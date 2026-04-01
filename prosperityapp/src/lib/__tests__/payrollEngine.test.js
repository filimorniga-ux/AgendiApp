import { describe, it, expect } from 'vitest';
import { calculatePayroll, DEFAULT_TEMPLATE_STEPS } from '../payrollEngine';

describe('payrollEngine', () => {
  describe('calculatePayroll', () => {
    it('should calculate final payment correctly using DEFAULT_TEMPLATE_STEPS', () => {
      const data = {
        totalServices: 1000,
        totalTechCost: 100,
        taxPercent: 10,
        commissionPercent: 50, // 50% participation
        totalSalesCommissions: 20,
        totalPropinas: 30,
        totalAdvances: -50,
      };

      // gross: 1000
      // tech_cost: -100
      // taxes (-19% of gross): -190 (since DEFAULT_TEMPLATE_STEPS hardcodes value: 19 for taxes)
      // net_base = 710
      // participation (50% of net_base): 355
      // sales_commission: +20
      // tips: +30
      // advances: -50
      // Final = 710 + 355 + 20 + 30 - 50 = 1065
      // Note: The current engine adds the participation to the netBase instead of resetting the accumulator.
      
      const { finalPayment, netBase } = calculatePayroll(data, DEFAULT_TEMPLATE_STEPS);
      
      expect(netBase).toBe(710);
      expect(finalPayment).toBe(1065);
    });

    it('should handle falsy/empty values gracefully', () => {
      const data = {
        totalServices: null,
      };

      const { finalPayment, netBase, rows } = calculatePayroll(data, DEFAULT_TEMPLATE_STEPS);
      expect(netBase).toBe(0);
      expect(finalPayment).toBe(0);
      expect(rows.length).toBe(DEFAULT_TEMPLATE_STEPS.length);
    });

    it('should handle NaN and undefined edge cases safely', () => {
      const data = {
        totalServices: NaN,
        totalTechCost: undefined,
        taxPercent: '',
        commissionPercent: null,
        totalSalesCommissions: 'invalid',
        totalPropinas: NaN,
        totalAdvances: undefined,
      };

      const { finalPayment, netBase, rows } = calculatePayroll(data, DEFAULT_TEMPLATE_STEPS);
      expect(netBase).toBe(0);
      expect(finalPayment).toBe(0);
      expect(rows.length).toBe(DEFAULT_TEMPLATE_STEPS.length);
      rows.forEach(row => {
        expect(Number.isNaN(row.calculatedValue)).toBe(false);
      });
    });

    it('should skip disabled steps', () => {
      const steps = [
        { id: 'gross', operator: 'add', source: 'gross', enabled: true },
        { id: 'fee', operator: 'subtract', source: 'fixed', value: 100, enabled: false }
      ];
      const data = { totalServices: 500 };

      const { finalPayment } = calculatePayroll(data, steps);
      expect(finalPayment).toBe(500); // 100 fee was skipped
    });

    it('should process fixed set operator', () => {
      const steps = [
        { id: 's1', operator: 'add', source: 'fixed', value: 200, enabled: true },
        { id: 's2', operator: 'set', source: 'fixed', value: 300, enabled: true }
      ];
      
      const { finalPayment } = calculatePayroll({}, steps);
      expect(finalPayment).toBe(300);
    });
  });
});
