// ===== INICIO: src/components/modals/MovementModal.jsx (Sprint 87 - Lógica Restaurada) =====
import React, { useState, useMemo, useEffect } from 'react';
import feather from 'feather-icons';
import { useData } from '../../context/DataContext';
import { db } from '../../firebase/config';
import { collection, doc, writeBatch, serverTimestamp, updateDoc, deleteDoc, increment, query, where, getDocs } from 'firebase/firestore';
import SearchableDropdown from '../ui/SearchableDropdown';
import toast from 'react-hot-toast';
import TechCalculatorModal from './TechCalculatorModal';
import SalesCommissionModal from './SalesCommissionModal';
import { useTranslation } from 'react-i18next';
import CurrencyInput from '../ui/CurrencyInput';
import { useStorage } from '../../hooks/useStorage';
import { useReactToPrint } from 'react-to-print';
import TicketTemplate from '../reports/TicketTemplate';
import PrintPreviewModal from './PrintPreviewModal';
import Swal from 'sweetalert2';

const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return value;
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const MovementModal = ({ isOpen, onClose, movementToEdit, preselectedCollab }) => {
  const { t } = useTranslation();
  const { clients, collaborators, services, retailInventory, config, movements } = useData();
  const { uploadFile, progress, isUploading } = useStorage();
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('multi');
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!movementToEdit;

  // Modales hijos
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [currentItemCartId, setCurrentItemCartId] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const ticketRef = React.useRef();

  const handlePrintTicket = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket_${new Date().toISOString()}`,
    onAfterPrint: () => {
      setTicketData(null);
      // handleClose is called in handleConfirmPrint or onClose of preview
    }
  });

  useEffect(() => {
    if (ticketData) {
      handlePrintTicket();
    }
  }, [ticketData]);

  // UI States
  const [showManualService, setShowManualService] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);

  // Form States
  const [rapidoServicio, setRapidoServicio] = useState({ collab: '', desc: '', monto: '' });
  const [gasto, setGasto] = useState({ desc: '', monto: '' });
  const [adelanto, setAdelanto] = useState({ collab: '', monto: '' });
  const [propina, setPropina] = useState({
    collab: '',
    monto: '',
    desc: '',
    paymentMethod: 'Efectivo',
    destination: 'nomina'
  });
  const [giftCard, setGiftCard] = useState({ code: '', amount: '', clientName: '', contact: '', paymentMethod: 'Efectivo' });
  const [pagoGiftCard, setPagoGiftCard] = useState({ code: '', amount: '' });
  const [searchServicio, setSearchServicio] = useState({ collab: null, service: null });
  const [searchProducto, setSearchProducto] = useState({ collab: null, product: null, cant: 1 });
  const [rapidoVenta, setRapidoVenta] = useState({ collab: 'salon', desc: '', monto: '', cant: 1 });

  const settings = useMemo(() => {
    return (config && config.find(c => c.id === 'settings')) || { salesCommissionGeneral: 10 };
  }, [config]);

  // Inicializar el modal
  useEffect(() => {
    if (isOpen) {
      // Resetear estados al abrir
      setCart([]);
      setSelectedClient(null);
      setPaymentMethod('multi');
      setRapidoServicio({ collab: '', desc: '', monto: '' });
      setGasto({ desc: '', monto: '' });
      setAdelanto({ collab: '', monto: '' });
      // Usamos t() aquí, pero ojo: t() podría no estar listo en el primer render. 
      // Mejor usar un string vacío o default y dejar el placeholder en el input.
      setPropina({ collab: '', monto: '', desc: '', paymentMethod: 'Efectivo', destination: 'nomina' });
      setGiftCard({ code: '', amount: '', clientName: '', contact: '', paymentMethod: 'Efectivo' });
      setPagoGiftCard({ code: '', amount: '' });
      setSearchServicio({ collab: null, service: null });
      setSearchProducto({ collab: null, product: null, cant: 1 });
      setRapidoVenta({ collab: 'salon', desc: '', monto: '', cant: 1 });
      setShowManualService(false);
      setShowManualProduct(false);

      // Si hay datos para editar o preseleccionar
      if (movementToEdit) {
        const relatedMovements = movements.filter(m => m.transactionId === movementToEdit.transactionId);
        // Filtrar los movimientos "virtuales" que no deben aparecer en el carrito visualmente si se desea
        // Por ahora mostramos todo para poder editar
        const cartItems = relatedMovements
          .filter(m => m.type !== 'ComisionVenta' && m.type !== 'ComisionPropina') // Ocultar comisiones automáticas
          .map(m => ({ ...m, cartId: m.id }));

        setCart(cartItems);
        const client = clients.find(c => c.name === movementToEdit.client);
        if (client) setSelectedClient(client);
      } else if (preselectedCollab) {
        // Preseleccionar colaborador en búsquedas
        const collab = collaborators.find(c => c.id === preselectedCollab.id);
        if (collab) {
          setSearchServicio(prev => ({ ...prev, collab }));
          setRapidoServicio(prev => ({ ...prev, collab: collab.id }));
          setPropina(prev => ({ ...prev, collab: collab.id }));
        }
      }
    }
  }, [isOpen, movementToEdit, preselectedCollab, clients, collaborators, movements]);

  useEffect(() => {
    feather.replace();
  }, [cart, isTechModalOpen, isCommissionModalOpen, showManualService, showManualProduct]);

  const handleClose = () => { setIsSaving(false); onClose(); };
  const totalCart = useMemo(() => cart.reduce((sum, item) => sum + item.amount, 0), [cart]);

  const handleCartItemChange = (cartId, field, value) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'amount') {
          updatedItem[field] = parseFloat(value) || 0;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeFromCart = (cartId) => setCart(prev => prev.filter(item => item.cartId !== cartId));

  // --- LÓGICA DE BOTONES RESTAURADA ---

  const addRapidoServicio = () => {
    const collab = collaborators.find(c => c.id === rapidoServicio.collab);
    if (!collab || !rapidoServicio.desc || !rapidoServicio.monto) { toast.error(t('modals.errors.completeFields')); return; }
    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'Servicio',
      description: rapidoServicio.desc,
      amount: parseFloat(rapidoServicio.monto),
      collaboratorId: collab.id,
      collaboratorName: collab.name,
      paymentMethod: 'Efectivo',
      technicalCost: 0,
      productsUsed: []
    }]);
    setRapidoServicio({ ...rapidoServicio, desc: '', monto: '' });
  };

  const addSearchServicio = () => {
    const { collab, service } = searchServicio;
    if (!collab || !service) { toast.error(t('modals.errors.selectCollabAndService')); return; }
    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'Servicio',
      description: service.name,
      amount: service.price,
      collaboratorId: collab.id,
      collaboratorName: collab.name,
      serviceId: service.id,
      paymentMethod: 'Efectivo',
      technicalCost: 0,
      productsUsed: []
    }]);
    setSearchServicio(prev => ({ ...prev, service: null }));
  };

  const addSearchProducto = () => {
    const { collab: prodCollab, product: prod, cant: prodCant } = searchProducto;
    if (!prod || !prodCant || prodCant < 1) { toast.error(t('modals.errors.selectProductAndQuantity')); return; }

    const stockDisponible = retailInventory.find(p => p.id === prod.id)?.stock || 0;
    // Validar stock considerando lo que ya está en el carrito
    const enCarrito = cart
      .filter(item => item.productId === prod.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if ((enCarrito + prodCant) > stockDisponible) {
      toast.error(`${t('modals.errors.stockCheck')} ${stockDisponible}, ${t('modals.forms.inCart')}: ${enCarrito}.`);
      return;
    }

    const collaboratorName = prodCollab ? prodCollab.name : t('modals.forms.salon');

    // Calcular comisión automática
    let commissionAmount = 0;
    let commissionType = 'auto';
    if (prodCollab) {
      const rate = (prodCollab.salesCommissionPercent || 10) / 100;
      commissionAmount = (prod.price * prodCant) * rate;
    }

    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'Venta',
      description: `${prodCant}x ${prod.name}`,
      amount: prod.price * prodCant,
      collaboratorId: prodCollab ? prodCollab.id : null,
      collaboratorName: collaboratorName,
      productId: prod.id,
      quantity: prodCant,
      paymentMethod: 'Efectivo',
      commissionType: commissionType,
      commissionAmount: commissionAmount
    }]);
    setSearchProducto(prev => ({ ...prev, product: null, cant: 1 }));
  };

  const addRapidoVenta = () => {
    const collab = collaborators.find(c => c.id === rapidoVenta.collab);
    if (!rapidoVenta.desc || !rapidoVenta.monto || !rapidoVenta.cant) { toast.error(t('modals.errors.completeFields')); return; }

    const collaboratorName = collab ? collab.name : t('modals.forms.salon');

    // Calcular comisión
    let commissionAmount = 0;
    let commissionType = 'auto';
    if (collab) {
      const rate = (collab.salesCommissionPercent || 10) / 100;
      commissionAmount = (parseFloat(rapidoVenta.monto) * parseInt(rapidoVenta.cant)) * rate;
    }

    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'Venta',
      description: `${rapidoVenta.cant}x ${rapidoVenta.desc}`,
      amount: parseFloat(rapidoVenta.monto) * parseInt(rapidoVenta.cant),
      collaboratorId: collab ? collab.id : null,
      collaboratorName: collaboratorName,
      productId: null,
      quantity: parseInt(rapidoVenta.cant),
      paymentMethod: 'Efectivo',
      commissionType: commissionType,
      commissionAmount: commissionAmount
    }]);
    setRapidoVenta({ ...rapidoVenta, desc: '', monto: '', cant: 1 });
  };

  const addGasto = () => {
    if (!gasto.desc || !gasto.monto) { toast.error(t('modals.errors.completeFields')); return; }
    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'Gasto',
      description: gasto.desc,
      amount: -Math.abs(parseFloat(gasto.monto)),
      paymentMethod: 'Efectivo',
    }]);
    setGasto({ desc: '', monto: '' });
  };

  const addAdelanto = () => {
    const collab = collaborators.find(c => c.id === adelanto.collab);
    if (!collab || !adelanto.monto) { toast.error(t('modals.errors.selectCollabAndAmount')); return; }
    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'Adelanto',
      description: `${t('modals.forms.advanceFor')} ${collab.name}`,
      amount: -Math.abs(parseFloat(adelanto.monto)),
      collaboratorId: collab.id,
      collaboratorName: collab.name,
      paymentMethod: 'Efectivo',
    }]);
    setAdelanto({ ...adelanto, monto: '' });
  };

  const addPropina = () => {
    const collab = collaborators.find(c => c.id === propina.collab);
    // Permitir descripción vacía y poner default
    const descripcion = propina.desc || t('modals.forms.tipsTitle');

    if (!collab || !propina.monto || !propina.paymentMethod || !propina.destination) {
      toast.error(t('modals.errors.completeFieldsTips'));
      return;
    }
    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'Propina',
      description: descripcion,
      amount: parseFloat(propina.monto),
      collaboratorId: collab.id,
      collaboratorName: collab.name,
      paymentMethod: propina.paymentMethod,
      destination: propina.destination
    }]);
    setPropina({ ...propina, monto: '', desc: '' });
  };

  const addGiftCard = () => {
    if (!giftCard.code || !giftCard.amount || !giftCard.clientName || !giftCard.paymentMethod) {
      toast.error(t('modals.errors.completeFieldsGC'));
      return;
    }
    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'VentaGiftCard',
      description: `${t('modals.forms.gcSaleDesc')} #${giftCard.code}`,
      amount: parseFloat(giftCard.amount),
      paymentMethod: giftCard.paymentMethod,
      gcCode: giftCard.code,
      gcClientName: giftCard.clientName,
      gcClientId: giftCard.gcClientId || null, // ID del cliente (si existe)
      gcContact: giftCard.contact,
      gcReceiptUrl: giftCard.receiptUrl || null, // URL del comprobante de venta
    }]);
    setGiftCard({ code: '', amount: '', clientName: '', gcClientId: null, contact: '', paymentMethod: 'Efectivo', receiptUrl: null });
  };

  const addPagoGiftCard = () => {
    if (!pagoGiftCard.code || !pagoGiftCard.amount) {
      toast.error(t('modals.errors.completeFieldsGCPay'));
      return;
    }
    setCart(prev => [...prev, {
      cartId: Date.now(),
      type: 'PagoGiftCard',
      description: `${t('modals.forms.gcPaymentDesc')} #${pagoGiftCard.code}`,
      amount: -Math.abs(parseFloat(pagoGiftCard.amount)),
      paymentMethod: 'Gift Card',
      gcCode: pagoGiftCard.code,
      gcRedeemReceiptUrl: pagoGiftCard.receiptUrl || null, // Evidencia de canje
    }]);
    setPagoGiftCard({ code: '', amount: '', receiptUrl: null });
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const path = `giftcards/receipts/${file.name}`;

    try {
      const url = await uploadFile(file, path);
      setGiftCard(prev => ({ ...prev, receiptUrl: url }));
      toast.success("Comprobante subido correctamente");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir comprobante");
    }
  };

  const handleRedeemReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const path = `giftcards/redemption_receipts/${file.name}`;

    try {
      const url = await uploadFile(file, path);
      setPagoGiftCard(prev => ({ ...prev, receiptUrl: url }));
      toast.success("Evidencia de canje subida correctamente");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error al subir evidencia");
    }
  };

  // --- Modales Hijos ---
  const handleOpenTechModal = (cartId) => { setCurrentItemCartId(cartId); setIsTechModalOpen(true); };

  const handleSaveTechCost = (cost, products) => {
    setCart(prevCart => prevCart.map(item =>
      item.cartId === currentItemCartId
        ? { ...item, technicalCost: cost, productsUsed: products }
        : item
    ));
    setIsTechModalOpen(false);
  };

  const handleOpenCommissionModal = (cartId) => { setCurrentItemCartId(cartId); setIsCommissionModalOpen(true); };

  const handleSaveCommission = (cartId, type, amount) => {
    setCart(prevCart => prevCart.map(item =>
      item.cartId === cartId
        ? { ...item, commissionType: type, commissionAmount: amount }
        : item
    ));
  };

  // --- GUARDAR OPERACIÓN ---
  const handleSaveOperation = async () => {
    if (cart.length === 0) {
      if (isEditMode) return await handleDeleteOperation();
      toast.error(t('modals.errors.noItems'));
      return;
    }
    setIsSaving(true);
    const settings = (config && config.find(c => c.id === 'settings')) || { salesCommissionGeneral: 10 };
    const commissionRate = (settings.salesCommissionGeneral || 10) / 100;
    const batch = writeBatch(db);
    const transactionId = isEditMode ? movementToEdit.transactionId : doc(collection(db, 'temp')).id;
    const today = new Date();
    const clientName = selectedClient ? selectedClient.name : t('modals.forms.occasionalClient');

    try {
      // Si editamos, borramos TODO lo anterior de esta transacción para reescribirlo
      if (isEditMode) {
        const q = query(collection(db, 'movements'), where('transactionId', '==', transactionId));
        const oldDocs = await getDocs(q);
        oldDocs.forEach(doc => { batch.delete(doc.ref); });

        const qGC = query(collection(db, 'giftCards'), where('transactionId', '==', transactionId));
        const oldGC = await getDocs(qGC);
        oldGC.forEach(doc => { batch.delete(doc.ref); });
      }

      // Validación de Gift Cards (Pagos)
      const gcPayments = cart.filter(item => item.type === 'PagoGiftCard');
      if (gcPayments.length > 0) {
        for (const payment of gcPayments) {
          // (Lógica simplificada de validación: asumimos que el backend/reglas de seguridad 
          // deberían manejar la concurrencia, pero aquí hacemos un chequeo básico)
          const gcQuery = query(collection(db, 'giftCards'), where('code', '==', payment.gcCode));
          const gcSnap = await getDocs(gcQuery);

          // Nota: En un entorno real, esto debería ser más robusto si hay múltiples cajas.
          if (!gcSnap.empty) {
            const gcDoc = gcSnap.docs[0];
            const gcData = gcDoc.data();
            if (gcData.balance < Math.abs(payment.amount)) {
              throw new Error(`${t('modals.errors.gcBalanceLow')} ${formatCurrency(gcData.balance)}`);
            }
            batch.update(gcDoc.ref, {
              balance: increment(payment.amount), // payment.amount es negativo
              history: [...gcData.history, { date: new Date(), action: 'Canje', amount: payment.amount }]
            });
          }
        }
      }

      for (const item of cart) {
        const moveRef = doc(collection(db, 'movements'));
        const moveData = { ...item, client: clientName, date: today, createdAt: serverTimestamp(), transactionId, paymentMethod: paymentMethod === 'multi' ? item.paymentMethod : paymentMethod };

        // Limpiar campos internos del carrito que no van a la BD
        delete moveData.cartId;
        delete moveData.destination;
        delete moveData.id; // Si venía de edición

        if (moveData.type === 'PagoGiftCard') {
          moveData.paymentMethod = 'Gift Card';
        }

        batch.set(moveRef, moveData);

        // Lógica de Propinas (Destino)
        if (item.type === 'Propina') {
          if (item.destination === 'instantanea') {
            // Si es instantánea, se crea un gasto de salida de caja
            const gastoRef = doc(collection(db, 'movements'));
            batch.set(gastoRef, {
              type: 'Gasto',
              description: `${t('modals.forms.tipsTitle')}: ${item.description} -> ${item.collaboratorName}`,
              amount: -Math.abs(item.amount),
              paymentMethod: item.paymentMethod,
              date: today,
              createdAt: serverTimestamp(),
              transactionId: transactionId,
            });
          } else {
            // Si es a nómina, se crea un registro de comisión especial
            const commRef = doc(collection(db, 'movements'));
            batch.set(commRef, {
              type: 'ComisionPropina',
              description: item.description,
              amount: item.amount,
              collaboratorId: item.collaboratorId,
              collaboratorName: item.collaboratorName,
              date: today,
              createdAt: serverTimestamp(),
              transactionId: transactionId,
              // No afecta caja, es virtual para nómina
            });
          }
        }

        // Venta de Gift Card
        if (item.type === 'VentaGiftCard') {
          let clientId = item.gcClientId || null;
          let clientName = item.gcClientName;

          // Si no tiene ID, es un cliente nuevo - crear automáticamente
          if (!clientId && clientName) {
            const newClientRef = doc(collection(db, 'clients'));
            batch.set(newClientRef, {
              name: clientName,
              phone: item.gcContact || '',
              email: '',
              createdAt: serverTimestamp(),
              lastVisit: today.toISOString().split('T')[0],
              notes: 'Cliente creado automáticamente desde venta de Gift Card'
            });
            clientId = newClientRef.id;
          }

          const gcRef = doc(collection(db, 'giftCards'));
          batch.set(gcRef, {
            code: item.gcCode,
            initialValue: item.amount,
            balance: item.amount,
            buyerName: clientName,
            buyerContact: item.gcContact,
            clientId: clientId, // Guardar referencia al cliente
            receiptUrl: item.gcReceiptUrl || null, // Comprobante de venta
            status: 'Activa',
            createdAt: serverTimestamp(),
            transactionId: transactionId,
            history: [{ date: new Date(), action: 'Compra', amount: item.amount }]
          });
        }

        // Descuento de Stock (Retail)
        if (item.type === 'Venta' && item.productId) {
          const productRef = doc(db, 'retailInventory', item.productId);
          batch.update(productRef, { stock: increment(-item.quantity) });
        }

        // Comisiones de Venta
        if (item.type === 'Venta' && item.collaboratorId) {
          let finalCommission = 0;
          if (item.commissionType === 'manual') {
            finalCommission = item.commissionAmount;
          } else {
            const collaborator = collaborators.find(c => c.id === item.collaboratorId);
            const rate = (collaborator?.salesCommissionPercent || settings.salesCommissionGeneral || 10) / 100;
            finalCommission = item.amount * rate;
          }

          if (finalCommission > 0) {
            const commRef = doc(collection(db, 'movements'));
            batch.set(commRef, {
              type: 'ComisionVenta',
              description: `${t('modals.forms.commission')}: ${item.description}`,
              amount: finalCommission,
              collaboratorId: item.collaboratorId,
              collaboratorName: item.collaboratorName,
              date: today,
              createdAt: serverTimestamp(),
              transactionId: transactionId,
            });
          }
        }
      }

      // Actualizar última visita del cliente
      if (selectedClient) { batch.update(doc(db, 'clients', selectedClient.id), { lastVisit: today.toISOString().split('T')[0] }); }

      await batch.commit();
      toast.success(isEditMode ? t('modals.buttons.updateChanges') : t('modals.buttons.successRegister'));

      // Preparar datos para el ticket
      const newTicketData = {
        items: cart.map(item => ({
          description: item.description,
          amount: item.amount,
          type: item.type,
          collaboratorName: item.collaboratorName
        })),
        total: cart.reduce((sum, item) => sum + item.amount, 0),
        paymentMethod: paymentMethod
      };

      // Open Preview Modal instead of direct print
      setIsPreviewOpen(true);

    } catch (error) {
      console.error("Error saving operation:", error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false); // Assuming setIsLoading is a typo for setIsSaving based on context
    }
  };

  const handleConfirmPrint = async () => {
    setIsPreviewOpen(false);
    await new Promise(resolve => setTimeout(resolve, 200));

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      alert('En dispositivos móviles, usa el menú de compartir de tu navegador para guardar como PDF o imprimir');
    }

    handlePrintTicket();
    handleClose();
  };

  const handleDeleteOperation = async () => {
    if (!window.confirm(t('common.confirmDelete'))) { return; }
    setIsSaving(true);
    const transactionId = movementToEdit.transactionId;
    if (!transactionId) {
      toast.error(t('modals.errors.noItems'));
      setIsSaving(false);
      return;
    }
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, 'movements'), where('transactionId', '==', transactionId));
      const oldDocs = await getDocs(q);
      oldDocs.forEach(doc => { batch.delete(doc.ref); });

      // Borrar GC si existía
      const qGC = query(collection(db, 'giftCards'), where('transactionId', '==', transactionId));
      const oldGC = await getDocs(qGC);
      oldGC.forEach(doc => { batch.delete(doc.ref); });

      await batch.commit();
      toast.success(t('modals.buttons.successDelete'));
      handleClose();
    } catch (error) {
      console.error("Error al eliminar: ", error);
      toast.error(t('common.error') + ": " + error.message);
      setIsSaving(false);
    }
  };

  const itemForTechModal = useMemo(() => cart.find(item => item.cartId === currentItemCartId), [cart, currentItemCartId]);
  const itemForCommissionModal = useMemo(() => cart.find(item => item.cartId === currentItemCartId), [cart, currentItemCartId]);

  if (!isOpen) return null;
  const activeCollaborators = (collaborators || []).filter(c => c.status === 'active');
  const salonOption = [{ id: 'salon', name: t('modals.forms.salon') }, ...activeCollaborators];

  return (
    <>
      <div className={`fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop ${isTechModalOpen || isCommissionModalOpen ? 'backdrop-blur-sm' : ''}`}>
        <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-5xl modal-content flex flex-col max-h-[90vh]">

          <div className="p-4 border-b border-border-main flex justify-between items-center flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold text-text-main">{isEditMode ? t('modals.editTitle') : t('modals.registerTitle')}</h3>
              <p className="text-xs text-text-muted">{new Date().toLocaleString('es-CL')}</p>
            </div>
            <button onClick={handleClose} className="text-text-main/70 hover:text-text-main text-3xl leading-none">&times;</button>
          </div>

          <div className="flex flex-grow overflow-hidden">
            <fieldset disabled={isSaving} className="w-2/5 border-r border-border-main flex flex-col">
              <div className="p-4 flex-shrink-0 relative z-50">
                <SearchableDropdown items={clients || []} placeholder={t('modals.forms.clientSearch')} onSelect={(client) => setSelectedClient(client)} initialValue={selectedClient} />
              </div>

              <div className="p-4 overflow-y-auto flex-grow space-y-4 pb-64">

                <details className="bg-bg-main/40 rounded-lg overflow-hidden">
                  <summary className="p-3 font-semibold text-text-main cursor-pointer hover:bg-bg-main/60 flex justify-between">
                    🪮 {t('modals.accordions.services')} <i data-feather="chevron-down" className="w-5 h-5"></i>
                  </summary>
                  <div className="p-3 border-t border-border-main space-y-4">
                    <div className="space-y-3">
                      <SearchableDropdown
                        items={activeCollaborators}
                        placeholder={t('modals.forms.collabSearch')}
                        onSelect={(c) => setSearchServicio(p => ({ ...p, collab: c }))}
                        initialValue={searchServicio.collab}
                      />
                      <SearchableDropdown
                        items={services || []}
                        placeholder="Buscar servicio..."
                        onSelect={(s) => setSearchServicio(p => ({ ...p, service: s }))}
                        initialValue={searchServicio.service}
                      />
                      <button onClick={addSearchServicio} className="w-full btn-golden py-2">{t('modals.forms.addServiceSearch')}</button>

                      <div className="text-center">
                        <button type="button" onClick={() => setShowManualService(true)} className={`text-xs text-accent hover:underline ${showManualService ? 'hidden' : ''}`}>
                          {t('modals.forms.notFoundService')}
                        </button>
                      </div>
                    </div>

                    <div className={`space-y-3 ${showManualService ? '' : 'hidden'}`}>
                      <hr className="border-border-main/50" />
                      <h4 className="font-semibold text-text-main text-sm">{t('modals.forms.registerManual')}</h4>
                      <select
                        value={rapidoServicio.collab}
                        onChange={(e) => setRapidoServicio(p => ({ ...p, collab: e.target.value }))}
                        className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
                      >
                        <option value="" disabled>{t('modals.forms.selectCollab')}</option>
                        {activeCollaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="text" placeholder={t('modals.forms.itemDesc')} value={rapidoServicio.desc} onChange={(e) => setRapidoServicio(p => ({ ...p, desc: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                      <CurrencyInput placeholder={t('modals.forms.itemAmount')} value={rapidoServicio.monto} onChange={(e) => setRapidoServicio(p => ({ ...p, monto: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                      <button onClick={addRapidoServicio} className="w-full btn-golden py-2 bg-bg-tertiary/50 text-text-muted">{t('modals.forms.addServiceManual')}</button>
                    </div>
                  </div>
                </details>

                <details className="bg-bg-main/40 rounded-lg overflow-hidden">
                  <summary className="p-3 font-semibold text-text-main cursor-pointer hover:bg-bg-main/60 flex justify-between">
                    🛍️ {t('modals.accordions.products')} <i data-feather="chevron-down" className="w-5 h-5"></i>
                  </summary>
                  <div className="p-3 border-t border-border-main space-y-4">
                    <div className="space-y-3">
                      <SearchableDropdown items={retailInventory || []} placeholder={t('modals.forms.productSearch')} onSelect={(p) => setSearchProducto(s => ({ ...s, product: p }))} initialValue={searchProducto.product} />
                      <SearchableDropdown items={activeCollaborators} placeholder={t('modals.forms.collabSearch')} onSelect={(c) => setSearchProducto(s => ({ ...s, collab: c }))} initialValue={searchProducto.collab} />
                      <input type="number" value={searchProducto.cant} min="1" onChange={e => setSearchProducto(s => ({ ...s, cant: parseInt(e.target.value) }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" placeholder={t('modals.forms.itemQuantity')} />
                      <button onClick={addSearchProducto} className="w-full btn-golden py-2">{t('modals.forms.addSalesSearch')}</button>

                      <div className="text-center">
                        <button type="button" onClick={() => setShowManualProduct(true)} className={`text-xs text-accent hover:underline ${showManualProduct ? 'hidden' : ''}`}>
                          {t('modals.forms.notFoundProduct')}
                        </button>
                      </div>
                    </div>

                    <div className={`space-y-3 ${showManualProduct ? '' : 'hidden'}`}>
                      <hr className="border-border-main/50" />
                      <h4 className="font-semibold text-text-main text-sm">{t('modals.forms.manualSaleTitle')}</h4>
                      <select value={rapidoVenta.collab} onChange={(e) => setRapidoVenta(p => ({ ...p, collab: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2">
                        {salonOption.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="text" placeholder={t('modals.forms.itemDesc')} value={rapidoVenta.desc} onChange={(e) => setRapidoVenta(p => ({ ...p, desc: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                      <div className="flex gap-2">
                        <CurrencyInput placeholder={t('modals.forms.priceTotal')} value={rapidoVenta.monto} onChange={(e) => setRapidoVenta(p => ({ ...p, monto: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                        <input type="number" placeholder={t('modals.forms.itemQuantityShort')} value={rapidoVenta.cant} min="1" onChange={(e) => setRapidoVenta(p => ({ ...p, cant: e.target.value }))} className="w-24 bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                      </div>
                      <button onClick={addRapidoVenta} className="w-full btn-golden py-2 bg-bg-tertiary/50 text-text-muted">{t('modals.forms.addSalesManual')}</button>
                    </div>
                  </div>
                </details>


                <details className="bg-bg-main/40 rounded-lg overflow-hidden">
                  <summary className="p-3 font-semibold text-text-main cursor-pointer hover:bg-bg-main/60 flex justify-between">
                    💳 {t('modals.accordions.gcSell')} <i data-feather="chevron-down" className="w-5 h-5"></i>
                  </summary>
                  <div className="p-3 border-t border-border-main space-y-3">
                    <input type="text" placeholder={t('modals.forms.gcCode')} value={giftCard.code} onChange={(e) => setGiftCard(p => ({ ...p, code: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                    <CurrencyInput placeholder={t('modals.forms.gcAmount')} value={giftCard.amount} onChange={(e) => setGiftCard(p => ({ ...p, amount: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />

                    {/* Cliente: SearchableDropdown o nombre manual */}
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Cliente (seleccionar o escribir nuevo)</label>
                      <SearchableDropdown
                        items={clients || []}
                        placeholder={t('modals.forms.gcBuyer')}
                        onSelect={(client) => setGiftCard(p => ({ ...p, clientName: client.name, gcClientId: client.id, contact: client.phone || '' }))}
                        allowManual={true}
                        onManualInput={(name) => setGiftCard(p => ({ ...p, clientName: name, gcClientId: null }))}
                      />
                    </div>

                    <input type="text" placeholder={t('modals.forms.gcContact')} value={giftCard.contact} onChange={(e) => setGiftCard(p => ({ ...p, contact: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                    <select
                      value={giftCard.paymentMethod}
                      onChange={(e) => setGiftCard(p => ({ ...p, paymentMethod: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-main rounded p-2"
                    >
                      <option value="Efectivo">{t('modals.forms.cashPayment')}</option>
                      <option value="Tarjeta">{t('modals.forms.cardPayment')}</option>
                      <option value="Transferencia">{t('modals.forms.transferPayment')}</option>
                    </select>

                    {/* RECEIPT UPLOAD */}
                    <div className="border border-dashed border-border-main p-3 rounded text-center relative">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleReceiptUpload}
                        accept=".pdf,.jpg,.png,.jpeg"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <span className="text-xs text-accent">Subiendo... {Math.round(progress)}%</span>
                      ) : giftCard.receiptUrl ? (
                        <span className="text-xs text-green-400 flex items-center justify-center gap-1">
                          <i data-feather="check"></i> Comprobante Listo
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Subir Comprobante/Firma (Opcional)</span>
                      )}
                    </div>

                    <button onClick={addGiftCard} className="w-full btn-golden py-2">{t('modals.forms.addGCSale')}</button>
                  </div>
                </details>

                <details className="bg-bg-main/40 rounded-lg overflow-hidden">
                  <summary className="p-3 font-semibold text-text-main cursor-pointer hover:bg-bg-main/60 flex justify-between">
                    🪙 {t('modals.accordions.gcRedeem')} <i data-feather="chevron-down" className="w-5 h-5"></i>
                  </summary>
                  <div className="p-3 border-t border-border-main space-y-3">
                    <input type="text" placeholder={t('modals.forms.gcCode')} value={pagoGiftCard.code} onChange={(e) => setPagoGiftCard(p => ({ ...p, code: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                    <CurrencyInput placeholder={t('modals.forms.gcAmount')} value={pagoGiftCard.amount} onChange={(e) => setPagoGiftCard(p => ({ ...p, amount: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />

                    {/* Evidencia de Canje */}
                    <div className="border border-dashed border-border-main p-3 rounded text-center relative">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleRedeemReceiptUpload}
                        accept=".pdf,.jpg,.png,.jpeg"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <span className="text-xs text-accent">Subiendo... {Math.round(progress)}%</span>
                      ) : pagoGiftCard.receiptUrl ? (
                        <span className="text-xs text-green-400 flex items-center justify-center gap-1">
                          <i data-feather="check"></i> Evidencia Cargada
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">Subir Gift Card Física / Comprobante (Opcional)</span>
                      )}
                    </div>

                    <button onClick={addPagoGiftCard} className="w-full btn-golden py-2">{t('modals.forms.addGCPay')}</button>
                  </div>
                </details>

                <details className="bg-bg-main/40 rounded-lg overflow-hidden">
                  <summary className="p-3 font-semibold text-text-main cursor-pointer hover:bg-bg-main/60 flex justify-between">
                    💸 {t('modals.accordions.expenses')} <i data-feather="chevron-down" className="w-5 h-5"></i>
                  </summary>
                  <div className="p-3 border-t border-border-main space-y-3">
                    <input type="text" placeholder={t('modals.forms.itemDesc')} value={gasto.desc} onChange={(e) => setGasto(p => ({ ...p, desc: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                    <CurrencyInput placeholder={t('modals.forms.itemAmount')} value={gasto.monto} onChange={(e) => setGasto(p => ({ ...p, monto: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                    <button onClick={addGasto} className="w-full btn-golden py-2">{t('modals.forms.addExpense')}</button>
                  </div>
                </details>

                <details className="bg-bg-main/40 rounded-lg overflow-hidden">
                  <summary className="p-3 font-semibold text-text-main cursor-pointer hover:bg-bg-main/60 flex justify-between">
                    💰 {t('modals.accordions.advances')} <i data-feather="chevron-down" className="w-5 h-5"></i>
                  </summary>
                  <div className="p-3 border-t border-border-main space-y-3">
                    <select value={adelanto.collab} onChange={(e) => setAdelanto(p => ({ ...p, collab: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2">
                      <option value="" disabled>{t('modals.forms.selectCollab')}</option>
                      {activeCollaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <CurrencyInput placeholder={t('modals.forms.itemAmount')} value={adelanto.monto} onChange={(e) => setAdelanto(p => ({ ...p, monto: e.target.value }))} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" />
                    <button onClick={addAdelanto} className="w-full btn-golden py-2">{t('modals.forms.addAdvance')}</button>
                  </div>
                </details>

                <details className="bg-bg-main/40 rounded-lg overflow-hidden">
                  <summary className="p-3 font-semibold text-text-main cursor-pointer hover:bg-bg-main/60 flex justify-between">
                    🪙 {t('modals.accordions.tips')} <i data-feather="chevron-down" className="w-5 h-5"></i>
                  </summary>
                  <div className="p-3 border-t border-border-main space-y-3">
                    <select
                      value={propina.collab}
                      onChange={(e) => setPropina(p => ({ ...p, collab: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-main rounded p-2"
                    >
                      <option value="" disabled>{t('modals.forms.selectCollab')}</option>
                      {activeCollaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder={t('modals.forms.tipsDesc')}
                      value={propina.desc}
                      onChange={(e) => setPropina(p => ({ ...p, desc: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
                    />
                    <CurrencyInput
                      placeholder={t('modals.forms.itemAmount')}
                      value={propina.monto}
                      onChange={(e) => setPropina(p => ({ ...p, monto: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
                    />
                    <select
                      value={propina.paymentMethod}
                      onChange={(e) => setPropina(p => ({ ...p, paymentMethod: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-main rounded p-2"
                    >
                      <option value="Efectivo">{t('modals.forms.cashPayment')}</option>
                      <option value="Tarjeta">{t('modals.forms.cardPayment')}</option>
                      <option value="Transferencia">{t('modals.forms.transferPayment')}</option>
                    </select>
                    <select
                      value={propina.destination}
                      onChange={(e) => setPropina(p => ({ ...p, destination: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-main rounded p-2"
                    >
                      <option value="nomina">{t('modals.forms.tipNomina')}</option>
                      <option value="instantanea">{t('modals.forms.tipInstant')}</option>
                    </select>
                    <button onClick={addPropina} className="w-full btn-golden py-2">{t('modals.forms.addTip')}</button>
                  </div>
                </details>

              </div>
            </fieldset>

            <div className="w-3/5 flex flex-col bg-bg-main/50">
              <div className="p-4 border-b border-border-main flex-shrink-0">
                <h3 className="text-lg font-bold text-text-main">{t('modals.summaryTitle')}</h3>
              </div>
              <div id="operation-items-list" className="flex-grow p-4 overflow-y-auto space-y-3">
                {cart.length === 0 && (<p className="text-center text-text-muted mt-8">{t('modals.errors.noItems')}</p>)}
                {cart.map(item => (
                  <div key={item.cartId} className="bg-bg-secondary p-3 rounded-lg border border-border-main">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow pr-4">
                        <label className="text-xs text-text-muted">{t('modals.forms.itemDesc')}</label>
                        <input
                          type="text" value={item.description}
                          onChange={(e) => handleCartItemChange(item.cartId, 'description', e.target.value)}
                          className="w-full bg-bg-tertiary border border-border-main rounded p-1 text-text-main font-bold"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-xs text-text-muted">{t('modals.forms.itemAmount')}</label>
                        <CurrencyInput
                          value={item.amount}
                          onChange={(e) => handleCartItemChange(item.cartId, 'amount', e.target.value)}
                          className={`w-full bg-bg-tertiary border border-border-main rounded p-1 font-bold text-lg ${item.amount >= 0 ? 'text-text-main' : 'text-red-400'}`}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{item.type} {item.collaboratorName ? `| ${item.collaboratorName}` : ''}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <div>
                        {item.type === 'Servicio' && (
                          <button
                            onClick={() => handleOpenTechModal(item.cartId)}
                            className="text-xs bg-bg-tertiary hover:bg-bg-main/50 px-2 py-1 rounded text-text-muted"
                            disabled={isSaving}
                          >
                            🧮 {t('modals.forms.techCost')}: {formatCurrency(item.technicalCost || 0)}
                          </button>
                        )}
                        {item.type === 'Venta' && item.collaboratorId && (
                          <button
                            onClick={() => handleOpenCommissionModal(item.cartId)}
                            className="text-xs bg-bg-tertiary hover:bg-bg-main/50 px-2 py-1 rounded text-text-muted"
                            disabled={isSaving}
                          >
                            💲 {t('modals.forms.commission')}: {formatCurrency(item.commissionAmount || 0)}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="item-payment-method bg-bg-tertiary border border-border-main rounded p-1 text-xs"
                          disabled={paymentMethod !== 'multi' || isSaving}
                          value={item.paymentMethod}
                          onChange={(e) => handleCartItemChange(item.cartId, 'paymentMethod', e.target.value)}
                        >
                          <option value="Efectivo">{t('modals.forms.cashPayment')}</option>
                          <option value="Tarjeta">{t('modals.forms.cardPayment')}</option>
                          <option value="Transferencia">{t('modals.forms.transferPayment')}</option>
                          <option value="Gift Card">{t('modals.forms.giftCardPayment')}</option>
                        </select>
                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-300" disabled={isSaving}>
                          <i data-feather="trash-2" className="w-4 h-4"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border-main bg-bg-secondary flex-shrink-0 space-y-2">
                <div className="flex justify-between items-center text-xl">
                  <span className="font-semibold text-text-muted">{t('modals.forms.total')}</span>
                  <span className="font-bold text-text-main">{formatCurrency(totalCart)}</span>
                </div>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-main rounded p-2"
                  disabled={isSaving}
                >
                  <option value="multi">{t('modals.forms.multiplePayments')}</option>
                  <option value="Efectivo">{t('modals.forms.cashPaymentTotal')}</option>
                  <option value="Tarjeta">{t('modals.forms.cardPaymentTotal')}</option>
                  <option value="Transferencia">{t('modals.forms.transferPaymentTotal')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-between flex-shrink-0">
            {isEditMode ? (
              <>
                <button onClick={handleDeleteOperation} disabled={isSaving} className="bg-red-600 text-text-main font-bold py-2 px-6 rounded-md hover:bg-red-700 disabled:opacity-50">
                  {t('modals.buttons.deleteTransaction')}
                </button>
                <button onClick={handleSaveOperation} disabled={isSaving} className="btn-golden py-2 px-6 disabled:opacity-50">
                  {isSaving ? t('modals.buttons.updating') : t('modals.buttons.updateChanges')}
                </button>
              </>
            ) : (
              <button onClick={handleSaveOperation} disabled={isSaving} className="btn-golden py-2 px-6 ml-auto disabled:opacity-50">
                {isSaving ? t('modals.buttons.saving') : t('modals.buttons.registerOperation')}
              </button>
            )}
          </div>
        </div>
      </div>

      {isTechModalOpen && (
        <TechCalculatorModal
          isOpen={isTechModalOpen}
          onClose={() => setIsTechModalOpen(false)}
          onSubmit={handleSaveTechCost}
          serviceName={itemForTechModal?.description}
          initialProducts={itemForTechModal?.productsUsed}
        />
      )}
      {isCommissionModalOpen && (
        <SalesCommissionModal
          isOpen={isCommissionModalOpen}
          onClose={() => setIsCommissionModalOpen(false)}
          item={itemForCommissionModal}
          onSave={handleSaveCommission}
        />
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); handleClose(); }}
        onPrint={handleConfirmPrint}
        title={t('modals.confirmPrintTicket')}
      >
        <div className="flex justify-center">
          {/* Render TicketTemplate visible for preview */}
          <div className="border border-gray-300 shadow-sm p-4 bg-white text-black w-[80mm]">
            <TicketTemplate data={ticketData} />
          </div>
        </div>
      </PrintPreviewModal>

      {/* Hidden Ticket Template for React-to-Print */}
      <div style={{ display: 'none' }}>
        {ticketData && (
          <TicketTemplate
            ref={ticketRef}
            data={ticketData}
            config={config}
          />
        )}
      </div>
    </>
  );
};
export default MovementModal;
// ===== FIN: src/components/modals/MovementModal.jsx (Sprint 87 - Lógica Restaurada) =====
