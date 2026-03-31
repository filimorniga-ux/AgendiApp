/**
 * RecepcionPage.jsx
 * Módulo de Recepción de Mercancía — 6 pasos guiados.
 * Importa factura → Revisa proveedor → Revisa pedido →
 * Recepción física → Discrepancias → Cierre y guardado.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceImporter     from '../components/reception/InvoiceImporter.jsx';
import SupplierReviewStep  from '../components/reception/SupplierReviewStep.jsx';
import OrderReviewStep     from '../components/reception/OrderReviewStep.jsx';
import PhysicalReceptionStep from '../components/reception/PhysicalReceptionStep.jsx';
import DiscrepancyStep     from '../components/reception/DiscrepancyStep.jsx';
import ClosureStep         from '../components/reception/ClosureStep.jsx';

const STEPS = [
  { id: 0, icon: '📂', label: 'Importar factura'      },
  { id: 1, icon: '🏢', label: 'Proveedor'              },
  { id: 2, icon: '📋', label: 'Revisar pedido'         },
  { id: 3, icon: '📦', label: 'Recepción física'       },
  { id: 4, icon: '⚠️',  label: 'Discrepancias'          },
  { id: 5, icon: '✅', label: 'Confirmar'               },
];

export default function RecepcionPage() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [session, setSession]   = useState({}); // Acumula datos de todos los pasos

  const next = (stepData = {}) => {
    setSession(prev => ({ ...prev, ...stepData }));
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleParsed = (invoiceData) => {
    setSession(prev => ({ ...prev, ...invoiceData }));
    setStep(1);
  };

  const handleFinished = (receptionId) => {
    navigate({
      pathname: '/recepcion/confirmado',
      search: `?id=${receptionId}`,
    });
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-main)', color: 'var(--text-main)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ← Volver
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
            📦 Recepción de Mercancía
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Importa una factura para registrar la entrada de mercancía al inventario
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                cursor: i < step ? 'pointer' : 'default',
                opacity: i > step ? 0.4 : 1,
              }}
              onClick={() => i < step && setStep(i)}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: i === step ? '1.2rem' : '1rem',
                background: i < step ? '#22c55e' : i === step ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: i <= step ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                boxShadow: i === step ? '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
                transition: 'all 0.3s',
              }}>
                {i < step ? '✓' : s.icon}
              </div>
              <span style={{ fontSize: '0.65rem', color: i === step ? 'var(--accent)' : 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: i === step ? 700 : 400 }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: '2px', minWidth: '20px', maxWidth: '40px', margin: '0 4px',
                background: i < step ? '#22c55e' : 'var(--border-main)',
                transition: 'background 0.3s',
                alignSelf: 'flex-start', marginTop: '20px',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-main)', minHeight: '300px' }}>
        {step === 0 && (
          <>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Importar factura
            </h2>
            <InvoiceImporter onParsed={handleParsed} countryCode="CL" />

            {/* Opción de ingreso manual */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => next({ raw_source: 'manual', supplier: {}, invoice: {}, items: [] })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                ✏️ Ingresar datos manualmente sin factura
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Datos del proveedor
            </h2>
            <SupplierReviewStep
              data={session}
              onNext={({ supplier, supplierId, mode }) => {
                next({ supplier, supplierId, supplierMode: mode });
              }}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Revisar ítems del pedido
            </h2>
            <OrderReviewStep
              items={session.items || []}
              onNext={(enrichedItems) => next({ items: enrichedItems })}
            />
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Verificación física del pedido
            </h2>
            <PhysicalReceptionStep
              items={session.items || []}
              onNext={({ items, extraItems }) => next({ items, extraItems })}
            />
          </>
        )}

        {step === 4 && (
          <>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Gestión de discrepancias
            </h2>
            <DiscrepancyStep
              items={session.items || []}
              extraItems={session.extraItems || []}
              onNext={({ extraDecisions, priceDecisions }) => next({ extraDecisions, priceDecisions })}
            />
          </>
        )}

        {step === 5 && (
          <>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Confirmar y guardar recepción
            </h2>
            <ClosureStep
              sessionData={session}
              onFinished={handleFinished}
            />
          </>
        )}
      </div>
    </div>
  );
}
