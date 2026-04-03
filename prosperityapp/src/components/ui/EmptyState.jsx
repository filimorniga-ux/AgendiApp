import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = PackageOpen, 
  title = "No hay datos", 
  description = "No se encontraron registros para mostrar.",
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center animate-fadeIn ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-bg-card border border-border flex items-center justify-center mb-6 shadow-sm relative group overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
        <Icon className="w-8 h-8 text-text-muted group-hover:text-accent group-hover:scale-110 transition-all duration-300 relative z-10" />
      </div>
      <h3 className="text-lg font-semibold text-text-main mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-muted max-w-sm mx-auto">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
