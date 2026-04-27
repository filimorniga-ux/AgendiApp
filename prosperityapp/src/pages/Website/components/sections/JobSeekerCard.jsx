import React from 'react';

export const JobSeekerCard = ({ profile, t, onSelect }) => {
  return (
    <article
      className="jb-card"
      onClick={() => onSelect(profile)}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && onSelect(profile)}
    >
      {/* Header */}
      <div className="jb-card__header">
        <div className="jb-card__logo" style={{ borderRadius: '50%' }}>
          <span>{(profile.full_name || '?')[0].toUpperCase()}</span>
        </div>
        <div className="jb-card__meta">
          <h3 className="jb-card__title">{profile.full_name}</h3>
          <p className="jb-card__company">{profile.profession}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="jb-card__tags">
        <span className="jb-tag jb-tag--sector">
          ⭐ {profile.experience_years} años de exp.
        </span>
        {profile.compensation_type && (
          <span className="jb-tag jb-tag--type" style={{background: 'rgba(255,215,0,0.1)', color: '#FFD700'}}>
            💰 {
              profile.compensation_type === 'percentage' ? 'Porcentaje' :
              profile.compensation_type === 'chair_rental' ? 'Arrendamiento de sillón' :
              profile.compensation_type === 'fixed_salary' ? 'Salario fijo' :
              'A convenir'
            }
          </span>
        )}
        {profile.city && (
          <span className="jb-tag jb-tag--location">
            📍 {profile.city}{profile.country_code ? `, ${profile.country_code}` : ''}
          </span>
        )}
      </div>

      {/* Description snippet */}
      <p className="jb-card__desc">
        {profile.bio?.slice(0, 160)}{profile.bio?.length > 160 ? '...' : ''}
      </p>

      {/* Footer */}
      <div className="jb-card__footer">
        {profile.instagram && <span className="jb-card__salary">📸 {profile.instagram}</span>}
      </div>
    </article>
  );
};
