import React, { useState } from 'react';
import { supabase } from '../../../../supabase/client';
import { Country, State, City } from 'country-state-city';

const PROFESSIONS = ['Barbero', 'Estilista', 'Manicurista', 'Lashista', 'Esteticista', 'Integral', 'Cajero/a', 'Administrador/a', 'Auxiliar', 'Personal de aseo', 'Otro'];

export const JobSeekerFormModal = ({ onClose, onSuccess, t }) => {
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
      setError(t.jobBoard.error_publish);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="jb-detail-overlay" onClick={onClose}>
      <div className="jb-detail" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="jb-detail__close" onClick={onClose}>✕</button>
        <h2 className="jb-detail__title" style={{ marginBottom: '20px' }}>{t.jobBoard.form_publish_title}</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="jb-detail__section">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_full_name}</label>
            <input 
              required 
              type="text" 
              name="full_name" 
              value={formData.full_name} 
              onChange={handleChange}
              className="jb-form-input"
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_profession}</label>
            <select 
              required 
              name="profession" 
              value={formData.profession} 
              onChange={handleChange}
              className="jb-form-select"
            >
              <option value="">{t.jobBoard.form_prof_select}</option>
              {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_exp_years}</label>
            <input 
              required 
              type="number" 
              name="experience_years" 
              min="0"
              value={formData.experience_years} 
              onChange={handleChange}
              className="jb-form-input"
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_bio}</label>
            <textarea 
              required
              name="bio" 
              rows="3"
              value={formData.bio} 
              onChange={handleChange}
              placeholder={t.jobBoard.form_bio_ph}
              className="jb-form-textarea"
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_comp_type}</label>
            <select 
              required 
              name="compensation_type" 
              value={formData.compensation_type} 
              onChange={handleChange}
              className="jb-form-select"
            >
              <option value="">{t.jobBoard.form_comp_select}</option>
              <option value="percentage">{t.jobBoard.comp_percentage}</option>
              <option value="chair_rental">{t.jobBoard.comp_chair_rental}</option>
              <option value="fixed_salary">{t.jobBoard.comp_fixed_salary}</option>
              <option value="to_agree">{t.jobBoard.comp_to_agree}</option>
            </select>
          </div>

          <div className="jb-detail__section">
            <h4 style={{ marginBottom: '10px' }}>{t.jobBoard.form_location}</h4>
            <select name="country_code" required value={formData.country_code} onChange={handleChange} className="jb-form-select">
              <option value="">{t.jobBoard.filter_country} *</option>
              {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
            </select>
            <select name="state_code" required value={formData.state_code} onChange={handleChange} disabled={!formData.country_code} className="jb-form-select">
              <option value="">{t.jobBoard.filter_state} *</option>
              {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
            </select>
            <select name="city" required value={formData.city} onChange={handleChange} disabled={!formData.state_code} className="jb-form-select">
              <option value="">{t.jobBoard.filter_city} *</option>
              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="jb-detail__section">
            <h4 style={{ marginBottom: '10px' }}>{t.jobBoard.form_contact}</h4>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_whatsapp}</label>
            <input 
              required 
              type="text" 
              name="contact_whatsapp" 
              placeholder="+573001234567"
              value={formData.contact_whatsapp} 
              onChange={handleChange}
              className="jb-form-input"
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_email}</label>
            <input 
              type="email" 
              name="contact_email" 
              value={formData.contact_email} 
              onChange={handleChange}
              className="jb-form-input"
            />

            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.jobBoard.form_instagram}</label>
            <input 
              type="text" 
              name="instagram" 
              placeholder="@tuusuario"
              value={formData.instagram} 
              onChange={handleChange}
              className="jb-form-input"
            />
          </div>

          <div className="jb-detail__actions">
            <button type="submit" disabled={loading} className="jb-btn jb-btn--gold" style={{ width: '100%' }}>
              {loading ? t.jobBoard.form_publishing : t.jobBoard.form_publish_btn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
