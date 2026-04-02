import React, { useState, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import TicketTemplate from '../reports/TicketTemplate';
import CollaboratorVoucher from '../reports/CollaboratorVoucher';
import feather from 'feather-icons';

const Icon = ({ name, className = 'w-4 h-4' }) => {
  const icon = feather.icons[name];
  if (!icon) return null;
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: icon.toSvg({ class: className }) }}
    />
  );
};

/**
 * PaymentSuccessModal
 *
 * Shown after a payment is saved. Has tabs:
 *   [Ticket Cliente] [Diana #03] [Carlos #07] ...
 *
 * Props:
 *   isOpen         — bool
 *   onClose        — fn()  — called after user dismisses
 *   ticketData     — { items, total, paymentMethod, client, date }
 *   voucherData    — [{ collaboratorId, collaboratorName, items, ticketNumber }]
 *   config         — raw config array from DataContext
 *   businessInfo   — { businessName, logoUrl, ticketWidth }
 */
const PaymentSuccessModal = ({ isOpen, onClose, ticketData, voucherData = [], config, businessInfo = {} }) => {
  const [activeTab, setActiveTab] = useState('client');

  // ── Refs for printing ─────────────────────────────────────────────────────
  const clientRef = useRef();
  const voucherRefs = useRef({}); // { collaboratorId: ref }

  const getVoucherRef = useCallback((collabId) => {
    if (!voucherRefs.current[collabId]) {
      voucherRefs.current[collabId] = React.createRef();
    }
    return voucherRefs.current[collabId];
  }, []);

  // ── Print handlers ────────────────────────────────────────────────────────
  const printClientTicket = useReactToPrint({
    contentRef: clientRef,
    documentTitle: `Ticket_Cliente_${new Date().toISOString().slice(0, 10)}`,
  });

  const printVoucher = useReactToPrint({
    contentRef: voucherRefs.current[activeTab] || { current: null },
    documentTitle: `Comprobante_${activeTab}_${new Date().toISOString().slice(0, 10)}`,
  });

  const handlePrintAll = () => {
    // Print client ticket first, then each voucher sequentially
    printClientTicket();
    voucherData.forEach(v => {
      const ref = voucherRefs.current[v.collaboratorId];
      if (ref?.current) {
        useReactToPrint({ contentRef: ref, documentTitle: `Comprobante_${v.collaboratorName}` })();
      }
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'client', label: 'Ticket Cliente', icon: 'file-text' },
    ...voucherData.map(v => ({
      id: v.collaboratorId,
      label: `${v.collaboratorName} #${String(v.ticketNumber).padStart(2, '0')}`,
      icon: 'user',
    })),
  ];

  const activeVoucher = voucherData.find(v => v.collaboratorId === activeTab);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-bg-secondary rounded-xl shadow-2xl border border-border-main w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="p-4 border-b border-border-main bg-bg-tertiary rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Icon name="check-circle" className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">Pago registrado</h3>
              <p className="text-xs text-text-muted">Selecciona qué imprimir antes de cerrar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-main rounded-full text-text-muted hover:text-text-main transition-colors">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex overflow-x-auto gap-1 px-4 pt-3 pb-0 border-b border-border-main bg-bg-secondary">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-t-md whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent text-accent bg-bg-tertiary'
                  : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-tertiary'
              }`}
            >
              <Icon name={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Preview area ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-200 flex justify-center items-start">
          {/* Client ticket */}
          {activeTab === 'client' && ticketData && (
            <div className="bg-white shadow-lg" style={{ display: 'inline-block' }}>
              <TicketTemplate
                ref={clientRef}
                data={{
                  ...ticketData,
                  date: new Date(),
                }}
                config={config}
              />
            </div>
          )}

          {/* Collaborator voucher */}
          {activeVoucher && (
            <div className="bg-white shadow-lg" style={{ display: 'inline-block' }}>
              <CollaboratorVoucher
                ref={getVoucherRef(activeVoucher.collaboratorId)}
                collaboratorName={activeVoucher.collaboratorName}
                items={activeVoucher.items}
                ticketNumber={activeVoucher.ticketNumber}
                date={new Date()}
                clientName={ticketData?.client}
                businessName={businessInfo.businessName}
                logoUrl={businessInfo.logoUrl}
                ticketWidth={businessInfo.ticketWidth}
              />
            </div>
          )}
        </div>

        {/* ── Hidden voucher refs for printing non-active tabs ──── */}
        <div style={{ display: 'none' }}>
          <TicketTemplate
            ref={clientRef}
            data={{ ...ticketData, date: new Date() }}
            config={config}
          />
          {voucherData.map(v => (
            <CollaboratorVoucher
              key={v.collaboratorId}
              ref={getVoucherRef(v.collaboratorId)}
              collaboratorName={v.collaboratorName}
              items={v.items}
              ticketNumber={v.ticketNumber}
              date={new Date()}
              clientName={ticketData?.client}
              businessName={businessInfo.businessName}
              logoUrl={businessInfo.logoUrl}
              ticketWidth={businessInfo.ticketWidth}
            />
          ))}
        </div>

        {/* ── Footer Actions ───────────────────────────────────────── */}
        <div className="p-4 border-t border-border-main bg-bg-tertiary rounded-b-xl">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors font-medium"
            >
              Cerrar sin imprimir
            </button>

            <div className="flex gap-2 flex-wrap">
              {/* Print active tab */}
              {activeTab === 'client' ? (
                <button
                  onClick={printClientTicket}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-main border border-border-main text-text-main hover:border-accent hover:text-accent transition-colors text-sm font-medium"
                >
                  <Icon name="printer" className="w-4 h-4" />
                  Imprimir Ticket Cliente
                </button>
              ) : activeVoucher ? (
                <button
                  onClick={printVoucher}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-main border border-border-main text-text-main hover:border-accent hover:text-accent transition-colors text-sm font-medium"
                >
                  <Icon name="printer" className="w-4 h-4" />
                  Imprimir comprobante de {activeVoucher.collaboratorName}
                </button>
              ) : null}

              {/* Print client ticket (always visible) */}
              {activeTab !== 'client' && (
                <button
                  onClick={printClientTicket}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-main border border-border-main text-text-main hover:border-accent hover:text-accent transition-colors text-sm font-medium"
                >
                  <Icon name="file-text" className="w-4 h-4" />
                  Ticket Cliente
                </button>
              )}

              {/* Print all button */}
              {voucherData.length > 0 && (
                <button
                  onClick={handlePrintAll}
                  className="btn-golden flex items-center gap-2 px-5 py-2 text-sm"
                >
                  <Icon name="layers" className="w-4 h-4" />
                  Imprimir todo ({tabs.length})
                </button>
              )}

              {/* If no collaborators, just print client */}
              {voucherData.length === 0 && (
                <button
                  onClick={() => { printClientTicket(); }}
                  className="btn-golden flex items-center gap-2 px-5 py-2 text-sm"
                >
                  <Icon name="printer" className="w-4 h-4" />
                  Imprimir ticket
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccessModal;
