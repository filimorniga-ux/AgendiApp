import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/utils';
import { vi } from 'vitest';
import CollaboratorModal from '../CollaboratorModal';
import * as dbMock from '../../../supabase/db';
import * as dataContextMock from '../../../context/DataContext';
import * as storageHookMock from '../../../hooks/useStorage';
import toast from 'react-hot-toast';

// Mock Supabase DB calls
vi.mock('../../../supabase/db', () => ({
  sbCreate: vi.fn(),
  sbUpdate: vi.fn(),
  sbDelete: vi.fn(),
  sbGetAll: vi.fn(),
}));

// Mock DataContext
vi.mock('../../../context/DataContext', () => ({
  useData: vi.fn(),
}));

// Mock useStorage hook
vi.mock('../../../hooks/useStorage', () => ({
  useStorage: vi.fn(),
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

describe('CollaboratorModal', () => {
  const mockOnClose = vi.fn();
  const mockUploadFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    dataContextMock.useData.mockReturnValue({ businessId: 'test-business-id' });
    storageHookMock.useStorage.mockReturnValue({
      uploadFile: mockUploadFile,
      progress: 0,
      isUploading: false,
    });
    // Mock window.confirm for delete action
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<CollaboratorModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders create mode correctly', () => {
    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} />);

    // Header
    expect(screen.getByText('collaborators.modal.newTitle')).toBeInTheDocument();

    // Inputs (personal tab by default)
    expect(screen.getByPlaceholderText('collaborators.modal.form.name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('collaborators.modal.form.lastName')).toBeInTheDocument();

    // Delete button should not be present in create mode
    expect(screen.queryByText('common.delete')).not.toBeInTheDocument();
  });

  it('renders edit mode correctly', () => {
    const mockCollab = {
      id: 'collab-123',
      name: 'Alice',
      lastName: 'Smith',
      docType: 'DNI',
      docNumber: '111222333',
      whatsapp: '555-0000',
      email: 'alice@example.com',
      commissionPercent: 40,
      salesCommissionPercent: 15,
      status: 'active',
    };

    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} collaboratorToEdit={mockCollab} />);

    // Header
    expect(screen.getByText('collaborators.modal.editTitle')).toBeInTheDocument();

    // Delete button should be present in edit mode
    expect(screen.getByText('common.delete')).toBeInTheDocument();

    // Inputs populated
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
  });

  it('allows switching between tabs', () => {
    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} />);

    const personalTab = screen.getByText('collaborators.modal.tabs.personal');
    const laboralTab = screen.getByText('collaborators.modal.tabs.labor');
    const docsTab = screen.getByText('collaborators.modal.tabs.docs');

    // Default Personal
    expect(screen.getByPlaceholderText('collaborators.modal.form.name')).toBeVisible();

    // Switch to Laboral
    fireEvent.click(laboralTab);
    expect(screen.getByText('collaborators.modal.form.hireDate')).toBeVisible();

    // Switch to Docs
    fireEvent.click(docsTab);
    expect(screen.getByText('collaborators.modal.docs.info')).toBeVisible();

    // Switch back to Personal
    fireEvent.click(personalTab);
    expect(screen.getByPlaceholderText('collaborators.modal.form.name')).toBeVisible();
  });

  it('handles successful creation with displayOrder update', async () => {
    dbMock.sbGetAll.mockResolvedValueOnce({
      data: [{ id: 'collab-1', display_order: 0 }, { id: 'collab-2', display_order: 1 }]
    });
    dbMock.sbUpdate.mockResolvedValue({ error: null });
    dbMock.sbCreate.mockResolvedValueOnce({ error: null });

    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} />);

    // Fill personal form
    const nameInput = screen.getByPlaceholderText('collaborators.modal.form.name');
    fireEvent.change(nameInput, { target: { value: 'Bob', name: 'name' } });

    // Switch to laboral tab to set some values
    const laboralTab = screen.getByText('collaborators.modal.tabs.labor');
    fireEvent.click(laboralTab);

    // Wait for tab to switch
    await waitFor(() => expect(screen.getByText('collaborators.modal.form.hireDate')).toBeVisible());

    // commissionPercent input
    const commissionInputs = screen.getAllByRole('spinbutton'); // number inputs
    fireEvent.change(commissionInputs[0], { target: { value: '45', name: 'commissionPercent' } });

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Should have called sbGetAll
      expect(dbMock.sbGetAll).toHaveBeenCalledWith('collaborators', 'test-business-id');

      // Should have called sbUpdate to shift display orders
      expect(dbMock.sbUpdate).toHaveBeenCalledWith('collaborators', 'collab-1', { displayOrder: 1 });
      expect(dbMock.sbUpdate).toHaveBeenCalledWith('collaborators', 'collab-2', { displayOrder: 2 });

      // Should have called sbCreate for the new collaborator
      expect(dbMock.sbCreate).toHaveBeenCalledWith(
        'collaborators',
        expect.objectContaining({
          name: 'Bob',
          displayOrder: 0,
          commissionPercent: 45, // Number parsing tested
        }),
        'test-business-id'
      );
      expect(toast.success).toHaveBeenCalledWith('collaborators.alerts.created');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles successful update without shifting displayOrder', async () => {
    dbMock.sbUpdate.mockResolvedValueOnce({ error: null });

    const mockCollab = {
      id: 'collab-123',
      name: 'Alice',
      commissionPercent: 40,
    };

    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} collaboratorToEdit={mockCollab} />);

    // Update name
    const nameInput = screen.getByDisplayValue('Alice');
    fireEvent.change(nameInput, { target: { value: 'Alicia', name: 'name' } });

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dbMock.sbGetAll).not.toHaveBeenCalled();
      expect(dbMock.sbUpdate).toHaveBeenCalledWith(
        'collaborators',
        'collab-123',
        expect.objectContaining({
          name: 'Alicia',
        })
      );

      const updatePayload = dbMock.sbUpdate.mock.calls[0][2];
      expect(updatePayload).not.toHaveProperty('id');

      expect(toast.success).toHaveBeenCalledWith('collaborators.alerts.updated');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles successful deletion', async () => {
    dbMock.sbDelete.mockResolvedValueOnce({ error: null });

    const mockCollab = {
      id: 'collab-123',
      name: 'Alice',
    };

    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} collaboratorToEdit={mockCollab} />);

    // Click Delete
    const deleteButton = screen.getByText('common.delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('collaborators.alerts.confirmDelete');

    await waitFor(() => {
      expect(dbMock.sbDelete).toHaveBeenCalledWith('collaborators', 'collab-123');
      expect(toast.success).toHaveBeenCalledWith('collaborators.alerts.deleted');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('cancels deletion if user clicks cancel on confirm', async () => {
    window.confirm.mockReturnValueOnce(false);

    const mockCollab = {
      id: 'collab-123',
      name: 'Alice',
    };

    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} collaboratorToEdit={mockCollab} />);

    // Click Delete
    const deleteButton = screen.getByText('common.delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(dbMock.sbDelete).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('handles file uploads', async () => {
    mockUploadFile.mockResolvedValueOnce('https://example.com/contract.pdf');

    render(<CollaboratorModal isOpen={true} onClose={mockOnClose} />);

    // Switch to Docs
    const docsTab = screen.getByText('collaborators.modal.tabs.docs');
    fireEvent.click(docsTab);

    // Simulate file selection
    const fileInput = screen.getAllByRole('textbox', { hidden: true }).find(el => el.type === 'file'); // Get the first file input (contract)
    // Testing Library file upload
    const file = new File(['dummy content'], 'contract.pdf', { type: 'application/pdf' });

    // We need to find the specific input for the contract. It's the first input of type file.
    const inputs = document.querySelectorAll('input[type="file"]');
    const contractInput = inputs[0];

    fireEvent.change(contractInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file, expect.stringContaining('contracts/new_collab_'));
      expect(toast.success).toHaveBeenCalledWith('Archivo subido correctamente');
    });

    // Check if link appears
    expect(screen.getByText('Ver Contrato Actual')).toBeInTheDocument();
  });
});
