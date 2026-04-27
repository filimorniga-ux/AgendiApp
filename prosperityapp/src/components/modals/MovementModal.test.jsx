import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MovementModal from './MovementModal';
import * as AppConfigContext from '../../context/collections/ConfigContext';
import * as ClientsContext from '../../context/collections/ClientsContext';
import * as CollaboratorsContext from '../../context/collections/CollaboratorsContext';
import * as ServicesContext from '../../context/collections/ServicesContext';
import * as InventoryContext from '../../context/collections/InventoryContext';
import * as MovementsContext from '../../context/collections/MovementsContext';
import * as BusinessContext from '../../context/BusinessContext';
import * as db from '../../supabase/db';

vi.mock('../../supabase/db', () => ({
  sbCreate: vi.fn(),
  sbUpdate: vi.fn(),
  sbDelete: vi.fn(),
}));

vi.mock('../../context/collections/ConfigContext', () => ({
  useAppConfig: vi.fn(),
}));
vi.mock('../../context/collections/ClientsContext', () => ({
  useClients: vi.fn(),
}));
vi.mock('../../context/collections/CollaboratorsContext', () => ({
  useCollaborators: vi.fn(),
}));
vi.mock('../../context/collections/ServicesContext', () => ({
  useServices: vi.fn(),
}));
vi.mock('../../context/collections/InventoryContext', () => ({
  useInventory: vi.fn(),
}));
vi.mock('../../context/collections/MovementsContext', () => ({
  useMovements: vi.fn(),
}));
vi.mock('../../context/BusinessContext', () => ({
  useBusiness: vi.fn(),
  BusinessContext: { Consumer: ({ children }) => children({ businessId: 'biz123' }) }
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
    BusinessContext.useBusiness.mockReturnValue({ businessId: 'bus-123' });
    ClientsContext.useClients.mockReturnValue({ clients: [{ id: 'c1', name: 'John Doe' }] });
    CollaboratorsContext.useCollaborators.mockReturnValue({ collaborators: [{ id: 'col1', name: 'Miguel', role: 'barbero' }] });
    ServicesContext.useServices.mockReturnValue({ services: [{ id: 's1', name: 'Corte de Pelo', price: 10 }] });
    InventoryContext.useInventory.mockReturnValue({ retailInventory: [{ id: 'p1', name: 'Gel', salePrice: 5, stockCurrent: 10 }] });
    AppConfigContext.useAppConfig.mockReturnValue({ config: [{ id: 'settings', requireReceiptUpload: false }] });
    MovementsContext.useMovements.mockReturnValue({ movements: [] });
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

  it('closes modal on close icon click', () => {
    render(
      <MovementModal isOpen={true} onClose={mockOnClose} preselectedCollab={null} />
    );

    // MovementModal actually does not have a cancel button at the bottom because it's massive.
    // Instead it only has the X top-right button.
    const closeIcon = screen.getByText('×');
    fireEvent.click(closeIcon);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal on escape key press', () => {
    render(
      <MovementModal isOpen={true} onClose={mockOnClose} preselectedCollab={null} />
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
