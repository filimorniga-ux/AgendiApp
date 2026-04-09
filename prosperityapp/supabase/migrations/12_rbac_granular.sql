-- ============================================================================
-- Migración 12: RBAC Granular + Campos para Ecosistema Multi-Actor
-- ============================================================================

-- 1. WhatsApp para comercios
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- 2. Vinculación cliente → Supabase Auth
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- 3. RLS clients (firebase_uid is TEXT, auth.uid() is UUID — cast needed)
DROP POLICY IF EXISTS "Owner can manage clients" ON clients;
CREATE POLICY "Owner can manage clients" ON clients
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM users WHERE firebase_uid = auth.uid()::text
      UNION
      SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
DROP POLICY IF EXISTS "Client can view own record" ON clients;
CREATE POLICY "Client can view own record" ON clients
  FOR SELECT USING (auth_user_id = auth.uid());

-- 4. RLS appointments
DROP POLICY IF EXISTS "Owner can manage appointments" ON appointments;
CREATE POLICY "Owner can manage appointments" ON appointments
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM users WHERE firebase_uid = auth.uid()::text
      UNION
      SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
DROP POLICY IF EXISTS "Staff can view own appointments" ON appointments;
CREATE POLICY "Staff can view own appointments" ON appointments
  FOR SELECT USING (
    collaborator_id IN (SELECT id FROM collaborators WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Client can view own appointments" ON appointments;
CREATE POLICY "Client can view own appointments" ON appointments
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Client can create appointments" ON appointments;
CREATE POLICY "Client can create appointments" ON appointments
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- 5. Servicios públicos
DROP POLICY IF EXISTS "Public can view services" ON services;
CREATE POLICY "Public can view services" ON services
  FOR SELECT USING (true);

-- 6. RLS movements
DROP POLICY IF EXISTS "Owner can manage movements" ON movements;
CREATE POLICY "Owner can manage movements" ON movements
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM users WHERE firebase_uid = auth.uid()::text
      UNION
      SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
DROP POLICY IF EXISTS "Staff can insert movements" ON movements;
CREATE POLICY "Staff can insert movements" ON movements
  FOR INSERT WITH CHECK (
    business_id IN (SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Staff can view own movements" ON movements;
CREATE POLICY "Staff can view own movements" ON movements
  FOR SELECT USING (
    collaborator_id IN (SELECT id FROM collaborators WHERE auth_user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Client can view own movements" ON movements;
CREATE POLICY "Client can view own movements" ON movements
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );
