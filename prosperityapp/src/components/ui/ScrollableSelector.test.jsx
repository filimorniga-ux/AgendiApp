import React from 'react';
import { render, screen, fireEvent } from '../../test/utils'; // Importa el render custom
import ScrollableSelector from './ScrollableSelector'; // Componente real
import { describe, it, expect, vi } from 'vitest';

describe('ScrollableSelector Component', () => {
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
});
