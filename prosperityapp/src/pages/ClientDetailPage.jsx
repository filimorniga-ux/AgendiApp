// ===== INICIO: src/pages/ClientDetailPage.jsx (Refactorizado) =====
import React, { useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext'; // <-- 1. USAR DATACONTEXT
import feather from 'feather-icons';
import { parseDate } from '../lib/dateUtils';

const formatCurrency = (value) => {
  if (typeof value !== 'number') value = 0;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const ClientDetailPage = () => {
  const { id: clientId } = useParams();
  
  // --- 2. Consumir datos desde el "cerebro" ---
  const { clients, movements, isLoading } = useData();
  const loadingClients = isLoading;
  const loadingMovements = isLoading;
  // --- Fin de cambios ---

  useEffect(() => {
    if (movements) {
      feather.replace();
    }
  }, [movements]);

  const { client, history } = useMemo(() => {
    if (!clients || !movements) return { client: null, history: [] };

    const currentClient = clients.find(c => c.id === clientId);
    if (!currentClient) return { client: null, history: [] };

    const clientHistory = movements
      .filter(m => m.client === currentClient.name)
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));

    return { client: currentClient, history: clientHistory };
  }, [clientId, clients, movements]);

  const isLoadingPage = loadingClients || loadingMovements;

  if (isLoadingPage) {
    return null; // El Layout.jsx ya muestra el cargador global
  }
  
  if (!client) {
    return <h1 className="text-2xl font-bold text-red-500 p-8">Error: Cliente no encontrado.</h1>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Back + header */}
      <div className="mb-4">
        <Link to="/app/clientes" className="flex items-center gap-2 text-accent mb-3 text-sm hover:underline">
          <i data-feather="arrow-left" className="w-4 h-4"></i>
          Volver a Clientes
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-text-main">{client.name} {client.lastName}</h2>
        <p className="text-text-muted text-sm mt-1">
          {client.phone && <span className="mr-3">📞 {client.phone}</span>}
          {client.email && <span>✉️ {client.email}</span>}
        </p>
      </div>

      {/* Movement list — cards en mobile, tabla en desktop */}
      <div className="flex-grow overflow-y-auto pb-24 sm:pb-4">
        {/* Desktop: tabla */}
        <div className="hidden sm:block bg-bg-secondary rounded-lg border border-border-main overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-main/50 text-xs uppercase text-text-muted">
              <tr>
                <th className="p-3 font-semibold">Fecha</th>
                <th className="p-3 font-semibold">Descripción</th>
                <th className="p-3 font-semibold">Tipo</th>
                <th className="p-3 font-semibold">Colaborador</th>
                <th className="p-3 font-semibold text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {history.map(m => (
                <tr key={m.id} className="border-b border-border-main text-sm hover:bg-bg-tertiary/50">
                  <td className="p-3">{parseDate(m.date).toLocaleDateString('es-CL')}</td>
                  <td className="p-3 text-text-main">{m.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      m.type === 'Servicio' ? 'bg-blue-500/20 text-blue-300' :
                      m.type === 'Venta' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>{m.type}</span>
                  </td>
                  <td className="p-3">{m.collaboratorName || 'N/A'}</td>
                  <td className={`p-3 text-right font-semibold ${m.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(m.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="sm:hidden space-y-2">
          {history.map(m => (
            <div key={m.id} className="bg-bg-secondary rounded-lg border border-border-main p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs text-text-muted">{parseDate(m.date).toLocaleDateString('es-CL')}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  m.type === 'Servicio' ? 'bg-blue-500/20 text-blue-300' :
                  m.type === 'Venta' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>{m.type}</span>
              </div>
              <p className="font-semibold text-text-main text-sm">{m.description}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-text-muted">{m.collaboratorName || 'N/A'}</span>
                <span className={`font-bold text-sm ${m.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(m.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {history.length === 0 && (
          <div className="text-center text-text-muted p-8 bg-bg-secondary rounded-lg">
            <i data-feather="clock" className="w-12 h-12 mx-auto mb-3 opacity-30"></i>
            <p>Este cliente aún no tiene historial de movimientos.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ClientDetailPage;
// ===== FIN: src/pages/ClientDetailPage.jsx (Refactorizado) =====