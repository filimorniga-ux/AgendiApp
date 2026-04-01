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
    rpc: mockRpc
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
      return () => {};
    });
  });

  it('renders correctly and sets initial values', async () => {
    // To ensure DEV_BYPASS is active during this test, we would normally set import.meta.env.
    // Since Vite env variables are read-only at runtime, we have to mock or just rely on the component
    // structure. Actually DEV_BYPASS is false during `vitest` execution unless set in .env.test.
    // Let's test the normal auth flow instead.

    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'test-uid', email: 'test@test.com' });
      return () => {};
    });

    supabase.maybeSingle.mockResolvedValueOnce({
      data: { business_id: 'test-business-xyz', role: 'owner' },
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

    expect(screen.getByTestId('user').textContent).toBe('test@test.com');
    expect(screen.getByTestId('role').textContent).toBe('owner');
    expect(screen.getByTestId('businessId').textContent).toBe('test-business-xyz');
  });

  it('handles user without business (auto-seed)', async () => {
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'new-uid', email: 'new@test.com' });
      return () => {};
    });

    // 1. users table -> no business
    supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    
    // 2. businesses table eq owner_uid -> no business
    supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // 3. businesses table upsert -> new business
    supabase.single.mockResolvedValueOnce({ data: { id: 'new-biz-id' }, error: null });

    render(
      <BusinessProvider>
        <TestConsumer />
      </BusinessProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('businessId').textContent).toBe('new-biz-id');
  });
});
