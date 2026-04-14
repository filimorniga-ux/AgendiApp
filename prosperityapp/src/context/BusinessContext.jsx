import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export const BusinessContext = createContext({
  businessId:    null,
  user:          null,
  supabaseUser:  null,
  realRole:      null,
  isClient:      false,
  loadingAuth:   true,
  businessPlan:  'free',
  signOutAll:    async () => {},
});

export const BusinessProvider = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [realRole,     setRealRole]     = useState(null);
  const [isClient,     setIsClient]     = useState(false);
  const [loadingAuth,  setLoadingAuth]  = useState(true);
  const [businessId,   setBusinessId]   = useState(null);
  const [businessPlan, setBusinessPlan] = useState('free');

  const signOutAll = async () => {
    await supabase.auth.signOut().catch(() => {});
    setSupabaseUser(null);
    setRealRole(null);
    setIsClient(false);
    setBusinessId(null);
  };

  useEffect(() => {
    // ── Supabase Auth listener ─────────────────────
    const { data: { subscription: sbSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sbUser = session?.user ?? null;
        setSupabaseUser(sbUser);

        if (sbUser) {
          // ── Priority 1: Check collaborators table (staff/admin) ──
          const { data: collab } = await supabase
            .from('collaborators')
            .select('id, business_id, role')
            .eq('auth_user_id', sbUser.id)
            .maybeSingle();

          if (collab?.business_id) {
            setRealRole(collab.role || 'staff');
            setBusinessId(collab.business_id);
            setIsClient(false);
            
            const { data: bData } = await supabase.from('businesses').select('plan').eq('id', collab.business_id).single();
            setBusinessPlan(bData?.plan || 'free');

          } else {
            // ── Priority 2: Check users table (owner) ──
            let { data: appUser } = await supabase
              .from('users')
              .select('business_id, role')
              .eq('email', sbUser.email)
              .maybeSingle();

            if (appUser?.business_id) {
              setRealRole(appUser.role || 'owner');
              setBusinessId(appUser.business_id);
              setIsClient(false);

              const { data: bData } = await supabase.from('businesses').select('plan').eq('id', appUser.business_id).single();
              setBusinessPlan(bData?.plan || 'free');

            } else {
              // ── Priority 3: Check clients table (end-user client) ──
              const { data: clientRecord } = await supabase
                .from('clients')
                .select('id, business_id')
                .eq('auth_user_id', sbUser.id)
                .maybeSingle();

              if (clientRecord?.business_id) {
                setRealRole('client');
                setBusinessId(clientRecord.business_id);
                setIsClient(true);
                
                const { data: bData } = await supabase.from('businesses').select('plan').eq('id', clientRecord.business_id).single();
                setBusinessPlan(bData?.plan || 'free');

              } else {
                // ── Priority 4: Auto-seed new business for new owner ──
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
                    { business_id: newBiz.id, auth_user_id: sbUser.id, email: sbUser.email, role: 'owner' },
                    { onConflict: 'auth_user_id' }
                  );
                  setBusinessId(newBiz.id);
                  setRealRole('owner');
                  setIsClient(false);
                  setBusinessPlan(newBiz.plan || 'free');
                }
              }
            }
          }
        } else {
          setRealRole(null);
          setBusinessId(null);
          setIsClient(false);
        }

        setLoadingAuth(false);
      }
    );

    return () => {
      sbSub.unsubscribe();
    };
  }, []);

  return (
    <BusinessContext.Provider value={{ businessId, businessPlan, user: supabaseUser, supabaseUser, realRole, isClient, loadingAuth, signOutAll }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
