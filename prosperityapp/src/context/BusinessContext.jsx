import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export const BusinessContext = createContext({
  businessId:    null,
  user:          null,
  supabaseUser:  null,
  realRole:      null,
  loadingAuth:   true,
  businessPlan:  'free',
  signOutAll:    async () => {},
});

export const BusinessProvider = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [realRole,     setRealRole]     = useState(null);
  const [loadingAuth,  setLoadingAuth]  = useState(true);
  const [businessId,   setBusinessId]   = useState(null);
  const [businessPlan, setBusinessPlan] = useState('free');

  const signOutAll = async () => {
    await supabase.auth.signOut().catch(() => {});
    setSupabaseUser(null);
    setRealRole(null);
    setBusinessId(null);
  };

  useEffect(() => {
    // ── Supabase Auth listener ─────────────────────
    const { data: { subscription: sbSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sbUser = session?.user ?? null;
        setSupabaseUser(sbUser);

        if (sbUser) {
          // Look up this Supabase user in the collaborators table
          const { data: collab } = await supabase
            .from('collaborators')
            .select('id, business_id, role')
            .eq('auth_user_id', sbUser.id)
            .maybeSingle();

          if (collab?.business_id) {
            setRealRole(collab.role || 'staff');
            setBusinessId(collab.business_id);
            
            // fetch business plan for collaborator
            const { data: bData } = await supabase.from('businesses').select('plan').eq('id', collab.business_id).single();
            setBusinessPlan(bData?.plan || 'free');

          } else {
            // Check if owner by email
            let { data: appUser } = await supabase
              .from('users')
              .select('business_id, role')
              .eq('email', sbUser.email)
              .maybeSingle();

            if (appUser?.business_id) {
              setRealRole(appUser.role || 'owner');
              setBusinessId(appUser.business_id);

              // fetch business plan for owner
              const { data: bData } = await supabase.from('businesses').select('plan').eq('id', appUser.business_id).single();
              setBusinessPlan(bData?.plan || 'free');
            } else {
              // Check if business already exists for this owner using legacy owner_uid logic if needed
              // or create a new business
              const { data: newBiz } = await supabase
                .from('businesses')
                .upsert(
                  { owner_uid: sbUser.id, name: 'Mi Salón' },
                  { onConflict: 'owner_uid', ignoreDuplicates: false }
                )
                .select()
                .single();

              if (newBiz) {
                await supabase.from('users').upsert(
                  { business_id: newBiz.id, firebase_uid: sbUser.id, email: sbUser.email, role: 'owner' },
                  { onConflict: 'firebase_uid' }
                );
                setBusinessId(newBiz.id);
                setRealRole('owner');
                setBusinessPlan(newBiz.plan || 'free');
              }
            }
          }
        } else {
          setRealRole(null);
          setBusinessId(null);
        }

        setLoadingAuth(false);
      }
    );

    return () => {
      sbSub.unsubscribe();
    };
  }, []);

  return (
    // Conservamos `user` apuntando a `supabaseUser` para que la app no rompa dependencias de legacy context ref
    <BusinessContext.Provider value={{ businessId, businessPlan, user: supabaseUser, supabaseUser, realRole, loadingAuth, signOutAll }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);

