/**
 * TimerContext — Sistema de temporizadores profesionales
 *
 * Funcionalidades:
 *  - Countdown en tiempo real cada segundo
 *  - Persistencia en Supabase (service_timers)
 *  - Realtime broadcast para notificar alarmas a recepción
 *  - Audio + vibración cuando un timer expira
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useBusiness } from './BusinessContext';
import toast from 'react-hot-toast';

const TimerContext = createContext(null);

export const useTimers = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimers must be used within TimerProvider');
  return ctx;
};

// ── Alarm sound (generated programmatically — no external file needed) ────
function playAlarmSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Play a pleasant chime: two ascending notes
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.5);
    });

    // Vibrate if supported (mobile)
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (e) {
    console.warn('Could not play alarm:', e);
  }
}

// ── Request browser notification permission ────────────────────────────────
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192x192.png' });
  }
}

export const TimerProvider = ({ children }) => {
  const { businessId, currentUser } = useBusiness();
  const [timers, setTimers] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const tickRef = useRef(null);
  const alarmFiredRef = useRef(new Set()); // track which timers already alarmed

  // ── Load active timers from Supabase ────────────────────────────────────
  const loadTimers = useCallback(async () => {
    if (!businessId) return;
    const { data, error } = await supabase
      .from('service_timers')
      .select('*')
      .eq('business_id', businessId)
      .in('status', ['running', 'completed'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTimers(data);
    }
  }, [businessId]);

  useEffect(() => {
    loadTimers();
    requestNotificationPermission();
  }, [loadTimers]);

  // ── Realtime subscription for cross-user alarm notifications ────────────
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`timers:${businessId}`)
      .on('broadcast', { event: 'timer_alarm' }, (payload) => {
        const { timerData } = payload.payload || {};
        if (timerData) {
          playAlarmSound();
          toast('⏰ ' + (timerData.client_name || 'Timer') + ' — ¡Tiempo!', {
            icon: '🔔',
            duration: 8000,
            style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' },
          });
          showBrowserNotification(
            '⏰ Timer completado',
            `${timerData.created_by_name}: ${timerData.client_name || 'Sin cliente'}`
          );
        }
      })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'service_timers', filter: `business_id=eq.${businessId}` },
        () => { loadTimers(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [businessId, loadTimers]);

  // ── Tick every second — recalculate remaining time ─────────────────────
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setTimers(prev => {
        const now = Date.now();
        let needsUpdate = false;

        const updated = prev.map(t => {
          if (t.status !== 'running') return t;
          const endsAt = new Date(t.ends_at).getTime();
          const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));

          if (remaining === 0 && !alarmFiredRef.current.has(t.id)) {
            // Timer just expired!
            alarmFiredRef.current.add(t.id);
            needsUpdate = true;

            // Play alarm locally
            playAlarmSound();
            showBrowserNotification(
              '⏰ Timer completado',
              `${t.client_name || 'Cliente'} — ${t.created_by_name}`
            );

            // Mark as completed in DB
            supabase
              .from('service_timers')
              .update({ status: 'completed' })
              .eq('id', t.id)
              .then();

            // Broadcast to reception if needed
            if (t.notify_reception) {
              supabase.channel(`timers:${t.business_id}`).send({
                type: 'broadcast',
                event: 'timer_alarm',
                payload: { timerData: t },
              });
            }

            return { ...t, status: 'completed', _remaining: 0 };
          }

          return { ...t, _remaining: remaining };
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  const addTimer = async ({ clientName, durationSeconds, notifyReception }) => {
    if (!businessId || !currentUser) return;

    const now = new Date();
    const endsAt = new Date(now.getTime() + durationSeconds * 1000);

    const { data, error } = await supabase
      .from('service_timers')
      .insert({
        business_id: businessId,
        created_by_uid: currentUser.authUserId || currentUser.id,
        created_by_name: currentUser.name || currentUser.email || 'Profesional',
        client_name: clientName || null,
        duration_seconds: durationSeconds,
        started_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        notify_reception: notifyReception || false,
        status: 'running',
      })
      .select()
      .single();

    if (error) {
      console.warn('Error creating timer:', error);
      toast.error('Error al crear timer');
      return null;
    }

    toast.success(`Timer iniciado: ${Math.floor(durationSeconds / 60)} min`);
    await loadTimers();
    return data;
  };

  const cancelTimer = async (timerId) => {
    await supabase
      .from('service_timers')
      .update({ status: 'cancelled' })
      .eq('id', timerId);
    setTimers(prev => prev.filter(t => t.id !== timerId));
    toast('Timer cancelado', { icon: '🗑️' });
  };

  const dismissTimer = async (timerId) => {
    await supabase
      .from('service_timers')
      .update({ status: 'dismissed' })
      .eq('id', timerId);
    alarmFiredRef.current.delete(timerId);
    setTimers(prev => prev.filter(t => t.id !== timerId));
  };

  const dismissAll = async () => {
    const completedIds = timers.filter(t => t.status === 'completed').map(t => t.id);
    if (completedIds.length === 0) return;
    await supabase
      .from('service_timers')
      .update({ status: 'dismissed' })
      .in('id', completedIds);
    alarmFiredRef.current.clear();
    setTimers(prev => prev.filter(t => t.status !== 'completed'));
  };

  // ── Derived state ──────────────────────────────────────────────────────
  const activeTimers = timers.filter(t => t.status === 'running');
  const expiredTimers = timers.filter(t => t.status === 'completed');
  const activeCount = activeTimers.length;
  const expiredCount = expiredTimers.length;
  const hasAlarm = expiredCount > 0;

  return (
    <TimerContext.Provider value={{
      timers, activeTimers, expiredTimers,
      activeCount, expiredCount, hasAlarm,
      panelOpen, setPanelOpen,
      addTimer, cancelTimer, dismissTimer, dismissAll,
      loadTimers,
    }}>
      {children}
    </TimerContext.Provider>
  );
};
