-- ══════════════════════════════════════════════════════════════
-- 19_job_seekers.sql — Perfiles de Profesionales (Busco Empleo)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Opcional por ahora

  -- Datos Personales y Profesionales
  full_name       TEXT NOT NULL,
  profession      TEXT NOT NULL, -- Ej: 'barbero', 'estilista', 'manicurista', etc.
  experience_years INTEGER DEFAULT 0,
  bio             TEXT,
  
  -- Portafolio y Redes
  instagram       TEXT,
  tiktok          TEXT,
  
  -- Ubicación
  country_code    TEXT,
  state_code      TEXT,
  city            TEXT,

  -- Contacto
  contact_email   TEXT,
  contact_whatsapp TEXT NOT NULL,

  -- Estado
  status          TEXT DEFAULT 'active', -- active, hidden
  view_count      INTEGER DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  -- Buscador
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish',
      coalesce(full_name, '') || ' ' ||
      coalesce(profession, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(bio, '')
    )
  ) STORED
);

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_job_seekers_search ON job_seeker_profiles USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_job_seekers_status ON job_seeker_profiles(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_job_seekers_location ON job_seeker_profiles(country_code, city);
CREATE INDEX IF NOT EXISTS idx_job_seekers_profession ON job_seeker_profiles(profession);

-- RLS
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Público puede ver perfiles activos
CREATE POLICY "Public can view active job seekers"
  ON job_seeker_profiles FOR SELECT
  USING (status = 'active');

-- 2. Público puede insertar perfiles (Formulario público rápido)
-- En el futuro se puede restringir solo a usuarios autenticados
CREATE POLICY "Public can insert job seekers"
  ON job_seeker_profiles FOR INSERT
  WITH CHECK (true);

-- 3. Usuarios autenticados pueden editar su propio perfil
CREATE POLICY "Users can update own profile"
  ON job_seeker_profiles FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_job_seeker_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_job_seeker_updated ON job_seeker_profiles;
CREATE TRIGGER trg_job_seeker_updated
  BEFORE UPDATE ON job_seeker_profiles
  FOR EACH ROW EXECUTE FUNCTION update_job_seeker_timestamp();

-- RPC para vistas
CREATE OR REPLACE FUNCTION increment_job_seeker_views(profile_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE job_seeker_profiles
  SET view_count = view_count + 1
  WHERE id = profile_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_job_seeker_views TO anon, authenticated;
