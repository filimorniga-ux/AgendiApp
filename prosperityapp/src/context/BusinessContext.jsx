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
  const [authErrorDetail, setAuthErrorDetail] = useState('');
  
  // Ref to track the currently resolved user ID to prevent redundant requests
  const currentUserRef = React.useRef(null);

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
    currentUserRef.current = null;

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
      console.warn("localStorage cleanup error (non-blocking):", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleSession = async (session) => {
      const sbUser = session?.user ?? null;
      setSupabaseUser(sbUser);
      if (sbUser) {
        if (currentUserRef.current === sbUser.id && businessId !== null && !noBusinessFound) {
           setLoadingAuth(false);
           return;
        }

        setNoBusinessFound(false);
        let resolved = false;

        const TIMEOUT_MS = 10000;
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Auth queries timeout')), TIMEOUT_MS);
        });

        const loadPlan = async (bizId) => {
          try {
            const { data: bData } = await supabase
              .from('businesses')
              .select('plan')
              .eq('id', bizId)
              .single();
            if (mounted) setBusinessPlan(bData?.plan || 'free');
          } catch {
            if (mounted) setBusinessPlan('free');
          }
        };

        try {
          const [collabRes, userByIdRes, userByUidRes, userByEmailRes, clientRes] = await Promise.race([
            Promise.all([
              supabase.from('collaborators').select('id, business_id, role').eq('auth_user_id', sbUser.id).maybeSingle(),
              supabase.from('users').select('business_id, role').eq('auth_user_id', sbUser.id).maybeSingle(),
              supabase.from('users').select('business_id, role').eq('firebase_uid', sbUser.id).maybeSingle(),
              supabase.from('users').select('business_id, role').eq('email', sbUser.email).maybeSingle(),
              supabase.from('clients').select('id, business_id').eq('auth_user_id', sbUser.id).maybeSingle(),
            ]),
            timeoutPromise
          ]);

          clearTimeout(timeoutHandle);
          
          if (collabRes.data?.business_id) {
            if (mounted) {
              setRealRole(collabRes.data.role || 'staff');
              setBusinessId(collabRes.data.business_id);
              setIsClient(false);
            }
            loadPlan(collabRes.data.business_id);
            resolved = true;
          } else if (userByIdRes.data?.business_id) {
            if (mounted) {
              setRealRole(userByIdRes.data.role || 'owner');
              setBusinessId(userByIdRes.data.business_id);
              setIsClient(false);
            }
            loadPlan(userByIdRes.data.business_id);
            resolved = true;
          } else if (userByUidRes.data?.business_id) {
            if (mounted) {
              setRealRole(userByUidRes.data.role || 'owner');
              setBusinessId(userByUidRes.data.business_id);
              setIsClient(false);
            }
            loadPlan(userByUidRes.data.business_id);
            resolved = true;
          } else if (userByEmailRes.data?.business_id) {
            if (mounted) {
              setRealRole(userByEmailRes.data.role || 'owner');
              setBusinessId(userByEmailRes.data.business_id);
              setIsClient(false);
            }
            loadPlan(userByEmailRes.data.business_id);
            resolved = true;
          } else if (clientRes.data?.business_id) {
            if (mounted) {
              setRealRole('client');
              setBusinessId(clientRes.data.business_id);
              setIsClient(true);
            }
            loadPlan(clientRes.data.business_id);
            resolved = true;
          }
        } catch (err) {
          clearTimeout(timeoutHandle);
          if (mounted) setAuthErrorDetail(err?.message || String(err));
        }

        if (!resolved) {
          if (mounted) {
            setRealRole(null);
            setBusinessId(null);
            setIsClient(false);
            setNoBusinessFound(true);
            currentUserRef.current = null;
          }
        } else {
          currentUserRef.current = sbUser.id;
        }
      } else {
        if (mounted) {
          setRealRole(null);
          setBusinessId(null);
          setIsClient(false);
          setNoBusinessFound(false);
          currentUserRef.current = null;
        }
      }

      if (mounted) setLoadingAuth(false);
    };

    // Initialize securely
    supabase.auth.getSession().then(({ data: { session } }) => {
       if (mounted) handleSession(session);
    });

    const { data: { subscription: sbSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') return;
        if (mounted) handleSession(session);
      }
    );

    return () => {
      sbSub.unsubscribe();
    };
  }, [businessId, noBusinessFound]);

  return (
    <BusinessContext.Provider value={{
      businessId, businessPlan, user: supabaseUser, supabaseUser,
      realRole, isClient, loadingAuth, noBusinessFound, authErrorDetail, signOutAll
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
