-- 22_whatsapp_agent.sql

-- Configuraciones de WhatsApp por negocio (Tenant)
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  waba_id TEXT,
  bot_active BOOLEAN DEFAULT true,
  system_prompt_customization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(business_id),
  UNIQUE(phone_number_id)
);

-- Conversaciones de WhatsApp con clientes
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  status TEXT DEFAULT 'bot_active', -- 'bot_active', 'human_active'
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(business_id, customer_phone)
);

-- Mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'bot', 'human', 'customer'
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'audio', 'video', 'document'
  meta_message_id TEXT, -- Para rastrear el ID del mensaje en Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_read BOOLEAN DEFAULT false
);

-- RLS para whatsapp_configs
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their business whatsapp config" ON public.whatsapp_configs;
CREATE POLICY "Users can view their business whatsapp config" ON public.whatsapp_configs
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM public.collaborators WHERE auth_user_id = auth.uid()
      UNION
      SELECT id FROM public.businesses WHERE owner_uid = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Owners can manage whatsapp configs" ON public.whatsapp_configs;
CREATE POLICY "Owners can manage whatsapp configs" ON public.whatsapp_configs
  FOR ALL
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_uid = auth.uid()::text)
  );

-- RLS para whatsapp_conversations
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their business whatsapp conversations" ON public.whatsapp_conversations;
CREATE POLICY "Users can view their business whatsapp conversations" ON public.whatsapp_conversations
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM public.collaborators WHERE auth_user_id = auth.uid()
      UNION
      SELECT id FROM public.businesses WHERE owner_uid = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can manage whatsapp conversations" ON public.whatsapp_conversations;
CREATE POLICY "Users can manage whatsapp conversations" ON public.whatsapp_conversations
  FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM public.collaborators WHERE auth_user_id = auth.uid()
      UNION
      SELECT id FROM public.businesses WHERE owner_uid = auth.uid()::text
    )
  );

-- RLS para whatsapp_messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages for their business conversations" ON public.whatsapp_messages;
CREATE POLICY "Users can view messages for their business conversations" ON public.whatsapp_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.whatsapp_conversations WHERE business_id IN (
        SELECT business_id FROM public.collaborators WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.businesses WHERE owner_uid = auth.uid()::text
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage messages for their business conversations" ON public.whatsapp_messages;
CREATE POLICY "Users can manage messages for their business conversations" ON public.whatsapp_messages
  FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM public.whatsapp_conversations WHERE business_id IN (
        SELECT business_id FROM public.collaborators WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public.businesses WHERE owner_uid = auth.uid()::text
      )
    )
  );

-- Habilitar Realtime para las nuevas tablas de whatsapp
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
