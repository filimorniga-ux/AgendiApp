import { useCallback } from 'react';
import { GLOBAL_CURRENCY_DATA } from '../lib/currencyData';
import { useAppConfig } from '../context/collections/ConfigContext';

export const useCurrencyFormat = () => {
    const {
        currentLocale
    } = useAppConfig();

    const formatCurrency = useCallback((value) => {
        if (typeof value !== 'number') value = 0;

        // Find the currency code corresponding to the current locale
        const currencyObj = GLOBAL_CURRENCY_DATA.find(c => c.locale === currentLocale);
        const currencyCode = currencyObj ? currencyObj.code : 'CLP'; // Default to CLP if not found

        return new Intl.NumberFormat(currentLocale, {
            style: 'currency',
            currency: currencyCode,
        }).format(value);
    }, [currentLocale]);

    return { formatCurrency };
};
