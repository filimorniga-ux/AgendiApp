import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RetailProductModal from './RetailProductModal';
import * as db from '../../supabase/db';
import * as DataContext from '../../context/DataContext';

vi.mock('../../supabase/db', () => ({
  sbCreate: vi.fn(),
  sbUpdate: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
}));

// Mock minimal de componentes decoradores que causen errores, aunque usamos componentes limpios
vi.mock('../ui/CurrencyInput', () => ({
  default: ({ value, onChange, name }) => (
    <input 
      data-testid={`currency-${name}`} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
    />
  )
}));

describe('RetailProductModal', () => {
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    DataContext.useData.mockReturnValue({ businessId: 'bus-123' });
  });

  it('no debería renderizar si isOpen es falso', () => {
    const { container } = render(
      <RetailProductModal isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debería renderizar formulario de creación vacío si no hay productToEdit', () => {
    render(
      <RetailProductModal isOpen={true} onClose={mockOnClose} productToEdit={null} />
    );
    
    expect(screen.getByText('modals.retailProduct.newTitle')).toBeInTheDocument();
    
    // Verificar que los inputs están vacíos o tienen valores por defecto
    const nameInput = screen.getByRole('textbox', { name: /modals.retailProduct.name/i });
    expect(nameInput.value).toBe('');
    
    const stockInput = screen.getByLabelText(/modals.retailProduct.stock/i);
    expect(stockInput.value).toBe('0');
    
    const minStockInput = screen.getByLabelText(/modals.retailProduct.minStock/i);
    expect(minStockInput.value).toBe('3');
  });

  it('debería pre-llenar formulario si hay productToEdit (modo edición)', () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'Shampoo Deluxe',
      brand: 'Loreal',
      category: 'Shampoo',
      cost: '10.50',
      price: '25.00',
      stock: 12,
      minStock: 5
    };

    render(
      <RetailProductModal isOpen={true} onClose={mockOnClose} productToEdit={mockProduct} />
    );
    
    expect(screen.getByText('modals.retailProduct.editTitle')).toBeInTheDocument();
    
    const nameInput = screen.getByRole('textbox', { name: /modals.retailProduct.name/i });
    expect(nameInput.value).toBe('Shampoo Deluxe');
    
    const brandInput = screen.getByRole('textbox', { name: /modals.retailProduct.brand/i });
    expect(brandInput.value).toBe('Loreal');
    
    const costInput = screen.getByTestId('currency-cost');
    expect(costInput.value).toBe('10.50');
  });

  it('debería actualizar los estados internos al tipear', async () => {
    const user = userEvent.setup();
    render(
      <RetailProductModal isOpen={true} onClose={mockOnClose} productToEdit={null} />
    );
    
    const nameInput = screen.getByLabelText(/modals.retailProduct.name/i);
    await user.type(nameInput, 'Nuevo Producto');
    expect(nameInput.value).toBe('Nuevo Producto');
  });

  it('debería llamar a sbCreate al guardar en modo creación con parsings correctos', async () => {
    const user = userEvent.setup();
    db.sbCreate.mockResolvedValue({ data: { id: 'new-prod' }, error: null });

    render(
      <RetailProductModal isOpen={true} onClose={mockOnClose} productToEdit={null} />
    );
    
    // Llenar datos requeridos
    await user.type(screen.getByLabelText(/modals.retailProduct.name/i), 'Ceramidas');
    await user.type(screen.getByLabelText(/modals.retailProduct.brand/i), 'Kerastase');
    
    // Mock input change
    const costInput = screen.getByTestId('currency-cost');
    fireEvent.change(costInput, { target: { name: 'cost', value: '15' } });
    
    const priceInput = screen.getByTestId('currency-price');
    fireEvent.change(priceInput, { target: { name: 'price', value: '30' } });

    // Guardar
    const saveButton = screen.getByRole('button', { name: /modals.forms.create/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(db.sbCreate).toHaveBeenCalledWith('retailInventory', {
        name: 'Ceramidas',
        brand: 'Kerastase',
        category: null,
        costPrice: 15,
        salePrice: 30,
        stockCurrent: 0,
        stockMin: 3
      }, 'bus-123');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('debería llamar a sbUpdate al guardar en modo edición', async () => {
    const user = userEvent.setup();
    db.sbUpdate.mockResolvedValue({ data: { id: 'prod-1' }, error: null });

    const mockProduct = { id: 'prod-1', name: 'Shampoo', cost: 10, price: 20, stock: 5 };
    render(
      <RetailProductModal isOpen={true} onClose={mockOnClose} productToEdit={mockProduct} />
    );
    
    const nameInput = screen.getByLabelText(/modals.retailProduct.name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Shampoo Modificado');

    // Clickeamos "Guardar", note the save button says updateChanges if edit mode, or the other
    // But since translation mock returns the key, we search for key
    const saveButton = screen.getByRole('button', { name: /modals.buttons.updateChanges/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(db.sbUpdate).toHaveBeenCalledWith('retailInventory', 'prod-1', expect.objectContaining({
        name: 'Shampoo Modificado',
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('no debería cerrar si hay error en Supabase', async () => {
    const user = userEvent.setup();
    db.sbCreate.mockResolvedValue({ data: null, error: new Error('DB Error') });

    render(
      <RetailProductModal isOpen={true} onClose={mockOnClose} productToEdit={null} />
    );
    
    const saveButton = screen.getByRole('button', { name: /modals.forms.create/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(db.sbCreate).toHaveBeenCalled();
      // OnClose shouldn't be called because throwing error blocks it
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
