import React, { useState } from 'react';
import { supabase } from '../../../../../supabase/client';
import { Country, State, City } from 'country-state-city';

const PROFESSIONS = ['Barbero', 'Estilista', 'Manicurista', 'Lashista', 'Esteticista', 'Integral', 'Cajero/a', 'Administrador/a', 'Auxiliar', 'Personal de aseo', 'Otro'];

export const JobSeekerFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    profession: '',
    experience_years: 0,
    bio: '',
    compensation_type: '',
    instagram: '',
    country_code: '',
    state_code: '',
    city: '',
    contact_email: '',
    contact_whatsapp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const countries = Country.getAllCountries();
  const states = formData.country_code ? State.getStatesOfCountry(formData.country_code) : [];
  const cities = formData.country_code && formData.state_code 
    ? City.getCitiesOfState(formData.country_code, formData.state_code) : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'country_code' ? { state_code: '', city: '' } : {}),
      ...(name === 'state_code' ? { city: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: submitError } = await supabase
      .from('job_seeker_profiles')
      .insert([{
        full_name: formData.full_name,
        profession: formData.profession,
        experience_years: Number(formData.experience_years),
        bio: formData.bio,
        compensation_type: formData.compensation_type,
        instagram: formData.instagram,
        country_code: formData.country_code,
        state_code: formData.state_code,
        city: formData.city,
        contact_email: formData.contact_email,
        contact_whatsapp: formData.contact_whatsapp,
        status: 'active'
      }]);

    setLoading(false);

    if (submitError) {
      console.error(submitError);
      setError('Hubo un error al publicar tu perfil. Intenta de nuevo.');
    } else {
      onSuccess();
    }
  };

  return (
    <div className="jb-detail-overlay" onClick={onClose}>
      <div className="jb-detail" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="jb-detail__close" onClick={onClose}>✕</button>
        <h2 className="jb-detail__title" style={{ marginBottom: '20px' }}>Publicar mi perfil profesional</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="jb-detail__section">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre Completo *</label>
            <input 
              required 
              type="text" 
              name="full_name" 
              value={formData.full_name} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profesión *</label>
            <select 
              required 
              name="profession" 
              value={formData.profession} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            >
              <option value="">Selecciona tu profesión</option>
              {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Años de Experiencia *</label>
            <input 
              required 
              type="number" 
              name="experience_years" 
              min="0"
              value={formData.experience_years} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción de Perfil (Bio) *</label>
            <textarea 
              required
              name="bio" 
              rows="3"
              value={formData.bio} 
              onChange={handleChange}
              placeholder="Cuéntanos un poco sobre tu estilo y experiencia..."
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo de Compensación Esperada *</label>
            <select 
              required 
              name="compensation_type" 
              value={formData.compensation_type} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            >
              <option value="">Selecciona tu preferencia</option>
              <option value="percentage">Porcentaje</option>
              <option value="chair_rental">Arrendamiento de sillón</option>
              <option value="fixed_salary">Salario fijo</option>
              <option value="to_agree">A convenir</option>
            </select>
          </div>

          <div className="jb-detail__section">
            <h4 style={{ marginBottom: '10px' }}>Ubicación</h4>
            <select name="country_code" required value={formData.country_code} onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}>
              <option value="">País *</option>
              {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
            <select name="state_code" required value={formData.state_code} onChange={handleChange} disabled={!formData.country_code} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}>
              <option value="">Estado/Región *</option>
              {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
            </select>
            <select name="city" required value={formData.city} onChange={handleChange} disabled={!formData.state_code} style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}>
              <option value="">Ciudad *</option>
              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="jb-detail__section">
            <h4 style={{ marginBottom: '10px' }}>Contacto</h4>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>WhatsApp *</label>
            <input 
              required 
              type="text" 
              name="contact_whatsapp" 
              placeholder="+573001234567"
              value={formData.contact_whatsapp} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
            <input 
              type="email" 
              name="contact_email" 
              value={formData.contact_email} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Usuario de Instagram</label>
            <input 
              type="text" 
              name="instagram" 
              placeholder="@tuusuario"
              value={formData.instagram} 
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />
          </div>

          <div className="jb-detail__actions">
            <button type="submit" disabled={loading} className="jb-btn jb-btn--gold" style={{ width: '100%' }}>
              {loading ? 'Publicando...' : 'Publicar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
