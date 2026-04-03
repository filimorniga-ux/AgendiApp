import React, { useContext } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessProvider, BusinessContext } from '../BusinessContext';
import { onAuthStateChanged } from 'firebase/auth';
import { supabase } from '../../supabase/client';

// Mock Vite Env for normal mode (non-bypass)
vi.stubEnv('VITE_DEV_BYPASS_AUTH', 'false');

vi.mock('../../firebase/config', () => ({
  auth: {
    signOut: vi.fn().mockResolvedValue(),
  }
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn()
}));

vi.mock('../../supabase/client', () => {
  const fromMock = vi.fn().mockReturnThis();
  const selectMock = vi.fn().mockReturnThis();
  const eqMock = vi.fn().mockReturnThis();
  const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const upsertMock = vi.fn().mockReturnThis();
  const singleMock = vi.fn().mockResolvedValue({ data: null, error: null });

  const limitMock = vi.fn().mockReturnThis();
  const thenMock = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    supabase: {
      from: fromMock,
      select: selectMock,
      eq: eqMock,
      limit: limitMock,
      then: thenMock,
      maybeSingle: maybeSingleMock,
      upsert: upsertMock,
      single: singleMock,
      rpc: vi.fn().mockResolvedValue({ error: null }),
      auth: {
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        signOut: vi.fn().mockResolvedValue({}),
      }
    }
  };
});

const TestConsumer = () => {
  const { user, supabaseUser, businessId, realRole, loadingAuth, signOutAll } = useContext(BusinessContext);
  return (
    <div>
      <div data-testid="loading">{loadingAuth.toString()}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="sbUser">{supabaseUser ? supabaseUser.email : 'null'}</div>
      <div data-testid="businessId">{businessId || 'null'}</div>
      <div data-testid="role">{realRole || 'null'}</div>
      <button data-testid="signout" onClick={signOutAll}>Sign Out All</button>
    </div>
  );
};

describe('BusinessContext (Non-Bypass)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and sets initial values without session', async () => {
    // Setup listeners that immediately return no user
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      cb('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return () => {};
    });

    render(
      <BusinessProvider>
        <TestConsumer />
      </BusinessProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('sbUser').textContent).toBe('null');
    expect(screen.getByTestId('role').textContent).toBe('null');
    expect(screen.getByTestId('businessId').textContent).toBe('null');
  });

  it('sets role to collaborator when Supabase auth resolves', async () => {
    supabase.from().maybeSingle.mockResolvedValueOnce({ data: { id: 'collab1', business_id: 'biz123' } });

    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      cb('SIGNED_IN', { user: { id: 'sb-id-123', email: 'collab@test.com' } });
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return () => {};
    });

    render(
      <BusinessProvider>
        <TestConsumer />
      </BusinessProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('sbUser').textContent).toBe('collab@test.com');
    expect(screen.getByTestId('role').textContent).toBe('collaborator');
    expect(screen.getByTestId('businessId').textContent).toBe('biz123');
    expect(supabase.rpc).toHaveBeenCalledWith('set_config', {
      setting: 'app.business_id',
      value: 'biz123',
      is_local: false,
    });
  });

  it('sets role based on user when Firebase auth resolves', async () => {
    supabase.from().maybeSingle.mockResolvedValueOnce({ data: { role: 'admin', business_id: 'biz-fb' } });

    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      cb('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'fb-uid-1', email: 'admin@test.com' });
      return () => {};
    });

    render(
      <BusinessProvider>
        <TestConsumer />
      </BusinessProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('admin@test.com');
    expect(screen.getByTestId('role').textContent).toBe('admin');
    expect(screen.getByTestId('businessId').textContent).toBe('biz-fb');
  });

  it('signOutAll clears everything and calls both sign outs', async () => {
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      cb('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    onAuthStateChanged.mockImplementation((auth, cb) => {
      cb(null);
      return () => {};
    });

    const { auth } = await import('../../firebase/config');

    render(
      <BusinessProvider>
        <TestConsumer />
      </BusinessProvider>
    );

    fireEvent.click(screen.getByTestId('signout'));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(auth.signOut).toHaveBeenCalled();
    });
  });
});