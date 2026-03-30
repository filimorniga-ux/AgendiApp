/**
 * BusinessContext — Contexto ligero que solo expone businessId.
 *
 * Existe para romper la dependencia circular entre:
 *   DataContext → useSupabaseCollection → DataContext
 *
 * DataProvider publica aquí su businessId para que useSupabaseCollection
 * pueda leerlo sin importar DataContext directamente.
 */
import { createContext } from 'react';

export const BusinessContext = createContext({ businessId: null });
