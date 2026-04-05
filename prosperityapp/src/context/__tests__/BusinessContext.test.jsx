import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessProvider, BusinessContext } from '../BusinessContext';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../../supabase/client';

// Mock dependencies
vi.mock('../../firebase/config', () => ({
  auth: {}
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn()
}));

vi.mock('../../supabase/client', () => {
  const mockFrom = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockMaybeSingle = vi.fn().mockReturnThis();
  const mockUpsert = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockReturnThis();
  
  const mockThen = vi.fn((resolve) => resolve({ data: [], error: null }));
  const mockRpc = vi.fn().mockResolvedValue({ error: null });

  const mock = {
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    limit: mockLimit,
    maybeSingle: mockMaybeSingle,
    upsert: mockUpsert,
    single: mockSingle,
    then: mockThen,
    rpc: mockRpc,
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  };
  return { supabase: mock };
});

const TestConsumer = () => {
  const { user, businessId, realRole, loadingAuth } = useContext(BusinessContext);
  return (
    <div>
      <div data-testid="loading">{loadingAuth.toString()}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="businessId">{businessId || 'null'}</div>
      <div data-testid="role">{realRole || 'null'}</div>
    </div>
  );
};

describe('BusinessContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'mock-uid', email: 'test@local.dev' });
      return () => {};
    });
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      cb('SIGNED_IN', { user: null });
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('renders correctly and sets initial values', async () => {
    supabase.maybeSingle.mockResolvedValueOnce({
      data: { business_id: 'test-business-xyz', role: 'owner' },
      error: null
    });
    supabase.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null
    });
    
    render(
      <BusinessProvider>
        <TestConsumer />
      </BusinessProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Validates overrides
    expect(screen.getByTestId('user').textContent).toBe('test@local.dev');
    expect(screen.getByTestId('role').textContent).toBe('owner');
    expect(screen.getByTestId('businessId').textContent).toBe('test-business-xyz');
  });
});
