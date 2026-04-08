import React from 'react';
import { useOutletContext } from 'react-router-dom';

const PublicAgenda = () => {
  const { business } = useOutletContext();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-bg-secondary border border-border-main rounded-2xl p-6 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-text-main mb-2">Agendar Cita</h2>
        <p className="text-text-muted mb-6">Selecciona el servicio y la fecha para tu visita a <span className="capitalize font-semibold text-accent">{business.name}</span>.</p>
        
        {/* Placeholder para el flujo de reservas */}
        <div className="py-12 border-2 border-dashed border-border-main rounded-xl flex items-center justify-center bg-bg-main">
          <p className="text-text-muted italic">Módulo de Reservas Públicas en Construcción</p>
        </div>
      </div>
    </div>
  );
};

export default PublicAgenda;
