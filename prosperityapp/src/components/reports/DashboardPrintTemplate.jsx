import React from 'react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (value) => {
    if (typeof value !== 'number') value = 0;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const DashboardPrintTemplate = ({ type, data, config, filterInfo, forPreview = false, ref }) => {
    const { t } = useTranslation();

    // Get company info
    const settings = (config && config.find(c => c.id === 'settings')) || {};
    const companyInfo = {
        businessName: settings.businessName || settings.brandName || 'AgendiApp Professional',
        taxId: settings.taxId || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        logoUrl: settings.logoUrl
    };

    const renderDiarioContent = () => (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold border-b-2 border-black pb-2 mb-4">Resumen Diario</h2>
                <p className="text-sm text-gray-600 mb-4">{filterInfo}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Servicios</p>
                    <p className="text-xl font-bold">{formatCurrency(data.totalServicios)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Ventas</p>
                    <p className="text-xl font-bold">{formatCurrency(data.totalVentas)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Gastos</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(data.totalGastos)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Costo Técnico</p>
                    <p className="text-xl font-bold">{formatCurrency(data.totalCostoTecnico)}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Efectivo</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalEfectivo)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Tarjetas</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalTarjetas)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Transferencias</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalTransferencias)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Adelantos</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(data.totalAdelantos)}</p>
                </div>
            </div>

            {/* Ranking */}
            {data.ranking && data.ranking.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-2">Ranking de Servicios (Hoy)</h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">#</th>
                                <th className="border border-gray-300 p-2 text-left">Colaborador</th>
                                <th className="border border-gray-300 p-2 text-right">Servicios</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.ranking.map((collab, idx) => (
                                <tr key={idx}>
                                    <td className="border border-gray-300 p-2">{idx + 1}</td>
                                    <td className="border border-gray-300 p-2">{collab.name}</td>
                                    <td className="border border-gray-300 p-2 text-right">{collab.serviceCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );

    const renderNominasContent = () => (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold border-b-2 border-black pb-2 mb-4">Análisis de Nómina</h2>
                <p className="text-sm text-gray-600 mb-4">{filterInfo}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Producción Total</p>
                    <p className="text-xl font-bold">{formatCurrency(data.totalProduccion)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Gastos</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(data.totalGastos)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Efectivo</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalEfectivo)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Tarjetas</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalTarjetas)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Transferencias</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalTransferencias)}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Adelantos</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(data.totalAdelantos)}</p>
                </div>
            </div>
        </>
    );

    const renderCierresContent = () => (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold border-b-2 border-black pb-2 mb-4">Análisis de Cierres</h2>
                <p className="text-sm text-gray-600 mb-4">{filterInfo}</p>
            </div>

            {data.closings && data.closings.length > 0 ? (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Nombre</th>
                            <th className="border border-gray-300 p-2 text-left">Fecha</th>
                            <th className="border border-gray-300 p-2 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.closings.map((closing, idx) => (
                            <tr key={idx}>
                                <td className="border border-gray-300 p-2">{closing.name}</td>
                                <td className="border border-gray-300 p-2">{closing.date}</td>
                                <td className="border border-gray-300 p-2 text-right">{formatCurrency(closing.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
            )}
        </>
    );

    const renderClientesContent = () => (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold border-b-2 border-black pb-2 mb-4">Análisis de Clientes</h2>
                <p className="text-sm text-gray-600 mb-4">{filterInfo}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Total Clientes</p>
                    <p className="text-2xl font-bold">{data.totalClients || 0}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Nuevos (Este mes)</p>
                    <p className="text-2xl font-bold text-green-600">{data.newClientsThisMonth || 0}</p>
                </div>
                <div className="border border-gray-300 p-3">
                    <p className="text-sm text-gray-600">Activos (30 días)</p>
                    <p className="text-2xl font-bold text-blue-600">{data.activeClients || 0}</p>
                </div>
            </div>

            {data.topClients && data.topClients.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-bold mb-3 border-b border-gray-300 pb-2">Clientes Frecuentes</h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Cliente</th>
                                <th className="border border-gray-300 p-2 text-right">Visitas</th>
                                <th className="border border-gray-300 p-2 text-right">Total Gastado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topClients.map((client, idx) => (
                                <tr key={idx}>
                                    <td className="border border-gray-300 p-2">{client.name}</td>
                                    <td className="border border-gray-300 p-2 text-right">{client.visits}</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatCurrency(client.totalSpent)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );

    return (
        <div ref={ref} className={`print-container w-full ${forPreview ? 'block' : 'hidden print:block'}`}>
            <style type="text/css" media="print">
                {`
                    @page { size: A4; margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; }
                `}
            </style>

            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        {companyInfo.logoUrl && (
                            <img src={companyInfo.logoUrl} alt="Logo" className="h-12 mb-2" />
                        )}
                        <h1 className="text-2xl font-bold">{companyInfo.businessName}</h1>
                        {companyInfo.taxId && <p className="text-sm">RUT: {companyInfo.taxId}</p>}
                        {companyInfo.address && <p className="text-sm">{companyInfo.address}</p>}
                        {companyInfo.phone && <p className="text-sm">Tel: {companyInfo.phone}</p>}
                    </div>
                    <div className="text-right text-sm">
                        <p className="font-bold">REPORTE</p>
                        <p>{new Date().toLocaleDateString('es-CL')}</p>
                        <p>{new Date().toLocaleTimeString('es-CL')}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            {type === 'diario' && renderDiarioContent()}
            {type === 'nominas' && renderNominasContent()}
            {type === 'cierres' && renderCierresContent()}
            {type === 'clientes' && renderClientesContent()}
        </div>
    );
};

export default DashboardPrintTemplate;
