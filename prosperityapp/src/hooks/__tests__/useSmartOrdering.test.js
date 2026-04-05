import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSmartOrdering } from '../useSmartOrdering';
import { supabase } from '../../supabase/client';

// Mock context wrapper
vi.mock('../../context/BusinessContext', () => ({
  useBusiness: () => ({ businessId: 'test-business' })
}));

describe('useSmartOrdering Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates suggestions correctly', async () => {
    // Mock data
    const mockMovements = [
      { product_id: 'p1', amount: 10, inventory_type: 'technical' },
      { product_id: 'p1', amount: 5, inventory_type: 'technical' },
      { product_id: 'p2', amount: 2, inventory_type: 'retail' } // very low usage
    ];

    const mockTechProducts = [
      {
        id: 'p1',
        name: 'Tech Prod 1',
        brand: 'Brand A',
        category: 'Cat A',
        stock_current: 5, // low stock
        stock_min: 10,
        cost_per_unit: 1000,
        default_supplier_id: 'supp1',
        sell_mode: 'whole'
      },
      {
        id: 'p3',
        name: 'Tech Prod 3',
        brand: 'Brand C',
        category: 'Cat C',
        stock_current: 50, // high stock, no sales
        stock_min: 5,
        cost_per_unit: 500,
        default_supplier_id: 'supp3',
        sell_mode: 'whole'
      }
    ];

    const mockRetailProducts = [
      {
        id: 'p2',
        name: 'Retail Prod 2',
        brand: 'Brand B',
        category: 'Cat B',
        stock_current: 0, // critical 0
        stock_min: 5,
        cost_price: 2000,
        sale_price: 4000,
        default_supplier_id: 'supp2'
      }
    ];

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'stock_movements') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ data: mockMovements, error: null })
        };
      }
      if (table === 'technical_inventory') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockTechProducts, error: null })
        };
      }
      if (table === 'retail_inventory') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockRetailProducts, error: null })
        };
      }
    });

    const { result } = renderHook(() => useSmartOrdering());

    await act(async () => {
      await result.current.calculate({
        period: 'month',
        horizon: 'month',
        safetyFactor: 0.15,
        filter: 'needed',
        inventoryTypeFilter: 'all',
        categoryFilter: 'all',
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.suggestions).toBeDefined();
    });

    const suggestions = result.current.suggestions;

    // Sort logic: stock 0 first, then critical, then descending suggested
    expect(suggestions.length).toBeGreaterThan(0);

    // p2 has 0 stock, should be first
    expect(suggestions[0].productId).toBe('p2');
    expect(suggestions[0].isZero).toBe(true);
    expect(suggestions[0].isCritical).toBe(true);

    // p1 has stock < min and high exits
    const p1 = suggestions.find(s => s.productId === 'p1');
    expect(p1).toBeDefined();
    expect(p1.isCritical).toBe(true);
    expect(p1.totalExits).toBe(15);
    // 15 exits in ~30 days = ~0.5 per day. Horizon is 30 days -> base 15.
    // Safety 15 * 0.15 = 2.25. Total needed = 17.25. Stock = 5. Suggested = ~13
    expect(p1.suggestedQty).toBeGreaterThan(10);

    // p3 shouldn't be suggested because it has high stock and no sales
    const p3 = suggestions.find(s => s.productId === 'p3');
    expect(p3).toBeUndefined(); // filter needed excludes negative suggestions when stock > min
  });

  it('handles custom date range', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null })
    });

    const { result } = renderHook(() => useSmartOrdering());

    await act(async () => {
      await result.current.calculate({
        period: 'custom',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });
    });

    expect(supabase.from).toHaveBeenCalledWith('stock_movements');
  });

  it('handles api errors gracefully', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
    });

    const { result } = renderHook(() => useSmartOrdering());

    await act(async () => {
      await result.current.calculate();
    });

    expect(result.current.error).toBe('DB Error');
    expect(result.current.loading).toBe(false);
  });
});