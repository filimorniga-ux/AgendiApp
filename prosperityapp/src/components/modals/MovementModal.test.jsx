import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MovementModal from './MovementModal';
import * as DataContext from '../../context/DataContext';
import * as db from '../../supabase/db';

vi.mock('../../supabase/db', () => ({
  sbCreate: vi.fn(),
  sbUpdate: vi.fn(),
  sbDelete: vi.fn(),
}));

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
}));

// Mockeamos algunos contextos hijos que no nos importan profundamente para este test unitario
vi.mock('../../hooks/useStorage', () => ({
  useStorage: () => ({ uploadFile: vi.fn(), progress: 0, isUploading: false })
}));
vi.mock('../../hooks/useBarcodeLookup', () => ({
  useBarcodeLookup: () => ({ lookup: vi.fn(), loading: false })
}));
vi.mock('./TechCalculatorModal', () => ({
  default: () => <div data-testid="tech-modal" />
}));
vi.mock('./SalesCommissionModal', () => ({
  default: () => <div data-testid="commission-modal" />
}));
vi.mock('./PrintPreviewModal', () => ({
  default: () => <div data-testid="print-preview" />
}));
// Supabase client can be mocked simply
vi.mock('../../supabase/client', () => ({
  supabase: {}
}));

describe('MovementModal', () => {
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    DataContext.useData.mockReturnValue({
      businessId: 'bus-123',
      clients: [{ id: 'c1', name: 'John Doe' }],
      collaborators: [{ id: 'col1', name: 'Miguel', role: 'barbero' }],
      services: [{ id: 's1', name: 'Corte de Pelo', price: 10 }],
      retailInventory: [{ id: 'p1', name: 'Gel', salePrice: 5, stockCurrent: 10 }],
      config: [{ id: 'settings', requireReceiptUpload: false }],
      movements: []
    });
  });

  it('no renderiza si isOpen es falso', () => {
    const { container } = render(
      <MovementModal isOpen={false} onClose={mockOnClose} preselectedCollab={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza correctamente el modal de caja cuando isOpen es true', () => {
    render(
      <MovementModal isOpen={true} onClose={mockOnClose} preselectedCollab={null} />
    );

    // Titulo de la modal
    expect(screen.getByText(/modals.registerTitle/i)).toBeInTheDocument();
  });

  it('renderiza acordeones principales de servicios y productos', () => {
    render(
      <MovementModal isOpen={true} onClose={mockOnClose} preselectedCollab={null} />
    );

    // Debe mostrar acordeón de servicios y acordeón de productos
    expect(screen.getByText(/modals.accordions.services/i)).toBeInTheDocument();
    expect(screen.getByText(/modals.accordions.products/i)).toBeInTheDocument();
  });
});
