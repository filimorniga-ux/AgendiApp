-- 11_multitenant_rls.sql
-- Establece políticas estrictas de seguridad (RLS) para evitar fugas de datos entre inquilinos.
-- Reemplaza la configuración insegura de 10_firebase_rls.sql

-- 1. Helper Function: Obtener el business_id asociado al usuario de Supabase Auth
CREATE OR REPLACE FUNCTION public.get_current_user_business_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios de creador para acceder a las tablas en la política
AS $$
DECLARE
    v_business_id text;
BEGIN
    -- 1. Buscar en colaboradores
    SELECT business_id INTO v_business_id
    FROM public.collaborators
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    IF v_business_id IS NOT NULL THEN
        RETURN v_business_id;
    END IF;

    -- 2. Buscar en dueños (users table)
    SELECT business_id INTO v_business_id
    FROM public.users
    WHERE firebase_uid = auth.uid()::text
    LIMIT 1;

    RETURN v_business_id;
END;
$$;

-- NOTA: Eliminamos las antiguas políticas inseguras primero
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.movements;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.retail_inventory;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.technical_inventory;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.services;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.collaborators;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.gift_cards;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.clients;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.config;
DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.appointments;


-- Activamos RLS Estricto:

-- 1. Movements
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.movements
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 2. Retail Inventory
ALTER TABLE public.retail_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.retail_inventory
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 3. Technical Inventory
ALTER TABLE public.technical_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.technical_inventory
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 4. Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.services
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 5. Collaborators
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
-- Permitirle a un colaborador ver los otros colaboradores de su mismo negocio. 
-- *Advertencia de recursión:* public.get_current_user_business_id() accede a colaboradores. 
-- Para evitar un loop infinito, la política de colaboradores necesita una lógica especial.
-- En vez de usar la función, hacemos subqueries directas, O permitimos que la función acceda a la tabla porque corre como SECURITY DEFINER (bypass RLS si el dueño de la función es un superuser/postgres y bypass_rls=true. Sin embargo, en Supabase SECURITY DEFINER sí bypasses RLS). Es seguro si es SECURITY DEFINER.
CREATE POLICY "Tenant Isolation Policy" ON public.collaborators
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 6. Gift Cards
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.gift_cards
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 7. Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.clients
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 8. Config
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.config
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- 9. Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation Policy" ON public.appointments
  FOR ALL USING (business_id = public.get_current_user_business_id()) WITH CHECK (business_id = public.get_current_user_business_id());

-- Fin de migración
