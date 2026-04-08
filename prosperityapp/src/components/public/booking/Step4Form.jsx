import React, { useState } from 'react';

const Step4Form = ({ onNext, onBack, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <div className="animate-fade-in relative z-10 max-w-md mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          disabled={loading}
          className={`text-sm text-text-muted hover:text-accent transition-colors flex items-center mb-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver al horario
        </button>
        <h3 className="text-2xl font-bold text-text-main mb-2">Tus Datos</h3>
        <p className="text-text-muted">Ingresa tus datos para confirmar la reserva.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-secondary p-6 rounded-xl border border-border-main shadow-lg space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-muted mb-1">Nombre completo *</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            disabled={loading}
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej. Juan Pérez"
            className="w-full bg-bg-tertiary border border-border-main rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>

        <div>
           <label htmlFor="phone" className="block text-sm font-medium text-text-muted mb-1">Teléfono (WhatsApp activo) *</label>
           <input
             type="tel"
             id="phone"
             name="phone"
             required
             disabled={loading}
             value={formData.phone}
             onChange={handleChange}
             placeholder="+56 9 1234 5678"
             className="w-full bg-bg-tertiary border border-border-main rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
           />
        </div>

        <div>
           <label htmlFor="email" className="block text-sm font-medium text-text-muted mb-1">Correo electrónico (Opcional)</label>
           <input
             type="email"
             id="email"
             name="email"
             disabled={loading}
             value={formData.email}
             onChange={handleChange}
             placeholder="juan@ejemplo.com"
             className="w-full bg-bg-tertiary border border-border-main rounded-lg px-4 py-3 text-text-main focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
           />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-lg flex items-center justify-center transition-all
              ${loading ? 'bg-bg-tertiary text-text-muted cursor-wait' : 'btn-golden shadow-[0_0_15px_rgba(212,168,83,0.3)]'}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Confirmando...
              </>
            ) : (
              'Confirmar Reserva'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step4Form;
