-- Migración: Tabla de Control de Sesiones de Caja (Arqueos y Cierres)

CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  user_id text, -- Opcional, quien hizo el arqueo/cierre
  collaborator_id text, -- Si aplica a alguien en específico
  type text NOT NULL CHECK (type IN ('arqueo', 'cierre')),
  expected_cash numeric DEFAULT 0,
  actual_cash numeric DEFAULT 0,
  difference numeric DEFAULT 0,
  total_sales numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  total_advances numeric DEFAULT 0,
  observations text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

-- Política de RLS
-- Asume que la función `current_setting('app.current_business_id', true)` 
-- ya está configurada o se manejará desde el cliente/app para RLS simulado.
CREATE POLICY "Permitir acceso por business_id" ON public.cash_sessions
  FOR ALL
  USING (business_id = current_setting('app.current_business_id', true))
  WITH CHECK (business_id = current_setting('app.current_business_id', true));

-- Alternativa simple si no estás forzando current_setting:
-- DROP POLICY IF EXISTS "Permitir acceso por business_id" ON public.cash_sessions;
-- CREATE POLICY "Bypass RLS temporal" ON public.cash_sessions FOR ALL USING (true);
