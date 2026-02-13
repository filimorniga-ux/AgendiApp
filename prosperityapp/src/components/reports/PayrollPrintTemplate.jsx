import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

const PayrollPrintTemplate = React.forwardRef(({ summary, selectedCollaboratorId, config, forPreview = false }, ref) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrencyFormat();

    // Get company info
    const settings = (config && config.find(c => c.id === 'settings')) || {};
    const companyInfo = {
        businessName: settings.businessName || settings.brandName || 'AgendiApp Professional',
        taxId: settings.taxId || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        city: settings.city || '',
        logoUrl: settings.logoUrl
    };

    // Filter data based on selection
    const dataToPrint = selectedCollaboratorId
        ? summary.payrollCards.filter(c => c.id === selectedCollaboratorId)
        : summary.payrollCards;

    return (
        <div ref={ref} className={`print-container w-full ${forPreview ? 'block' : 'hidden print:block'}`}>
            {(!dataToPrint || dataToPrint.length === 0) ? (
                <div className="p-10 text-center">No hay datos para imprimir</div>
            ) : (
                <>
                    <style type="text/css" media="print">
                        {`
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          .page-break { page-break-after: always; }
          .print-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 4px 8px; }
          .print-table th { background-color: #f3f4f6; font-weight: bold; text-align: left; }
          .print-header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .print-footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
          .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; text-align: center; font-size: 9pt; }
        `}
                    </style>

                    {dataToPrint.map((collab, index) => (
                        <div key={collab.id} className={`${index < dataToPrint.length - 1 ? 'page-break' : ''} p-4`}>
                            {/* Header */}
                            <div className="print-header flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    {companyInfo.logoUrl && (
                                        <img src={companyInfo.logoUrl} alt="Logo" className="h-16 w-auto object-contain grayscale" />
                                    )}
                                    <div>
                                        <h1 className="text-2xl font-bold uppercase">{companyInfo.businessName}</h1>
                                        {companyInfo.taxId && <p className="text-sm text-gray-600">RUT: {companyInfo.taxId}</p>}
                                        <p className="text-sm text-gray-600">{companyInfo.address} {companyInfo.city}</p>
                                        <p className="text-sm text-gray-600">{companyInfo.phone} {companyInfo.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-bold uppercase mb-1">{t('payroll.print.title')}</h2>
                                    <p className="font-bold text-lg">{collab.name}</p>
                                    <p className="text-sm">{t('payroll.print.period')} {summary.dateRangeString}</p>
                                    <p className="text-xs text-gray-500">{t('payroll.print.generated')} {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="mb-6">
                                <h3 className="font-bold text-lg mb-2 border-b border-gray-300">{t('payroll.print.generalSummary')}</h3>
                                <table className="print-table">
                                    <tbody>
                                        <tr>
                                            <td><strong>{t('payroll.print.totalServices')}</strong></td>
                                            <td className="text-right">{formatCurrency(collab.totalServices)}</td>
                                            <td><strong>{t('payroll.print.techCost')}</strong></td>
                                            <td className="text-right text-red-600">{formatCurrency(collab.totalTechCost)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>{t('payroll.print.tax')}</strong></td>
                                            <td className="text-right text-red-600">{formatCurrency(collab.taxAmount)}</td>
                                            <td><strong>{t('payroll.print.baseCommission')}</strong></td>
                                            <td className="text-right font-bold">{formatCurrency(collab.baseNet)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>{t('payroll.print.participation')}</strong></td>
                                            <td className="text-right text-green-600 font-bold">{formatCurrency(collab.participation)}</td>
                                            <td><strong>{t('payroll.print.salesCommission')}</strong></td>
                                            <td className="text-right text-green-600">{formatCurrency(collab.totalSalesCommissions)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>{t('payroll.print.tips')}</strong></td>
                                            <td className="text-right text-green-600">{formatCurrency(collab.totalPropinas)}</td>
                                            <td><strong>{t('payroll.print.advances')}</strong></td>
                                            <td className="text-right">{formatCurrency(collab.totalAdvances)}</td>
                                        </tr>
                                        <tr className="bg-gray-100">
                                            <td colSpan="3" className="text-right font-bold text-lg">{t('payroll.print.totalPay')}</td>
                                            <td className="text-right font-bold text-lg">{formatCurrency(collab.finalPayment)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Details Sections */}
                            <div className="space-y-4">
                                {/* Services */}
                                {collab.serviceItems && collab.serviceItems.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-sm mb-1 bg-gray-200 p-1">{t('payroll.print.serviceDetails')}</h4>
                                        <table className="print-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('payroll.print.date')}</th>
                                                    <th>{t('payroll.print.client')}</th>
                                                    <th>{t('payroll.print.service')}</th>
                                                    <th className="text-right">{t('payroll.print.amount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {collab.serviceItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.date?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                                                        <td>{item.client || '-'}</td>
                                                        <td>{item.description}</td>
                                                        <td className="text-right">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Sales Commissions */}
                                {collab.salesCommissionItems && collab.salesCommissionItems.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-sm mb-1 bg-gray-200 p-1">{t('payroll.print.salesDetails')}</h4>
                                        <table className="print-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('payroll.print.date')}</th>
                                                    <th>{t('payroll.print.product')}</th>
                                                    <th className="text-right">{t('payroll.print.commission')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {collab.salesCommissionItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.date?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                                                        <td>{item.description}</td>
                                                        <td className="text-right">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Advances */}
                                {collab.advanceItems && collab.advanceItems.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-sm mb-1 bg-gray-200 p-1">{t('payroll.print.advanceDetails')}</h4>
                                        <table className="print-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('payroll.print.date')}</th>
                                                    <th>{t('payroll.print.description')}</th>
                                                    <th className="text-right">{t('payroll.print.amount')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {collab.advanceItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.date?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                                                        <td>{item.description}</td>
                                                        <td className="text-right">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Signatures */}
                            <div className="print-footer mt-12 flex justify-between px-10">
                                <div className="signature-line">
                                    {t('payroll.print.employerSignature')}
                                </div>
                                <div className="signature-line">
                                    {t('payroll.print.collaboratorSignature')}
                                    <br />
                                    <span className="text-xs font-normal">{t('payroll.print.received')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
});

export default PayrollPrintTemplate;
