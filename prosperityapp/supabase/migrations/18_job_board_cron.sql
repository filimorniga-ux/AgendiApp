-- ══════════════════════════════════════════════════════════════
-- 18_job_board_cron.sql — Cron job para expiración de ofertas
-- ══════════════════════════════════════════════════════════════

-- Asegurarse de que la extensión existe
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Crear el cron job que corre cada hora en el minuto 0
SELECT cron.schedule('expire-job-campaigns', '0 * * * *', $$
  UPDATE job_campaigns
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();
$$);
