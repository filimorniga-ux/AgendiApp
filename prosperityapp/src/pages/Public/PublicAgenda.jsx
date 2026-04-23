import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabase/client';
import ErrorBoundary from '../../components/ErrorBoundary';

import Step1Service from '../../components/public/booking/Step1Service';
import Step2Stylist from '../../components/public/booking/Step2Stylist';
import Step3DateTime from '../../components/public/booking/Step3DateTime';
import Step4Form from '../../components/public/booking/Step4Form';

const PublicAgenda = () => {
  const { business } = useOutletContext();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const handleNextStep1 = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleNextStep2 = (stylist) => {
    setSelectedStylist(stylist);
    setStep(3);
  };

  const handleNextStep3 = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep(4);
  };

  const handleFinalSubmit = async (clientInfo) => {
    setLoading(true);
    try {
      // 1. Buscar o Crear Cliente
      let clientId = null;
      let existingClient = null;

      // Intentar buscar por teléfono si lo proporcionó
      if (clientInfo.phone) {
        const { data: cData } = await supabase
          .from('clients')
          .select('id, name')
          .eq('business_id', business.id)
          .eq('phone', clientInfo.phone)
          .limit(1)
          .maybeSingle();
        existingClient = cData;
      }

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Crear cliente con fuente de captación
        const { data: newClient, error: cError } = await supabase
          .from('clients')
          .insert({
            business_id: business.id,
            name: clientInfo.name,
            phone: clientInfo.phone,
            email: clientInfo.email || null,
            source: 'public_booking',
            status: 'active'
          })
          .select()
          .single();
        
        if (cError) throw cError;
        clientId = newClient.id;
      }

      // 2. Si el cliente quiere crear cuenta, registrar en Supabase Auth
      if (clientInfo.wantsAccount && clientInfo.email && clientInfo.password) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: clientInfo.email,
            password: clientInfo.password,
            options: { data: { name: clientInfo.name, phone: clientInfo.phone } },
          });

          if (!authErr && authData?.user?.id) {
            // Vincular auth_user_id al registro del cliente
            await supabase
              .from('clients')
              .update({ auth_user_id: authData.user.id, email: clientInfo.email })
              .eq('id', clientId);
          }
        } catch (accErr) {
          // No bloquear la reserva si falla la creación de cuenta
          console.warn('Account creation failed, booking will proceed:', accErr);
        }
      }

      // 3. Crear Cita
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime.getTime() + (selectedService.duration || 60) * 60000);

      const appointmentData = {
        business_id: business.id,
        client_id: clientId,
        client_name: clientInfo.name,
        collaborator_id: selectedStylist.id === 'no-preference' ? null : selectedStylist.id,
        collaborator_name: selectedStylist.id === 'no-preference' ? 'Cualquier Profesional' : selectedStylist.name,
        service_id: selectedService.id,
        service_name: selectedService.name,
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString(),
        status: 'pending', // Requiere confirmación del negocio
        notes: `Agendado vía App Pública. Teléfono: ${clientInfo.phone}`
      };

      const { error: aptError } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (aptError) throw aptError;

      setIsSuccess(true);
      toast.success(clientInfo.wantsAccount 
        ? '¡Reserva creada y cuenta activada! Ya puedes ver tu historial.' 
        : '¡Reserva creada con éxito!');

    } catch (error) {
      console.error('Error al crear reserva:', error);
      toast.error('Ocurrió un error al procesar tu reserva. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedStylist(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 animate-fade-in relative z-10">
        <div className="bg-bg-secondary border border-border-main rounded-2xl p-8 text-center shadow-lg max-w-lg mx-auto">
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-text-main mb-2">¡Reserva solicitada!</h2>
          <p className="text-text-muted mb-6">Hemos enviado tu solicitud a <span className="capitalize font-semibold text-accent">{business.name}</span>.</p>
          
          <div className="bg-bg-tertiary rounded-xl p-4 text-left border border-border-main mb-8">
            <p className="text-sm text-text-muted mb-1">Servicio: <span className="text-text-main font-semibold">{selectedService?.name}</span></p>
            <p className="text-sm text-text-muted mb-1">Profesional: <span className="text-text-main font-semibold capitalize">{selectedStylist?.name}</span></p>
            <p className="text-sm text-text-muted mb-1">Día: <span className="text-text-main font-semibold">{selectedDate?.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
            <p className="text-sm text-text-muted">Hora: <span className="text-text-main font-semibold">{selectedTime}</span></p>
          </div>

          <div className="flex gap-4 justify-center">
             <button onClick={resetFlow} className="btn-golden py-2 px-6">Agendar otra cita</button>
          </div>
        </div>
      </div>
    );
  }

  // Barra de progreso del wizard
  const stepsRender = [
    { num: 1, label: 'Servicio' },
    { num: 2, label: 'Profesional' },
    { num: 3, label: 'Horario' },
    { num: 4, label: 'Tus Datos' }
  ];

  return (
    <div className="space-y-6 relative z-10 w-full max-w-5xl mx-auto">
      {/* Progreso */}
      <div className="mb-8 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex items-center min-w-max">
          {stepsRender.map((s, idx) => (
             <React.Fragment key={s.num}>
               <div className={`flex flex-col items-center relative z-10 ${step >= s.num ? 'opacity-100' : 'opacity-50'}`}>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all duration-300
                   ${step === s.num ? 'bg-accent text-bg-main shadow-[0_0_15px_rgba(212,168,83,0.5)] scale-110' : 
                     step > s.num ? 'bg-accent/20 text-accent border border-accent/50' : 'bg-bg-tertiary border border-border-main text-text-muted'}
                 `}>
                   {step > s.num ? '✓' : s.num}
                 </div>
                 <span className={`text-xs font-medium ${step === s.num ? 'text-accent' : 'text-text-muted'}`}>{s.label}</span>
               </div>
               {idx < stepsRender.length - 1 && (
                 <div className={`w-16 sm:w-24 h-1 mx-2 sm:mx-4 -mt-6 rounded-full transition-all duration-300
                   ${step > s.num ? 'bg-accent/50' : 'bg-bg-tertiary'}
                 `} />
               )}
             </React.Fragment>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        <ErrorBoundary>
          {step === 1 && (
            <Step1Service 
              business={business} 
              onNext={handleNextStep1}
              initialService={selectedService}
            />
          )}
          {step === 2 && (
            <Step2Stylist 
              business={business} 
              onNext={handleNextStep2} 
              onBack={() => setStep(1)}
              initialStylist={selectedStylist}
            />
          )}
          {step === 3 && (
            <Step3DateTime 
              business={business}
              selectedStylist={selectedStylist}
              selectedService={selectedService}
              onNext={handleNextStep3}
              onBack={() => setStep(2)}
              initialDate={selectedDate}
              initialTime={selectedTime}
            />
          )}
          {step === 4 && (
            <Step4Form 
              onNext={handleFinalSubmit}
              onBack={() => setStep(3)}
              loading={loading}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default PublicAgenda;
