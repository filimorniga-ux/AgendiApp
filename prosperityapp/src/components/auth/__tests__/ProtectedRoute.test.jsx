import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';
import { useBusiness } from '../../../context/BusinessContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { supabase } from '../../../supabase/client';

vi.mock('../../../context/BusinessContext', () => ({
  useBusiness: vi.fn(),
}));

vi.mock('../../../firebase/config', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock('../../../supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

vi.stubEnv('VITE_DEV_BYPASS_AUTH', 'false');

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children if user is logged in (Firebase)', () => {
    useBusiness.mockReturnValue({
      user: { email: 'admin@test.com' },
      supabaseUser: null,
      loadingAuth: false,
    });

    render(
      <ProtectedRoute>
        <div data-testid="child-content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders children if user is logged in (Supabase)', () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: { email: 'collab@test.com' },
      loadingAuth: false,
    });

    render(
      <ProtectedRoute>
        <div data-testid="child-content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('shows loading spinner if loadingAuth is true', () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: true,
    });

    const { container } = render(<ProtectedRoute><div /></ProtectedRoute>);
    // The spinner has animate-spin class
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows login form if no user', () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: false,
    });

    render(<ProtectedRoute><div /></ProtectedRoute>);
    expect(screen.getByText('Inicia sesión para continuar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Administrador' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Colaborador' })).toBeInTheDocument();
  });

  it('calls Firebase signInWithEmailAndPassword in owner mode', async () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: false,
    });
    signInWithEmailAndPassword.mockResolvedValue({});

    render(<ProtectedRoute><div /></ProtectedRoute>);

    // Default is owner
    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'owner@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'owner@test.com', 'password123');
    });
  });

  it('calls Supabase signInWithPassword in collaborator mode', async () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: false,
    });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    render(<ProtectedRoute><div /></ProtectedRoute>);

    // Switch to collaborator
    fireEvent.click(screen.getByRole('button', { name: 'Colaborador' }));

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'collab@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'collab@test.com', password: 'password123' });
    });
  });
});