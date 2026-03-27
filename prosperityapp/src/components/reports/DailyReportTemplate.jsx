// ===== INICIO: src/components/reports/DailyReportTemplate.jsx =====
import React from 'react';

const formatCurrency = (value) => {
    if (typeof value !== 'number') value = 0;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
};

const formatDate = (date) => {
    return new Date(date).toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const DailyReportTemplate = ({ data, user, config, ref }) => {
    const settings = config?.find(c => c.id === 'settings') || {};
    const brandName = settings.brandName || 'AgendiApp';
    const logoUrl = settings.logoUrl;

    // Asegurar que data exista
    const summary = data || {
        totalServicios: 0,
        totalVentas: 0,
        totalPropinas: 0,
        totalVentasGC: 0,
        totalTarjetas: 0,
        totalTransferencias: 0,
        totalPagosGC: 0,
        totalGastos: 0,
        totalAdelantos: 0
    };

    const totalEfectivo =
        summary.totalServicios +
        summary.totalVentas +
        summary.totalPropinas +
        summary.totalVentasGC -
        summary.totalTarjetas -
        summary.totalTransferencias -
        summary.totalPagosGC -
        summary.totalGastos -
        summary.totalAdelantos;

    const totalIngresos =
        summary.totalServicios +
        summary.totalVentas +
        summary.totalPropinas +
        summary.totalVentasGC;

    const totalEgresos =
        summary.totalGastos +
        summary.totalAdelantos;

    return (
        <div ref={ref}>
            <div style={{
                width: '80mm',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '10px',
                margin: '0 auto',
                backgroundColor: 'white',
                color: 'black'
            }}>
                {/* CABECERA */}
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            style={{
                                maxWidth: '60px',
                                maxHeight: '60px',
                                margin: '0 auto 5px',
                                display: 'block'
                            }}
                        />
                    )}
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '3px' }}>
                        {brandName}
                    </div>
                    <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                        CIERRE DE CAJA DIARIA
                    </div>
                    <div style={{ fontSize: '10px' }}>
                        {formatDate(new Date())}
                    </div>
                    {user && (
                        <div style={{ fontSize: '10px', marginTop: '3px' }}>
                            Impreso por: {user}
                        </div>
                    )}
                </div>

                {/* RESUMEN PRINCIPAL */}
                <div style={{ marginBottom: '10px', fontSize: '11px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', textAlign: 'center', fontSize: '12px' }}>
                        === RESUMEN ===
                    </div>

                    <table style={{ width: '100%', marginBottom: '5px', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ paddingTop: '3px' }}>Total Servicios:</td>
                                <td style={{ textAlign: 'right', paddingTop: '3px', fontWeight: 'bold' }}>{formatCurrency(summary.totalServicios)}</td>
                            </tr>
                            <tr>
                                <td style={{ paddingTop: '3px' }}>Total Ventas:</td>
                                <td style={{ textAlign: 'right', paddingTop: '3px', fontWeight: 'bold' }}>{formatCurrency(summary.totalVentas)}</td>
                            </tr>
                            <tr>
                                <td style={{ paddingTop: '3px' }}>Total Propinas:</td>
                                <td style={{ textAlign: 'right', paddingTop: '3px', fontWeight: 'bold' }}>{formatCurrency(summary.totalPropinas)}</td>
                            </tr>
                            <tr>
                                <td style={{ paddingTop: '3px' }}>Total Gift Cards:</td>
                                <td style={{ textAlign: 'right', paddingTop: '3px', fontWeight: 'bold' }}>{formatCurrency(summary.totalVentasGC)}</td>
                            </tr>
                            <tr style={{ borderTop: '1px solid #000' }}>
                                <td style={{ paddingTop: '5px', fontWeight: 'bold' }}>TOTAL INGRESOS:</td>
                                <td style={{ textAlign: 'right', paddingTop: '5px', fontWeight: 'bold', fontSize: '13px' }}>{formatCurrency(totalIngresos)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ paddingTop: '3px' }}>Pagos Tarjeta:</td>
                                    <td style={{ textAlign: 'right', paddingTop: '3px' }}>{formatCurrency(summary.totalTarjetas)}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingTop: '3px' }}>Transferencias:</td>
                                    <td style={{ textAlign: 'right', paddingTop: '3px' }}>{formatCurrency(summary.totalTransferencias)}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingTop: '3px' }}>Pagos Gift Card:</td>
                                    <td style={{ textAlign: 'right', paddingTop: '3px' }}>{formatCurrency(summary.totalPagosGC)}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingTop: '3px' }}>Gastos:</td>
                                    <td style={{ textAlign: 'right', paddingTop: '3px', color: 'red' }}>{formatCurrency(summary.totalGastos)}</td>
                                </tr>
                                <tr>
                                    <td style={{ paddingTop: '3px' }}>Adelantos:</td>
                                    <td style={{ textAlign: 'right', paddingTop: '3px', color: 'red' }}>{formatCurrency(summary.totalAdelantos)}</td>
                                </tr>
                                <tr style={{ borderTop: '1px solid #000' }}>
                                    <td style={{ paddingTop: '5px', fontWeight: 'bold' }}>TOTAL EGRESOS:</td>
                                    <td style={{ textAlign: 'right', paddingTop: '5px', fontWeight: 'bold' }}>{formatCurrency(totalEgresos)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{
                        borderTop: '2px solid #000',
                        marginTop: '10px',
                        paddingTop: '10px',
                        backgroundColor: '#f0f0f0',
                        padding: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '11px', marginBottom: '3px' }}>EFECTIVO EN CAJA</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            {formatCurrency(totalEfectivo)}
                        </div>
                    </div>
                </div>

                {/* PIE */}
                <div style={{
                    borderTop: '2px dashed #000',
                    marginTop: '15px',
                    paddingTop: '15px',
                    fontSize: '10px',
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        _______________________
                    </div>
                    <div>Firma del Responsable</div>
                    <div style={{ marginTop: '10px', fontSize: '9px' }}>
                        Documento generado automáticamente por {brandName}
                    </div>
                </div>
            </div>
        </div>
    );
};

DailyReportTemplate.displayName = 'DailyReportTemplate';

export default DailyReportTemplate;
// ===== FIN: src/components/reports/DailyReportTemplate.jsx =====
