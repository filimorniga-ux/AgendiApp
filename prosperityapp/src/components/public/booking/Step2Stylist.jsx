import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';

const Step2Stylist = ({ business, onNext, onBack, initialStylist }) => {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStylistId, setSelectedStylistId] = useState(initialStylist?.id || null);

  useEffect(() => {
    const fetchStylists = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('collaborators')
          .select('id, name, avatar_url, role')
          .eq('business_id', business.id)
          .eq('status', 'active')
          .order('name');
          
        if (error) throw error;
        setStylists(data || []);
      } catch (err) {
        console.error('Error fetching stylists:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (business?.id) fetchStylists();
  }, [business.id]);

  const handleSelect = (stylist) => {
    setSelectedStylistId(stylist.id);
    onNext(stylist);
  };

  const noPreferenceStylist = {
    id: 'no-preference',
    name: 'Cualquier Profesional',
    role: 'Disponible',
    avatar_url: null
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
        <p className="text-text-muted animate-pulse">Cargando profesionales...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative z-10">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="text-sm text-text-muted hover:text-accent transition-colors flex items-center mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver a servicios
        </button>
        <h3 className="text-2xl font-bold text-text-main mb-2">Selecciona un profesional</h3>
        <p className="text-text-muted">¿Con quién te gustaría agendar tu cita?</p>
      </div>

      {stylists.length === 0 ? (
        <div className="text-center py-12 bg-bg-secondary rounded-2xl border border-border-main">
          <p className="text-text-muted">No hay profesionales disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            onClick={() => handleSelect(noPreferenceStylist)}
            className={`cursor-pointer transition-all duration-300 p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center group
              ${selectedStylistId === 'no-preference'
                ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(212,168,83,0.3)]' 
                : 'border-border-main bg-bg-secondary/50 hover:border-accent/50 hover:bg-bg-tertiary shadow-sm'
              }`}
          >
            <div className="w-16 h-16 mb-3 rounded-full bg-bg-tertiary border border-border-main flex items-center justify-center text-text-muted group-hover:text-accent transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h5 className="font-semibold text-text-main mb-1">Sin preferencia</h5>
            <p className="text-xs text-text-muted">El primer profesional disponible</p>
          </div>

          {stylists.map(stylist => {
            const isSelected = selectedStylistId === stylist.id;
            return (
              <div 
                key={stylist.id} 
                onClick={() => handleSelect(stylist)}
                className={`cursor-pointer transition-all duration-300 p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center group
                  ${isSelected
                    ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(212,168,83,0.3)]' 
                    : 'border-border-main bg-bg-secondary/50 hover:border-accent/50 hover:bg-bg-tertiary shadow-sm'
                  }`}
              >
                <div className="relative w-16 h-16 mb-3">
                  {stylist.avatar_url ? (
                    <img src={stylist.avatar_url} alt={stylist.name} className="w-full h-full object-cover rounded-full border border-border-main" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-bg-tertiary border border-border-main flex items-center justify-center text-xl font-bold text-text-muted uppercase">
                      {stylist.name.charAt(0)}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-accent text-bg-main shadow-md">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
                <h5 className="font-semibold text-text-main mb-0.5 capitalize">{stylist.name}</h5>
                <p className="text-xs text-text-muted capitalize">{stylist.role || 'Estilista'}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Step2Stylist;
