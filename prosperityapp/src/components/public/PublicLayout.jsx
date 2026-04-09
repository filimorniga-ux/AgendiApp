import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams, Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';

const PublicLayout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clientUser, setClientUser] = useState(null); // logged-in client

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!slug) {
        setError(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, slug, whatsapp_phone')
          .eq('slug', slug)
          .single();
        
        if (error || !data) throw error;
        setBusiness(data);

        // Save slug for PWA binding
        localStorage.setItem('agendiapp_bound_slug', slug);
      } catch (err) {
        console.error('Error fetching public business details:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [slug]);

  // Check if a client is already logged in
  useEffect(() => {
    const checkClientAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, name')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        
        if (client) setClientUser(client);
      }
    };
    checkClientAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: client } = await supabase
          .from('clients')
          .select('id, name')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        setClientUser(client || null);
      } else {
        setClientUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleClientLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setClientUser(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main text-text-main">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-main text-text-main p-4">
        <div className="text-center p-8 bg-bg-secondary rounded-2xl border border-border-main max-w-md">
          <h2 className="text-2xl font-bold mb-4">Comercio no encontrado</h2>
          <p className="text-text-muted mb-6">La URL introducida no corresponde a un comercio activo en nuestra plataforma.</p>
          <Link to="/" className="btn-golden py-2 px-6 inline-block">Ir a inicio</Link>
        </div>
      </div>
    );
  }

  const whatsappUrl = business.whatsapp_phone
    ? `https://wa.me/${business.whatsapp_phone.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans">
      {/* Navbar público mejorado */}
      <nav className="bg-bg-secondary border-b border-border-main sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
          <h1 className="text-xl font-bold text-accent capitalize">{business.name}</h1>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <NavLink
              to="reservar"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-bg-tertiary text-text-main' : 'text-text-muted hover:text-text-main'}`
              }
            >
              Agendar Cita
            </NavLink>
            <NavLink
              to="precios"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-bg-tertiary text-text-main' : 'text-text-muted hover:text-text-main'}`
              }
            >
              Servicios
            </NavLink>
            {clientUser && (
              <NavLink
                to="historial"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-bg-tertiary text-text-main' : 'text-text-muted hover:text-text-main'}`
                }
              >
                Mi Historial
              </NavLink>
            )}
            {/* Auth section */}
            {clientUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-accent font-medium hidden sm:inline">
                  {clientUser.name}
                </span>
                <button
                  onClick={handleClientLogout}
                  className="text-xs text-text-muted hover:text-red-400 transition-colors"
                  title="Cerrar sesión"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <NavLink
                to="login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition-colors border border-accent/30"
              >
                Mi Cuenta
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Contenido público de la ruta */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet context={{ business, clientUser }} />
      </main>
      
      {/* Botón flotante de WhatsApp */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-[0_0_20px_rgba(37,211,102,0.5)]"
          aria-label="Contactar por WhatsApp"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      )}

      <footer className="mt-12 py-6 text-center text-sm text-text-muted">
        Powered by AgendiApp
      </footer>
    </div>
  );
};

export default PublicLayout;
