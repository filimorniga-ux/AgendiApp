/**
 * useBarcodeLookup.js
 * Busca un código de barras en retail_inventory y technical_inventory.
 * Retorna el producto encontrado, el tipo de inventario y estado de carga.
 */
import { useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useContext } from 'react';
import { BusinessContext } from '../context/BusinessContext';

export function useBarcodeLookup() {
  const [loading, setLoading] = useState(false);
  const { businessId } = useContext(BusinessContext);

  /**
   * Busca un barcode en ambos inventarios.
   * @param {string} barcode
   * @returns {{ product: object|null, inventoryType: 'retail'|'technical'|null, found: boolean }}
   */
  const lookup = useCallback(async (barcode) => {
    if (!barcode?.trim() || !businessId) return { product: null, inventoryType: null, found: false };

    setLoading(true);
    try {
      const trimmed = barcode.trim();

      // 1. Buscar en retail_inventory (barcode o supplier_sku)
      const { data: retailRows } = await supabase
        .from('retail_inventory')
        .select('*')
        .eq('business_id', businessId)
        .or(`barcode.eq.${trimmed},supplier_sku.eq.${trimmed}`)
        .limit(1);

      if (retailRows?.length > 0) {
        return { product: retailRows[0], inventoryType: 'retail', found: true };
      }

      // 2. Buscar en technical_inventory
      const { data: techRows } = await supabase
        .from('technical_inventory')
        .select('*')
        .eq('business_id', businessId)
        .or(`barcode.eq.${trimmed},supplier_sku.eq.${trimmed}`)
        .limit(1);

      if (techRows?.length > 0) {
        return { product: techRows[0], inventoryType: 'technical', found: true };
      }

      return { product: null, inventoryType: null, found: false };
    } catch (err) {
      console.error('[useBarcodeLookup]', err);
      return { product: null, inventoryType: null, found: false };
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  return { lookup, loading };
}
