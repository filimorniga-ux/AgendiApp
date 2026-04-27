-- ══════════════════════════════════════════════════════════════
-- 16_job_board.sql — Bolsa de Empleo + Perfil Público de Negocios
-- ══════════════════════════════════════════════════════════════
-- Fase 1 de la expansión AgendiApp
-- Crea: perfil público en businesses, vista segura, campañas de empleo,
--        RLS, triggers freemium, y RPC para contadores anónimos.
-- APPLIED TO PRODUCTION: 2026-04-24

-- ══════════════════════════════════════════════════════════════
-- PARTE A: Extender businesses con perfil público
-- ══════════════════════════════════════════════════════════════
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS photos TEXT[];
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
-- city/country needed for public profile geo-filtering
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Índice geoespacial para búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- PARTE B: Vista pública segura
-- Solo expone datos que el público necesita ver (no plan, config, etc.)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.public_business_profiles AS
SELECT
  id,
  name,
  description,
  sector,
  city,
  country,
  whatsapp_phone,
  instagram,
  facebook,
  tiktok,
  website_url,
  logo_url,
  photos,
  lat,
  lng
FROM businesses
WHERE is_public = true;

GRANT SELECT ON public.public_business_profiles TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- PARTE C: Tabla de Campañas de Empleo
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Información de la oferta
  title           TEXT NOT NULL,
  description     TEXT,
  requirements    TEXT,
  benefits        TEXT,

  -- Ubicación
  country         TEXT,
  country_code    TEXT,        -- ISO 3166-1 alpha-2 (CO, MX, US, AR)
  state           TEXT,
  state_code      TEXT,
  city            TEXT,

  -- Sector y tipo
  sector          TEXT,        -- 'barbería','salón','spa','clínica estética','restaurante'
  position_type   TEXT DEFAULT 'full_time',  -- full_time, part_time, freelance, temporary

  -- Compensación
  salary_fixed           NUMERIC,
  salary_approximate     TEXT,    -- "Competitivo", "A convenir", "$1.500.000 - $2.000.000"
  commission_percentage  NUMERIC,
  commission_details     TEXT,

  -- Contacto
  contact_whatsapp TEXT,
  contact_email    TEXT,

  -- Estado y métricas
  status       TEXT DEFAULT 'active',  -- active, paused, expired
  view_count   INTEGER DEFAULT 0,
  apply_count  INTEGER DEFAULT 0,
  expires_at   TIMESTAMPTZ,

  -- Timestamps
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),

  -- Full-text search en español
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(sector, '') || ' ' ||
      coalesce(requirements, '')
    )
  ) STORED
);

-- ══════════════════════════════════════════════════════════════
-- PARTE D: Índices de rendimiento
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_job_campaigns_search
  ON job_campaigns USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_job_campaigns_status
  ON job_campaigns(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_job_campaigns_business
  ON job_campaigns(business_id);

CREATE INDEX IF NOT EXISTS idx_job_campaigns_location
  ON job_campaigns(country_code, state_code, city);

CREATE INDEX IF NOT EXISTS idx_job_campaigns_sector
  ON job_campaigns(sector) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_job_campaigns_expires
  ON job_campaigns(expires_at) WHERE status = 'active';

-- ══════════════════════════════════════════════════════════════
-- PARTE E: Row Level Security
-- ══════════════════════════════════════════════════════════════
ALTER TABLE job_campaigns ENABLE ROW LEVEL SECURITY;

-- Cualquier persona (incluso anónimos) puede ver campañas activas
CREATE POLICY "Public can view active campaigns"
  ON job_campaigns FOR SELECT
  USING (status = 'active');

-- Solo owner/admin del negocio puede gestionar sus campañas
CREATE POLICY "Owner/admin can manage campaigns"
  ON job_campaigns FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE auth_user_id = auth.uid()
      UNION
      SELECT business_id FROM collaborators
        WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ══════════════════════════════════════════════════════════════
-- PARTE F: Trigger Freemium — Máximo 1 oferta activa en plan free
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION check_job_campaign_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo verificar si la campaña está siendo activada
  IF NEW.status = 'active' THEN
    -- Verificar si el negocio está en plan free
    IF (SELECT plan FROM businesses WHERE id = NEW.business_id) = 'free' THEN
      -- Contar campañas activas excluyendo la actual (para UPDATE)
      IF (
        SELECT count(*) FROM job_campaigns
        WHERE business_id = NEW.business_id
          AND status = 'active'
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      ) >= 1 THEN
        RAISE EXCEPTION 'Plan gratuito: máximo 1 oferta de empleo activa.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_campaign_limit ON job_campaigns;
CREATE TRIGGER trg_job_campaign_limit
  BEFORE INSERT OR UPDATE ON job_campaigns
  FOR EACH ROW EXECUTE FUNCTION check_job_campaign_limit();

-- ══════════════════════════════════════════════════════════════
-- PARTE G: RPC para contadores anónimos
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_job_counter(
  campaign_id UUID,
  counter_type TEXT  -- 'view' o 'apply'
)
RETURNS void AS $$
BEGIN
  IF counter_type = 'view' THEN
    UPDATE job_campaigns
    SET view_count = view_count + 1
    WHERE id = campaign_id AND status = 'active';
  ELSIF counter_type = 'apply' THEN
    UPDATE job_campaigns
    SET apply_count = apply_count + 1
    WHERE id = campaign_id AND status = 'active';
  ELSE
    RAISE EXCEPTION 'counter_type must be "view" or "apply"';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_job_counter TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- PARTE H: Trigger auto-update de updated_at
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_job_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_campaign_updated ON job_campaigns;
CREATE TRIGGER trg_job_campaign_updated
  BEFORE UPDATE ON job_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_job_campaign_timestamp();
