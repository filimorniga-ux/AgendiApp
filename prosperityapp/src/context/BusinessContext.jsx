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

    let firebaseResolved = false;
    let supabaseResolved = false;
    let setLoadingDone   = false;

    const trySetLoadingDone = () => {
      if (firebaseResolved && supabaseResolved && !setLoadingDone) {
        setLoadingDone = true;
        setLoadingAuth(false);
      }
    };

    // ── Supabase Auth listener (colaboradores) ─────────────────────
    const { data: { subscription: sbSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sbUser = session?.user ?? null;
        setSupabaseUser(sbUser);

        if (sbUser) {
          // Look up this Supabase user in the collaborators table
          const { data: collab } = await supabase
            .from('collaborators')
            .select('id, business_id')
            .eq('auth_user_id', sbUser.id)
            .maybeSingle();

          if (collab?.business_id) {
            setRealRole('collaborator');
            setBusinessId(collab.business_id);
            // Set RLS app.business_id for collaborator
            await supabase.rpc('set_config', {
              setting: 'app.business_id',
              value: collab.business_id,
              is_local: false,
            }).catch(console.warn);
          }
        }

        supabaseResolved = true;
        trySetLoadingDone();
      }
    );

    // ── Firebase Auth listener (dueños / admins) ───────────────────
    const unsubscribeFirebase = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data: sbUser, error: userErr } = await supabase
            .from('users')
            .select('business_id, role')
            .eq('firebase_uid', currentUser.uid)
            .maybeSingle();

          if (userErr) throw userErr;

          if (sbUser?.role)        setRealRole(sbUser.role);
          if (sbUser?.business_id) {
            setBusinessId(sbUser.business_id);
          } else {
            // Check if business already exists for this owner (migration edge case)
            let { data: biz } = await supabase
              .from('businesses')
              .select('id')
              .eq('owner_uid', currentUser.uid)
              .maybeSingle();

            if (!biz) {
              // Auto-seed: primer login → crear business
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
              setBusinessId(biz.id);
            }
          }
        } catch (err) {
          console.warn('[BusinessProvider] Supabase user error:', err);
        }
      } else {
        // Only clear Firebase-specific state; collaborator Supabase session is independent
        setUser(null);
        // If there's no Supabase session either, clear everything
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setRealRole(null);
          setBusinessId(null);
        }
      }

      firebaseResolved = true;
      trySetLoadingDone();
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
