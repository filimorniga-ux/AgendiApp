/* ─────────────────────────────────────────────────────────────────────────────
 * JobBoardPage.jsx — Bolsa de Empleo pública
 * Ruta: /empleo
 * Muestra campañas activas con filtros de ubicación, sector y tipo de puesto.
 * Conecta con la vista pública `public_job_campaigns` en Supabase.
 * ─────────────────────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './jobboard.css';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../supabase/client';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Country, State, City } from 'country-state-city';
import { JobSeekerCard } from './JobSeekerCard';
import { JobSeekerDetailModal } from './JobSeekerDetailModal';
import { JobSeekerFormModal } from './JobSeekerFormModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const POSITION_TYPES = ['full_time', 'part_time', 'freelance', 'temporary'];
const SECTORS = ['barbershop', 'salon', 'spa', 'clinic', 'nails', 'restaurant', 'other'];

const formatSalary = (fixed, approx) => {
  if (fixed) return `$${Number(fixed).toLocaleString()}`;
  if (approx) return `~$${Number(approx).toLocaleString()}`;
  return null;
};

const daysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt) - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
};

// ── Job Card ──────────────────────────────────────────────────────────────────
const JobCard = ({ campaign, t, onSelect }) => {
  const salary = formatSalary(campaign.salary_fixed, campaign.salary_approximate);
  const days = daysRemaining(campaign.expires_at);

  return (
    <article
      className="jb-card"
      onClick={() => onSelect(campaign)}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && onSelect(campaign)}
    >
      {/* Header */}
      <div className="jb-card__header">
        <div className="jb-card__logo">
          {campaign.business_logo_url ? (
            <img src={campaign.business_logo_url} alt={campaign.business_name} />
          ) : (
            <span>{(campaign.business_name || '?')[0].toUpperCase()}</span>
          )}
        </div>
        <div className="jb-card__meta">
          <h3 className="jb-card__title">{campaign.title}</h3>
          <p className="jb-card__company">{campaign.business_name}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="jb-card__tags">
        <span className="jb-tag jb-tag--sector">
          {t.jobBoard.sectors?.[campaign.sector] || campaign.sector}
        </span>
        <span className="jb-tag jb-tag--type">
          {t.jobBoard[campaign.position_type] || campaign.position_type}
        </span>
        {campaign.city && (
          <span className="jb-tag jb-tag--location">
            📍 {campaign.city}{campaign.country ? `, ${campaign.country}` : ''}
          </span>
        )}
      </div>

      {/* Description snippet */}
      <p className="jb-card__desc">
        {campaign.description?.slice(0, 160)}{campaign.description?.length > 160 ? '...' : ''}
      </p>

      {/* Footer */}
      <div className="jb-card__footer">
        {campaign.compensation_type && (
          <span className="jb-card__salary" style={{color: '#FFD700'}}>
            💰 {
              campaign.compensation_type === 'percentage' ? t.jobBoard?.comp_percentage || 'Porcentaje' :
              campaign.compensation_type === 'chair_rental' ? t.jobBoard?.comp_chair_rental || 'Arrendamiento de sillón' :
              campaign.compensation_type === 'fixed_salary' ? t.jobBoard?.comp_fixed_salary || 'Salario fijo' :
              t.jobBoard?.comp_to_agree || 'A convenir'
            }
          </span>
        )}
        {salary && <span className="jb-card__salary">💰 {salary}</span>}
        {campaign.commission_percentage > 0 && (
          <span className="jb-card__commission">📊 {campaign.commission_percentage}% {t.jobBoard.commission}</span>
        )}
        {days !== null && (
          <span className={`jb-card__expires ${days <= 3 ? 'jb-card__expires--urgent' : ''}`}>
            ⏳ {days}d
          </span>
        )}
      </div>
    </article>
  );
};

// ── Job Detail Modal ──────────────────────────────────────────────────────────
const JobDetail = ({ campaign, t, onClose }) => {
  if (!campaign) return null;
  const salary = formatSalary(campaign.salary_fixed, campaign.salary_approximate);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hola, me interesa la vacante: ${campaign.title}`);
    window.open(`https://wa.me/${campaign.contact_whatsapp?.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Aplicación: ${campaign.title}`);
    window.open(`mailto:${campaign.contact_email}?subject=${subject}`, '_blank');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/empleo/${campaign.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vacante: ${campaign.title} - ${campaign.business_name}`,
          text: `Mira esta vacante de ${campaign.title} en ${campaign.business_name}.`,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert(t.jobBoard.link_copied || 'Enlace copiado al portapapeles');
    }
  };

  return (
    <div className="jb-detail-overlay" onClick={onClose}>
      <div className="jb-detail" onClick={e => e.stopPropagation()}>
        <button className="jb-detail__close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="jb-detail__header">
          <div className="jb-card__logo jb-card__logo--lg">
            {campaign.business_logo_url ? (
              <img src={campaign.business_logo_url} alt={campaign.business_name} />
            ) : (
              <span>{(campaign.business_name || '?')[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="jb-detail__title">{campaign.title}</h2>
            <p className="jb-detail__company">{campaign.business_name}</p>
            <div className="jb-card__tags" style={{ marginTop: 8 }}>
              <span className="jb-tag jb-tag--sector">
                {t.jobBoard.sectors?.[campaign.sector] || campaign.sector}
              </span>
              <span className="jb-tag jb-tag--type">
                {t.jobBoard[campaign.position_type] || campaign.position_type}
              </span>
              {campaign.city && (
                <span className="jb-tag jb-tag--location">
                  📍 {campaign.city}{campaign.country ? `, ${campaign.country}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div className="jb-detail__compensation">
          {campaign.compensation_type && (
            <div className="jb-detail__comp-item">
              <span className="jb-detail__comp-label">{t.jobBoard?.modal_mode || 'Modalidad'}</span>
              <span className="jb-detail__comp-value" style={{color: '#FFD700'}}>
                {campaign.compensation_type === 'percentage' ? t.jobBoard?.comp_percentage || 'Porcentaje' :
                 campaign.compensation_type === 'chair_rental' ? t.jobBoard?.comp_chair_rental || 'Arrendamiento de sillón' :
                 campaign.compensation_type === 'fixed_salary' ? t.jobBoard?.comp_fixed_salary || 'Salario fijo' :
                 t.jobBoard?.comp_to_agree || 'A convenir'}
              </span>
            </div>
          )}
          {salary && (
            <div className="jb-detail__comp-item">
              <span className="jb-detail__comp-label">{t.jobBoard.salary}</span>
              <span className="jb-detail__comp-value">{salary}</span>
            </div>
          )}
          {campaign.commission_percentage > 0 && (
            <div className="jb-detail__comp-item">
              <span className="jb-detail__comp-label">{t.jobBoard.commission}</span>
              <span className="jb-detail__comp-value">{campaign.commission_percentage}%</span>
            </div>
          )}
          {campaign.commission_details && (
            <p className="jb-detail__comm-details">{campaign.commission_details}</p>
          )}
        </div>

        {/* Description */}
        <div className="jb-detail__section">
          <p className="jb-detail__text">{campaign.description}</p>
        </div>

        {/* Requirements */}
        {campaign.requirements && (
          <div className="jb-detail__section">
            <h4 className="jb-detail__section-title">📋 {t.jobBoard.requirements}</h4>
            <p className="jb-detail__text">{campaign.requirements}</p>
          </div>
        )}

        {/* Benefits */}
        {campaign.benefits && (
          <div className="jb-detail__section">
            <h4 className="jb-detail__section-title">🎁 {t.jobBoard.benefits}</h4>
            <p className="jb-detail__text">{campaign.benefits}</p>
          </div>
        )}

        {/* Expiration */}
        {campaign.expires_at && (
          <p className="jb-detail__expires-label">
            {t.jobBoard.expires}: {new Date(campaign.expires_at).toLocaleDateString()}
          </p>
        )}

        {/* Action buttons */}
        <div className="jb-detail__actions">
          {campaign.contact_whatsapp && (
            <button className="jb-btn jb-btn--whatsapp" onClick={handleWhatsApp}>
              💬 {t.jobBoard.apply_whatsapp}
            </button>
          )}
          {campaign.contact_email && (
            <button className="jb-btn jb-btn--email" onClick={handleEmail}>
              ✉️ {t.jobBoard.apply_email}
            </button>
          )}
          <button className="jb-btn jb-btn--share" onClick={handleShare}>
            📤 Compartir
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Filters ───────────────────────────────────────────────────────────────────
const Filters = ({ filters, setFilters, t }) => {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() =>
    filters.countryCode ? State.getStatesOfCountry(filters.countryCode) : [],
    [filters.countryCode]
  );
  const cities = useMemo(() =>
    filters.countryCode && filters.stateCode
      ? City.getCitiesOfState(filters.countryCode, filters.stateCode) : [],
    [filters.countryCode, filters.stateCode]
  );

  const update = (key, val) => {
    const next = { ...filters, [key]: val };
    if (key === 'countryCode') { next.stateCode = ''; next.city = ''; }
    if (key === 'stateCode') { next.city = ''; }
    setFilters(next);
  };

  const clearAll = () => setFilters({ search: '', countryCode: '', stateCode: '', city: '', sector: '', positionType: '' });

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="jb-filters">
      {/* Search */}
      <div className="jb-filters__search">
        <span className="jb-filters__icon">🔍</span>
        <input
          type="text"
          placeholder={t.jobBoard.search_placeholder}
          value={filters.search}
          onChange={e => update('search', e.target.value)}
          className="jb-filters__input"
        />
      </div>

      {/* Dropdowns row */}
      <div className="jb-filters__row">
        <select value={filters.countryCode} onChange={e => update('countryCode', e.target.value)} className="jb-filters__select">
          <option value="">{t.jobBoard.filter_country}</option>
          {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>)}
        </select>

        <select value={filters.stateCode} onChange={e => update('stateCode', e.target.value)} className="jb-filters__select" disabled={!filters.countryCode}>
          <option value="">{t.jobBoard.filter_state}</option>
          {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
        </select>

        <select value={filters.city} onChange={e => update('city', e.target.value)} className="jb-filters__select" disabled={!filters.stateCode}>
          <option value="">{t.jobBoard.filter_city}</option>
          {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>

        <select value={filters.sector} onChange={e => update('sector', e.target.value)} className="jb-filters__select">
          <option value="">{t.jobBoard.filter_sector}</option>
          {SECTORS.map(s => <option key={s} value={s}>{t.jobBoard.sectors?.[s] || s}</option>)}
        </select>

        <select value={filters.positionType} onChange={e => update('positionType', e.target.value)} className="jb-filters__select">
          <option value="">{t.jobBoard.filter_position}</option>
          {POSITION_TYPES.map(p => <option key={p} value={p}>{t.jobBoard[p] || p}</option>)}
        </select>
      </div>

      {hasFilters && (
        <button className="jb-filters__clear" onClick={clearAll}>{t.jobBoard.filter_clear}</button>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
function JobBoardContent() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // States for Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  // States for Job Seekers
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'seekers'
  const [jobSeekers, setJobSeekers] = useState([]);
  const [loadingSeekers, setLoadingSeekers] = useState(true);
  const [selectedSeeker, setSelectedSeeker] = useState(null);
  const [showSeekerForm, setShowSeekerForm] = useState(false);

  const [filters, setFilters] = useState({
    search: '', countryCode: '', stateCode: '', city: '', sector: '', positionType: ''
  });

  // Fetch active campaigns from public view
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_job_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

        if (!error && data) {
          setCampaigns(data);
          if (id) {
            const found = data.find(c => c.id === id);
            if (found) {
              setSelected(found);
              // increment views if loaded directly
              supabase.rpc('increment_campaign_views', { campaign_id: id }).catch(() => {});
            } else {
              navigate('/empleo', { replace: true });
            }
          }
        }
        setLoading(false);
    };
    fetchCampaigns();
  }, []);

  // Fetch active job seekers
  useEffect(() => {
    const fetchJobSeekers = async () => {
      setLoadingSeekers(true);
      const { data, error } = await supabase
        .from('job_seeker_profiles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setJobSeekers(data);
      }
      setLoadingSeekers(false);
    };
    fetchJobSeekers();
  }, []);

  // Increment view count
  const handleSelect = useCallback(async (campaign) => {
    setSelected(campaign);
    navigate(`/empleo/${campaign.id}`);
    
    // Fire and forget, wrap in async IIFE
    (async () => {
      try {
        await supabase.rpc('increment_campaign_views', { campaign_id: campaign.id });
      } catch (e) {}
    })();
  }, [navigate]);

  // Client-side filtering
  const filtered = useMemo(() => {
    if (activeTab === 'campaigns') {
      return campaigns.filter(c => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (!c.title?.toLowerCase().includes(q) && !c.business_name?.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q))
            return false;
        }
        if (filters.countryCode) {
          const countryName = Country.getCountryByCode(filters.countryCode)?.name;
          if (c.country !== countryName && c.country_code !== filters.countryCode) return false;
        }
        if (filters.city && c.city !== filters.city) return false;
        if (filters.sector && c.sector !== filters.sector) return false;
        if (filters.positionType && c.position_type !== filters.positionType) return false;
        return true;
      });
    } else {
      // Job Seekers
      return jobSeekers.filter(s => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (!s.full_name?.toLowerCase().includes(q) && !s.profession?.toLowerCase().includes(q) && !s.bio?.toLowerCase().includes(q))
            return false;
        }
        if (filters.countryCode && s.country_code !== filters.countryCode) return false;
        if (filters.city && s.city !== filters.city) return false;
        if (filters.sector && s.profession !== filters.sector) return false;
        return true;
      });
    }
  }, [campaigns, jobSeekers, filters, activeTab]);

  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode as requested

  // Detect portrait vs landscape for hero video source
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const check = () => setIsPortrait(window.innerWidth < 768);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return (
    <div className="jb-page" data-theme={isDarkMode ? "dark" : "light"}>
      <Helmet>
        <title>Bolsa de Empleo — AgendiApp | {lang === 'es' ? 'Ofertas de trabajo en belleza y bienestar' : 'Beauty & wellness job listings'}</title>
        <meta name="description" content={lang === 'es' ? 'Encuentra las mejores oportunidades de empleo en el sector belleza y bienestar. Barberías, salones, spas y más.' : 'Find the best job opportunities in the beauty and wellness industry. Barbershops, salons, spas and more.'} />
      </Helmet>

      <Header
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
        user={null}
        onLoginClick={() => navigate('/')}
        onRegisterClick={() => navigate('/')}
        onLogout={() => {}}
      />

      {/* Hero — Video adapts to device orientation */}
      <section className="jb-hero">
        <div className="jb-hero__video-wrap">
          <video
            className="jb-hero__video"
            autoPlay
            loop
            muted
            playsInline
            key={isPortrait ? 'vertical' : 'horizontal'}
          >
            <source
              src={isPortrait ? '/videos/bolsa-vertical.mp4' : '/videos/bolsa-horizontal.mp4'}
              type="video/mp4"
            />
          </video>
          <div className="jb-hero__video-overlay"></div>
        </div>
        <div className="jb-hero__content">
          <h1 className="jb-hero__title">{t.jobBoard.hero_title}</h1>
          <p className="jb-hero__subtitle">{t.jobBoard.hero_subtitle}</p>
        </div>
      </section>

      {/* Filters + Results */}
      <section className="jb-main">
        <div className="jb-container">
          
          {/* Tabs */}
          <div className="jb-tabs">
            <button 
              className={`jb-tab-btn ${activeTab === 'campaigns' ? 'jb-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('campaigns')}
            >
              💼 {t.jobBoard?.tab_campaigns || 'Ofertas de Empleo'}
            </button>
            <button 
              className={`jb-tab-btn ${activeTab === 'seekers' ? 'jb-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('seekers')}
            >
              🙋‍♀️ {t.jobBoard?.tab_seekers || 'Profesionales Disponibles'}
            </button>
          </div>

          <Filters filters={filters} setFilters={setFilters} t={t} />

          {/* Results count */}
          <div className="jb-results-bar">
            <span className="jb-results-count">
              <strong>{filtered.length}</strong> {t.jobBoard.results_count}
            </span>
          </div>

          {/* Grid */}
          {(activeTab === 'campaigns' ? loading : loadingSeekers) ? (
            <div className="jb-loading">
              <div className="jb-spinner"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="jb-empty">
              <div className="jb-empty__icon">💼</div>
              <p>{t.jobBoard?.no_results || 'No se encontraron resultados'}</p>
            </div>
          ) : (
            <div className="jb-grid">
              {filtered.map(item => (
                activeTab === 'campaigns' ? (
                  <JobCard key={item.id} campaign={item} t={t} onSelect={handleSelect} />
                ) : (
                  <JobSeekerCard key={item.id} profile={item} t={t} onSelect={setSelectedSeeker} />
                )
              ))}
            </div>
          )}

          {/* CTA Employer / Professional */}
          <div className="jb-cta-employer">
            <div className="jb-cta-employer__content">
              <h3>{activeTab === 'campaigns' ? (t.jobBoard?.cta_employer || '¿Buscas talento?') : (t.jobBoard?.seeker_cta || '¿Eres profesional de la belleza?')}</h3>
              <p>{activeTab === 'campaigns' 
                  ? (t.jobBoard?.cta_employer_desc || 'Publica tu vacante en AgendiApp y conecta con los mejores profesionales.') 
                  : (t.jobBoard?.seeker_cta_desc || 'Publica tu perfil profesional para que los salones y barberías te encuentren.')}
              </p>
            </div>
            <button 
              className="jb-btn jb-btn--gold" 
              onClick={() => activeTab === 'campaigns' ? navigate('/') : setShowSeekerForm(true)}
            >
              {activeTab === 'campaigns' ? (t.jobBoard?.cta_employer_btn || 'Registrar Comercio') : (t.jobBoard?.seeker_cta_btn || 'Publicar mi Perfil')}
            </button>
          </div>
        </div>
      </section>

      <Footer isDarkMode={isDarkMode} />

      {/* Detail modal for Campaigns */}
      {selected && (
        <JobDetail campaign={selected} t={t} onClose={() => { setSelected(null); navigate('/empleo'); }} />
      )}

      {/* Detail modal for Job Seekers */}
      {selectedSeeker && (
        <JobSeekerDetailModal profile={selectedSeeker} t={t} onClose={() => setSelectedSeeker(null)} />
      )}

      {/* Job Seeker Form Modal */}
      {showSeekerForm && (
        <JobSeekerFormModal 
          t={t}
          onClose={() => setShowSeekerForm(false)} 
          onSuccess={() => {
            setShowSeekerForm(false);
            // Re-fetch logic could go here to refresh list
            window.location.reload(); 
          }} 
        />
      )}
    </div>
  );
}

export default function JobBoardPage() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <JobBoardContent />
      </LanguageProvider>
    </HelmetProvider>
  );
}
