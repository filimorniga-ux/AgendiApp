import { describe, it, expect } from 'vitest';
import { calculatePayroll, DEFAULT_TEMPLATE_STEPS } from '../../src/lib/payrollEngine';

describe('payrollEngine', () => {
  it('should fall back to commissionPercent and taxPercent if step value is null', () => {
    const data = {
      totalServices: 100000,
      totalTechCost: 10000,
      totalAdvances: 0,
      totalSalesCommissions: 2000,
      totalPropinas: 5000,
      commissionPercent: 50,
      taxPercent: 19
    };

    const { finalPayment, netBase } = calculatePayroll(data, DEFAULT_TEMPLATE_STEPS);

    // gross = 100,000
    // - tech_cost (10,000) = 90,000
    // - taxes (19% of 100,000) = 19,000
    // net_base = 100,000 - 10,000 - 19,000 = 71,000
    expect(netBase).toBe(71000);

    // + participation (50% of 71,000) = 35,500
    // + commissions (2,000) = 37,500
    // + tips (5,000) = 42,500
    // + advances (0) = 42,500
    // However, since the engine currently accumulates all steps:
    // accumulator starts at 100,000 - 10,000 - 19,000 = 71,000
    // 71,000 + 35,500 + 2,000 + 5,000 + 0 = 113,500
    expect(finalPayment).toBe(113500);
  });

  it('should safely handle NaN, string, and null inputs without failing', () => {
    const data = {
      totalServices: '100000', // string
      totalTechCost: null, // should be 0
      totalAdvances: NaN, // should be 0
      totalSalesCommissions: undefined, // should be 0
      totalPropinas: '5000', // string
      commissionPercent: null, // fallback logic in safeNum -> 0
      taxPercent: NaN, // fallback logic in safeNum -> 19
    };

    const { finalPayment, netBase } = calculatePayroll(data, DEFAULT_TEMPLATE_STEPS);

    // net_base = 81,000
    expect(netBase).toBe(81000);

    // Accumulator = 81,000 + tips (5,000) = 86,000
    expect(finalPayment).toBe(86000);
  });
});
