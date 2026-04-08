import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Step3DateTime = ({ business, onNext, onBack, selectedStylist, selectedService, initialDate, initialTime }) => {
  const [date, setDate] = useState(initialDate || new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(initialTime || null);

  // Generar horario comercial estándar 9am - 6pm (18:00)
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9;
    const endHour = 18;
    // Granularidad de 30 mins para mostrar opciones, aunque el servicio dure más o menos.
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      // Ajustar fechas para el query
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      try {
        let query = supabase
          .from('appointments')
          .select('id, starts_at, ends_at, status')
          .eq('business_id', business.id)
          .gte('starts_at', startOfDay.toISOString())
          .lte('starts_at', endOfDay.toISOString())
          .neq('status', 'cancelled'); // ignorar citas canceladas

        // Si se eligió un estilista específico
        if (selectedStylist.id !== 'no-preference') {
          query = query.eq('collaborator_id', selectedStylist.id);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        setAppointments(data || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
    setSelectedTimeSlot(null); // Reset time when date changes
  }, [date, business.id, selectedStylist.id]);

  const allSlots = generateTimeSlots();

  // Filtrar slots ocupados y pasados
  const availableSlots = allSlots.filter(slotStr => {
    const [hours, minutes] = slotStr.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);

    const now = new Date();
    
    // Si la fecha seleccionada es hoy, bloquear horas pasadas (con un margen de 30 mins para urgencias)
    if (date.toDateString() === now.toDateString() && slotStart < new Date(now.getTime() + 30 * 60000)) {
      return false;
    }

    // Calcular hora de fin del slot basado en la duración del servicio
    const duration = selectedService?.duration || 60;
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    // Revisar colisiones con citas existentes
    const isOccupied = appointments.some(apt => {
      const aptStart = new Date(apt.starts_at);
      const aptEnd = new Date(apt.ends_at);
      
      // Hay colisión si el inicio del slot es antes del fin de la cita Y el fin del slot es después del inicio
      return (slotStart < aptEnd && slotEnd > aptStart);
    });

    return !isOccupied;
  });

  const handleNext = () => {
    if (selectedTimeSlot) {
      onNext(date, selectedTimeSlot);
    }
  };

  // Deshabilitar fechas pasadas en el calendario
  const tileDisabled = ({ date: tileDate, view }) => {
    if (view === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return tileDate < today;
    }
    return false;
  };

  return (
    <div className="animate-fade-in relative z-10">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="text-sm text-text-muted hover:text-accent transition-colors flex items-center mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver a profesionales
        </button>
        <h3 className="text-2xl font-bold text-text-main mb-2">Fecha y Hora</h3>
        <p className="text-text-muted">Selecciona cuándo deseas asistir.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <div className="bg-bg-secondary p-4 rounded-xl border border-border-main shadow-md">
            <ReactCalendar 
              onChange={setDate} 
              value={date} 
              className="react-calendar-gema !border-none !bg-transparent w-full"
              tileDisabled={tileDisabled}
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <h4 className="text-lg font-semibold text-text-main mb-4 border-b border-border-main pb-2">
            Disponibilidad - {date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h4>
          
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
             </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12 bg-bg-secondary rounded-xl border border-border-main">
              <p className="text-text-muted">No hay horarios disponibles para este día.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto custom-scrollbar p-1">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`py-2 px-1 text-center rounded-lg border text-sm font-medium transition-all duration-200
                    ${selectedTimeSlot === slot 
                      ? 'bg-accent text-bg-main border-accent shadow-[0_0_10px_rgba(212,168,83,0.4)]' 
                      : 'bg-bg-tertiary border-border-main text-text-main hover:border-accent hover:text-accent'
                    }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedTimeSlot}
              className={`btn-golden py-3 px-8 text-lg ${!selectedTimeSlot ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3DateTime;
