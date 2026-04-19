import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_TICKET_CONFIG } from '../../pages/Settings/TicketEditorTab';
import { parseDate } from '../../lib/dateUtils';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateObj) => {
  if (!dateObj) return new Date().toLocaleString('es-CL');
  return parseDate(dateObj).toLocaleString('es-CL');
};

/**
 * TicketTemplate — 80mm thermal receipt for the client.
 *
 * Props:
 *   data          — { items[], total, paymentMethod, client, collaboratorName, date }
 *   config        — raw config array from DataContext
 *   ref           — forwarded ref for react-to-print
 */
const TicketTemplate = React.forwardRef(({ data, config }, ref) => {
  const { t } = useTranslation();

  const settings = (config && config.find(c => c.id === 'settings')) || {};
  const cfg = { ...DEFAULT_TICKET_CONFIG, ...(settings.ticketConfig || {}) };

  const biz = {
    name: cfg.businessNameOverride || settings.businessName || settings.brandName || 'Mi Negocio',
    taxId: settings.taxId || '',
    address: settings.address || '',
    city: settings.city || '',
    phone: settings.phone || '',
    email: settings.email || '',
  };

  // Items: support both single-item (legacy) and multi-item (new)
  const items = data?.items?.length
    ? data.items
    : [{ description: data?.description || data?.type, amount: data?.amount || 0, type: data?.type }];

  const total = data?.total ?? items.reduce((s, i) => s + (i.amount || 0), 0);

  // Filter items to show on ticket (hide internal types)
  const visibleItems = items.filter(
    i => !['ComisionVenta', 'ComisionPropina', 'Adelanto', 'Propina'].includes(i.type)
  );

  const width = cfg.ticketWidth === '58mm' ? '58mm' : '80mm';

  return (
    <div
      ref={ref}
      style={{ width, margin: '0 auto', padding: '8px 6px', fontFamily: 'monospace', fontSize: '11px', color: '#000', lineHeight: '1.4', backgroundColor: '#fff' }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        {cfg.showLogo && settings.logoUrl && (
          <img
            src={settings.logoUrl}
            alt="Logo"
            style={{ height: '36px', margin: '0 auto 4px', maxWidth: '65%', filter: 'grayscale(1)' }}
          />
        )}
        {cfg.showBusinessName && (
          <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {biz.name}
          </div>
        )}
        {cfg.showTaxId && biz.taxId && <div>RUT: {biz.taxId}</div>}
        {cfg.showAddress && biz.address && <div>{biz.address}</div>}
        {biz.city && <div>{biz.city}</div>}
        {cfg.showPhone && biz.phone && <div>Tel: {biz.phone}</div>}
        {cfg.showEmail && biz.email && <div>{biz.email}</div>}
        {cfg.headerExtra && (
          <div style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '10px' }}>{cfg.headerExtra}</div>
        )}
      </div>

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }} />

      {/* ── Transaction info ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '8px' }}>
        {cfg.showDateTime && (
          <div><b>{t('ticket.date')}:</b> {formatDate(data?.date)}</div>
        )}
        {cfg.showClient && data?.client && (
          <div><b>Cliente:</b> {data.client}</div>
        )}
        {cfg.showCollaborator && data?.collaboratorName && (
          <div><b>Atendido por:</b> {data.collaboratorName}</div>
        )}
        {cfg.showPaymentMethod && data?.paymentMethod && (
          <div><b>{t('ticket.paymentMethod')}:</b> {data.paymentMethod}</div>
        )}
      </div>

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }} />

      {/* ── Items ───────────────────────────────────────────────────── */}
      {cfg.showItemizedList && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
            <span>{t('ticket.items')}</span>
            <span>{t('ticket.total')}</span>
          </div>
          {visibleItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ paddingRight: '8px', wordBreak: 'break-word', maxWidth: '65%' }}>
                {item.description || item.type}
                {item.collaboratorName && (
                  <span style={{ opacity: 0.6, fontSize: '9px', display: 'block' }}>↳ {item.collaboratorName}</span>
                )}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }} />

      {/* ── Total ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>
        <span>TOTAL</span>
        <span>{formatCurrency(total)}</span>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      {(cfg.showThankYou || cfg.showFooterMessage) && (
        <div style={{ textAlign: 'center', marginTop: '8px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
          {cfg.showThankYou && (
            <div style={{ fontWeight: 'bold' }}>{cfg.thankYouText || t('ticket.thankYou')}</div>
          )}
          {cfg.showFooterMessage && cfg.footerMessage && (
            <div style={{ marginTop: '4px', fontSize: '10px', whiteSpace: 'pre-line' }}>{cfg.footerMessage}</div>
          )}
          <div style={{ marginTop: '6px' }}>***</div>
        </div>
      )}
    </div>
  );
});

TicketTemplate.displayName = 'TicketTemplate';

export default TicketTemplate;
