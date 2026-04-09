import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';

const PublicClientLogin = () => {
  const { business } = useOutletContext();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      toast.success('¡Bienvenido de vuelta!');
      navigate(`/p/${business.slug}/historial`);
    } catch (err) {
      toast.error(err.message?.includes('Invalid') ? 'Correo o contraseña incorrectos' : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Supabase Auth account
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, phone: formData.phone },
        },
      });
      if (authErr) throw authErr;

      const userId = authData?.user?.id;
      if (!userId) throw new Error('No se pudo crear la cuenta');

      // 2. Check if client already exists (by phone) and link
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('business_id', business.id)
        .eq('phone', formData.phone)
        .maybeSingle();

      if (existing) {
        // Link existing guest client to auth account
        await supabase
          .from('clients')
          .update({ auth_user_id: userId, email: formData.email })
          .eq('id', existing.id);
      } else {
        // Create new client record
        await supabase.from('clients').insert({
          business_id: business.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          auth_user_id: userId,
          source: 'public_registration',
          status: 'active',
        });
      }

      toast.success('¡Cuenta creada! Ya puedes ver tu historial');
      navigate(`/p/${business.slug}/historial`);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message?.includes('already registered')) {
        toast.error('Ya existe una cuenta con ese correo. Intenta iniciar sesión.');
      } else {
        toast.error('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in relative z-10 max-w-md mx-auto">
      <div className="bg-bg-secondary border border-border-main rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-main">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {mode === 'login'
              ? 'Accede a tu historial de citas y servicios'
              : 'Crea una cuenta gratuita para ver tu historial'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border-main overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-accent text-accent-text' : 'text-text-muted hover:bg-bg-tertiary'}`}
          >
            Crear Cuenta
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Nombre completo</label>
                <input
                  type="text"
                  name="name"
                  required
                  disabled={loading}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-4 py-2.5 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  disabled={loading}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-4 py-2.5 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Correo electrónico</label>
            <input
              type="email"
              name="email"
              required
              disabled={loading}
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              className="w-full px-4 py-2.5 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              required
              disabled={loading}
              value={formData.password}
              onChange={handleChange}
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••'}
              minLength={mode === 'register' ? 6 : undefined}
              className="w-full px-4 py-2.5 rounded-lg bg-bg-main border border-border-main text-text-main placeholder-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-golden py-2.5 font-semibold disabled:opacity-50"
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear mi cuenta gratis'}
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-xs text-text-muted text-center mt-4 opacity-70">
            Tu cuenta es 100% gratuita. Solo la usamos para mostrarte tu historial de visitas.
          </p>
        )}
      </div>
    </div>
  );
};

export default PublicClientLogin;
