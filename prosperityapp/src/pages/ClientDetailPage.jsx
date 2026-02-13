// ===== INICIO: src/pages/ClientDetailPage.jsx (Refactorizado) =====
import React, { useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext'; // <-- 1. USAR DATACONTEXT
import feather from 'feather-icons';

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
      .sort((a, b) => b.date.toDate() - a.date.toDate());

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
      <div className="mb-6">
        <Link to="/clientes" className="flex items-center gap-2 text-accent mb-4">
          <i data-feather="arrow-left" className="w-4 h-4"></i>
          Volver a Clientes
        </Link>
        <h2 className="text-3xl font-bold text-white">{client.name} {client.lastName}</h2>
        <p className="text-text-main/70">{client.phone} | {client.email || 'Sin email'}</p>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="bg-secondary rounded-lg border border-border-main overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-main/50 text-xs uppercase text-text-main/70">
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
                <tr key={m.id} className="border-b border-border-main text-sm hover:bg-tertiary/50">
                  <td className="p-3">
                    {m.date.toDate().toLocaleDateString('es-CL')}
                  </td>
                  <td className="p-3 text-white">{m.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      m.type === 'Servicio' ? 'bg-blue-500/20 text-blue-300' :
                      m.type === 'Venta' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {m.type}
                    </span>
                  </td>
                  <td className="p-3">{m.collaboratorName || 'N/A'}</td>
                  <td className={`p-3 text-right font-semibold ${m.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(m.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && (
            <p className="text-center text-text-main/70 p-8">Este cliente aún no tiene historial de movimientos.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default ClientDetailPage;
// ===== FIN: src/pages/ClientDetailPage.jsx (Refactorizado) =====