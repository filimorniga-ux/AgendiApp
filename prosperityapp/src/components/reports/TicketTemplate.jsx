import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

const TicketTemplate = forwardRef(({ data, config }, ref) => {
    const { t } = useTranslation();

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    // Helper to format date
    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        // Handle Firestore Timestamp or JS Date
        const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
        return date.toLocaleString('es-CL');
    };

    // Find settings in config array
    const settings = (config && config.find(c => c.id === 'settings')) || {};
    const companyInfo = {
        businessName: settings.businessName || settings.brandName || 'Gema',
        taxId: settings.taxId || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        city: settings.city || ''
    };

    return (
        <div ref={ref} className="p-2 text-black font-mono text-xs" style={{ width: '80mm', margin: '0 auto' }}>
            {/* Header / Company Info */}
            <div className="text-center mb-4">
                {settings.logoUrl && (
                    <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="h-12 mx-auto mb-2 grayscale"
                        style={{ maxWidth: '60%' }}
                    />
                )}
                <h2 className="font-bold text-sm uppercase">{companyInfo.businessName}</h2>
                {companyInfo.taxId && <p>RUT: {companyInfo.taxId}</p>}
                {companyInfo.address && <p>{companyInfo.address}</p>}
                {companyInfo.city && <p>{companyInfo.city}</p>}
                {companyInfo.phone && <p>Tel: {companyInfo.phone}</p>}
            </div>

            <div className="border-b border-black mb-2 border-dashed"></div>

            {/* Transaction Details */}
            <div className="mb-4">
                <p><span className="font-bold">{t('ticket.date')}:</span> {formatDate(data.date)}</p>
                <p><span className="font-bold">{t('ticket.paymentMethod')}:</span> {data.paymentMethod}</p>
                {data.client && <p><span className="font-bold">Cliente:</span> {data.client}</p>}
                {data.collaboratorName && <p><span className="font-bold">Atendido por:</span> {data.collaboratorName}</p>}
            </div>

            <div className="border-b border-black mb-2 border-dashed"></div>

            {/* Items */}
            <div className="mb-4">
                <div className="flex justify-between font-bold mb-1">
                    <span>{t('ticket.items')}</span>
                    <span>{t('ticket.total')}</span>
                </div>

                <div className="flex justify-between items-start mb-1">
                    <span className="pr-2">{data.description || data.type}</span>
                    <span className="whitespace-nowrap">{formatCurrency(data.amount)}</span>
                </div>
            </div>

            <div className="border-b border-black mb-2 border-dashed"></div>

            {/* Totals */}
            <div className="flex justify-between font-bold text-sm mb-6">
                <span>TOTAL</span>
                <span>{formatCurrency(data.amount)}</span>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px]">
                <p>{t('ticket.thankYou')}</p>
                <p className="mt-1">***</p>
            </div>
        </div>
    );
});

TicketTemplate.displayName = 'TicketTemplate';

export default TicketTemplate;
