import { calculatePayroll } from './prosperityapp/src/lib/payrollEngine.js';

const steps = [
  {
    id: 'participation',
    label: '(+) Participación',
    operator: 'percent_add',
    source: 'commission_pct',
    value: null,
    reference: 'gross',
    enabled: true,
  }
];

const dataWithNull = {
  totalServices: 100000,
  commissionPercent: null,
  globalCommission: 25
};

const result = calculatePayroll(dataWithNull, steps);
console.log('Result with null commissionPercent:', JSON.stringify(result, null, 2));

const dataAllNull = null;
const result2 = calculatePayroll(dataAllNull, steps);
console.log('Result with null data:', JSON.stringify(result2, null, 2));
