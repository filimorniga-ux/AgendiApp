-- ============================================================================
-- Migración 12: RBAC Granular + Campos para Ecosistema Multi-Actor
-- Agrega campos necesarios para vincular clientes a Supabase Auth,
-- WhatsApp del comercio, y permisos granulares RLS por rol.
-- ============================================================================

-- ── 1. Agregar columna de WhatsApp al comercio ─────────────────────────────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- ── 2. Agregar vinculación de cliente a Supabase Auth ──────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Índice para búsqueda rápida por auth_user_id
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- ── 3. Políticas RLS para `clients` ────────────────────────────────────────
-- Owner/Admin: acceso completo a los clientes de su negocio
DROP POLICY IF EXISTS "Owner can manage clients" ON clients;
CREATE POLICY "Owner can manage clients" ON clients
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE firebase_uid = auth.uid()
      UNION
      SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Staff: sin acceso a la lista de clientes (protección de base de datos)
-- (No se crea policy, por lo tanto RLS bloquea automáticamente)

-- Cliente: puede ver su propio registro
DROP POLICY IF EXISTS "Client can view own record" ON clients;
CREATE POLICY "Client can view own record" ON clients
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- ── 4. Políticas RLS para `appointments` ───────────────────────────────────
-- Owner/Admin: CRUD completo
DROP POLICY IF EXISTS "Owner can manage appointments" ON appointments;
CREATE POLICY "Owner can manage appointments" ON appointments
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE firebase_uid = auth.uid()
      UNION
      SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Staff: puede ver/editar solo sus citas asignadas
DROP POLICY IF EXISTS "Staff can view own appointments" ON appointments;
CREATE POLICY "Staff can view own appointments" ON appointments
  FOR SELECT
  USING (
    collaborator_id IN (
      SELECT id FROM collaborators WHERE auth_user_id = auth.uid()
    )
  );

-- Cliente: puede ver sus propias citas y crear nuevas
DROP POLICY IF EXISTS "Client can view own appointments" ON appointments;
CREATE POLICY "Client can view own appointments" ON appointments
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Client can create appointments" ON appointments;
CREATE POLICY "Client can create appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

-- ── 5. Permitir lectura pública de servicios (para portal público) ─────────
-- Anon y authenticated pueden ver servicios de cualquier negocio
DROP POLICY IF EXISTS "Public can view services" ON services;
CREATE POLICY "Public can view services" ON services
  FOR SELECT
  USING (true);

-- ── 6. Políticas RLS para `movements` ──────────────────────────────────────
-- Owner/Admin: CRUD completo
DROP POLICY IF EXISTS "Owner can manage movements" ON movements;
CREATE POLICY "Owner can manage movements" ON movements
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE firebase_uid = auth.uid()
      UNION
      SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Staff: puede insertar (registrar ventas) y ver sus propios movimientos
DROP POLICY IF EXISTS "Staff can insert movements" ON movements;
CREATE POLICY "Staff can insert movements" ON movements
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM collaborators WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can view own movements" ON movements;
CREATE POLICY "Staff can view own movements" ON movements
  FOR SELECT
  USING (
    collaborator = (
      SELECT name FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );

-- Cliente: puede ver sus propios movimientos (historial de compras)
DROP POLICY IF EXISTS "Client can view own movements" ON movements;
CREATE POLICY "Client can view own movements" ON movements
  FOR SELECT
  USING (
    client = (
      SELECT name FROM clients WHERE auth_user_id = auth.uid() LIMIT 1
    )
    OR
    "clientId" = (
      SELECT id::text FROM clients WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );
