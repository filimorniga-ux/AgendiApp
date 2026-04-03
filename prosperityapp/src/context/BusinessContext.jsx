/**
 * BusinessContext + BusinessProvider
 *
 * Capa externa: maneja Firebase Auth (dueños/admins) Y Supabase Auth (colaboradores).
 * Resuelve businessId y realRole para todos los tipos de usuario.
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
  businessId:    null,
  user:          null,
  supabaseUser:  null,
  realRole:      null,
  loadingAuth:   true,
  signOutAll:    async () => {},
});

export const BusinessProvider = ({ children }) => {
  const [user,         setUser]         = useState(null);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [realRole,     setRealRole]     = useState(null);
  const [loadingAuth,  setLoadingAuth]  = useState(true);
  const [businessId,   setBusinessId]   = useState(null);

  const signOutAll = async () => {
    await supabase.auth.signOut().catch(() => {});
    await auth.signOut().catch(() => {});
    setUser(null);
    setSupabaseUser(null);
    setRealRole(null);
    setBusinessId(null);
  };

  React.useEffect(() => {
    // ── Modo bypass: sin Firebase Auth ────────────────────────────
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      setRealRole('owner');
      supabase
        .from('businesses')
        .select('id')
        .eq('owner_uid', 'filimorniga-uid-placeholder')
        .limit(1)
        .then(async ({ data, error }) => {
          if (error) console.warn('[BusinessProvider Dev Bypass] Error fetching business:', error);
          const id = data?.[0]?.id ?? null;
          if (id) {
            setBusinessId(id);
            // Establecer app.business_id para que RLS pueda validar sin sesión de Auth
            await supabase.rpc('set_config', {
              setting: 'app.business_id',
              value: id,
              is_local: false,
            }).then(({ error }) => {
              if (error) console.warn('[BusinessProvider Dev Bypass] set_config error:', error);
            });
          }
          setLoadingAuth(false);
        });
      return;
    }

    let firebaseReady = false;
    let supabaseReady = false;

    let fbData = { user: null, role: null, businessId: null };
    let sbData = { user: null, role: null, businessId: null };

    const updateState = () => {
      if (!firebaseReady || !supabaseReady) return;

      if (fbData.user && sbData.user) {
        // Conflicting sessions: log out of Supabase to prioritize Firebase admin
        supabase.auth.signOut().catch(() => {});
        sbData = { user: null, role: null, businessId: null };
      }

      if (fbData.user) {
        setUser(fbData.user);
        setSupabaseUser(null);
        setRealRole(fbData.role);
        setBusinessId(fbData.businessId);
      } else if (sbData.user) {
        setUser(null);
        setSupabaseUser(sbData.user);
        setRealRole('collaborator');
        setBusinessId(sbData.businessId);
      } else {
        setUser(null);
        setSupabaseUser(null);
        setRealRole(null);
        setBusinessId(null);
      }

      setLoadingAuth(false);
    };

    // ── Supabase Auth listener (colaboradores) ─────────────────────
    const { data: { subscription: sbSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          const sbUser = session?.user ?? null;
          if (sbUser) {
            const { data: collab } = await supabase
              .from('collaborators')
              .select('id, business_id')
              .eq('auth_user_id', sbUser.id)
              .maybeSingle();

            if (collab?.business_id) {
              sbData = { user: sbUser, role: 'collaborator', businessId: collab.business_id };
              await supabase.rpc('set_config', {
                setting: 'app.business_id',
                value: collab.business_id,
                is_local: false,
              }).catch(console.warn);
            } else {
              sbData = { user: null, role: null, businessId: null };
            }
          } else {
            sbData = { user: null, role: null, businessId: null };
          }
        } catch (err) {
          console.warn('[BusinessProvider] Supabase user error:', err);
          sbData = { user: null, role: null, businessId: null };
        }

        supabaseReady = true;
        updateState();
      }
    );

    // ── Firebase Auth listener (dueños / admins) ───────────────────
    const unsubscribeFirebase = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const { data: sbUser, error: userErr } = await supabase
            .from('users')
            .select('business_id, role')
            .eq('firebase_uid', currentUser.uid)
            .maybeSingle();

          if (userErr) throw userErr;

          let role = sbUser?.role || 'owner';
          let bId = sbUser?.business_id;

          if (!bId) {
            let { data: biz } = await supabase
              .from('businesses')
              .select('id')
              .eq('owner_uid', currentUser.uid)
              .maybeSingle();

            if (!biz) {
              const { data: newBiz } = await supabase
                .from('businesses')
                .upsert(
                  { owner_uid: currentUser.uid, name: 'Mi Salón' },
                  { onConflict: 'owner_uid', ignoreDuplicates: false }
                )
                .select()
                .single();
              biz = newBiz;
            }

            if (biz) {
              await supabase.from('users').upsert(
                { business_id: biz.id, firebase_uid: currentUser.uid, email: currentUser.email, role: 'owner' },
                { onConflict: 'firebase_uid' }
              );
              bId = biz.id;
            }
          }

          fbData = { user: currentUser, role, businessId: bId };
        } else {
          fbData = { user: null, role: null, businessId: null };
        }
      } catch (err) {
        console.warn('[BusinessProvider] Firebase user error:', err);
        fbData = { user: null, role: null, businessId: null };
      }

      firebaseReady = true;
      updateState();
    });

    return () => {
      unsubscribeFirebase();
      sbSub.unsubscribe();
    };
  }, []);

  return (
    <BusinessContext.Provider value={{ businessId, user, supabaseUser, realRole, loadingAuth, signOutAll }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
