import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenUnitTracker } from '../OpenUnitTracker';
import { supabase } from '../../../supabase/client';

// Mock business context wrapper to avoid context errors
vi.mock('../../../context/BusinessContext', () => ({
  useBusiness: () => ({ businessId: 'test-business' })
}));

describe('OpenUnitTracker Component', () => {
  const mockLots = [
    {
      id: 'lot-1',
      status: 'active',
      quantity_remaining: 5,
      lot_number: 'L-123'
    }
  ];

  const mockOpenUnits = [
    {
      id: 'unit-1',
      status: 'in_use',
      total_capacity: 1000,
      unit_of_measure: 'ml',
      opened_at: new Date().toISOString()
    },
    {
      id: 'unit-2',
      status: 'depleted',
      total_capacity: 1000,
      unit_of_measure: 'ml',
      opened_at: new Date().toISOString(),
      depleted_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches units', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'open_units') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockOpenUnits, error: null })
        };
      }
    });

    render(<OpenUnitTracker productId="prod-1" unitSize={1000} unitOfMeasure="ml" lots={mockLots} />);

    // Test the text content
    await waitFor(() => {
      expect(screen.getByText(/Unidades abiertas/i)).toBeInTheDocument();
    });
  });

  it('opens a new unit successfully', async () => {
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'open_units') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockImplementation(() => {
            callCount++;
            return Promise.resolve({
              data: callCount === 1 ? [] : mockOpenUnits,
              error: null
            });
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnThis()
        }
      }
      if (table === 'inventory_lots') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        }
      }
      if (table === 'stock_movements') {
         return {
           insert: vi.fn().mockResolvedValue({ error: null })
         }
      }
    });

    render(<OpenUnitTracker productId="prod-1" unitSize={1000} unitOfMeasure="ml" lots={mockLots} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Abrir unidad')).toBeInTheDocument();
    });

    const btn = screen.getByText('Abrir unidad');

    fireEvent.click(btn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('inventory_lots');
      expect(supabase.from).toHaveBeenCalledWith('open_units');
      expect(supabase.from).toHaveBeenCalledWith('stock_movements');
    });
  });

  it('handles empty lots state gracefully', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'open_units') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }
      }
    });

    render(<OpenUnitTracker productId="prod-1" unitSize={1000} unitOfMeasure="ml" lots={[]} />);

    await waitFor(() => {
      expect(screen.getByText('No hay unidades abiertas actualmente')).toBeInTheDocument();
    });

    const btn = screen.getByRole('button', { name: /Abrir unidad/i });
    expect(btn).toBeDisabled();
  });
});
