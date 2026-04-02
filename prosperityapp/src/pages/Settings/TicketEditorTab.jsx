import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { sbUpdate } from '../../supabase/db';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import feather from 'feather-icons';

// ── defaults ──────────────────────────────────────────────────────────────────
export const DEFAULT_TICKET_CONFIG = {
  // Encabezado
  showLogo: true,
  showBusinessName: true,
  businessNameOverride: '',
  headerExtra: '',
  showTaxId: true,
  showAddress: true,
  showPhone: true,
  showEmail: false,
  // Cuerpo
  showClient: true,
  showCollaborator: true,
  showPaymentMethod: true,
  showDateTime: true,
  showItemizedList: true,
  // Separador
  separatorStyle: '─',  // '─' | '═' | '·'
  // Pie
  thankYouText: '¡Gracias por su visita!',
  showThankYou: true,
  footerMessage: '',
  showFooterMessage: false,
  // Formato
  ticketWidth: '80mm',   // '58mm' | '80mm'
};

const Toggle = ({ label, value, onChange, description }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-border-main/30 last:border-0">
    <div>
      <p className="text-sm font-medium text-text-main">{label}</p>
      {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-4 ${
        value ? 'bg-accent' : 'bg-bg-tertiary border border-border-main'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          value ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const FieldGroup = ({ title, icon, children }) => (
  <div className="bg-bg-secondary rounded-lg border border-border-main overflow-hidden">
    <div className="px-4 py-3 bg-bg-tertiary flex items-center gap-2 border-b border-border-main">
      <i data-feather={icon} className="w-4 h-4 text-accent" />
      <h4 className="text-sm font-bold text-text-main uppercase tracking-wide">{title}</h4>
    </div>
    <div className="px-4 py-1">{children}</div>
  </div>
);

// ── Live Preview (80mm receipt render) ────────────────────────────────────────
const TicketPreview = ({ cfg, settings }) => {
  const sep = cfg.separatorStyle || '─';
  const sepLine = sep.repeat(32);
  const biz = {
    name: cfg.businessNameOverride || settings.businessName || settings.brandName || 'Mi Negocio',
    taxId: settings.taxId || '',
    address: settings.address || '',
    city: settings.city || '',
    phone: settings.phone || '',
    email: settings.email || '',
  };
  const width = cfg.ticketWidth === '58mm' ? '58mm' : '80mm';

  return (
    <div
      className="font-mono text-[11px] text-black bg-white leading-tight"
      style={{ width, minWidth: width, margin: '0 auto', padding: '8px 6px' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        {cfg.showLogo && settings.logoUrl && (
          <img src={settings.logoUrl} alt="Logo" style={{ height: '32px', margin: '0 auto 4px', maxWidth: '60%', filter: 'grayscale(1)' }} />
        )}
        {cfg.showBusinessName && <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>{biz.name}</div>}
        {cfg.showTaxId && biz.taxId && <div>RUT: {biz.taxId}</div>}
        {cfg.showAddress && biz.address && <div>{biz.address}</div>}
        {biz.city && <div>{biz.city}</div>}
        {cfg.showPhone && biz.phone && <div>Tel: {biz.phone}</div>}
        {cfg.showEmail && biz.email && <div>{biz.email}</div>}
        {cfg.headerExtra && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>{cfg.headerExtra}</div>}
      </div>

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />

      {/* Transaction info */}
      <div style={{ marginBottom: '6px' }}>
        {cfg.showDateTime && <div><b>Fecha:</b> {new Date().toLocaleString('es-CL')}</div>}
        {cfg.showClient && <div><b>Cliente:</b> María García</div>}
        {cfg.showCollaborator && <div><b>Atendido por:</b> Diana</div>}
        {cfg.showPaymentMethod && <div><b>Pago:</b> Efectivo</div>}
      </div>

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />

      {/* Items */}
      {cfg.showItemizedList && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '2px' }}>
            <span>DESCRIPCIÓN</span><span>VALOR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Balayage Premium</span><span>$45.000</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Shampoo 1x</span><span>$8.000</span>
          </div>
        </div>
      )}

      <div style={{ borderBottom: '1px dashed #000', marginBottom: '6px' }} />

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
        <span>TOTAL</span><span>$53.000</span>
      </div>

      {/* Footer */}
      {(cfg.showThankYou || cfg.showFooterMessage) && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          {cfg.showThankYou && <div style={{ fontWeight: 'bold' }}>{cfg.thankYouText || '¡Gracias por su visita!'}</div>}
          {cfg.showFooterMessage && cfg.footerMessage && (
            <div style={{ marginTop: '4px', fontSize: '10px' }}>{cfg.footerMessage}</div>
          )}
          <div style={{ marginTop: '6px' }}>***</div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TicketEditorTab = () => {
  const { config, businessId } = useData();
  const previewRef = useRef();

  const settings = useMemo(
    () => (config && config.find(c => c.id === 'settings')) || {},
    [config]
  );

  const [cfg, setCfg] = useState(() => ({
    ...DEFAULT_TICKET_CONFIG,
    ...(settings.ticketConfig || {}),
  }));
  const [isSaving, setIsSaving] = useState(false);

  const set = (key, val) => setCfg(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await sbUpdate('config', businessId, { ticketConfig: cfg });
      if (error) throw error;
      toast.success('Configuración de ticket guardada');
    } catch (e) {
      console.warn(e);
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPreview = useReactToPrint({
    contentRef: previewRef,
    documentTitle: 'Preview_Ticket',
  });

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* ── Controls Panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4 min-w-0">

        <FieldGroup title="Encabezado" icon="align-center">
          <Toggle label="Mostrar logo" value={cfg.showLogo} onChange={v => set('showLogo', v)} />
          <Toggle label="Mostrar nombre del negocio" value={cfg.showBusinessName} onChange={v => set('showBusinessName', v)} />
          {cfg.showBusinessName && (
            <div className="py-2">
              <label className="text-xs text-text-muted mb-1 block">Nombre personalizado (deja vacío para usar el de Empresa)</label>
              <input
                type="text"
                value={cfg.businessNameOverride}
                onChange={e => set('businessNameOverride', e.target.value)}
                placeholder={settings.businessName || settings.brandName || 'Nombre del negocio'}
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main focus:border-accent focus:outline-none"
              />
            </div>
          )}
          <Toggle label="Mostrar RUT / NIF" value={cfg.showTaxId} onChange={v => set('showTaxId', v)} />
          <Toggle label="Mostrar dirección" value={cfg.showAddress} onChange={v => set('showAddress', v)} />
          <Toggle label="Mostrar teléfono" value={cfg.showPhone} onChange={v => set('showPhone', v)} />
          <Toggle label="Mostrar email" value={cfg.showEmail} onChange={v => set('showEmail', v)} />
          <div className="py-2">
            <label className="text-xs text-text-muted mb-1 block">Texto adicional en cabecera (opcional)</label>
            <textarea
              value={cfg.headerExtra}
              onChange={e => set('headerExtra', e.target.value)}
              rows={2}
              placeholder="Ej: Horario L-V 9am-7pm"
              className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main focus:border-accent focus:outline-none resize-none"
            />
          </div>
        </FieldGroup>

        <FieldGroup title="Cuerpo de la transacción" icon="list">
          <Toggle label="Mostrar nombre del cliente" value={cfg.showClient} onChange={v => set('showClient', v)} />
          <Toggle
            label="Mostrar 'Atendido por'"
            description="Nombre del colaborador que prestó el servicio"
            value={cfg.showCollaborator}
            onChange={v => set('showCollaborator', v)}
          />
          <Toggle label="Mostrar método de pago" value={cfg.showPaymentMethod} onChange={v => set('showPaymentMethod', v)} />
          <Toggle label="Mostrar fecha y hora" value={cfg.showDateTime} onChange={v => set('showDateTime', v)} />
          <Toggle
            label="Mostrar lista de ítems"
            description="Desglose de servicios y productos"
            value={cfg.showItemizedList}
            onChange={v => set('showItemizedList', v)}
          />
        </FieldGroup>

        <FieldGroup title="Formato" icon="sliders">
          <div className="py-2 space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Ancho del ticket</label>
              <select
                value={cfg.ticketWidth}
                onChange={e => set('ticketWidth', e.target.value)}
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main focus:border-accent focus:outline-none"
              >
                <option value="80mm">80mm (estándar)</option>
                <option value="58mm">58mm (compacto)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Estilo de separador</label>
              <select
                value={cfg.separatorStyle}
                onChange={e => set('separatorStyle', e.target.value)}
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main font-mono focus:border-accent focus:outline-none"
              >
                <option value="─">──────── (línea simple)</option>
                <option value="═">════════ (línea doble)</option>
                <option value="·">········ (puntos)</option>
                <option value="*">******** (asteriscos)</option>
              </select>
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title="Pie de página" icon="message-square">
          <Toggle label="Mostrar mensaje de agradecimiento" value={cfg.showThankYou} onChange={v => set('showThankYou', v)} />
          {cfg.showThankYou && (
            <div className="py-2">
              <label className="text-xs text-text-muted mb-1 block">Texto de agradecimiento</label>
              <input
                type="text"
                value={cfg.thankYouText}
                onChange={e => set('thankYouText', e.target.value)}
                placeholder="¡Gracias por su visita!"
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main focus:border-accent focus:outline-none"
              />
            </div>
          )}
          <Toggle
            label="Mostrar mensaje personalizado"
            description="Promociones, redes sociales, etc."
            value={cfg.showFooterMessage}
            onChange={v => set('showFooterMessage', v)}
          />
          {cfg.showFooterMessage && (
            <div className="py-2">
              <label className="text-xs text-text-muted mb-1 block">Mensaje del pie</label>
              <textarea
                value={cfg.footerMessage}
                onChange={e => set('footerMessage', e.target.value)}
                rows={3}
                placeholder="Síguenos en Instagram @minegocio ✨&#10;Presentando este ticket: 10% off tu próxima visita"
                className="w-full bg-bg-tertiary border border-border-main rounded p-2 text-sm text-text-main focus:border-accent focus:outline-none resize-none"
              />
            </div>
          )}
        </FieldGroup>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handlePrintPreview} className="flex items-center gap-2 px-4 py-2 rounded-md border border-accent text-accent hover:bg-accent/10 transition-colors text-sm font-medium">
            <i data-feather="printer" className="w-4 h-4" />
            Imprimir preview
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-golden flex items-center gap-2">
            <i data-feather="save" className="w-4 h-4" />
            {isSaving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      </div>

      {/* ── Live Preview Panel ─────────────────────────────────────────────── */}
      <div className="xl:w-80 xl:flex-shrink-0">
        <div className="sticky top-0">
          <div className="bg-bg-secondary rounded-lg border border-border-main overflow-hidden">
            <div className="px-4 py-3 bg-bg-tertiary border-b border-border-main flex items-center gap-2">
              <i data-feather="eye" className="w-4 h-4 text-accent" />
              <h4 className="text-sm font-bold text-text-main uppercase tracking-wide">Preview en vivo</h4>
            </div>
            <div className="p-4 bg-gray-100 flex justify-center overflow-x-auto">
              <div ref={previewRef} className="shadow-lg">
                <TicketPreview cfg={cfg} settings={settings} />
              </div>
            </div>
            <div className="px-4 py-2 bg-bg-tertiary border-t border-border-main">
              <p className="text-xs text-text-muted text-center">
                Vista previa con datos de ejemplo • Ancho: {cfg.ticketWidth}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketEditorTab;
