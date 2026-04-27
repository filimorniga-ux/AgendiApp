import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../test/utils';
import { vi } from 'vitest';
import ServiceModal from '../ServiceModal';
import * as dbMock from '../../../supabase/db';
import * as BusinessContextMock from '../../../context/BusinessContext';
import toast from 'react-hot-toast';

// Mock Supabase DB calls
vi.mock('../../../supabase/db', () => ({
  sbCreate: vi.fn(),
  sbUpdate: vi.fn(),
}));

// Mock BusinessContext
vi.mock('../../../context/BusinessContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useBusiness: vi.fn(),
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock CurrencyInput (simplify testing inner workings)
vi.mock('../../ui/CurrencyInput', () => ({
  default: ({ value, onChange, placeholder, name, id }) => (
    <input
      data-testid="currency-input"
      type="text"
      name={name}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
}));

describe('ServiceModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    BusinessContextMock.useBusiness.mockReturnValue({ businessId: 'test-business-id' });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ServiceModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders create mode correctly', () => {
    render(<ServiceModal isOpen={true} onClose={mockOnClose} />);

    // Header
    expect(screen.getByText('modals.service.newTitle')).toBeInTheDocument();

    // Inputs
    expect(screen.getByPlaceholderText('modals.service.placeholders.name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('modals.service.placeholders.category')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('modals.service.placeholders.price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('modals.service.placeholders.duration')).toBeInTheDocument();

    // Buttons
    expect(screen.getByText('common.save')).toBeInTheDocument();
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
  });

  it('renders edit mode correctly and populates data', () => {
    const mockService = {
      id: 'service-123',
      name: 'Haircut',
      category: 'Cortes y Lavado',
      price: '15000',
      duration: '45',
    };

    render(<ServiceModal isOpen={true} onClose={mockOnClose} serviceToEdit={mockService} />);

    // Header
    expect(screen.getByText('modals.service.editTitle')).toBeInTheDocument();

    // Inputs should have correct values
    expect(screen.getByDisplayValue('Haircut')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cortes y Lavado')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
  });

  it('handles validation error if name or price is missing', () => {
    render(<ServiceModal isOpen={true} onClose={mockOnClose} />);

    // Name is empty, price is empty initially
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    expect(toast.error).toHaveBeenCalledWith('modals.errors.completeFields');
    expect(dbMock.sbCreate).not.toHaveBeenCalled();
  });

  it('handles successful creation', async () => {
    dbMock.sbCreate.mockResolvedValueOnce({ error: null });

    render(<ServiceModal isOpen={true} onClose={mockOnClose} />);

    // Fill form
    const nameInput = screen.getByPlaceholderText('modals.service.placeholders.name');
    fireEvent.change(nameInput, { target: { value: 'Manicure', name: 'name' } });

    const priceInput = screen.getByTestId('currency-input');
    fireEvent.change(priceInput, { target: { value: '12000', name: 'price' } });

    const durationInput = screen.getByPlaceholderText('modals.service.placeholders.duration');
    fireEvent.change(durationInput, { target: { value: '30', name: 'duration' } });

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dbMock.sbCreate).toHaveBeenCalledWith(
        'services',
        expect.objectContaining({
          name: 'Manicure',
          category: null, // empty string converts to null
          price: 12000,
          durationMin: 30,
        }),
        'test-business-id'
      );
      expect(toast.success).toHaveBeenCalledWith('common.success');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles successful update', async () => {
    dbMock.sbUpdate.mockResolvedValueOnce({ error: null });

    const mockService = {
      id: 'service-123',
      name: 'Haircut',
      category: 'Cortes y Lavado',
      price: '15000',
      duration: '45',
    };

    render(<ServiceModal isOpen={true} onClose={mockOnClose} serviceToEdit={mockService} />);

    // Change price
    const priceInput = screen.getByTestId('currency-input');
    fireEvent.change(priceInput, { target: { value: '16000', name: 'price' } });

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dbMock.sbUpdate).toHaveBeenCalledWith(
        'services',
        'service-123',
        expect.objectContaining({
          name: 'Haircut',
          category: 'Cortes y Lavado',
          price: 16000,
          durationMin: 45,
        })
      );
      expect(toast.success).toHaveBeenCalledWith('common.success');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    dbMock.sbCreate.mockRejectedValueOnce(new Error('Network error'));

    render(<ServiceModal isOpen={true} onClose={mockOnClose} />);

    // Fill required
    const nameInput = screen.getByPlaceholderText('modals.service.placeholders.name');
    fireEvent.change(nameInput, { target: { value: 'Nails', name: 'name' } });

    const priceInput = screen.getByTestId('currency-input');
    fireEvent.change(priceInput, { target: { value: '5000', name: 'price' } });

    // Submit
    const saveButton = screen.getByText('common.save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('common.error');
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ServiceModal isOpen={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('common.cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
