/**
 * JobCampaignsTab — Tab CRUD de Campañas de Empleo
 * 
 * Listado de campañas del negocio con acciones:
 * - Crear nueva campaña (abre JobCampaignModal)
 * - Editar campaña existente
 * - Pausar/activar campaña
 * - Eliminar campaña
 * - Ver métricas (vistas / aplicaciones)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';
import toast from 'react-hot-toast';
import JobCampaignModal from './JobCampaignModal';

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const JobCampaignsTab = () => {
  
  const { countryCode } = useBusiness();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const businessCountryCode = countryCode || '';

  // Cargar campañas del negocio
  const fetchCampaigns = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_campaigns')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      toast.error('Error cargando campañas');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Crear o editar campaña
  const handleSaveCampaign = async (formData) => {
    try {
      if (editingCampaign) {
        // UPDATE
        const { error } = await supabase
          .from('job_campaigns')
          .update(formData)
          .eq('id', editingCampaign.id)
          .eq('business_id', businessId);
        if (error) throw error;
        toast.success(t('jobBoard.campaignUpdated'));
      } else {
        // INSERT
        const { error } = await supabase
          .from('job_campaigns')
          .insert({ ...formData, business_id: businessId });
        if (error) {
          // Captura error de freemium limit
          if (error.message?.includes('máximo 1')) {
            toast.error(t('jobBoard.freemiumLimit'));
            return;
          }
          throw error;
        }
        toast.success(t('jobBoard.campaignCreated'));
      }
      fetchCampaigns();
    } catch (err) {
      console.error('Error saving campaign:', err);
      toast.error(err.message || t('common.error'));
      throw err; // re-throw para que el modal sepa que falló
    }
  };

  // Toggle estado activo/pausado
  const handleToggleStatus = async (campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('job_campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id)
        .eq('business_id', businessId);

      if (error) {
        if (error.message?.includes('máximo 1')) {
          toast.error(t('jobBoard.freemiumLimit'));
          return;
        }
        throw error;
      }
      toast.success(newStatus === 'active' ? 'Campaña activada' : 'Campaña pausada');
      fetchCampaigns();
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error(t('common.error'));
    }
  };

  // Eliminar campaña
  const handleDelete = async (campaignId) => {
    if (!window.confirm('¿Eliminar esta oferta de empleo? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase
        .from('job_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('business_id', businessId);
      if (error) throw error;
      toast.success('Campaña eliminada');
      fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      toast.error(t('common.error'));
    }
  };

  const openCreate = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  const openEdit = (campaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused');
  const expiredCampaigns = campaigns.filter(c => c.status === 'expired');

  if (loading) {
    return (
      <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm animate-pulse">
        <div className="h-6 bg-bg-tertiary rounded w-56 mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-bg-tertiary rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary p-6 rounded-lg border border-border-main shadow-sm animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border-main">
        <div>
          <h3 className="text-xl font-bold text-text-main">{t('jobBoard.title')}</h3>
          <p className="text-sm text-text-muted mt-1">{t('jobBoard.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent text-accent-text px-4 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('jobBoard.createCampaign')}
        </button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{activeCampaigns.length}</p>
          <p className="text-xs text-green-400/80">Activas</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pausedCampaigns.length}</p>
          <p className="text-xs text-yellow-400/80">Pausadas</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {campaigns.reduce((sum, c) => sum + (c.view_count || 0), 0)}
          </p>
          <p className="text-xs text-blue-400/80">Vistas total</p>
        </div>
      </div>

      {/* Lista de campañas */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-bg-tertiary rounded-full mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-text-main mb-1">{t('jobBoard.noCampaigns')}</h4>
          <p className="text-sm text-text-muted mb-4">{t('jobBoard.noCampaignsDesc')}</p>
          <button
            onClick={openCreate}
            className="bg-accent text-accent-text px-5 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t('jobBoard.createFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-bg-tertiary border border-border-main rounded-lg p-4 hover:border-accent/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-text-main truncate">{campaign.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[campaign.status]}`}>
                      {t(`jobBoard.status.${campaign.status}`)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                    {campaign.sector && (
                      <span>🏷️ {t(`jobBoard.sectors.${campaign.sector}`)}</span>
                    )}
                    {campaign.city && (
                      <span>📍 {campaign.city}{campaign.state ? `, ${campaign.state}` : ''}</span>
                    )}
                    {campaign.position_type && (
                      <span>⏰ {t(`jobBoard.positionTypes.${campaign.position_type}`)}</span>
                    )}
                    {campaign.expires_at && (
                      <span>📅 Vence: {new Date(campaign.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  {/* Métricas */}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-blue-400">👁️ {campaign.view_count || 0} vistas</span>
                    <span className="text-green-400">📩 {campaign.apply_count || 0} aplicaciones</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleStatus(campaign)}
                    title={campaign.status === 'active' ? 'Pausar' : 'Activar'}
                    className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted hover:text-text-main"
                  >
                    {campaign.status === 'active' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(campaign)}
                    title="Editar"
                    className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted hover:text-text-main"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    title="Eliminar"
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-text-muted hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <JobCampaignModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCampaign(null); }}
        onSave={handleSaveCampaign}
        campaign={editingCampaign}
        businessCountryCode={businessCountryCode}
      />
    </div>
  );
};

export default JobCampaignsTab;
