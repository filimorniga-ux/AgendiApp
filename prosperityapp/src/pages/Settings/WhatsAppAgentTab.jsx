import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

const WhatsAppAgentTab = () => {
  const { t } = useTranslation();
  const { businessId, businessPlan } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [config, setConfig] = useState({
    phone_number_id: '',
    waba_id: '',
    bot_active: true,
    system_prompt_customization: ''
  });

  // Check if user is Platinum
  const isPlatinum = businessPlan === 'platinum' || businessPlan === 'enterprise';

  useEffect(() => {
    if (!businessId || !isPlatinum) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_configs')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setConfig({
            phone_number_id: data.phone_number_id || '',
            waba_id: data.waba_id || '',
            bot_active: data.bot_active ?? true,
            system_prompt_customization: data.system_prompt_customization || ''
          });
        }
      } catch (error) {
        console.error('Error fetching WhatsApp config:', error);
        toast.error('Error al cargar la configuración de WhatsApp');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [businessId, isPlatinum]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveAttempt = () => {
    if (!config.phone_number_id) {
      toast.error('El Phone Number ID es obligatorio');
      return;
    }
    // Show warning before saving
    setShowWarningModal(true);
  };

  const confirmSave = async () => {
    setShowWarningModal(false);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('whatsapp_configs')
        .upsert({
          business_id: businessId,
          phone_number_id: config.phone_number_id,
          waba_id: config.waba_id,
          bot_active: config.bot_active,
          system_prompt_customization: config.system_prompt_customization,
          updated_at: new Date().toISOString()
        }, { onConflict: 'business_id' });

      if (error) throw error;
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (!isPlatinum) {
    return (
      <div className="bg-bg-secondary p-8 rounded-lg border border-border-main shadow-sm text-center">
        <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-feather="lock" className="w-8 h-8"></i>
        </div>
        <h3 className="text-2xl font-bold text-text-main mb-2">Suscripción Platinum Requerida</h3>
        <p className="text-text-muted mb-6 max-w-md mx-auto">
          Los agentes de Inteligencia Artificial con WhatsApp Oficial son una función exclusiva de nuestro plan Platinum. Mejora tu plan para acceder a esta herramienta.
        </p>
        <button className="btn-golden">
          Mejorar a Platinum
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center p-8 text-text-muted">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

        <h3 className="text-xl font-bold text-text-main mb-2 flex items-center gap-2">
          <i data-feather="cpu" className="w-6 h-6 text-accent"></i>
          Agente de IA (WhatsApp Oficial)
        </h3>
        <p className="text-text-muted mb-6">
          Configura la conexión oficial con Meta y personaliza cómo se comporta tu Agente de IA para responder a tus clientes automáticamente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">Phone Number ID (Meta)</label>
            <input
              type="text"
              name="phone_number_id"
              value={config.phone_number_id}
              onChange={handleChange}
              placeholder="Ej: 104561234567890"
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-text-muted">El identificador único de tu número en la API de Meta.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">WhatsApp Business Account ID (WABA)</label>
            <input
              type="text"
              name="waba_id"
              value={config.waba_id}
              onChange={handleChange}
              placeholder="Ej: 105671234567890"
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-text-muted">El ID de tu cuenta de WhatsApp Business (Opcional).</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-text-main">Instrucciones Adicionales para el Agente (Prompt)</label>
          <textarea
            name="system_prompt_customization"
            value={config.system_prompt_customization}
            onChange={handleChange}
            rows="4"
            placeholder="Ej: Responde siempre de forma muy amable. Recuerda que no abrimos los domingos..."
            className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-text-main focus:border-accent focus:outline-none resize-y"
          ></textarea>
          <p className="text-xs text-text-muted">Estas instrucciones se sumarán al comportamiento predeterminado del bot de gestionar citas y dar precios.</p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-bg-tertiary rounded-lg border border-border-main mb-6">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-text-main">Agente Activo</h4>
            <p className="text-xs text-text-muted">Permite que el Agente IA responda automáticamente a los mensajes entrantes.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              name="bot_active"
              checked={config.bot_active} 
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
          </label>
        </div>

        <div className="text-right border-t border-border-main pt-4">
          <button 
            onClick={handleSaveAttempt} 
            disabled={saving}
            className="btn-golden flex items-center gap-2 ml-auto"
          >
            {saving ? 'Guardando...' : (
              <>
                <i data-feather="save" className="w-4 h-4"></i>
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div className="bg-bg-secondary rounded-xl shadow-2xl border border-red-500/50 w-full max-w-lg p-6 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i data-feather="alert-triangle" className="w-6 h-6"></i>
              </div>
              <h3 className="text-2xl font-bold text-text-main">Atención Importante</h3>
            </div>
            
            <div className="space-y-4 text-text-muted mb-8">
              <p>
                Al vincular este número con la <strong>API Oficial de Meta</strong>, debes tener en cuenta que el número quedará <strong>dedicado exclusivamente</strong> a este Agente de IA y al Chat Interno de AgendiApp.
              </p>
              <p className="text-red-400 font-semibold">
                No podrás seguir utilizando este número simultáneamente en la aplicación móvil de WhatsApp Business. 
              </p>
              <p>
                Si tienes dudas, te recomendamos usar un número nuevo exclusivamente para este Agente, o estar completamente seguro de migrar tu canal principal a nuestra plataforma.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 rounded-lg font-bold border border-border-main text-text-main hover:bg-bg-tertiary transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmSave}
                className="px-4 py-2 rounded-lg font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Comprendo, Guardar y Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppAgentTab;
