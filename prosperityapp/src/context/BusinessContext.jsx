import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { clearAllCache } from '../lib/localDb';

export const BusinessContext = createContext({
  businessId:       null,
  user:             null,
  supabaseUser:     null,
  realRole:         null,
  isClient:         false,
  loadingAuth:      true,
  businessPlan:     'free',
  noBusinessFound:  false,
  signOutAll:       async () => {},
});

export const BusinessProvider = ({ children }) => {
  const [supabaseUser,    setSupabaseUser]    = useState(null);
  const [realRole,        setRealRole]        = useState(null);
  const [isClient,        setIsClient]        = useState(false);
  const [loadingAuth,     setLoadingAuth]     = useState(true);
  const [businessId,      setBusinessId]      = useState(null);
  const [businessPlan,    setBusinessPlan]    = useState('free');
  const [noBusinessFound, setNoBusinessFound] = useState(false);

  const signOutAll = async () => {
    // 1. Try Supabase signOut (may fail on expired/missing token — that's OK)
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("SignOut API error (non-blocking):", err);
    }

    // 2. Always reset local state
    await clearAllCache();
    setSupabaseUser(null);
    setRealRole(null);
    setIsClient(false);
    setBusinessId(null);

    // 3. Clean up ALL Supabase auth tokens from localStorage (safe)
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // localStorage access can fail in incognito/restricted environments
      console.warn("localStorage cleanup error (non-blocking):", e);
    }
  };

  useEffect(() => {
    // ── Supabase Auth listener ─────────────────────
    const { data: { subscription: sbSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') return;

        const sbUser = session?.user ?? null;
        setSupabaseUser(sbUser);
        setNoBusinessFound(false); // Reset on every auth change

        if (sbUser) {
          let resolved = false;

          // ── Helper to load business plan ──
          const loadPlan = async (bizId) => {
            try {
              const { data: bData } = await supabase
                .from('businesses')
                .select('plan')
                .eq('id', bizId)
                .single();
              setBusinessPlan(bData?.plan || 'free');
            } catch {
              setBusinessPlan('free');
            }
          };

          // ── Priority 1: Check collaborators table (staff/admin) ──
          try {
            const { data: collab } = await supabase
              .from('collaborators')
              .select('id, business_id, role')
              .eq('auth_user_id', sbUser.id)
              .maybeSingle();

            if (collab?.business_id) {
              setRealRole(collab.role || 'staff');
              setBusinessId(collab.business_id);
              setIsClient(false);
              await loadPlan(collab.business_id);
              resolved = true;
            }
          } catch (err) {
            console.warn('[BusinessContext] collaborators lookup failed:', err);
          }

          // ── Priority 2: Check users table (owner) — by auth_user_id first, then email ──
          if (!resolved) {
            try {
              let appUser = null;

              // 2a. Search by auth_user_id (most reliable)
              const { data: byId } = await supabase
                .from('users')
                .select('business_id, role')
                .eq('auth_user_id', sbUser.id)
                .maybeSingle();

              if (byId?.business_id) {
                appUser = byId;
              } else {
                // 2b. Fallback: search by firebase_uid (legacy)
                const { data: byUid } = await supabase
                  .from('users')
                  .select('business_id, role')
                  .eq('firebase_uid', sbUser.id)
                  .maybeSingle();

                if (byUid?.business_id) {
                  appUser = byUid;
                } else {
                  // 2c. Fallback: search by email
                  const { data: byEmail } = await supabase
                    .from('users')
                    .select('business_id, role')
                    .eq('email', sbUser.email)
                    .maybeSingle();

                  if (byEmail?.business_id) appUser = byEmail;
                }
              }

              if (appUser?.business_id) {
                setRealRole(appUser.role || 'owner');
                setBusinessId(appUser.business_id);
                setIsClient(false);
                await loadPlan(appUser.business_id);
                resolved = true;
              }
            } catch (err) {
              console.warn('[BusinessContext] users lookup failed:', err);
            }
          }

          // ── Priority 3: Check clients table (end-user client) ──
          if (!resolved) {
            try {
              const { data: clientRecord } = await supabase
                .from('clients')
                .select('id, business_id')
                .eq('auth_user_id', sbUser.id)
                .maybeSingle();

              if (clientRecord?.business_id) {
                setRealRole('client');
                setBusinessId(clientRecord.business_id);
                setIsClient(true);
                await loadPlan(clientRecord.business_id);
                resolved = true;
              }
            } catch (err) {
              console.warn('[BusinessContext] clients lookup failed:', err);
            }
          }

          // ── No business found — user is NOT registered ──
          if (!resolved) {
            console.warn('[BusinessContext] User is authenticated but has no business/role. Blocking access.');
            setRealRole(null);
            setBusinessId(null);
            setIsClient(false);
            setNoBusinessFound(true);
          }

        } else {
          // Logged out
          setRealRole(null);
          setBusinessId(null);
          setIsClient(false);
          setNoBusinessFound(false);
        }

        setLoadingAuth(false);
      }
    );

    return () => {
      sbSub.unsubscribe();
    };
  }, []);

  return (
    <BusinessContext.Provider value={{
      businessId, businessPlan, user: supabaseUser, supabaseUser,
      realRole, isClient, loadingAuth, noBusinessFound, signOutAll
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
