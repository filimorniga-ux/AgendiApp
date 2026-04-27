import React from 'react';

export const JobSeekerDetailModal = ({ profile, t, onClose }) => {
  if (!profile) return null;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hola ${profile.full_name}, vi tu perfil en AgendiApp y me gustaría conversar sobre una oportunidad laboral.`);
    window.open(`https://wa.me/${profile.contact_whatsapp?.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Oportunidad Laboral en AgendiApp`);
    window.open(`mailto:${profile.contact_email}?subject=${subject}`, '_blank');
  };

  const handleInstagram = () => {
    const username = profile.instagram.replace('@', '');
    window.open(`https://instagram.com/${username}`, '_blank');
  };

  return (
    <div className="jb-detail-overlay" onClick={onClose}>
      <div className="jb-detail" onClick={e => e.stopPropagation()}>
        <button className="jb-detail__close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="jb-detail__header">
          <div className="jb-card__logo jb-card__logo--lg" style={{ borderRadius: '50%' }}>
            <span>{(profile.full_name || '?')[0].toUpperCase()}</span>
          </div>
          <div>
            <h2 className="jb-detail__title">{profile.full_name}</h2>
            <p className="jb-detail__company">{profile.profession}</p>
            <div className="jb-card__tags" style={{ marginTop: 8 }}>
              <span className="jb-tag jb-tag--sector">
                ⭐ {profile.experience_years} años de experiencia
              </span>
              {profile.city && (
                <span className="jb-tag jb-tag--location">
                  📍 {profile.city}{profile.country_code ? `, ${profile.country_code}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="jb-detail__section">
          <h4 className="jb-detail__section-title">Sobre mí</h4>
          <p className="jb-detail__text">{profile.bio || 'Sin descripción adicional.'}</p>
        </div>

        {/* Action buttons */}
        <div className="jb-detail__actions">
          {profile.contact_whatsapp && (
            <button className="jb-btn jb-btn--whatsapp" onClick={handleWhatsApp}>
              💬 Contactar por WhatsApp
            </button>
          )}
          {profile.contact_email && (
            <button className="jb-btn jb-btn--email" onClick={handleEmail}>
              ✉️ Enviar Email
            </button>
          )}
          {profile.instagram && (
            <button className="jb-btn" style={{ background: '#e1306c', color: 'white' }} onClick={handleInstagram}>
              📸 Ver Instagram
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
