// ===== INICIO: src/components/agenda/AgendaCalendario.jsx (Sprint 107 - Kanban Real) =====
import React, { useState, useEffect, useMemo, useRef } from 'react';
import feather from 'feather-icons';
import { useData } from '../../context/DataContext';
import { db } from '../../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import SearchableDropdown from '../ui/SearchableDropdown';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import TimeClockModal from '../modals/TimeClockModal';
import TechCalculatorModal from '../modals/TechCalculatorModal';

// Helper para formatear hora
const formatTime = (dateObj) => {
  if (!dateObj) return '';
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- TARJETA DE CITA (Estilo Caja Diaria) ---
const AppointmentCard = ({ appointment, onClick }) => {
  const { t } = useTranslation();

  // Mapeo de estados a colores
  const statusStyles = {
    confirmed: 'border-l-blue-500 bg-bg-tertiary',
    pending: 'border-l-yellow-500 bg-yellow-500/10',
    completed: 'border-l-green-500 bg-green-500/10',
    cancelled: 'border-l-red-500 bg-red-500/10',
    no_show: 'border-l-gray-500 bg-gray-500/10'
  };

  const borderClass = statusStyles[appointment.status] || 'border-l-accent bg-bg-tertiary';

  return (
    <div
      onClick={() => onClick(appointment)}
      className={`p-3 mb-3 rounded-r-md shadow-sm border-l-4 ${borderClass} hover:brightness-110 cursor-pointer transition-all group`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="font-bold text-text-main text-sm truncate">{appointment.clientName}</span>
        <span className="text-[10px] font-mono text-text-muted bg-bg-main/50 px-1 rounded ml-2 whitespace-nowrap">
          {formatTime(appointment.start)}
        </span>
      </div>
      <p className="text-xs text-text-secondary truncate font-medium">{appointment.serviceName}</p>

      <div className="flex justify-between items-end mt-2">
        {appointment.notes && (
          <span className="text-[10px] text-text-muted italic truncate max-w-[80%]">
            <i data-feather="message-square" className="w-3 h-3 inline mr-1"></i>
            {appointment.notes}
          </span>
        )}
        {/* Icono de estado sutil */}
        <span className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">
          {appointment.status === 'confirmed' && '📅'}
          {appointment.status === 'completed' && '✅'}
        </span>
      </div>
    </div>
  );
};

// --- COLUMNA DE ESTILISTA (Kanban) ---
const StylistColumn = ({ stylist, appointments, onAdd, onEdit }) => {
  // Ordenar citas cronológicamente
  const sorted = [...appointments].sort((a, b) => a.start - b.start);

  return (
    <div className="min-w-[280px] w-[280px] flex flex-col h-full bg-bg-secondary rounded-lg border border-border-main shadow-md mx-2 flex-shrink-0 transition-colors">
      {/* Cabecera */}
      <div className="p-3 border-b-4 border-accent bg-bg-tertiary/30 rounded-t-lg flex justify-between items-center">
        <div className="overflow-hidden">
          <h3 className="font-bold text-lg text-text-main uppercase truncate">{stylist.name}</h3>
          <p className="text-xs text-text-muted">{appointments.length} Citas</p>
        </div>
        <button
          onClick={() => onAdd(stylist)}
          className="p-1.5 rounded-full bg-bg-main hover:bg-accent text-text-muted hover:text-accent-text transition-colors shadow-sm"
        >
          <i data-feather="plus" className="w-5 h-5"></i>
        </button>
      </div>

      {/* Cuerpo (Scroll Vertical Independiente) */}
      <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
        {sorted.length > 0 ? (
          sorted.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} onClick={onEdit} />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted/30">
            <i data-feather="calendar" className="w-10 h-10 mb-2"></i>
            <span className="text-sm font-medium">Libre</span>
          </div>
        )}
      </div>
    </div>
  );
};

const AgendaCalendario = () => {
  const { t, i18n } = useTranslation();
  const { appointments, clients, collaborators, services, isLoading } = useData();

  const [date, setDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimeClockOpen, setIsTimeClockOpen] = useState(false);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const calendarRef = useRef(null);

  const [formData, setFormData] = useState({
    client: null, stylist: null, service: null, start: new Date(), duration: 60, status: 'confirmed', notes: '', productsUsed: []
  });

  // Estado para TechCalculatorModal
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [techProducts, setTechProducts] = useState([]);

  // Filtrar citas del día seleccionado
  const dailyAppointments = useMemo(() => {
    if (!appointments) return [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return appointments
      .filter(apt => {
        // Manejo seguro de Timestamp de Firestore
        const aptDate = apt.start?.toDate ? apt.start.toDate() : new Date(apt.start);
        return aptDate >= startOfDay && aptDate <= endOfDay;
      })
      .map(apt => ({
        ...apt,
        start: apt.start?.toDate ? apt.start.toDate() : new Date(apt.start),
        end: apt.end?.toDate ? apt.end.toDate() : new Date(apt.end)
      }));
  }, [appointments, date]);

  useEffect(() => { feather.replace(); }, [collaborators, dailyAppointments, isModalOpen, isTimeClockOpen]);

  // Cerrar mini-calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowMiniCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegación
  const handleDateChange = (newDate) => { setDate(newDate); setShowMiniCalendar(false); };
  const navigateToday = () => setDate(new Date());
  const navigateBack = () => { const d = new Date(date); d.setDate(date.getDate() - 1); setDate(d); };
  const navigateNext = () => { const d = new Date(date); d.setDate(date.getDate() + 1); setDate(d); };

  // Handlers
  const handleAddAppointment = (stylist = null) => {
    setSelectedEvent(null);
    // Pre-llenar fecha con la fecha seleccionada en el calendario + hora actual (o 9 AM si es otro día)
    const now = new Date();
    let defaultStart = new Date(date);
    if (date.toDateString() === now.toDateString()) {
      defaultStart.setHours(now.getHours() + 1, 0, 0, 0); // Próxima hora
    } else {
      defaultStart.setHours(9, 0, 0, 0); // 9 AM por defecto
    }

    setFormData({
      client: null,
      stylist: stylist || null,
      service: null,
      start: defaultStart,
      duration: 60,
      status: 'confirmed',
      notes: '',
      productsUsed: []
    });
    setTechProducts([]);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (apt) => {
    setSelectedEvent(apt);
    // Reconstruir objetos para dropdowns
    const client = clients.find(c => c.id === apt.clientId) || { id: apt.clientId, name: apt.clientName };
    const stylist = collaborators.find(c => c.id === apt.stylistId) || { id: apt.stylistId, name: apt.stylistName };
    const service = services.find(s => s.id === apt.serviceId) || { id: apt.serviceId, name: apt.serviceName };

    setFormData({
      client, stylist, service,
      start: apt.start,
      duration: (apt.end - apt.start) / 60000,
      status: apt.status,
      notes: apt.notes || '',
      productsUsed: apt.productsUsed || []
    });
    setTechProducts(apt.productsUsed || []);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.client || !formData.stylist || !formData.service) {
      toast.error(t('modals.errors.completeFields'));
      return;
    }
    const startTime = new Date(formData.start);
    const endTime = new Date(startTime.getTime() + formData.duration * 60000);

    // Calcular costo técnico desde productos usados
    const technicalCost = techProducts.reduce((sum, p) => sum + (p.costPerGram * p.gramsUsed || 0), 0);

    const appointmentData = {
      clientId: formData.client.id,
      clientName: formData.client.name,
      stylistId: formData.stylist.id,
      stylistName: formData.stylist.name,
      serviceId: formData.service.id,
      serviceName: formData.service.name,
      start: startTime,
      end: endTime,
      status: formData.status,
      notes: formData.notes,
      productsUsed: techProducts, // Guardar productos en la cita
      technicalCost: technicalCost, // Guardar costo calculado
      updatedAt: serverTimestamp()
    };

    try {
      const batch = writeBatch(db);

      if (selectedEvent) {
        let paymentRegistered = false;
        // Lógica de Ingreso a Caja (Trigger: status 'completed')
        if (formData.status === 'completed' && !selectedEvent.movementId) {
          const movementData = {
            type: 'Servicio',
            description: `Servicio: ${formData.service.name}`,
            amount: formData.service.price || 0,
            clientId: formData.client.id,
            client: formData.client.name,
            collaboratorId: formData.stylist.id,
            collaboratorName: formData.stylist.name,
            technicalCost: technicalCost, // Transferir costo técnico al movimiento
            productsUsed: techProducts, // Transferir productos al movimiento
            date: new Date(),
            createdAt: serverTimestamp(),
            paymentMethod: 'Efectivo', // Default
            transactionId: doc(collection(db, 'temp')).id // Generar ID único de transacción
          };
          const movementRef = doc(collection(db, 'movements'));
          batch.set(movementRef, movementData);
          appointmentData.movementId = movementRef.id;

          paymentRegistered = true;
        }

        const aptRef = doc(db, 'appointments', selectedEvent.id);
        batch.update(aptRef, appointmentData);

        await batch.commit();

        if (paymentRegistered) {
          toast.success(t('calendar.alerts.paymentRegistered'));
        } else {
          toast.success(t('calendar.alerts.updated'));
        }
      } else {
        appointmentData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'appointments'), appointmentData);
        toast.success(t('calendar.alerts.created'));
      }
      setIsModalOpen(false);
    } catch (error) { console.error(error); toast.error(t('common.error')); }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !window.confirm(t('common.confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'appointments', selectedEvent.id));
      toast.success(t('calendar.alerts.deleted'));
      setIsModalOpen(false);
    } catch (error) { console.error(error); toast.error(t('common.error')); }
  };

  // Handler para TechCalculatorModal
  const handleTechSave = (products) => {
    setTechProducts(products);
    setIsTechModalOpen(false);
    toast.success(`${products.length} productos agregados`);
  };

  if (isLoading) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* --- HEADER (Navegación y Controles) --- */}
      <div className="flex flex-wrap justify-between items-center bg-bg-secondary p-4 rounded-lg border border-border-main shadow-sm gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-2xl font-bold text-text-main mr-2">{t('calendar.title')}</h2>

          {/* Navegación de Fecha */}
          <div className="flex items-center bg-bg-main p-1 rounded-md border border-border-main">
            <button onClick={navigateBack} className="p-2 text-text-muted hover:text-accent hover:bg-bg-secondary rounded-md transition-colors">
              <i data-feather="chevron-left" className="w-5 h-5"></i>
            </button>

            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowMiniCalendar(!showMiniCalendar)}
                className="px-4 py-2 font-bold text-text-main hover:text-accent transition-colors flex items-center gap-2 min-w-[200px] justify-center"
              >
                <i data-feather="calendar" className="w-4 h-4"></i>
                {date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </button>

              {showMiniCalendar && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-bg-secondary border border-border-main rounded-lg shadow-xl p-2 w-72">
                  <ReactCalendar onChange={handleDateChange} value={date} className="react-calendar-gema" />
                </div>
              )}
            </div>

            <button onClick={navigateNext} className="p-2 text-text-muted hover:text-accent hover:bg-bg-secondary rounded-md transition-colors">
              <i data-feather="chevron-right" className="w-5 h-5"></i>
            </button>
          </div>

          <button onClick={navigateToday} className="px-3 py-1 text-sm font-semibold text-text-muted hover:text-accent transition-colors underline">
            {t('calendar.today')}
          </button>
        </div>

        <div className="flex gap-3 ml-auto">
          <button onClick={() => setIsTimeClockOpen(true)} className="px-4 py-2 bg-bg-tertiary text-text-main font-semibold rounded-md hover:bg-bg-main border border-border-main flex items-center gap-2 transition-colors">
            <i data-feather="clock" className="w-4 h-4"></i>
            <span className="hidden sm:inline">{t('hr.title')}</span>
          </button>

          <button onClick={() => handleAddAppointment(null)} className="btn-golden flex items-center shadow-md">
            <i data-feather="plus" className="inline-block w-5 h-5 mr-2"></i>
            <span>{t('calendar.newBtn')}</span>
          </button>
        </div>
      </div>

      {/* --- PIZARRA KANBAN (Columnas) --- */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="flex h-full pb-2">
          {(collaborators || []).filter(c => c.status === 'active').map(collab => {
            const collabAppointments = dailyAppointments.filter(apt => apt.stylistId === collab.id);
            return (
              <StylistColumn
                key={collab.id}
                stylist={collab}
                appointments={collabAppointments}
                onAdd={handleAddAppointment}
                onEdit={handleEditAppointment}
              />
            );
          })}
        </div>
      </div>

      {/* --- MODAL DE CITA (RESTAURADO) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 modal-backdrop">
          <div className="bg-bg-secondary rounded-lg shadow-xl border border-border-main w-full max-w-lg modal-content flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border-main flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-main">{selectedEvent ? t('calendar.modal.editTitle') : t('calendar.modal.newTitle')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main text-3xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div><label className="block text-sm font-medium text-text-muted mb-1">{t('calendar.modal.client')}</label><SearchableDropdown items={clients || []} placeholder={t('calendar.modal.clientPlaceholder')} onSelect={(c) => setFormData({ ...formData, client: c })} initialValue={formData.client} /></div>
              <div><label className="block text-sm font-medium text-text-muted mb-1">{t('calendar.modal.stylist')}</label><SearchableDropdown items={collaborators || []} placeholder={t('calendar.modal.stylistPlaceholder')} onSelect={(c) => setFormData({ ...formData, stylist: c })} initialValue={formData.stylist} /></div>
              <div><label className="block text-sm font-medium text-text-muted mb-1">{t('calendar.modal.service')}</label><SearchableDropdown items={services || []} placeholder={t('calendar.modal.servicePlaceholder')} onSelect={(s) => setFormData({ ...formData, service: s, duration: s.duration || 60 })} initialValue={formData.service} /></div>

              {/* Botón de Consumo Técnico */}
              <div className="bg-bg-main/30 border border-border-main rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="block text-sm font-medium text-text-main">Consumo Técnico</label>
                    <p className="text-xs text-text-muted mt-1">
                      {techProducts.length > 0 ? `${techProducts.length} productos seleccionados` : 'Sin productos aún'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTechModalOpen(true)}
                    className="px-4 py-2 bg-bg-tertiary text-text-main font-semibold rounded-md hover:bg-accent hover:text-accent-text border border-border-main flex items-center gap-2 transition-colors"
                  >
                    <i data-feather="calculator" className="w-4 h-4"></i>
                    <span className="text-sm">Productos</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1">{t('calendar.modal.date')}</label><input type="datetime-local" className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" value={formData.start ? new Date(formData.start.getTime() - (formData.start.getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''} onChange={(e) => setFormData({ ...formData, start: new Date(e.target.value) })} required /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1">{t('calendar.modal.duration')}</label><input type="number" className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} min="15" step="15" /></div>
              </div>
              <div><label className="block text-sm font-medium text-text-muted mb-1">{t('collaborators.table.status')}</label><select className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="confirmed">{t('calendar.status.confirmed')}</option><option value="pending">{t('calendar.status.pending')}</option><option value="completed">{t('calendar.status.completed')}</option><option value="cancelled">{t('calendar.status.cancelled')}</option></select></div>
              <div><label className="block text-sm font-medium text-text-muted mb-1">{t('calendar.modal.notes')}</label><textarea className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main h-20" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div >
            </form>
            <div className="p-4 border-t border-border-main bg-bg-main/50 flex justify-between items-center">
              <div>{selectedEvent && (<button onClick={handleDelete} type="button" className="text-red-500 hover:text-red-400 font-semibold text-sm">{t('common.delete')}</button>)}</div>
              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="py-2 px-4 bg-bg-tertiary rounded text-text-muted hover:bg-bg-tertiary/80">{t('common.cancel')}</button>
                <button onClick={handleSave} className="btn-golden py-2 px-4">{t('common.save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TechCalculatorModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        onSave={handleTechSave}
        initialProducts={techProducts}
      />
      <TimeClockModal isOpen={isTimeClockOpen} onClose={() => setIsTimeClockOpen(false)} />
    </div>
  );
};

export default AgendaCalendario;
// ===== FIN: src/components/agenda/AgendaCalendario.jsx =====