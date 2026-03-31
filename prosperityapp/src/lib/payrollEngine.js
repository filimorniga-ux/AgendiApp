/**
 * payrollEngine.js
 * Motor genérico de cálculo de nómina basado en plantillas de pasos.
 *
 * Un "step" tiene la forma:
 * {
 *   id:          string,
 *   label:       string,          // "(-) Impuestos"
 *   operator:    'add'|'subtract'|'percent_add'|'percent_subtract'|'set',
 *   source:      'gross'|'tech_cost'|'taxes'|'commissions'|'tips'|'advances'|'fixed'|'result',
 *   value:       number,          // monto fijo o % según operator
 *   reference:   'gross'|'result'|'net_base'|null,  // base del porcentaje
 *   enabled:     boolean,
 *   isSubtotal:  boolean,         // si true, pinta una línea de subtotal con este label
 *   color:       'red'|'green'|'neutral',
 * }
 *
 * @param {Object} data   - Datos reales del colaborador del período seleccionado
 * @param {Array}  steps  - Array de pasos de la plantilla
 * @returns {{ rows: Array, finalPayment: number }}
 */
export function calculatePayroll(data, steps) {
  const {
    totalServices     = 0,
    totalTechCost     = 0,
    totalAdvances     = 0,
    totalSalesCommissions = 0,
    totalPropinas     = 0,
    commissionPercent = 0,
    taxPercent        = 19,
  } = data;

  // Registros disponibles por fuente
  const sources = {
    gross:       totalServices,
    tech_cost:   totalTechCost,
    advances:    totalAdvances,
    commissions: totalSalesCommissions,
    tips:        totalPropinas,
  };

  let accumulator = 0;      // resultado corriendo
  let netBase     = 0;      // guardamos la "base neta" para referencia posterior
  const rows      = [];

  for (const step of steps) {
    if (!step.enabled) continue;

    // Valor base del paso
    let raw = 0;
    if (step.source === 'fixed') {
      raw = Number(step.value) || 0;
    } else if (step.source === 'result') {
      raw = accumulator;
    } else if (step.source === 'commission_pct') {
      // Participación = % del accumulator actual
      raw = accumulator * ((Number(step.value) || commissionPercent) / 100);
    } else if (step.source === 'tax_pct') {
      // Impuesto = % de la referencia (gross o result)
      const base = step.reference === 'gross' ? sources.gross : accumulator;
      raw = base * ((Number(step.value) || taxPercent) / 100);
    } else {
      raw = sources[step.source] ?? 0;
    }

    // Porcentaje genérico sobre referencia
    if (step.operator === 'percent_add' || step.operator === 'percent_subtract') {
      const base = step.reference === 'gross'
        ? sources.gross
        : step.reference === 'net_base'
          ? netBase
          : accumulator;
      raw = base * ((Number(step.value) || 0) / 100);
    }

    // Aplicar operador al acumulador
    let delta = 0;
    switch (step.operator) {
      case 'add':
      case 'percent_add':
        delta = +raw;
        accumulator += raw;
        break;
      case 'subtract':
      case 'percent_subtract':
        delta = -raw;
        accumulator -= raw;
        break;
      case 'set':
        delta = raw - accumulator;
        accumulator = raw;
        break;
      default:
        delta = +raw;
        accumulator += raw;
    }

    // Marcar el net_base para referencia de steps posteriores
    if (step.id === 'net_base' || step.isNetBase) {
      netBase = accumulator;
    }

    rows.push({
      id:         step.id,
      label:      step.label,
      value:      Math.abs(delta),
      display:    delta,          // con signo para mostrar
      isSubtotal: step.isSubtotal || false,
      color:      step.color || 'neutral',
      runningTotal: accumulator,
    });
  }

  return { rows, finalPayment: accumulator, netBase };
}

/**
 * Plantilla por defecto compatible con la lógica hardcoded anterior.
 * Se usa cuando no hay ninguna plantilla guardada en la BD.
 */
export const DEFAULT_TEMPLATE_STEPS = [
  {
    id: 'gross',
    label: 'Producción Bruta',
    operator: 'add',
    source: 'gross',
    value: null,
    reference: null,
    enabled: true,
    isSubtotal: false,
    isNetBase: false,
    color: 'neutral',
  },
  {
    id: 'tech_cost',
    label: '(-) Costo Técnico',
    operator: 'subtract',
    source: 'tech_cost',
    value: null,
    reference: null,
    enabled: true,
    isSubtotal: false,
    isNetBase: false,
    color: 'red',
  },
  {
    id: 'taxes',
    label: '(-) Impuestos',
    operator: 'percent_subtract',
    source: 'tax_pct',
    value: 19,
    reference: 'gross',
    enabled: true,
    isSubtotal: false,
    isNetBase: false,
    color: 'red',
  },
  {
    id: 'net_base',
    label: 'Base Neta',
    operator: 'set',
    source: 'result',
    value: null,
    reference: null,
    enabled: true,
    isSubtotal: true,
    isNetBase: true,
    color: 'neutral',
  },
  {
    id: 'participation',
    label: '(+) Participación',
    operator: 'percent_add',
    source: 'commission_pct',
    value: null,          // usa commissionPercent del colaborador
    reference: 'net_base',
    enabled: true,
    isSubtotal: false,
    isNetBase: false,
    color: 'green',
  },
  {
    id: 'commissions',
    label: '(+) Comisiones Venta',
    operator: 'add',
    source: 'commissions',
    value: null,
    reference: null,
    enabled: true,
    isSubtotal: false,
    isNetBase: false,
    color: 'green',
  },
  {
    id: 'tips',
    label: '(+) Propinas',
    operator: 'add',
    source: 'tips',
    value: null,
    reference: null,
    enabled: true,
    isSubtotal: false,
    isNetBase: false,
    color: 'green',
  },
  {
    id: 'advances',
    label: '(+/-) Adelantos',
    operator: 'add',
    source: 'advances',
    value: null,
    reference: null,
    enabled: true,
    isSubtotal: false,
    isNetBase: false,
    color: 'neutral',
  },
];
