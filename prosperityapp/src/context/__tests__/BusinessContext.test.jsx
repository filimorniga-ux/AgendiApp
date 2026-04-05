import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessProvider, BusinessContext } from '../BusinessContext';
import { supabase } from '../../supabase/client';

// Note: VITE_DEV_BYPASS_AUTH=true in .env, so BusinessProvider skips
// Firebase Auth entirely and uses a hardcoded DEV_USER.

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

    // Re-establish supabase mock chain for the dev bypass path
    supabase.auth.onAuthStateChange.mockImplementation((cb) => {
      if (typeof cb === 'function') {
        cb('SIGNED_IN', { user: null });
      }
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('provides dev user via DEV_BYPASS mode', async () => {
    await act(async () => {
      render(
        <BusinessProvider>
          <TestConsumer />
        </BusinessProvider>
      );
    });

    // DEV_BYPASS sets user immediately with hardcoded email
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('dev@local.dev');
    // Role is set to 'owner' in bypass mode
    expect(screen.getByTestId('role').textContent).toBe('owner');
  });

  it('exports BusinessContext and BusinessProvider correctly', () => {
    expect(BusinessContext).toBeDefined();
    expect(BusinessProvider).toBeDefined();
    expect(typeof BusinessProvider).toBe('function');
  });

  it('renders children without errors', async () => {
    await act(async () => {
      render(
        <BusinessProvider>
          <div data-testid="child">Hello World</div>
        </BusinessProvider>
      );
    });

    expect(screen.getByTestId('child').textContent).toBe('Hello World');
  });

  it('provides signOutAll function in context', async () => {
    let contextValue;
    const ContextCapture = () => {
      contextValue = useContext(BusinessContext);
      return null;
    };

    await act(async () => {
      render(
        <BusinessProvider>
          <ContextCapture />
        </BusinessProvider>
      );
    });

    expect(contextValue).toBeDefined();
    expect(typeof contextValue.signOutAll).toBe('function');
  });
});
