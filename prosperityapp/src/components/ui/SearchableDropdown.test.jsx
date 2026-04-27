import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '../../test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchableDropdown from './SearchableDropdown';

// Mock feather icons since it runs outside typical context
vi.mock('feather-icons', () => ({
    default: {
        replace: vi.fn(),
    },
}));

const mockItems = [
    { id: '1', name: 'Item A', price: 100, stock: 10 },
    { id: '2', name: 'Item B', price: 200, stockUnits: 5 },
    { id: '3', name: 'Other C', price: 300, stock: 0 },
];

describe('SearchableDropdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    let mockOnSelect;
    let mockOnManualInput;

    beforeEach(() => {
        mockOnSelect = vi.fn();
        mockOnManualInput = vi.fn();
        vi.clearAllMocks();
    });

    it('renders with placeholder', () => {
        render(
            <SearchableDropdown
                items={mockItems}
                placeholder="Search..."
                onSelect={mockOnSelect}
            />
        );

        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('opens dropdown on focus and shows all items', () => {
        render(
            <SearchableDropdown
                items={mockItems}
                placeholder="Search..."
                onSelect={mockOnSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search...');
        fireEvent.focus(input);

        // Since it uses portal, it should render somewhere in document.body
        expect(screen.getByText('Item A')).toBeInTheDocument();
        expect(screen.getByText('Item B')).toBeInTheDocument();
        expect(screen.getByText('Other C')).toBeInTheDocument();
    });

    it('filters items based on input', async () => {
        render(
            <SearchableDropdown
                items={mockItems}
                placeholder="Search..."
                onSelect={mockOnSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search...');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'Item' } });
        act(() => { vi.advanceTimersByTime(350); });

        await waitFor(() => {
            expect(screen.getByText('Item A')).toBeInTheDocument();
            expect(screen.getByText('Item B')).toBeInTheDocument();
            // 'Other C' shouldn't be matched
            expect(screen.queryByText('Other C')).not.toBeInTheDocument();
        });
    });

    it('selects an item and updates input value', () => {
        render(
            <SearchableDropdown
                items={mockItems}
                placeholder="Search..."
                onSelect={mockOnSelect}
            />
        );

        const input = screen.getByPlaceholderText('Search...');
        fireEvent.focus(input);

        const itemA = screen.getByText('Item A');
        // Dropdown uses onMouseDown
        fireEvent.mouseDown(itemA);

        expect(mockOnSelect).toHaveBeenCalledWith(mockItems[0]);
        expect(input.value).toBe('Item A');
        // Menu should be closed
        expect(screen.queryByText('Item B')).not.toBeInTheDocument();
    });

    it('closes on outside click', () => {
        render(
            <div>
                <div data-testid="outside">Outside Element</div>
                <SearchableDropdown
                    items={mockItems}
                    placeholder="Search..."
                    onSelect={mockOnSelect}
                />
            </div>
        );

        const input = screen.getByPlaceholderText('Search...');
        fireEvent.focus(input);

        expect(screen.getByText('Item A')).toBeInTheDocument();

        // Click outside
        fireEvent.mouseDown(document.body);

        expect(screen.queryByText('Item A')).not.toBeInTheDocument();
    });

    it('clears selection on clear button click', () => {
        render(
            <SearchableDropdown
                items={mockItems}
                placeholder="Search..."
                onSelect={mockOnSelect}
                initialValue={mockItems[0]}
            />
        );

        const input = screen.getByPlaceholderText('Search...');
        expect(input.value).toBe('Item A');

        // Look for the clear button (which is rendered when selectedItem is present)
        const clearButton = screen.getByRole('button');
        fireEvent.mouseDown(clearButton);

        expect(mockOnSelect).toHaveBeenCalledWith(null);
        expect(input.value).toBe('');
    });

    it('handles manual input when allowManual is true', async () => {
        render(
            <SearchableDropdown
                items={mockItems}
                placeholder="Search..."
                onSelect={mockOnSelect}
                allowManual={true}
                onManualInput={mockOnManualInput}
            />
        );

        const input = screen.getByPlaceholderText('Search...');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'New Item' } });
        act(() => { vi.advanceTimersByTime(350); });

        await waitFor(() => {
            expect(mockOnManualInput).toHaveBeenCalledWith('New Item');
            expect(screen.getByText('Usar "New Item" como nuevo')).toBeInTheDocument();
        });
    });

    it('handles disabled state', () => {
        render(
            <SearchableDropdown
                items={mockItems}
                placeholder="Search..."
                onSelect={mockOnSelect}
                disabled={true}
            />
        );

        const input = screen.getByPlaceholderText('Search...');
        expect(input).toBeDisabled();

        fireEvent.focus(input);
        expect(screen.queryByText('Item A')).not.toBeInTheDocument(); // Menu doesn't open
    });
});
