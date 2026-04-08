import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabase/client';

const PublicPrices = () => {
  const { business } = useOutletContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, duration, price, category')
          .eq('business_id', business.id)
          .eq('is_active', true)
          .order('category')
          .order('name');
          
        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching public services:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (business?.id) fetchServices();
  }, [business.id]);

  if (loading) {
    return <div className="text-center py-12 text-text-muted animate-pulse">Cargando servicios...</div>;
  }

  // Agrupar por categoría
  const categorizedServices = services.reduce((acc, curr) => {
    const cat = curr.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Carta de Servicios</h2>
        <p className="text-text-muted">Descubre lo que {business.name} tiene para ofrecerte.</p>
      </div>

      {Object.keys(categorizedServices).length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-2xl border border-border-main">
          <p className="text-text-muted">Este comercio aún no ha cargado sus servicios.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(categorizedServices).map(([category, items]) => (
            <div key={category} className="bg-bg-secondary/50 backdrop-blur-md rounded-2xl border border-border-main p-6 shadow-xl">
              <h3 className="text-xl font-semibold text-accent mb-4 border-b border-border-main pb-2">{category}</h3>
              <ul className="space-y-3">
                {items.map(service => (
                  <li key={service.id} className="flex justify-between items-center group">
                    <div>
                      <h4 className="font-medium text-text-main group-hover:text-accent transition-colors">{service.name}</h4>
                      <span className="text-xs text-text-muted">{service.duration} min</span>
                    </div>
                    <div className="font-semibold text-text-main">
                      ${service.price.toLocaleString('es-CL')}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicPrices;
