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
    <div className="recepcion-page">
      {/* Encabezado */}
      <div className="recepcion-header">
        <button className="recepcion-back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <div>
          <h1 className="recepcion-title">📦 Recepción de Mercancía</h1>
          <p className="recepcion-subtitle">
            Importa una factura para registrar la entrada de mercancía al inventario
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="recepcion-stepper">
        {STEPS.map((s, i) => (
          <div key={s.id} className="recepcion-stepper-item">
            <div
              className={`recepcion-step-circle ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''} ${i > step ? 'pending' : ''}`}
              onClick={() => i < step && setStep(i)}
              style={{ cursor: i < step ? 'pointer' : 'default' }}
            >
              {i < step ? '✓' : s.icon}
            </div>
            <span className={`recepcion-step-label ${i === step ? 'active' : ''}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`recepcion-step-line ${i < step ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="recepcion-content-card">
        {step === 0 && (
          <>
            <h2 className="recepcion-step-title">Importar factura</h2>
            <InvoiceImporter onParsed={handleParsed} countryCode="CL" />
            <div className="recepcion-manual-link">
              <button
                onClick={() => next({ raw_source: 'manual', supplier: {}, invoice: {}, items: [] })}
                className="recepcion-manual-btn"
              >
                ✏️ Ingresar datos manualmente sin factura
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="recepcion-step-title">Datos del proveedor</h2>
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
            <h2 className="recepcion-step-title">Revisar ítems del pedido</h2>
            <OrderReviewStep
              items={session.items || []}
              onNext={(enrichedItems) => next({ items: enrichedItems })}
            />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="recepcion-step-title">Verificación física del pedido</h2>
            <PhysicalReceptionStep
              items={session.items || []}
              onNext={({ items, extraItems }) => next({ items, extraItems })}
            />
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="recepcion-step-title">Gestión de discrepancias</h2>
            <DiscrepancyStep
              items={session.items || []}
              extraItems={session.extraItems || []}
              onNext={({ extraDecisions, priceDecisions }) => next({ extraDecisions, priceDecisions })}
            />
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="recepcion-step-title">Confirmar y guardar recepción</h2>
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
