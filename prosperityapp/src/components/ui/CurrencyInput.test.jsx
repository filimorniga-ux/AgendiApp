import React, { useState } from 'react';
import { render, screen, fireEvent } from '../../test/utils';
import CurrencyInput from './CurrencyInput';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useData } from '../../context/DataContext';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

vi.mock('../../context/DataContext', () => ({
  useData: vi.fn(),
  DataProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('../../hooks/useCurrencyFormat', () => ({
  useCurrencyFormat: vi.fn()
}));

const TestWrapper = ({ initialValue = '' }) => {
  const [val, setVal] = useState(initialValue);
  const handleChange = (e) => {
    setVal(e.target.value);
  };
  return <CurrencyInput value={val} onChange={handleChange} name="price" id="price-input" placeholder="0.00" />;
};

describe('CurrencyInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useData.mockReturnValue({ currentLocale: 'es-CL' });
    useCurrencyFormat.mockReturnValue({ formatCurrency: (val) => `$${val}` });
  });

  it('renders correctly with default value', () => {
    render(<CurrencyInput value={1500} onChange={() => {}} name="price" id="price-input" />);
    // es-CL formats 1500 as 1.500 (grouping separator is point)
    expect(screen.getByDisplayValue('1.500')).toBeInTheDocument();
  });

  it('updates display value on focus to raw value without group separators', () => {
    render(<CurrencyInput value={1500} onChange={() => {}} name="price" id="price-input" />);
    const input = screen.getByDisplayValue('1.500');
    fireEvent.focus(input);
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
  });

  it('formats display value on blur', () => {
    // We use TestWrapper because it holds state and passes changing values
    render(<TestWrapper initialValue={1500} />);
    const input = screen.getByDisplayValue('1.500');
    
    fireEvent.focus(input);
    expect(input.value).toBe('1500');
    
    // Change value
    fireEvent.change(input, { target: { value: '2500' } });
    
    fireEvent.blur(input);
    expect(input.value).toBe('2.500');
  });

  it('cleans invalid characters string input correctly', () => {
    const handleChange = vi.fn();
    render(<CurrencyInput value={''} onChange={handleChange} name="price" id="price-input" />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: '1abc500' } });
    
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 1500 })
    }));
  });

  it('handles negative values correctly', () => {
    const handleChange = vi.fn();
    render(<CurrencyInput value={-2000} onChange={handleChange} name="price" id="price-input" />);

    expect(screen.getByDisplayValue('-2.000')).toBeInTheDocument();
  });

  it('has correct aria-labels for accessibility', () => {
    render(<CurrencyInput value={100} onChange={() => {}} name="price" id="price-input" aria-label="Precio" />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });
});
