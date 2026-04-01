import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/utils';
import { vi } from 'vitest';
import ClientModal from '../ClientModal';
import * as dbMock from '../../../supabase/db';
import * as dataContextMock from '../../../context/DataContext';
import toast from 'react-hot-toast';

// Mock Supabase DB calls
vi.mock('../../../supabase/db', () => ({
  sbCreate: vi.fn(),
  sbUpdate: vi.fn(),
}));

// Mock DataContext
vi.mock('../../../context/DataContext', () => ({
  useData: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock feather-icons
vi.mock('feather-icons', () => ({
  default: {
    replace: vi.fn(),
  },
}));

describe('ClientModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    dataContextMock.useData.mockReturnValue({ businessId: 'test-business-id' });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ClientModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders create mode correctly', () => {
    render(<ClientModal isOpen={true} onClose={mockOnClose} />);

    // Header
    expect(screen.getByText('modals.client.newTitle')).toBeInTheDocument();

    // Inputs
    expect(screen.getByPlaceholderText('modals.client.name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('modals.client.lastName')).toBeInTheDocument();

    // Buttons
    expect(screen.getByText('common.save')).toBeInTheDocument();
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
  });

  it('renders edit mode correctly and populates data', () => {
    const mockClient = {
      id: 'client-123',
      name: 'John',
      lastName: 'Doe',
      docType: 'Pasaporte',
      docNumber: '12345678',
      phone: '555-1234',
      email: 'john@example.com',
      createdAt: '2023-01-01T00:00:00.000Z',
      lastVisit: '2023-10-01',
    };

    render(<ClientModal isOpen={true} onClose={mockOnClose} clientToEdit={mockClient} />);

    // Header
    expect(screen.getByText('modals.client.editTitle')).toBeInTheDocument();

    // Inputs should have correct values
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pasaporte')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-1234')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });

  it('allows switching tabs', () => {
    const mockClient = {
      id: 'client-123',
      createdAt: '2023-01-01T00:00:00.000Z',
      lastVisit: '2023-10-01',
    };

    render(<ClientModal isOpen={true} onClose={mockOnClose} clientToEdit={mockClient} />);

    // Find tab buttons
    const personalTab = screen.getByText('modals.client.personal');
    const historyTab = screen.getByText('modals.client.history');

    // Default is personal
    expect(screen.getByPlaceholderText('modals.client.name')).toBeVisible();

    // Click history tab
    fireEvent.click(historyTab);

    // Check history tab content
    expect(screen.getByText('modals.client.historyDesc')).toBeInTheDocument();
    expect(screen.getByText('01-01-2023')).toBeInTheDocument(); // es-CL locale mapping
    expect(screen.getByText('2023-10-01')).toBeInTheDocument();

    // Click personal tab again
    fireEvent.click(personalTab);
    expect(screen.getByPlaceholderText('modals.client.name')).toBeVisible();
  });

  it('handles successful creation', async () => {
    dbMock.sbCreate.mockResolvedValueOnce({ error: null });

    render(<ClientModal isOpen={true} onClose={mockOnClose} />);

    // Fill form
    const nameInput = screen.getByPlaceholderText('modals.client.name');
    fireEvent.change(nameInput, { target: { value: 'Jane', name: 'name' } });

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dbMock.sbCreate).toHaveBeenCalledWith(
        'clients',
        expect.objectContaining({
          name: 'Jane',
          lastName: '',
          docType: 'DNI',
          docNumber: '',
          phone: '',
          email: '',
          birthday: '',
          lastVisit: expect.any(String), // should be today's date
        }),
        'test-business-id'
      );
      expect(toast.success).toHaveBeenCalledWith('common.success');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles successful update', async () => {
    dbMock.sbUpdate.mockResolvedValueOnce({ error: null });

    const mockClient = {
      id: 'client-123',
      name: 'John',
      lastName: 'Doe',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    };

    render(<ClientModal isOpen={true} onClose={mockOnClose} clientToEdit={mockClient} />);

    // Change name
    const nameInput = screen.getByDisplayValue('John');
    fireEvent.change(nameInput, { target: { value: 'Johnny', name: 'name' } });

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // should omit id, createdAt, updatedAt
      expect(dbMock.sbUpdate).toHaveBeenCalledWith(
        'clients',
        'client-123',
        expect.objectContaining({
          name: 'Johnny',
          lastName: 'Doe',
        })
      );

      const updatePayload = dbMock.sbUpdate.mock.calls[0][2];
      expect(updatePayload).not.toHaveProperty('id');
      expect(updatePayload).not.toHaveProperty('createdAt');
      expect(updatePayload).not.toHaveProperty('updatedAt');

      expect(toast.success).toHaveBeenCalledWith('common.success');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles API errors during save', async () => {
    dbMock.sbCreate.mockRejectedValueOnce(new Error('API Error'));

    render(<ClientModal isOpen={true} onClose={mockOnClose} />);

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('common.error');
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ClientModal isOpen={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('common.cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
