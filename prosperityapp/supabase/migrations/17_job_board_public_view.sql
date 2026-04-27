-- ══════════════════════════════════════════════════════════════
-- 17_job_board_public_view.sql — Vista pública de campañas de empleo
-- ══════════════════════════════════════════════════════════════
-- Crea una vista que combina campañas activas con datos del negocio
-- para la página pública de la bolsa de empleo (/empleo)

CREATE OR REPLACE VIEW public.public_job_campaigns AS
SELECT
  jc.id,
  jc.title,
  jc.description,
  jc.requirements,
  jc.benefits,
  jc.country,
  jc.country_code,
  jc.state,
  jc.state_code,
  jc.city,
  jc.sector,
  jc.position_type,
  jc.salary_fixed,
  jc.salary_approximate,
  jc.commission_percentage,
  jc.commission_details,
  jc.contact_whatsapp,
  jc.contact_email,
  jc.expires_at,
  jc.created_at,
  jc.view_count,
  jc.apply_count,
  -- Business info via join
  b.name       AS business_name,
  b.logo_url   AS business_logo_url,
  b.sector     AS business_sector,
  b.city       AS business_city,
  b.country    AS business_country
FROM job_campaigns jc
JOIN businesses b ON b.id = jc.business_id
WHERE jc.status = 'active'
  AND (jc.expires_at IS NULL OR jc.expires_at > now());

GRANT SELECT ON public.public_job_campaigns TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- RPC alias: increment_campaign_views
-- Wrapper amigable para el frontend
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_campaign_views(campaign_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM increment_job_counter(campaign_id, 'view');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_campaign_views TO anon, authenticated;
