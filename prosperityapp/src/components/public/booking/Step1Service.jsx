import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';

const Step1Service = ({ business, onNext, initialService }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState(initialService?.id || null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, duration, price, category')
          .eq('business_id', business.id)
          .eq('is_active', true)
          .order('name');
          
        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (business?.id) fetchServices();
  }, [business.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
        <p className="text-text-muted animate-pulse">Cargando servicios...</p>
      </div>
    );
  }

  // Agrupar por categoría
  const categorizedServices = services.reduce((acc, curr) => {
    const cat = curr.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  const handleSelect = (service) => {
    setSelectedServiceId(service.id);
    onNext(service);
  };

  return (
    <div className="animate-fade-in">
      <h3 className="text-2xl font-bold text-text-main mb-2">Selecciona un servicio</h3>
      <p className="text-text-muted mb-8">Elige el servicio que deseas agendar.</p>

      {Object.keys(categorizedServices).length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-2xl border border-border-main">
          <p className="text-text-muted">No hay servicios disponibles en este momento.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(categorizedServices).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h4 className="text-lg font-semibold text-accent border-b border-border-main pb-2">{category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(service => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <div 
                      key={service.id} 
                      onClick={() => handleSelect(service)}
                      className={`cursor-pointer transition-all duration-300 p-4 rounded-xl border-2 flex items-center justify-between group
                        ${isSelected 
                          ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(212,168,83,0.3)]' 
                          : 'border-border-main bg-bg-secondary/50 hover:border-accent/50 hover:bg-bg-tertiary shadow-sm'
                        }`}
                    >
                      <div>
                        <h5 className="font-semibold text-text-main mb-1">{service.name}</h5>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <span className="inline-block w-3 h-3 text-accent"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                          {service.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-text-main">${service.price.toLocaleString('es-CL')}</p>
                        {isSelected && (
                          <div className="mt-1 flex justify-end">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-bg-main">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Step1Service;
