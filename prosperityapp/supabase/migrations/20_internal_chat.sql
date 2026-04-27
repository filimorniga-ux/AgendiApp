-- 20_internal_chat.sql

-- Tabla de Chats
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  is_group BOOLEAN DEFAULT false,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Miembros del Chat
CREATE TABLE IF NOT EXISTS public.chat_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(chat_id, user_id)
);

-- Tabla de Mensajes
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'image', 'document'
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_read BOOLEAN DEFAULT false
);

-- RLS para Chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;
CREATE POLICY "Users can view chats they are members of" ON public.chats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.chats.id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create chats for their business" ON public.chats;
CREATE POLICY "Users can create chats for their business" ON public.chats
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.collaborators WHERE auth_user_id = auth.uid()
      UNION
      SELECT id FROM public.businesses WHERE owner_uid = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can update chats they are members of" ON public.chats;
CREATE POLICY "Users can update chats they are members of" ON public.chats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.chats.id
      AND user_id = auth.uid()
    )
  );

-- RLS para Chat Members
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;
CREATE POLICY "Users can view members of their chats" ON public.chat_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members AS cm
      WHERE cm.chat_id = public.chat_members.chat_id
      AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add members to their chats" ON public.chat_members;
CREATE POLICY "Users can add members to their chats" ON public.chat_members
  FOR INSERT
  WITH CHECK (
    -- Allowed if they are creating a new chat (no members yet) OR if they are an admin/member adding someone else
    NOT EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = public.chat_members.chat_id)
    OR
    EXISTS (
      SELECT 1 FROM public.chat_members AS cm
      WHERE cm.chat_id = public.chat_members.chat_id
      AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own membership" ON public.chat_members;
CREATE POLICY "Users can update their own membership" ON public.chat_members
  FOR UPDATE
  USING (user_id = auth.uid());

-- RLS para Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.messages.chat_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
CREATE POLICY "Users can insert messages in their chats" ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.messages.chat_id
      AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Habilitar Realtime para messages y chats
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
