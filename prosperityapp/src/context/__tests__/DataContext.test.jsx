import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataProvider, useData, DataContext } from '../DataContext';
import { useBusiness } from '../BusinessContext';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

// Mock dependencies
vi.mock('../BusinessContext', () => ({
  useBusiness: vi.fn(),
  BusinessContext: React.createContext()
}));

vi.mock('../../hooks/useSupabaseCollection', () => ({
  useSupabaseCollection: vi.fn()
}));

const TestConsumer = () => {
  const data = useData();
  return (
    <div>
      <div data-testid="isLoading">{data.isLoading.toString()}</div>
      <div data-testid="currentLocale">{data.currentLocale}</div>
      <div data-testid="currentCurrencySymbol">{data.currentCurrencySymbol}</div>
      <div data-testid="userRole">{data.userRole || 'null'}</div>
    </div>
  );
};

describe('DataContext', () => {
  it('combines state from BusinessContext and collections', () => {
    useBusiness.mockReturnValue({
      businessId: 'test-biz',
      user: { uid: 'u1' },
      realRole: 'owner',
      loadingAuth: false
    });

    useSupabaseCollection.mockImplementation((collectionName) => {
      // Simulate loading state for all collections initially
      return { data: [], loading: false };
    });

    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    );

    expect(screen.getByTestId('isLoading').textContent).toBe('false');
    expect(screen.getByTestId('currentLocale').textContent).toBe('es-CL');
    expect(screen.getByTestId('currentCurrencySymbol').textContent).toBe('$');
    expect(screen.getByTestId('userRole').textContent).toBe('owner');
  });

  it('aggregates loading state from any collection', () => {
    useBusiness.mockReturnValue({
      businessId: 'test-biz',
      user: { uid: 'u1' },
      realRole: 'owner',
      loadingAuth: false
    });

    useSupabaseCollection.mockImplementation((collectionName) => {
      // Simulate clients is loading, everything else is not
      if (collectionName === 'clients') {
        return { data: [], loading: true };
      }
      return { data: [], loading: false };
    });

    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    );

    expect(screen.getByTestId('isLoading').textContent).toBe('true');
  });

  it('throws an error if useData is used outside DataProvider', () => {
    // Check missing context provider
    const ErrorConsumer = () => {
      useData();
      return <div>Test</div>;
    };

    // Prevent React from logging error in test console
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ErrorConsumer />)).toThrow('useData debe ser usado dentro de un DataProvider');

    consoleError.mockRestore();
  });

  it('aggregates error state from any collection', () => {
    useBusiness.mockReturnValue({
      businessId: 'test-biz',
      user: { uid: 'u1' },
      realRole: 'owner',
      loadingAuth: false
    });

    useSupabaseCollection.mockImplementation((collectionName) => {
      if (collectionName === 'clients') {
        return { data: [], loading: false, error: { message: 'RLS policy violation' } };
      }
      return { data: [], loading: false, error: null };
    });

    const TestErrorConsumer = () => {
      const data = useData();
      return <div data-testid="clients">{data.clients.length}</div>;
    };

    render(
      <DataProvider>
        <TestErrorConsumer />
      </DataProvider>
    );

    expect(screen.getByTestId('clients').textContent).toBe('0');
  });
});
