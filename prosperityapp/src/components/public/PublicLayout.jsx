import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { supabase } from '../../supabase/client';

const PublicLayout = () => {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error || !data) throw error;
        setBusiness(data);
      } catch (err) {
        console.error('Error fetching public business details:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBusiness();
  }, [slug]);

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
          <a href="/" className="btn-golden py-2 px-6">Ir a inicio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans">
      {/* Navbar simplificado público */}
      <nav className="bg-bg-secondary border-b border-border-main p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-accent capitalize">{business.name}</h1>
        </div>
      </nav>

      {/* Contenido público de la ruta */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet context={{ business }} />
      </main>
      
      <footer className="mt-12 py-6 text-center text-sm text-text-muted">
        Powered by AgendiApp
      </footer>
    </div>
  );
};

export default PublicLayout;
