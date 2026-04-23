import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { parseDate } from '../../lib/dateUtils';

const PublicHistory = () => {
  const { business, clientUser } = useOutletContext();
  const [appointments, setAppointments] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientUser?.id) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Fetch appointments
        const { data: aptData } = await supabase
          .from('appointments')
          .select('id, service_name, collaborator_name, starts_at, ends_at, status, notes')
          .eq('client_id', clientUser.id)
          .eq('business_id', business.id)
          .order('starts_at', { ascending: false })
          .limit(50);

        setAppointments(aptData || []);

        // Fetch purchase history (movements linked to this client)
        const { data: mvData } = await supabase
          .from('movements')
          .select('id, date, type, description, amount, collaborator_name')
          .or(`client_id.eq.${clientUser.id},client.eq.${clientUser.name}`)
          .eq('business_id', business.id)
          .order('date', { ascending: false })
          .limit(50);

        setMovements(mvData || []);
      } catch (err) {
        console.error('Error fetching client history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [clientUser, business.id]);

  // Not logged in
  if (!clientUser) {
    return (
      <div className="animate-fade-in relative z-10 text-center py-16">
        <div className="bg-bg-secondary rounded-2xl border border-border-main p-8 max-w-md mx-auto shadow-xl">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">Inicia sesión para ver tu historial</h2>
          <p className="text-text-muted text-sm mb-6">
            Crea una cuenta gratuita o inicia sesión para acceder a tu historial de visitas, servicios y citas.
          </p>
          <Link
            to={`/p/${business.slug}/login`}
            className="btn-golden py-2.5 px-6 inline-block font-semibold"
          >
            Iniciar Sesión / Crear Cuenta
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-text-muted animate-pulse">
        Cargando tu historial...
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return parseDate(dateStr).toLocaleDateString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return parseDate(dateStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  const statusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-red-500/20 text-red-400',
      completed: 'bg-blue-500/20 text-blue-400',
    };
    const labels = {
      confirmed: 'Confirmada',
      pending: 'Pendiente',
      cancelled: 'Cancelada',
      completed: 'Completada',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-bg-tertiary text-text-muted'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const hasHistory = appointments.length > 0 || movements.length > 0;

  return (
    <div className="animate-fade-in relative z-10 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Mi Historial</h2>
        <p className="text-text-muted">Hola <span className="text-accent font-semibold">{clientUser.name}</span>, aquí están tus visitas en {business.name}.</p>
      </div>

      {!hasHistory ? (
        <div className="text-center py-12 bg-bg-secondary rounded-2xl border border-border-main">
          <p className="text-text-muted mb-4">Aún no tienes historial registrado.</p>
          <Link to={`/p/${business.slug}/reservar`} className="btn-golden py-2 px-6 inline-block">
            Agendar tu primera cita
          </Link>
        </div>
      ) : (
        <>
          {/* Citas */}
          {appointments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Mis Citas ({appointments.length})
              </h3>
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id} className="bg-bg-secondary rounded-xl border border-border-main p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-main">{apt.service_name}</h4>
                      <p className="text-sm text-text-muted">
                        {apt.collaborator_name && <span className="capitalize">con {apt.collaborator_name} · </span>}
                        {formatDate(apt.starts_at)} a las {formatTime(apt.starts_at)}
                      </p>
                    </div>
                    <div>{statusBadge(apt.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial de compras */}
          {movements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Mis Servicios ({movements.length})
              </h3>
              <div className="space-y-3">
                {movements.map(mv => (
                  <div key={mv.id} className="bg-bg-secondary rounded-xl border border-border-main p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-main">{mv.description || mv.type}</h4>
                      <p className="text-sm text-text-muted">
                        {mv.collaborator_name && <span className="capitalize">con {mv.collaborator_name} · </span>}
                        {formatDate(mv.date)}
                      </p>
                    </div>
                    <div className="text-accent font-bold">
                      ${(mv.amount || 0).toLocaleString('es-CL')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <div className="text-center pt-4">
        <Link to={`/p/${business.slug}/reservar`} className="btn-golden py-2.5 px-8 inline-block font-semibold">
          Agendar nueva cita
        </Link>
      </div>
    </div>
  );
};

export default PublicHistory;
