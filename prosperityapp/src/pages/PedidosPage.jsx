// ===== INICIO: src/pages/PedidosPage.jsx =====
import React, { useState, useEffect, useMemo } from 'react';
import feather from 'feather-icons';
import { useData } from '../context/DataContext';
import { useCollection } from '../hooks/useCollection';
import { db } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import SearchableDropdown from '../components/ui/SearchableDropdown';
import { useStorage } from '../hooks/useStorage';

const formatCurrency = (value) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

const PedidosPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('suppliers');
    const { uploadFile, progress, isUploading } = useStorage();

    const { data: suppliersData, loading: loadSup } = useCollection('suppliers');
    const { data: invoicesData, loading: loadInv } = useCollection('invoices');
    const { data: debtsData, loading: loadDebts } = useCollection('debts');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [formData, setFormData] = useState({});

    // Debt specific state
    const [generatedInstallments, setGeneratedInstallments] = useState([]);
    const [selectedDebt, setSelectedDebt] = useState(null);

    // Filters
    const [invoiceFilters, setInvoiceFilters] = useState({ search: '', category: '', dateStart: '', dateEnd: '' });

    // Data Processing
    const suppliers = useMemo(() => suppliersData || [], [suppliersData]);

    const invoices = useMemo(() => {
        if (!invoicesData) return [];
        let filtered = [...invoicesData];

        // Apply filters
        if (invoiceFilters.search) {
            const term = invoiceFilters.search.toLowerCase();
            filtered = filtered.filter(i =>
                (i.supplierName && i.supplierName.toLowerCase().includes(term)) ||
                (i.rut && i.rut.toLowerCase().includes(term)) ||
                (i.brand && i.brand.toLowerCase().includes(term))
            );
        }
        if (invoiceFilters.category) {
            filtered = filtered.filter(i => i.category === invoiceFilters.category);
        }
        if (invoiceFilters.dateStart) {
            filtered = filtered.filter(i => {
                const date = i.date?.toDate ? i.date.toDate() : new Date(i.date * 1000);
                return date >= new Date(invoiceFilters.dateStart);
            });
        }
        if (invoiceFilters.dateEnd) {
            filtered = filtered.filter(i => {
                const date = i.date?.toDate ? i.date.toDate() : new Date(i.date * 1000);
                return date <= new Date(invoiceFilters.dateEnd);
            });
        }

        return filtered.sort((a, b) => {
            const dateA = a.date?.seconds || 0;
            const dateB = b.date?.seconds || 0;
            return dateB - dateA;
        });
    }, [invoicesData, invoiceFilters]);

    const debts = useMemo(() => {
        if (!debtsData) return [];
        return [...debtsData].sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
    }, [debtsData]);

    useEffect(() => { feather.replace(); }, [activeTab, suppliers, invoices, debts, isModalOpen, selectedDebt]);

    const openModal = (type) => {
        setModalType(type);
        setFormData({});
        setGeneratedInstallments([]);
        setIsModalOpen(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Path: invoices/{supplierId}/{fileName} or debts/...
        const supplierId = formData.supplierId || 'temp';
        const path = modalType === 'payInstallment'
            ? `debts/${selectedDebt?.id}/proof_${formData.installmentId}_${file.name}`
            : `invoices/${supplierId}/${file.name}`;

        try {
            const url = await uploadFile(file, path);
            if (modalType === 'payInstallment') {
                setFormData(prev => ({ ...prev, proofUrl: url }));
            } else {
                setFormData(prev => ({ ...prev, invoiceUrl: url }));
            }
            toast.success("Archivo subido correctamente");
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Error al subir archivo");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'supplier') {
                await addDoc(collection(db, 'suppliers'), { ...formData, createdAt: serverTimestamp() });
                toast.success(t('common.success'));
            } else if (modalType === 'invoice') {
                let invoiceDate = new Date();
                if (formData.date) {
                    const parts = formData.date.split('-');
                    invoiceDate = new Date(parts[0], parts[1] - 1, parts[2]);
                }
                await addDoc(collection(db, 'invoices'), { ...formData, date: invoiceDate, createdAt: serverTimestamp() });
                toast.success(t('common.success'));
            } else if (modalType === 'debt') {
                const total = parseFloat(formData.amount);
                const initial = parseFloat(formData.initialPay) || 0;
                const pending = total - initial;

                // Use generated installments or create default if none
                let finalInstallments = generatedInstallments;

                await addDoc(collection(db, 'debts'), {
                    ...formData,
                    totalAmount: total,
                    paidAmount: initial,
                    pendingAmount: pending,
                    status: pending <= 0 ? 'paid' : 'pending',
                    history: initial > 0 ? [{ date: new Date(), amount: initial, type: 'initial' }] : [],
                    installments: finalInstallments,
                    createdAt: serverTimestamp()
                });
                toast.success(t('common.success'));
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const handlePayInstallment = async (e) => {
        e.preventDefault();
        if (!selectedDebt || !formData.installmentId) return;

        try {
            const debtRef = doc(db, 'debts', selectedDebt.id);
            const amount = parseFloat(formData.paymentAmount);

            // Update installments
            const updatedInstallments = selectedDebt.installments?.map(inst => {
                if (inst.id === formData.installmentId) {
                    return {
                        ...inst,
                        status: 'paid',
                        paidAt: new Date().toISOString(),
                        proofUrl: formData.proofUrl,
                        paymentMethod: formData.paymentMethod
                    };
                }
                return inst;
            }) || [];

            // Update history
            const newHistoryItem = {
                date: new Date(),
                amount: amount,
                type: 'installment',
                installmentId: formData.installmentId,
                paymentMethod: formData.paymentMethod,
                proofUrl: formData.proofUrl
            };

            const newPaidAmount = (selectedDebt.paidAmount || 0) + amount;
            const newPendingAmount = (selectedDebt.totalAmount || 0) - newPaidAmount;
            const newStatus = newPendingAmount <= 0 ? 'paid' : 'pending';

            await updateDoc(debtRef, {
                installments: updatedInstallments,
                history: [...(selectedDebt.history || []), newHistoryItem],
                paidAmount: newPaidAmount,
                pendingAmount: newPendingAmount,
                status: newStatus
            });

            toast.success("Cuota pagada correctamente");
            setIsModalOpen(false);
            // Refresh selected debt locally if needed, but useCollection should handle it
            // We might need to close modal or update selectedDebt state if we want to keep it open
            setSelectedDebt(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar pago");
        }
    };

    const handleDelete = async (collectionName, id) => {
        if (!window.confirm(t('common.confirmDelete'))) return;
        try {
            await deleteDoc(doc(db, collectionName, id));
            toast.success(t('common.success'));
        } catch (e) { toast.error(t('common.error')); }
    };

    // --- RENDERERS ---

    const renderSuppliers = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers?.map(s => (
                <div key={s.id} className="bg-bg-secondary p-4 rounded-lg border border-border-main shadow-sm">
                    <h3 className="font-bold text-text-main text-lg mb-1">{s.name}</h3>
                    <p className="text-sm text-text-muted flex items-center gap-2"><i data-feather="user" className="w-4 h-4"></i> {s.contact}</p>
                    <p className="text-sm text-text-muted flex items-center gap-2"><i data-feather="phone" className="w-4 h-4"></i> {s.phone}</p>
                    <div className="mt-3 pt-3 border-t border-border-main/50 text-xs text-text-secondary">
                        <p><strong>{t('orders.suppliers.bank')}:</strong> {s.bank}</p>
                        <p><strong>{t('orders.suppliers.account')}:</strong> {s.account}</p>
                    </div>
                    <button onClick={() => handleDelete('suppliers', s.id)} className="mt-2 text-red-400 hover:text-red-500 text-xs flex items-center gap-1"><i data-feather="trash-2" className="w-3 h-3"></i> {t('common.delete')}</button>
                </div>
            ))}
            {suppliers.length === 0 && <p className="text-text-muted p-4">{t('dashboard.noData')}</p>}
        </div>
    );

    const renderInvoices = () => (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Buscar por Nombre, RUT o Marca..."
                    className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main"
                    value={invoiceFilters.search}
                    onChange={e => setInvoiceFilters({ ...invoiceFilters, search: e.target.value })}
                />
                <select
                    className="bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main"
                    value={invoiceFilters.category}
                    onChange={e => setInvoiceFilters({ ...invoiceFilters, category: e.target.value })}
                >
                    <option value="">Todas las Categorías</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Marca">Marca</option>
                    <option value="Insumos">Insumos</option>
                    <option value="Servicios Básicos">Servicios Básicos</option>
                    <option value="Otros">Otros</option>
                </select>
                <input
                    type="date"
                    className="bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main"
                    value={invoiceFilters.dateStart}
                    onChange={e => setInvoiceFilters({ ...invoiceFilters, dateStart: e.target.value })}
                />
                <input
                    type="date"
                    className="bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main"
                    value={invoiceFilters.dateEnd}
                    onChange={e => setInvoiceFilters({ ...invoiceFilters, dateEnd: e.target.value })}
                />
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-text-muted border-b border-border-main text-xs uppercase">
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Proveedor</th>
                        <th className="p-3">RUT</th>
                        <th className="p-3">Marca</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Pago</th>
                        <th className="p-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices?.map(inv => (
                        <tr key={inv.id} className="border-b border-border-main text-sm hover:bg-bg-tertiary">
                            <td className="p-3 text-text-main">{inv.date?.toDate ? inv.date.toDate().toLocaleDateString() : (inv.date ? new Date(inv.date * 1000).toLocaleDateString() : 'N/A')}</td>
                            <td className="p-3 text-text-main font-semibold">{inv.supplierName}</td>
                            <td className="p-3 text-text-muted">{inv.rut || '-'}</td>
                            <td className="p-3 text-text-muted">{inv.brand || '-'}</td>
                            <td className="p-3 text-text-muted">
                                <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs">{inv.category || 'General'}</span>
                            </td>
                            <td className="p-3 text-text-muted">{inv.method}</td>
                            <td className="p-3 text-right">
                                {inv.invoiceUrl ? (
                                    <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mr-3 text-xs flex items-center justify-end gap-1">
                                        <i data-feather="file-text" className="w-3 h-3"></i> Ver
                                    </a>
                                ) : (
                                    <span className="text-text-muted mr-3 text-xs">Sin archivo</span>
                                )}
                                <button onClick={() => handleDelete('invoices', inv.id)} className="text-red-400"><i data-feather="trash-2" className="w-4 h-4"></i></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {invoices.length === 0 && <p className="text-text-muted p-4 text-center">{t('dashboard.noData')}</p>}
        </div>
    );

    const renderDebts = () => (
        <div className="space-y-4">
            {debts?.map(debt => (
                <div key={debt.id} className="bg-bg-secondary p-4 rounded-lg border border-border-main flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1">
                        <h4 className="font-bold text-text-main text-lg">{debt.supplierName}</h4>
                        <p className="text-xs text-text-muted">Ref: {debt.invoiceRef || 'N/A'}</p>
                        <div className="mt-2 flex gap-4 text-sm">
                            <span className="text-green-400 font-semibold">Pagado: {formatCurrency(debt.paidAmount)}</span>
                            <span className="text-red-400 font-bold">Pendiente: {formatCurrency(debt.pendingAmount)}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-bg-tertiary h-2 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-accent h-full transition-all"
                                style={{ width: `${(debt.paidAmount / debt.totalAmount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="text-center flex flex-col gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${debt.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {debt.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                        <button
                            onClick={() => { setSelectedDebt(debt); setModalType('debtDetails'); setIsModalOpen(true); }}
                            className="text-xs text-accent hover:underline"
                        >
                            Ver Detalles / Pagar
                        </button>
                    </div>
                    <div>
                        <button onClick={() => handleDelete('debts', debt.id)} className="ml-2 text-text-muted hover:text-red-400 p-2"><i data-feather="trash-2" className="w-4 h-4"></i></button>
                    </div>
                </div>
            ))}
            {debts.length === 0 && <p className="text-text-muted p-4 text-center">{t('dashboard.noData')}</p>}
        </div>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">{t('orders.title')}</h2>
                    <p className="text-text-muted">{t('orders.subtitle')}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 bg-bg-secondary p-4 rounded-lg border border-border-main">
                <div className="flex rounded-md bg-bg-main/50 p-1">
                    <button onClick={() => setActiveTab('suppliers')} className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'suppliers' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}>{t('orders.tabs.suppliers')}</button>
                    <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'invoices' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}>{t('orders.tabs.invoices')}</button>
                    <button onClick={() => setActiveTab('debts')} className={`px-4 py-2 text-sm font-semibold rounded ${activeTab === 'debts' ? 'bg-accent text-accent-text' : 'text-text-muted hover:text-text-main'}`}>{t('orders.tabs.debts')}</button>
                </div>
                <button onClick={() => openModal(activeTab === 'suppliers' ? 'supplier' : activeTab === 'invoices' ? 'invoice' : 'debt')} className="btn-golden ml-auto flex items-center gap-2">
                    <i data-feather="plus" className="w-4 h-4"></i>
                    <span>{activeTab === 'suppliers' ? t('orders.suppliers.addBtn') : activeTab === 'invoices' ? t('orders.invoices.uploadBtn') : t('orders.debts.addBtn')}</span>
                </button>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {activeTab === 'suppliers' && renderSuppliers()}
                {activeTab === 'invoices' && renderInvoices()}
                {activeTab === 'debts' && renderDebts()}
            </div>

            {/* --- MODALS --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
                    <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-md modal-content p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-text-main mb-4">
                            {modalType === 'supplier' ? t('orders.suppliers.addBtn') :
                                modalType === 'invoice' ? t('orders.invoices.uploadBtn') :
                                    modalType === 'debt' ? t('orders.debts.addBtn') :
                                        modalType === 'debtDetails' ? 'Detalles de Deuda' :
                                            modalType === 'payInstallment' ? 'Registrar Pago de Cuota' : ''}
                        </h3>

                        {modalType === 'debtDetails' && selectedDebt ? (
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Total:</span>
                                    <span className="text-text-main font-bold">{formatCurrency(selectedDebt.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Pagado:</span>
                                    <span className="text-green-400 font-bold">{formatCurrency(selectedDebt.paidAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Pendiente:</span>
                                    <span className="text-red-400 font-bold">{formatCurrency(selectedDebt.pendingAmount)}</span>
                                </div>

                                <h4 className="font-bold text-text-main mt-4">Cuotas</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {selectedDebt.installments?.map(inst => (
                                        <div key={inst.id} className="bg-bg-tertiary p-3 rounded border border-border-main flex justify-between items-center">
                                            <div>
                                                <div className="text-sm font-bold text-text-main">Cuota #{inst.id}</div>
                                                <div className="text-xs text-text-muted">{inst.date}</div>
                                                <div className="text-xs font-semibold text-accent">{formatCurrency(inst.amount)}</div>
                                            </div>
                                            <div>
                                                {inst.status === 'paid' ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-green-400 text-xs font-bold flex items-center gap-1"><i data-feather="check" className="w-3 h-3"></i> PAGADO</span>
                                                        {inst.proofUrl && (
                                                            <a href={inst.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">Ver Comprobante</a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setFormData({
                                                                installmentId: inst.id,
                                                                paymentAmount: inst.amount,
                                                                paymentMethod: 'Transferencia'
                                                            });
                                                            setModalType('payInstallment');
                                                        }}
                                                        className="btn-golden text-xs py-1 px-2"
                                                    >
                                                        Pagar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedDebt.installments || selectedDebt.installments.length === 0) && (
                                        <p className="text-text-muted text-xs">No hay cuotas definidas.</p>
                                    )}
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main">Cerrar</button>
                                </div>
                            </div>
                        ) : modalType === 'payInstallment' ? (
                            <form onSubmit={handlePayInstallment} className="space-y-4">
                                <div className="bg-bg-tertiary p-3 rounded mb-4">
                                    <p className="text-sm text-text-muted">Pagando Cuota #{formData.installmentId}</p>
                                    <p className="text-lg font-bold text-text-main">{formatCurrency(formData.paymentAmount)}</p>
                                </div>

                                <select
                                    className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
                                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    value={formData.paymentMethod}
                                >
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                                    <option value="Tarjeta Débito">Tarjeta Débito</option>
                                </select>

                                {/* UPLOAD PROOF */}
                                <div className="border border-dashed border-border-main p-4 text-center text-text-muted rounded relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.png,.jpeg"
                                        disabled={isUploading}
                                    />
                                    {isUploading ? (
                                        <span className="text-accent">Subiendo... {Math.round(progress)}%</span>
                                    ) : formData.proofUrl ? (
                                        <span className="text-green-400 flex items-center justify-center gap-2">
                                            <i data-feather="check-circle"></i> Comprobante Listo
                                        </span>
                                    ) : (
                                        <span>Subir Comprobante (PDF/Foto)</span>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setModalType('debtDetails')} className="py-2 px-4 text-text-muted hover:text-text-main">Volver</button>
                                    <button type="submit" className="btn-golden py-2 px-4">Confirmar Pago</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4">
                                {modalType === 'supplier' && (
                                    <>
                                        <input type="text" placeholder={t('orders.suppliers.name')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                        <input type="text" placeholder={t('orders.suppliers.contact')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                                        <input type="text" placeholder={t('orders.suppliers.phone')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        <input type="text" placeholder={t('orders.suppliers.bank')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, bank: e.target.value })} />
                                        <input type="text" placeholder={t('orders.suppliers.account')} className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, account: e.target.value })} />
                                    </>
                                )}

                                {modalType === 'invoice' && (
                                    <>
                                        <SearchableDropdown items={suppliers || []} placeholder="Seleccionar Proveedor" onSelect={(s) => setFormData({ ...formData, supplierId: s.id, supplierName: s.name })} />

                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" placeholder="RUT" className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, rut: e.target.value })} />
                                            <input type="text" placeholder="Marca" className="bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                        </div>

                                        <select className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="">Seleccionar Categoría</option>
                                            <option value="Empresa">Empresa</option>
                                            <option value="Marca">Marca</option>
                                            <option value="Insumos">Insumos</option>
                                            <option value="Servicios Básicos">Servicios Básicos</option>
                                            <option value="Otros">Otros</option>
                                        </select>

                                        <input type="date" className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, date: e.target.value })} required />

                                        <select className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, method: e.target.value })}>
                                            <option value="">Medio de Pago</option>
                                            <option value="Transferencia">Transferencia</option>
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                                            <option value="Tarjeta Débito">Tarjeta Débito</option>
                                        </select>

                                        {/* UPLOAD INVOICE */}
                                        <div className="border border-dashed border-border-main p-4 text-center text-text-muted rounded relative">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                                accept=".pdf,.jpg,.png,.jpeg"
                                                disabled={isUploading}
                                            />
                                            {isUploading ? (
                                                <span className="text-accent">Subiendo... {Math.round(progress)}%</span>
                                            ) : formData.invoiceUrl ? (
                                                <span className="text-green-400 flex items-center justify-center gap-2">
                                                    <i data-feather="check-circle"></i> Factura Subida
                                                </span>
                                            ) : (
                                                <span>{t('orders.invoices.uploadBtn')} (PDF/Foto)</span>
                                            )}
                                        </div>
                                        {formData.invoiceUrl && (
                                            <a href={formData.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline text-center block">Ver Factura Cargada</a>
                                        )}
                                    </>
                                )}

                                {modalType === 'debt' && (
                                    <>
                                        <SearchableDropdown items={suppliers || []} placeholder="Seleccionar Proveedor" onSelect={(s) => setFormData({ ...formData, supplierId: s.id, supplierName: s.name })} />
                                        <input type="text" placeholder="Ref. Factura" className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, invoiceRef: e.target.value })} />
                                        <input
                                            type="number"
                                            placeholder="Monto Total"
                                            className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
                                            onChange={e => {
                                                const val = parseFloat(e.target.value);
                                                setFormData({ ...formData, amount: val });
                                                if (formData.installmentsCount) {
                                                    // Regenerar cuotas si cambia el monto
                                                    const count = parseInt(formData.installmentsCount);
                                                    const amountPerQuota = val / count;
                                                    const newInstallments = generatedInstallments.map(i => ({ ...i, amount: amountPerQuota }));
                                                    setGeneratedInstallments(newInstallments);
                                                }
                                            }}
                                            required
                                        />
                                        <input type="number" placeholder="Pago Inicial (Opcional)" className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" onChange={e => setFormData({ ...formData, initialPay: e.target.value })} />

                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="number"
                                                placeholder="N° Cuotas"
                                                className="flex-grow bg-bg-tertiary border border-border-main rounded p-2 text-text-main"
                                                onChange={e => {
                                                    const count = parseInt(e.target.value);
                                                    setFormData({ ...formData, installmentsCount: count });
                                                    if (count > 0 && formData.amount) {
                                                        const amount = parseFloat(formData.amount) / count;
                                                        const newInstallments = [];
                                                        for (let i = 0; i < count; i++) {
                                                            const date = new Date();
                                                            date.setMonth(date.getMonth() + i + 1); // Empezar próximo mes
                                                            newInstallments.push({
                                                                id: i + 1,
                                                                amount: amount,
                                                                date: date.toISOString().split('T')[0],
                                                                status: 'pending'
                                                            });
                                                        }
                                                        setGeneratedInstallments(newInstallments);
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Lista de Cuotas Generadas */}
                                        {generatedInstallments.length > 0 && (
                                            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                                                <h4 className="text-sm font-bold text-text-main">Plan de Pagos:</h4>
                                                {generatedInstallments.map((inst, idx) => (
                                                    <div key={inst.id} className="flex gap-2 text-xs">
                                                        <span className="w-6 text-text-muted">#{inst.id}</span>
                                                        <input
                                                            type="date"
                                                            value={inst.date}
                                                            className="bg-bg-tertiary border border-border-main rounded px-1 text-text-main"
                                                            onChange={(e) => {
                                                                const newInst = [...generatedInstallments];
                                                                newInst[idx].date = e.target.value;
                                                                setGeneratedInstallments(newInst);
                                                            }}
                                                        />
                                                        <input
                                                            type="number"
                                                            value={inst.amount}
                                                            className="w-24 bg-bg-tertiary border border-border-main rounded px-1 text-text-main"
                                                            onChange={(e) => {
                                                                const newInst = [...generatedInstallments];
                                                                newInst[idx].amount = parseFloat(e.target.value);
                                                                setGeneratedInstallments(newInst);
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 px-4 text-text-muted hover:text-text-main">{t('common.cancel')}</button>
                                    <button type="submit" className="btn-golden py-2 px-4">{t('common.save')}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PedidosPage;