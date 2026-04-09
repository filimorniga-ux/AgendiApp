import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';
import { useBusiness } from '../../../context/BusinessContext';
import { supabase } from '../../../supabase/client';

vi.mock('../../../context/BusinessContext', () => ({
  useBusiness: vi.fn(),
}));

vi.mock('../../../supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.stubEnv('VITE_DEV_BYPASS_AUTH', 'false');

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children if user is logged in (Supabase user)', () => {
    useBusiness.mockReturnValue({
      user: { email: 'admin@test.com' },
      supabaseUser: { email: 'admin@test.com' },
      loadingAuth: false,
    });

    render(
      <ProtectedRoute>
        <div data-testid="child-content">Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders children if supabaseUser is present', () => {
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
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows unified login form if no user', () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: false,
    });

    render(<ProtectedRoute><div /></ProtectedRoute>);
    expect(screen.getByText('Inicia sesión para continuar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    // No more dual tabs — single unified login
    expect(screen.queryByRole('button', { name: 'Administrador' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Colaborador' })).not.toBeInTheDocument();
  });

  it('calls Supabase signInWithPassword on form submit', async () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: false,
    });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    render(<ProtectedRoute><div /></ProtectedRoute>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'user@test.com', password: 'password123' });
    });
  });

  it('shows error on invalid credentials', async () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: false,
    });
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    render(<ProtectedRoute><div /></ProtectedRoute>);

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('Correo o contraseña incorrectos. Verifica tus datos.')).toBeInTheDocument();
    });
  });

  it('has Google OAuth button', () => {
    useBusiness.mockReturnValue({
      user: null,
      supabaseUser: null,
      loadingAuth: false,
    });

    render(<ProtectedRoute><div /></ProtectedRoute>);
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
  });
});