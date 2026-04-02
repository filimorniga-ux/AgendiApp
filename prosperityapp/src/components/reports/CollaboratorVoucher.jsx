import React from 'react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

/**
 * CollaboratorVoucher — 80mm comprobante interno para el colaborador.
 *
 * Props:
 *   collaboratorName  — string
 *   items             — [{ description, amount, type }]
 *   ticketNumber      — number  (Nº correlativo del día para este colaborador)
 *   date              — Date object
 *   clientName        — string
 *   businessName      — string
 *   logoUrl           — string | null
 *   ticketWidth       — '80mm' | '58mm'
 */
const CollaboratorVoucher = React.forwardRef(
  ({ collaboratorName, items = [], ticketNumber, date, clientName, businessName, logoUrl, ticketWidth = '80mm' }, ref) => {
    const width = ticketWidth === '58mm' ? '58mm' : '80mm';
    const dateObj = date instanceof Date ? date : new Date(date);
    const dateStr = dateObj.toLocaleDateString('es-CL');
    const timeStr = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    // Only show client-visible types on the collaborator's voucher
    const visibleItems = items.filter(
      i => ['Servicio', 'Venta'].includes(i.type)
    );
    const subtotal = visibleItems.reduce((s, i) => s + (i.amount || 0), 0);

    return (
      <div
        ref={ref}
        style={{
          width,
          margin: '0 auto',
          padding: '8px 6px',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#000',
          lineHeight: '1.5',
          backgroundColor: '#fff',
        }}
      >
        {/* ── Encabezado ─────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ height: '28px', margin: '0 auto 4px', maxWidth: '50%', filter: 'grayscale(1)' }}
            />
          )}
          <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {businessName || 'Mi Negocio'}
          </div>
          <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.7 }}>COMPROBANTE INTERNO</div>
        </div>

        <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />

        {/* ── Número de ticket del día + colaborador ─────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
            #{String(ticketNumber).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {collaboratorName}
          </div>
        </div>

        <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />

        {/* ── Fecha, hora, cliente ───────────────────────────────────── */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><b>Fecha:</b> {dateStr}</span>
            <span><b>Hora:</b> {timeStr}</span>
          </div>
          {clientName && (
            <div><b>Cliente:</b> {clientName}</div>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />

        {/* ── Servicios y productos ──────────────────────────────────── */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }}>
            DETALLE
          </div>
          {visibleItems.length === 0 ? (
            <div style={{ opacity: 0.6, fontStyle: 'italic' }}>Sin ítems registrados</div>
          ) : (
            visibleItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '3px',
                  paddingBottom: '2px',
                  borderBottom: idx < visibleItems.length - 1 ? '1px dotted #ccc' : 'none',
                }}
              >
                <span style={{ paddingRight: '8px', wordBreak: 'break-word', maxWidth: '70%' }}>
                  {item.type === 'Venta' && '🛍 '}
                  {item.type === 'Servicio' && '✂ '}
                  {item.description}
                </span>
                <span style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ borderBottom: '2px solid #000', marginBottom: '6px' }} />

        {/* ── Subtotal ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>
          <span>SUBTOTAL</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {/* ── Pie ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '6px', opacity: 0.7 }}>
          <div>Conservar para control interno</div>
          <div style={{ marginTop: '2px' }}>***</div>
        </div>
      </div>
    );
  }
);

CollaboratorVoucher.displayName = 'CollaboratorVoucher';

export default CollaboratorVoucher;
