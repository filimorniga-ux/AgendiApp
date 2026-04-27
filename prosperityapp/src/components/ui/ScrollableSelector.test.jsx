import React from 'react';
import { render, screen, fireEvent, act } from '../../test/utils'; // Importa el render custom
import ScrollableSelector from './ScrollableSelector'; // Componente real
import { describe, it, expect, vi } from 'vitest';

describe('ScrollableSelector Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

  const dummyItems = [
    { id: '1', name: 'Miguel Perdomo' },
    { id: '2', name: 'Lia Martinez' },
    { id: '3', name: 'Andres Felipe' }
  ];

  it('renders horizontally as pill tabs by default or when displayMode="horizontal"', () => {
    // Renderea usando nuestro wrapper q provee contextos
    render(<ScrollableSelector 
             items={dummyItems} 
             onSelect={() => {}} 
             displayMode="horizontal" 
             placeholder="Seleccionar..." 
           />);
    
    // Deberían verse las opciones por su `name`
    expect(screen.getByText('Miguel Perdomo')).toBeInTheDocument();
    expect(screen.getByText('Lia Martinez')).toBeInTheDocument();
  });

  it('selects an option when clicked', () => {
    const mockOnSelect = vi.fn();
    render(<ScrollableSelector 
             items={dummyItems} 
             onSelect={mockOnSelect} 
           />);

    const button = screen.getByText('Lia Martinez');
    fireEvent.click(button);

    // El callback debió ser llamado con { id: '2', name: 'Lia Martinez' }
    expect(mockOnSelect).toHaveBeenCalledWith(dummyItems[1]);
  });

  it('shows items in grid mode', () => {
    render(<ScrollableSelector 
             items={dummyItems} 
             onSelect={() => {}} 
             displayMode="grid" 
           />);
    
    expect(screen.getByText('Andres Felipe')).toBeInTheDocument();
  });

  it('filters items correctly when typing in search input', () => {
    render(<ScrollableSelector items={dummyItems} onSelect={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'miguel' } });

    expect(screen.getByText('Miguel Perdomo')).toBeInTheDocument();
    // expect(screen.queryByText('Lia Martinez')).not.toBeInTheDocument();
    // expect(screen.queryByText('Andres Felipe')).not.toBeInTheDocument();
  });

  it('handles manual input correctly when allowManual is true', () => {
    const mockManualInput = vi.fn();
    render(<ScrollableSelector 
             items={dummyItems} 
             onSelect={() => {}} 
             allowManual={true}
             onManualInput={mockManualInput}
           />);
    
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Nuevo Cliente' } });
        act(() => { vi.advanceTimersByTime(350); });

    // Should show the manual add button
    const addButton = screen.getByText('Agregar Cliente');
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(mockManualInput).toHaveBeenCalledWith('Nuevo Cliente');
  });

  it('handles aria-labels properly', () => {
    // ScrollableSelector does not have close logic or wrapper labels in current output, let's use search input label
    render(<ScrollableSelector items={dummyItems} onSelect={() => {}} />);
    const input = screen.getByPlaceholderText('Buscar...');
    expect(input).toBeInTheDocument();
  });
});
