import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LotRow } from '../LotRow';
import * as useInventoryLotsHook from '../../../hooks/useInventoryLots';

vi.mock('../../../hooks/useInventoryLots');

describe('LotRow Component', () => {
  const mockLots = [
    {
      id: '1',
      lot_number: 'LOTE-123',
      quantity_initial: 10,
      quantity_remaining: 5,
      status: 'active',
      cost_per_unit: 1000,
      supplier_name: 'Test Supplier',
    },
    {
      id: '2',
      lot_number: 'LOTE-456',
      quantity_initial: 10,
      quantity_remaining: 0,
      status: 'depleted',
      cost_per_unit: 1200,
    }
  ];

  const mockStats = {
    activeLots: 1,
    totalLots: 2,
    totalRemaining: 5,
    totalInitial: 20,
    avgCost: 1000
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with closed state', () => {
    vi.mocked(useInventoryLotsHook.useInventoryLots).mockReturnValue({
      lots: mockLots,
      loading: false,
      stats: mockStats
    });

    render(<LotRow productId="prod-1" inventoryType="technical" productName="Test Prod" sellMode="whole" />);

    // Check toggle button text
    expect(screen.getByText(/1 lote activo/i)).toBeInTheDocument();
    expect(screen.getByText(/\(2 total\)/i)).toBeInTheDocument();

    // Check content is not visible
    expect(screen.queryByTestId('lot-row-content')).not.toBeInTheDocument();
  });

  it('expands on click and shows lots data', () => {
    vi.mocked(useInventoryLotsHook.useInventoryLots).mockReturnValue({
      lots: mockLots,
      loading: false,
      stats: mockStats
    });

    render(<LotRow productId="prod-1" inventoryType="technical" productName="Test Prod" sellMode="whole" />);

    // Click toggle button
    const toggleBtn = screen.getByRole('button');
    fireEvent.click(toggleBtn);

    // Check content is visible
    expect(screen.getByTestId('lot-row-content')).toBeInTheDocument();

    // Check lot data is rendered
    expect(screen.getByText('LOTE-123')).toBeInTheDocument();
    expect(screen.getByText('LOTE-456')).toBeInTheDocument();
    expect(screen.getByText('Test Supplier')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  it('shows empty message when no lots', () => {
    vi.mocked(useInventoryLotsHook.useInventoryLots).mockReturnValue({
      lots: [],
      loading: false,
      stats: { activeLots: 0, totalLots: 0 }
    });

    render(<LotRow productId="prod-1" inventoryType="technical" productName="Test Prod" sellMode="whole" />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Sin lotes registrados')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useInventoryLotsHook.useInventoryLots).mockReturnValue({
      lots: [],
      loading: true,
      stats: { activeLots: 0, totalLots: 0 }
    });

    render(<LotRow productId="prod-1" inventoryType="technical" productName="Test Prod" sellMode="whole" />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByTestId('lot-row-loading')).toBeInTheDocument();
  });
});
