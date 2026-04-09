// ===== INICIO: src/pages/ClientDetailPage.jsx (Refactorizado con CRM extendido) =====
import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import feather from 'feather-icons';
import { parseDate } from '../lib/dateUtils';
import { sbUpdate } from '../supabase/db';
import toast from 'react-hot-toast';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  
  const { clients, movements, isLoading, refreshData } = useData();
  const loadingClients = isLoading;
  const loadingMovements = isLoading;

  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (movements) {
      setTimeout(() => feather.replace(), 50);
    }
  }, [movements]);

  const { client, history } = useMemo(() => {
    if (!clients || !movements) return { client: null, history: [] };

    const currentClient = clients.find(c => c.id === clientId);
    if (!currentClient) return { client: null, history: [] };

    const clientHistory = movements
      .filter(m => m.client === currentClient.name || m.clientId === currentClient.id)
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));

    return { client: currentClient, history: clientHistory };
  }, [clientId, clients, movements]);

  // Sincronizar notas cuando se carga el cliente
  useEffect(() => {
    if (client && client.notes !== undefined) {
      setNotes(client.notes || '');
    }
  }, [client]);

  const isLoadingPage = loadingClients || loadingMovements;

  if (isLoadingPage) {
    return null; // Layout.jsx muestra loader
  }
  
  if (!client) {
    return <h1 className="text-2xl font-bold text-red-500 p-8">Error: Cliente no encontrado.</h1>;
  }

  // Métricas de CRM (LTV, Visitas)
  const lifetimeValue = history.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const totalVisits = history.length;

  const handleSaveNotes = async () => {
    if (notes === (client.notes || '')) return; // No hay cambios
    setIsSavingNotes(true);
    try {
      const { error } = await sbUpdate('clients', client.id, { notes });
      if (error) throw error;
      toast.success('Notas actualizadas');
      if (refreshData) refreshData('clients');
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Error al guardar las notas');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 sm:p-0">
      {/* Header */}
      <div>
        <Link to="/app/clientes" className="flex items-center gap-2 text-accent mb-3 text-sm hover:underline">
          <i data-feather="arrow-left" className="w-4 h-4"></i>
          Volver a Clientes
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-main">{client.name} {client.lastName}</h2>
        <p className="text-text-muted text-sm mt-1 flex flex-wrap gap-4">
          {client.phone && <span><i data-feather="phone" className="w-3 h-3 inline mr-1"></i> {client.phone}</span>}
          {client.email && <span><i data-feather="mail" className="w-3 h-3 inline mr-1"></i> {client.email}</span>}
          {client.birthday && <span><i data-feather="gift" className="w-3 h-3 inline mr-1"></i> {new Date(client.birthday).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</span>}
        </p>
      </div>

      {/* CRM KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-main flex flex-col items-center justify-center text-center">
          <i data-feather="dollar-sign" className="text-accent mb-2 w-6 h-6"></i>
          <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Valor de Vida (LTV)</p>
          <p className="text-xl font-bold text-text-main mt-1">{formatCurrency(lifetimeValue)}</p>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-main flex flex-col items-center justify-center text-center">
          <i data-feather="calendar" className="text-blue-400 mb-2 w-6 h-6"></i>
          <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Total Visitas</p>
          <p className="text-xl font-bold text-text-main mt-1">{totalVisits}</p>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-main flex flex-col items-center justify-center text-center">
          <i data-feather="clock" className="text-green-400 mb-2 w-6 h-6"></i>
          <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Última Visita</p>
          <p className="text-base font-bold text-text-main mt-1">
            {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : 'N/A'}
          </p>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border-main flex flex-col items-center justify-center text-center">
          <i data-feather="star" className="text-purple-400 mb-2 w-6 h-6"></i>
          <p className="text-text-muted text-xs uppercase tracking-wider font-semibold">Ticket Promedio</p>
          <p className="text-base font-bold text-text-main mt-1">
            {totalVisits > 0 ? formatCurrency(lifetimeValue / totalVisits) : '$0'}
          </p>
        </div>
      </div>

      {/* Advanced Notes */}
      <div className="bg-bg-secondary p-5 rounded-xl border border-border-main shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-text-main flex items-center gap-2">
            <i data-feather="file-text" className="w-5 h-5 text-accent"></i> Notas Avanzadas & Preferencias
          </h3>
          {isSavingNotes && <span className="text-xs text-accent animate-pulse font-semibold">Guardando...</span>}
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Ej: Prefiere café sin azúcar, es alérgica a productos con sulfatos..."
          className="w-full bg-bg-tertiary border border-border-main rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-accent min-h-[100px] resize-y"
        />
        <p className="text-xs text-text-muted mt-2 text-right">Las notas se guardan automáticamente al dejar de escribir.</p>
      </div>

      {/* Movement List */}
      <h3 className="font-bold text-text-main text-lg mt-2 flex items-center gap-2">
        <i data-feather="activity" className="w-5 h-5"></i> Historial de Movimientos
      </h3>
      
      <div className="flex-grow overflow-y-auto pb-24 sm:pb-4 space-y-4 sm:space-y-0 text-sm">
        {/* Desktop: tabla */}
        <div className="hidden sm:block bg-bg-secondary rounded-xl border border-border-main overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
              <tr>
                <th className="p-4 font-semibold border-b border-border-main">Fecha</th>
                <th className="p-4 font-semibold border-b border-border-main">Descripción</th>
                <th className="p-4 font-semibold border-b border-border-main">Tipo</th>
                <th className="p-4 font-semibold border-b border-border-main">Colaborador</th>
                <th className="p-4 font-semibold text-right border-b border-border-main">Monto</th>
              </tr>
            </thead>
            <tbody>
              {history.map(m => (
                <tr key={m.id} className="border-b border-border-main/50 hover:bg-bg-tertiary/50 transition-colors">
                  <td className="p-4">{parseDate(m.date).toLocaleDateString('es-CL')}</td>
                  <td className="p-4 text-text-main font-medium">{m.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      m.type === 'Servicio' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      m.type === 'Venta' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>{m.type}</span>
                  </td>
                  <td className="p-4">{m.collaboratorName || 'N/A'}</td>
                  <td className={`p-4 text-right font-bold ${m.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(m.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="sm:hidden space-y-3">
          {history.map(m => (
            <div key={m.id} className="bg-bg-secondary rounded-xl border border-border-main p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-text-muted">{parseDate(m.date).toLocaleDateString('es-CL')}</span>
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                  m.type === 'Servicio' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  m.type === 'Venta' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}>{m.type}</span>
              </div>
              <p className="font-bold text-text-main text-base mb-1">{m.description}</p>
              <div className="flex justify-between items-end mt-2">
                <div className="text-xs text-text-muted flex items-center gap-1">
                  <i data-feather="user" className="w-3 h-3"></i> {m.collaboratorName || 'N/A'}
                </div>
                <span className={`font-black text-lg ${m.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(m.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {history.length === 0 && (
          <div className="text-center text-text-muted py-12 px-4 bg-bg-secondary rounded-xl border border-border-main shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-bg-main/50 flex items-center justify-center mb-4">
              <i data-feather="clock" className="w-8 h-8 opacity-30 text-text-main"></i>
            </div>
            <p className="font-medium text-lg text-text-main mb-1">Sin movimientos</p>
            <p className="text-sm opacity-80">Este cliente aún no tiene historial de servicios o ventas registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ClientDetailPage;
// ===== FIN: src/pages/ClientDetailPage.jsx (Refactorizado) =====