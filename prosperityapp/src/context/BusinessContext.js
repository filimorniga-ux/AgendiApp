/**
 * BusinessContext + BusinessProvider
 *
 * Capa externa: maneja Firebase Auth y resuelve businessId desde Supabase.
 * Debe envolver DataProvider en App.jsx para que useSupabaseCollection
 * pueda leer businessId sin dependencia circular.
 */
import React, { createContext, useContext, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../supabase/client';

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
const DEV_USER   = DEV_BYPASS ? { uid: 'filimorniga-uid-placeholder', email: 'dev@local.dev' } : null;

export const BusinessContext = createContext({
  businessId:  null,
  user:        null,
  realRole:    null,
  loadingAuth: true,
});

export const BusinessProvider = ({ children }) => {
  const [user,        setUser]        = useState(null);
  const [realRole,    setRealRole]    = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [businessId,  setBusinessId]  = useState(null);

  React.useEffect(() => {
    // ── Modo bypass: sin Firebase Auth ────────────────────────────
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      setRealRole('owner');
      supabase
        .from('businesses')
        .select('id')
        .limit(1)
        .then(({ data }) => {
          if (data?.[0]?.id) setBusinessId(data[0].id);
          setLoadingAuth(false);
        });
      return;
    }

    // ── Flujo normal con Firebase Auth ────────────────────────────
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data: sbUser } = await supabase
            .from('users')
            .select('business_id, role')
            .eq('firebase_uid', currentUser.uid)
            .single();

          if (sbUser?.role)        setRealRole(sbUser.role);
          if (sbUser?.business_id) {
            setBusinessId(sbUser.business_id);
          } else {
            // Auto-seed: primer login → crear business + user
            const { data: biz } = await supabase
              .from('businesses')
              .upsert(
                { owner_uid: currentUser.uid, name: 'Mi Salón' },
                { onConflict: 'owner_uid', ignoreDuplicates: false }
              )
              .select()
              .single();

            if (biz) {
              await supabase.from('users').upsert(
                { business_id: biz.id, firebase_uid: currentUser.uid, email: currentUser.email, role: 'owner' },
                { onConflict: 'firebase_uid' }
              );
              setBusinessId(biz.id);
            }
          }
        } catch (err) {
          console.warn('[BusinessProvider] Supabase user error:', err);
        }
      } else {
        setRealRole(null);
        setBusinessId(null);
      }

      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <BusinessContext.Provider value={{ businessId, user, realRole, loadingAuth }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
