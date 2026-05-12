import React, { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';
import feather from 'feather-icons';

const Icon = ({ name, className = '' }) => {
  const icon = feather.icons[name];
  if (!icon) return null;
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: icon.toSvg({ class: 'w-full h-full' }) }}
    />
  );
};

const WhatsAppAgentTab = () => {
  const { businessId, businessPlan } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [hasPlatinum, setHasPlatinum] = useState(false);

  const [config, setConfig] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [botActive, setBotActive] = useState(true);

  // Load Meta Facebook SDK dynamically
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) return;

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID || '2512577115880923',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v25.0'
      });
    };

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  // Fetch business Platinum status and WhatsApp config
  useEffect(() => {
    if (!businessId) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        // Check Platinum status
        const { data: biz } = await supabase
          .from('businesses')
          .select('has_platinum')
          .eq('id', businessId)
          .single();

        setHasPlatinum(biz?.has_platinum || false);

        // Fetch WhatsApp config
        const { data: waConfig } = await supabase
          .from('whatsapp_configs')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle();

        if (waConfig) {
          setConfig(waConfig);
          setCustomPrompt(waConfig.system_prompt_customization || '');
          setBotActive(waConfig.bot_active ?? true);
        }
      } catch (error) {
        console.error('Error fetching AgendiBot config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  const isConnected = config?.connection_status === 'connected' && config?.phone_number_id;

  // Save bot settings (prompt + active toggle)
  const handleSaveSettings = async () => {
    if (!config?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('whatsapp_configs')
        .update({
          system_prompt_customization: customPrompt,
          bot_active: botActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;
      setConfig(prev => ({ ...prev, system_prompt_customization: customPrompt, bot_active: botActive }));
      toast.success('AgendiBot actualizado ✅');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    if (!config?.id) return;
    if (!window.confirm('¿Estás seguro de desconectar tu WhatsApp? El bot dejará de responder.')) return;
    
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from('whatsapp_configs')
        .update({
          connection_status: 'disconnected',
          bot_active: false,
          access_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;
      setConfig(prev => ({ ...prev, connection_status: 'disconnected', bot_active: false, access_token: null }));
      setBotActive(false);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Error al desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  // Launch Meta Embedded Signup
  const launchEmbeddedSignup = useCallback(() => {
    // Check if FB SDK is loaded
    if (typeof window.FB === 'undefined') {
      toast.error('Error: SDK de Meta no cargado. Recarga la página.');
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const { code } = response.authResponse;
          // Send to backend for token exchange
          handleEmbeddedSignupCallback(code);
        } else {
          toast.error('Conexión cancelada');
        }
      },
      {
        config_id: import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID || '',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3'
        }
      }
    );
  }, [businessId]);

  // Handle callback from Embedded Signup
  const handleEmbeddedSignupCallback = async (code) => {
    const loadingToast = toast.loading('Conectando WhatsApp...');
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-onboard', {
        body: { code, businessId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error en la conexión');

      // Refresh config
      const { data: updatedConfig } = await supabase
        .from('whatsapp_configs')
        .select('*')
        .eq('business_id', businessId)
        .single();

      setConfig(updatedConfig);
      setBotActive(updatedConfig?.bot_active ?? true);
      setCustomPrompt(updatedConfig?.system_prompt_customization || '');
      toast.dismiss(loadingToast);
      toast.success('🎉 ¡WhatsApp conectado exitosamente!');
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Embedded Signup error:', error);
      toast.error('Error al conectar WhatsApp: ' + (error?.message || 'Intenta de nuevo'));
    }
  };

  // ═══════════════════════════════════════════════
  // RENDER: Not Platinum — Upsell Card
  // ═══════════════════════════════════════════════
  if (!hasPlatinum && !loading) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-border-main shadow-sm overflow-hidden">
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-purple-500 via-accent to-amber-400"></div>
        
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-purple-500/20 text-accent rounded-2xl flex items-center justify-center mx-auto mb-5 border border-accent/30 shadow-[0_0_30px_rgba(246,224,94,0.15)]">
            <span className="text-4xl">🤖</span>
          </div>

          <h3 className="text-2xl font-black text-text-main mb-2">AgendiBot</h3>
          <p className="text-sm font-medium text-accent mb-4">Asistente WhatsApp con Inteligencia Artificial</p>
          
          <p className="text-text-muted mb-6 max-w-lg mx-auto leading-relaxed">
            Tu asistente virtual atiende clientes <strong className="text-text-main">24/7</strong> por WhatsApp: 
            agenda citas, informa precios, muestra disponibilidad y sugiere profesionales. 
            Todo con los datos reales de tu negocio.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-lg mx-auto">
            {[
              { icon: '📅', label: 'Agendamiento' },
              { icon: '💰', label: 'Precios' },
              { icon: '🔔', label: 'Recordatorios' },
              { icon: '👩‍💼', label: 'Profesionales' },
            ].map((f, i) => (
              <div key={i} className="bg-bg-tertiary rounded-lg p-3 border border-border-main text-center">
                <span className="text-xl block mb-1">{f.icon}</span>
                <span className="text-xs font-medium text-text-muted">{f.label}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => toast('Redirigiendo a Suscripción...', { icon: '⬆️' })}
            className="btn-golden text-base px-8 py-3 shadow-[0_0_20px_rgba(246,224,94,0.3)]"
          >
            ⬆️ Activar Platinum
          </button>
          <p className="text-xs text-text-muted mt-3">
            Disponible como add-on en cualquier plan (Personal, Pro, Enterprise)
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-bg-secondary p-8 rounded-xl border border-border-main text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-text-muted text-sm">Cargando AgendiBot...</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER: Connected State
  // ═══════════════════════════════════════════════
  if (isConnected) {
    return (
      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-bg-secondary p-6 rounded-xl border border-border-main shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center border border-green-500/20">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-text-main">AgendiBot</h3>
                <p className="text-sm text-text-muted">Asistente WhatsApp con IA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                botActive 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                <span className={`w-2 h-2 rounded-full ${botActive ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                {botActive ? 'Activo' : 'Pausado'}
              </span>
            </div>
          </div>

          {/* Connection Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-bg-tertiary rounded-lg border border-border-main">
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Número conectado</p>
              <p className="text-sm font-bold text-text-main">{config.display_phone || config.phone_number_id}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Conectado desde</p>
              <p className="text-sm font-bold text-text-main">
                {config.connected_at 
                  ? new Date(config.connected_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Plan</p>
              <p className="text-sm font-bold text-accent">✨ Platinum</p>
            </div>
          </div>
        </div>

        {/* Bot Toggle + Custom Prompt */}
        <div className="bg-bg-secondary p-6 rounded-xl border border-border-main shadow-sm">
          <h4 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <Icon name="settings" className="w-5 h-5 text-accent" />
            Configuración del Bot
          </h4>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 p-4 bg-bg-tertiary rounded-lg border border-border-main mb-6">
            <div className="flex-1">
              <h5 className="text-sm font-bold text-text-main">Bot Activo</h5>
              <p className="text-xs text-text-muted">Cuando está activo, responde automáticamente a los mensajes de tus clientes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={botActive} 
                onChange={(e) => setBotActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-bold text-text-main flex items-center gap-2">
              <Icon name="edit-3" className="w-4 h-4 text-accent" />
              Personalización del Asistente
            </label>
            <p className="text-xs text-text-muted mb-2">
              Agrega instrucciones específicas para tu negocio. El bot ya sabe tus servicios, precios y profesionales automáticamente.
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows="5"
              placeholder={`Ejemplos:\n• Responde siempre en español y de forma muy amigable\n• No abrimos los domingos\n• Ofrece el combo "Corte + Barba" a $15.000 cuando pregunten por cortes\n• Siempre sugiere agendar una cita al final de la conversación`}
              className="w-full bg-bg-tertiary border border-border-main rounded-lg p-3 text-text-main focus:border-accent focus:outline-none resize-y text-sm leading-relaxed"
            ></textarea>
            <p className="text-xs text-text-muted">
              {customPrompt.length}/500 caracteres
            </p>
          </div>

          {/* Save + Disconnect */}
          <div className="flex flex-col sm:flex-row gap-3 border-t border-border-main pt-4">
            <button 
              onClick={handleSaveSettings} 
              disabled={saving}
              className="btn-golden flex items-center justify-center gap-2 flex-1"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Guardando...</>
              ) : (
                <><Icon name="save" className="w-4 h-4" /> Guardar Cambios</>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 rounded-lg font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              {disconnecting ? 'Desconectando...' : (
                <><Icon name="x-circle" className="w-4 h-4" /> Desconectar WhatsApp</>
              )}
            </button>
          </div>
        </div>

        {/* Capabilities Info */}
        <div className="bg-bg-secondary p-6 rounded-xl border border-border-main shadow-sm">
          <h4 className="text-lg font-bold text-text-main mb-4">¿Qué puede hacer AgendiBot?</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '📅', title: 'Agendar', desc: 'Citas por chat' },
              { icon: '💰', title: 'Precios', desc: 'Servicios y combos' },
              { icon: '🔔', title: 'Recordatorios', desc: 'Antes de la cita' },
              { icon: '❌', title: 'Cancelar', desc: 'Citas por chat' },
              { icon: '🕐', title: 'Horarios', desc: 'Disponibilidad real' },
              { icon: '👩‍💼', title: 'Profesionales', desc: 'Quién atiende' },
              { icon: '🛍️', title: 'Productos', desc: 'Catálogo retail' },
              { icon: '📞', title: 'Derivar', desc: 'A un humano' },
            ].map((cap, i) => (
              <div key={i} className="bg-bg-tertiary rounded-lg p-3 border border-border-main text-center hover:border-accent/30 transition-colors">
                <span className="text-xl block mb-1">{cap.icon}</span>
                <p className="text-xs font-bold text-text-main">{cap.title}</p>
                <p className="text-[10px] text-text-muted">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // RENDER: Not Connected — Connect Flow
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <div className="bg-bg-secondary rounded-xl border border-border-main shadow-sm overflow-hidden">
        {/* Gradient top */}
        <div className="h-1.5 bg-gradient-to-r from-green-500 via-accent to-green-400"></div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-accent/20 rounded-2xl flex items-center justify-center border border-green-500/30">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-main">AgendiBot</h3>
              <p className="text-sm text-text-muted">Conecta tu WhatsApp Business</p>
            </div>
          </div>

          <p className="text-text-muted mb-8 leading-relaxed">
            Conecta tu número de WhatsApp Business para que <strong className="text-text-main">AgendiBot</strong> atienda a tus clientes 
            automáticamente con los datos de tu negocio: servicios, precios, horarios y disponibilidad.
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {[
              { step: 1, title: 'Conectar con Meta', desc: 'Se abrirá un popup seguro de Facebook/Meta', icon: '🔐' },
              { step: 2, title: 'Seleccionar tu negocio', desc: 'Elige o crea tu cuenta de WhatsApp Business', icon: '🏪' },
              { step: 3, title: 'Verificar tu número', desc: 'Recibirás un SMS con un código de verificación', icon: '📱' },
              { step: 4, title: '¡Listo!', desc: 'AgendiBot comenzará a responder automáticamente', icon: '🚀' },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-bg-tertiary border border-border-main">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm border border-accent/20">
                  {s.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main">Paso {s.step}: {s.title}</p>
                  <p className="text-xs text-text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Connect Button */}
          <button
            onClick={launchEmbeddedSignup}
            className="w-full py-4 rounded-xl font-black text-base bg-gradient-to-r from-green-500 to-green-600 text-white shadow-[0_0_25px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Conectar mi WhatsApp
          </button>

          <p className="text-xs text-text-muted text-center mt-4">
            Necesitarás una cuenta de Facebook/Meta y un número de teléfono para verificar por SMS.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-bg-secondary p-6 rounded-xl border border-border-main shadow-sm">
        <h4 className="text-lg font-bold text-text-main mb-4">Preguntas frecuentes</h4>
        <div className="space-y-4">
          {[
            { q: '¿Necesito una cuenta de Facebook?', a: 'Sí, Meta (Facebook) requiere autenticación para conectar la API oficial de WhatsApp Business.' },
            { q: '¿Puedo seguir usando WhatsApp Business App?', a: 'Con la función de "Coexistencia" de Meta, puedes mantener tu app de WhatsApp Business activa al mismo tiempo.' },
            { q: '¿Qué datos usa el bot?', a: 'AgendiBot usa los servicios, precios, profesionales y horarios que tienes configurados en AgendiApp. Se actualiza automáticamente.' },
            { q: '¿Puedo pausar el bot?', a: 'Sí, en cualquier momento puedes pausar o desactivar AgendiBot desde esta misma sección.' },
          ].map((faq, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer text-sm font-bold text-text-main hover:text-accent transition-colors list-none flex items-center gap-2">
                <Icon name="chevron-right" className="w-4 h-4 text-text-muted group-open:rotate-90 transition-transform" />
                {faq.q}
              </summary>
              <p className="text-xs text-text-muted mt-2 ml-6">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppAgentTab;
