import React, { useState, useEffect, useRef } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useData } from '../../context/DataContext';
import { GLOBAL_CURRENCY_DATA } from '../../lib/currencyData';

const CurrencyInput = ({
    value,
    onChange,
    name,
    id,
    placeholder,
    className,
    required = false,
    disabled = false,
    min = 0
}) => {
    const { formatCurrency } = useCurrencyFormat();
    const { currentLocale } = useData();
    const [displayValue, setDisplayValue] = useState('');
    const inputRef = useRef(null);

    // Helper to get currency symbol and decimal separator
    const getCurrencyDetails = () => {
        const currencyObj = GLOBAL_CURRENCY_DATA.find(c => c.locale === currentLocale) || GLOBAL_CURRENCY_DATA[0];
        const parts = new Intl.NumberFormat(currentLocale, { style: 'currency', currency: currencyObj.code }).formatToParts(1000.1);
        const decimalPart = parts.find(p => p.type === 'decimal');
        const decimalSeparator = decimalPart ? decimalPart.value : '.';
        const groupPart = parts.find(p => p.type === 'group');
        const groupSeparator = groupPart ? groupPart.value : ',';
        return { symbol: currencyObj.symbol, decimalSeparator, groupSeparator };
    };

    const { symbol, decimalSeparator, groupSeparator } = getCurrencyDetails();

    // Format value for display when prop changes
    useEffect(() => {
        // Prevent overwriting user input while editing
        if (document.activeElement === inputRef.current) return;

        if (value === '' || value === null || value === undefined) {
            setDisplayValue('');
        } else {
            const rawValue = parseFloat(value);
            if (!isNaN(rawValue)) {
                const numberFormatter = new Intl.NumberFormat(currentLocale, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                });
                setDisplayValue(numberFormatter.format(rawValue));
            } else {
                setDisplayValue('');
            }
        }
    }, [value, currentLocale]);

    const handleChange = (e) => {
        const inputValue = e.target.value;

        // 1. Remove invalid characters (keep numbers, decimal separator, minus sign)
        // We explicitly remove group separators by NOT including them in the allowed regex
        const escapedDecimal = decimalSeparator === '.' ? '\\.' : decimalSeparator;
        const regex = new RegExp(`[^0-9${escapedDecimal}-]`, 'g');
        let cleanInput = inputValue.replace(regex, '');

        // 2. Handle multiple decimal separators (keep only first)
        const parts = cleanInput.split(decimalSeparator);
        if (parts.length > 2) {
            cleanInput = parts[0] + decimalSeparator + parts.slice(1).join('');
        }

        // 3. Update local display value immediately
        setDisplayValue(cleanInput);

        // 4. Convert to standard number (dot decimal) for parent
        let standardValue = cleanInput;
        if (decimalSeparator !== '.') {
            standardValue = cleanInput.replace(decimalSeparator, '.');
        }

        // 5. Parse to float
        // Handle cases like "1." or "-" which are valid intermediate states but not valid numbers
        let numericValue = '';
        if (standardValue !== '' && standardValue !== '-' && standardValue !== '.') {
            numericValue = parseFloat(standardValue);
        }

        // 6. Call parent
        onChange({
            target: {
                name: name,
                value: numericValue,
                id: id
            }
        });
    };

    const handleBlur = () => {
        if (value !== '' && value !== null && value !== undefined && !isNaN(value)) {
            const numberFormatter = new Intl.NumberFormat(currentLocale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
            setDisplayValue(numberFormatter.format(value));
        }
    };

    const handleFocus = () => {
        // On focus, show raw number without group separators for easier editing
        if (value !== '' && value !== null && value !== undefined && !isNaN(value)) {
            let raw = value.toString();
            if (decimalSeparator !== '.') {
                raw = raw.replace('.', decimalSeparator);
            }
            setDisplayValue(raw);
        }
    };

    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none">
                {symbol}
            </span>
            <input
                ref={inputRef}
                type="text" // Must be text to handle localized separators
                name={name}
                id={id}
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                placeholder={placeholder}
                className={`pl-8 ${className}`} // Add padding left for symbol
                required={required}
                disabled={disabled}
                autoComplete="off"
                inputMode="decimal"
            />
        </div>
    );
};

export default CurrencyInput;
