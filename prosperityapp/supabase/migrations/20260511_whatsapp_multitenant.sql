-- Migration: WhatsApp Multi-Tenant Support
-- Adds per-tenant access tokens and connection tracking to whatsapp_configs

ALTER TABLE whatsapp_configs
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS display_phone TEXT,
ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_status ON whatsapp_configs(connection_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_business ON whatsapp_configs(business_id);

COMMENT ON COLUMN whatsapp_configs.access_token IS 'Long-lived WhatsApp access token per tenant';
COMMENT ON COLUMN whatsapp_configs.connection_status IS 'pending | connected | error | disconnected';

-- RLS
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS owners_manage_whatsapp_configs ON whatsapp_configs
FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()::text)
);

CREATE POLICY IF NOT EXISTS service_role_whatsapp_configs ON whatsapp_configs
FOR ALL USING (auth.role() = 'service_role');

-- Platinum add-on: enables AgendiBot (WhatsApp AI assistant)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS has_platinum BOOLEAN DEFAULT false;
COMMENT ON COLUMN businesses.has_platinum IS 'Platinum add-on: enables AgendiBot (WhatsApp AI assistant with RAG)';
