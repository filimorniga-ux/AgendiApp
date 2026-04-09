import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CollaboratorModal from '../CollaboratorModal';
import * as DataContext from '../../../context/DataContext';

vi.mock('../../../context/BusinessContext', () => ({
  useBusiness: () => ({ businessId: 'biz123' })
}));

vi.mock('../../../supabase/db', () => ({
  sbCreate: vi.fn(),
  sbUpdate: vi.fn(),
  sbDelete: vi.fn()
}));

vi.mock('../../../supabase/client', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) }
  }
}));

// Mock fetch for Edge Function
global.fetch = vi.fn();

describe('CollaboratorModal - Acceso App Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(DataContext, 'useData').mockReturnValue({
      config: [{ id: 'settings', securityPin: '1234' }]
    });
  });

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    collaboratorToEdit: { id: 'collab1', name: 'Test Collab', email: 'test@test.com' }
  };

  it('shows "guardar primero" message when in create mode', () => {
    render(<CollaboratorModal {...defaultProps} collaboratorToEdit={null} />);

    // Switch to Acceso tab
    fireEvent.click(screen.getByText('Acceso App'));

    expect(screen.getByText('Primero guarda el colaborador para poder configurar su acceso a la app.')).toBeInTheDocument();
  });

  it('shows PinVerifier when unlocking tab in edit mode', () => {
    render(<CollaboratorModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Acceso App'));

    expect(screen.getByText('Autorización Requerida')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PIN de administrador')).toBeInTheDocument();
  });

  it('unlocks tab with correct PIN', async () => {
    render(<CollaboratorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Acceso App'));

    const pinInput = screen.getByPlaceholderText('PIN de administrador');
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Autorizar' }));

    await waitFor(() => {
      expect(screen.getByText('Correo de inicio de sesión')).toBeInTheDocument();
    });
  });

  it('shows error and blocks after 3 incorrect attempts', async () => {
    render(<CollaboratorModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Acceso App'));

    const pinInput = screen.getByPlaceholderText('PIN de administrador');
    const authButton = screen.getByRole('button', { name: 'Autorizar' });

    // Attempt 1
    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(authButton);
    expect(screen.getByText('PIN incorrecto. Inténtalo de nuevo.')).toBeInTheDocument();

    // Attempt 2
    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(authButton);

    // Attempt 3
    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText(/Demasiados intentos fallidos/)).toBeInTheDocument();
      expect(authButton).toBeDisabled();
      expect(pinInput).toBeDisabled();
    });
  });
});