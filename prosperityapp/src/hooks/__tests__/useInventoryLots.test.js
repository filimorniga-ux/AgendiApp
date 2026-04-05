import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInventoryLots } from '../useInventoryLots';
import { supabase } from '../../supabase/client';

vi.mock('../../context/BusinessContext', () => ({
  useBusiness: () => ({ businessId: 'test-business' })
}));

describe('useInventoryLots Hook', () => {
  const mockLots = [
    {
      id: 'l1',
      status: 'active',
      quantity_initial: 10,
      quantity_remaining: 5,
      cost_per_unit: 1000
    },
    {
      id: 'l2',
      status: 'depleted',
      quantity_initial: 5,
      quantity_remaining: 0,
      cost_per_unit: 1200
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches lots on mount and calculates stats', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockLots, error: null })
          })
        })
      })
    });

    const { result } = renderHook(() => useInventoryLots('prod-1', 'technical'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lots).toEqual(mockLots);

    // Check stats
    expect(result.current.stats.totalLots).toBe(2);
    expect(result.current.stats.activeLots).toBe(1);
    expect(result.current.stats.totalRemaining).toBe(5);
    expect(result.current.stats.totalInitial).toBe(15);
    expect(result.current.stats.avgCost).toBe(1000);
  });

  it('creates a new lot successfully', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'new-lot' }, error: null })
      })
    });

    vi.mocked(supabase.from).mockImplementation((table) => {
       if (table === 'inventory_lots') {
          return {
            insert: mockInsert,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockLots, error: null })
          }
       }
    });

    const { result } = renderHook(() => useInventoryLots('prod-1', 'technical'));

    await waitFor(() => {
       expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createLot({
        quantity: 10,
        costPerUnit: 1500
      });
    });

    expect(mockInsert).toHaveBeenCalled();
    const insertArgs = mockInsert.mock.calls[0][0];
    expect(insertArgs.quantity_initial).toBe(10);
    expect(insertArgs.business_id).toBe('test-business');
  });

  it('deducts from lot correctly', async () => {
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'inventory_lots') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockLots, error: null }),
          update: vi.fn().mockReturnValue({
            eq: () => Promise.resolve({ error: null })
          })
        }
      }
    });

    const { result } = renderHook(() => useInventoryLots('prod-1', 'technical'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let deductResult;
    await act(async () => {
      deductResult = await result.current.deductFromLot('l1', 2);
    });

    expect(deductResult.newRemaining).toBe(3);
    expect(deductResult.newStatus).toBe('active');
  });

  it('marks lot depleted manually', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: null })
    });

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'inventory_lots') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockLots, error: null }),
          update: mockUpdate
        }
      }
    });

    const { result } = renderHook(() => useInventoryLots('prod-1', 'technical'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markDepleted('l1');
    });

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      quantity_remaining: 0,
      status: 'depleted'
    }));
  });
});