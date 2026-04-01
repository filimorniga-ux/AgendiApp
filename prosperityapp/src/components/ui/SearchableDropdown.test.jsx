import React from 'react';
import { render, screen, fireEvent } from '../../test/utils';
import { describe, it, expect, vi } from 'vitest';
import SearchableDropdown from './SearchableDropdown';

describe('SearchableDropdown Component', () => {
  const dummyItems = [
    { id: '1', name: 'Miguel Perdomo', price: 1000 },
    { id: '2', name: 'Lia Martinez', stock: 5 },
    { id: '3', name: 'Andres Felipe', stockUnits: 10 }
  ];

  it('renders correctly with placeholder', () => {
    render(<SearchableDropdown items={dummyItems} placeholder="Find User..." onSelect={() => {}} />);
    expect(screen.getByPlaceholderText('Find User...')).toBeInTheDocument();
  });

  it('opens menu on focus and filters items', () => {
    render(<SearchableDropdown items={dummyItems} placeholder="Buscar..." onSelect={() => {}} />);
    const input = screen.getByPlaceholderText('Buscar...');
    
    // Default closed
    expect(screen.queryByText('Miguel Perdomo')).not.toBeInTheDocument();
    
    fireEvent.focus(input);
    expect(screen.getByText('Miguel Perdomo')).toBeInTheDocument();
    
    // Menu is opened via React Portal, it attaches to document.body
    fireEvent.change(input, { target: { value: 'Lia' } });
    
    expect(screen.getByText('Lia Martinez')).toBeInTheDocument();
    expect(screen.queryByText('Miguel Perdomo')).not.toBeInTheDocument();
  });

  it('selects an item and closes the menu', () => {
    const handleSelect = vi.fn();
    render(<SearchableDropdown items={dummyItems} placeholder="Buscar..." onSelect={handleSelect} />);
    
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.focus(input);
    
    const item = screen.getByText('Andres Felipe');
    fireEvent.mouseDown(item); // The component uses onMouseDown to select
    
    expect(handleSelect).toHaveBeenCalledWith(dummyItems[2]);
    expect(input.value).toBe('Andres Felipe');
    
    // Menu should be closed
    expect(screen.queryByText('Lia Martinez')).not.toBeInTheDocument();
  });

  it('handles allowManual input correctly', () => {
    const handleManualInput = vi.fn();
    render(<SearchableDropdown items={dummyItems} placeholder="Buscar..." onSelect={() => {}} allowManual={true} onManualInput={handleManualInput} />);
    
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.focus(input);
    
    fireEvent.change(input, { target: { value: 'Nuevo Usuario' } });
    
    expect(handleManualInput).toHaveBeenCalledWith('Nuevo Usuario');
    expect(screen.getByText('Usar "Nuevo Usuario" como nuevo')).toBeInTheDocument();
  });
});
