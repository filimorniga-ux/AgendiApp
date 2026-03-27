// ===== INICIO: src/components/agenda/ModalNuevaCita.jsx (Refactorizado) =====
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext'; // <-- 1. USAR DATACONTEXT
import { sbCreate } from '../../supabase/db';
import SearchableDropdown from '../ui/SearchableDropdown';
import toast from 'react-hot-toast';

const ModalNuevaCita = ({ isOpen, onClose, slotInfo }) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- 2. Consumir datos desde el "cerebro" ---
  const { clients, services, isLoading, businessId } = useData();
  const loadingClients = isLoading; // Simplificado
  const loadingServices = isLoading; // Simplificado
  // --- Fin de cambios ---


  useEffect(() => {
    if (isOpen) {
      setSelectedClient(null);
      setSelectedService(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen || !slotInfo) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedClient || !selectedService) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }
    setIsSaving(true);

    const duration = selectedService.duration || 30; 
    const [startH, startM] = slotInfo.time.split(':').map(Number);
    const startTimeInMinutes = startH * 60 + startM;
    const endTimeInMinutes = startTimeInMinutes + duration;
    const endH = String(Math.floor(endTimeInMinutes / 60)).padStart(2, '0');
    const endM = String(endTimeInMinutes % 60).padStart(2, '0');

    // Guardamos la cita como un 'movement' de tipo 'Cita'
    const appointmentData = {
      type: 'Cita', // <-- Tipo Movimiento
      collaboratorId: slotInfo.collaborator.id,
      collaboratorName: slotInfo.collaborator.name,
      clientId: selectedClient.id,
      client: selectedClient.name, // Guardamos el nombre para consistencia
      serviceId: selectedService.id,
      description: selectedService.name, // Usamos description
      amount: selectedService.price, // Guardamos el precio
      startTime: slotInfo.time,
      endTime: `${endH}:${endM}`,
      date: new Date(), // Guarda como Timestamp
      createdAt: serverTimestamp(),
      paymentMethod: 'Pendiente', // Las citas no se pagan al agendar
      technicalCost: 0,
      productsUsed: []
    };

    try {
      const { error } = await sbCreate('movements', appointmentData, businessId);
      if (error) throw error;
      toast.success('Cita guardada con éxito');
      onClose();
    } catch (error) {
      console.warn('Error al guardar la cita: ', error);
      toast.error('Hubo un error al guardar la cita.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center">
      <div className="bg-secondary p-6 rounded-lg shadow-xl w-full max-w-md z-50 text-text-main">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Crear Nueva Cita</h2>
          <button onClick={onClose} className="text-text-main hover:text-accent text-2xl">&times;</button>
        </div>

        <div className="bg-main p-3 rounded-md mb-6 text-sm">
          <p><span className="font-semibold">Colaborador:</span> {slotInfo.collaborator.name}</p>
          <p><span className="font-semibold">Hora de inicio:</span> {slotInfo.time}</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <SearchableDropdown
              items={clients || []}
              placeholder={loadingClients ? 'Cargando clientes...' : 'Selecciona un cliente'}
              onSelect={(client) => setSelectedClient(client)}
              initialValue={selectedClient}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Servicio</label>
            <SearchableDropdown
              items={services || []}
              placeholder={loadingServices ? 'Cargando servicios...' : 'Selecciona un servicio'}
              onSelect={(service) => setSelectedService(service)}
              initialValue={selectedService}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-tertiary text-text-main rounded-md hover:bg-opacity-80" disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-accent text-accent-text font-semibold rounded-md hover:bg-opacity-90" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ModalNuevaCita;
// ===== FIN: src/components/agenda/ModalNuevaCita.jsx =====