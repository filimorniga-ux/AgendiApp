-- ============================================================================
-- Migración 24: Fix Supabase Linter Issues
-- ============================================================================
-- Fixes SECURITY DEFINER views, mutable search_path functions,
-- unoptimized auth.uid() usage in RLS, and overlapping permissive policies.

-- 1. Fix SECURITY DEFINER Views
-- Supabase linter: "Detects views defined with the SECURITY DEFINER property"
ALTER VIEW public.public_business_profiles SET (security_invoker = on);
ALTER VIEW public.public_job_campaigns SET (security_invoker = on);

-- 2. Fix mutable search_path on functions
-- Supabase linter: "Function ... has a mutable search_path"
ALTER FUNCTION public.increment_job_counter(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.update_job_campaign_timestamp() SET search_path = public;
ALTER FUNCTION public.check_job_campaign_limit() SET search_path = public;
ALTER FUNCTION public.increment_campaign_views(UUID) SET search_path = public;
ALTER FUNCTION public.increment_job_seeker_views(UUID) SET search_path = public;
ALTER FUNCTION public.update_job_seeker_timestamp() SET search_path = public;
ALTER FUNCTION public.get_current_user_business_id() SET search_path = public;

-- Revoke public execution for sensitive SECURITY DEFINER function if applicable
-- In 16_job_board.sql, increment_job_counter is granted to anon, authenticated, but it only increments if status='active'.
-- However, we should be careful with other functions. If get_current_user_business_id was granted, it's fine.

-- 3. Optimize RLS Policies
-- Supabase linter: "Inefficient RLS using auth.<function>() instead of (select auth.<function>())"

-- Table: job_campaigns
DROP POLICY IF EXISTS "Owner/admin can manage campaigns" ON job_campaigns;
CREATE POLICY "Owner/admin can manage campaigns"
  ON job_campaigns FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM users WHERE auth_user_id = (select auth.uid())
      UNION
      SELECT business_id FROM collaborators
        WHERE auth_user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- Table: job_seeker_profiles
DROP POLICY IF EXISTS "Users can update own profile" ON job_seeker_profiles;
CREATE POLICY "Users can update own profile"
  ON job_seeker_profiles FOR UPDATE
  USING (auth_user_id = (select auth.uid()));

-- Table: chats
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;
CREATE POLICY "Users can view chats they are members of" ON public.chats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.chats.id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create chats for their business" ON public.chats;
CREATE POLICY "Users can create chats for their business" ON public.chats
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.collaborators WHERE auth_user_id = (select auth.uid())
      UNION
      SELECT id FROM public.businesses WHERE owner_uid = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can update chats they are members of" ON public.chats;
CREATE POLICY "Users can update chats they are members of" ON public.chats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.chats.id
      AND user_id = (select auth.uid())
    )
  );

-- Table: chat_members
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;
CREATE POLICY "Users can view members of their chats" ON public.chat_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members AS cm
      WHERE cm.chat_id = public.chat_members.chat_id
      AND cm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can add members to their chats" ON public.chat_members;
CREATE POLICY "Users can add members to their chats" ON public.chat_members
  FOR INSERT
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = public.chat_members.chat_id)
    OR
    EXISTS (
      SELECT 1 FROM public.chat_members AS cm
      WHERE cm.chat_id = public.chat_members.chat_id
      AND cm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own membership" ON public.chat_members;
CREATE POLICY "Users can update their own membership" ON public.chat_members
  FOR UPDATE
  USING (user_id = (select auth.uid()));

-- Table: messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.messages.chat_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
CREATE POLICY "Users can insert messages in their chats" ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_id = public.messages.chat_id
      AND user_id = (select auth.uid())
    )
    AND sender_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE
  USING (sender_id = (select auth.uid()));

-- 4. Clean up Multiple Permissive Policies
-- Drop overlapping Tenant Isolation Policies that conflict with granular RBAC
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.appointments;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.movements;
