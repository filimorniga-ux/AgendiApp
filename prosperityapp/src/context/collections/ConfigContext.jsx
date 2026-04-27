import React, { createContext, useContext, useMemo, useState } from 'react';
import { useSupabaseCollection } from '../../hooks/useSupabaseCollection';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const { data: config, loading, error } = useSupabaseCollection('config');

  const [currentLocale, setCurrentLocale] = useState('es-CL');
  const [currentCurrencySymbol, setCurrentCurrencySymbol] = useState('$');
  
  const setCurrentCurrency = (locale, symbol) => {
    setCurrentLocale(locale);
    setCurrentCurrencySymbol(symbol);
  };

  const brandName = config?.[0]?.brandName || 'AgendiApp';
  const logoUrl = config?.[0]?.logoUrl || null;

  const value = useMemo(() => ({
    config,
    loading,
    error,
    currentLocale,
    currentCurrencySymbol,
    setCurrentCurrency,
    brandName,
    logoUrl
  }), [config, loading, error, currentLocale, currentCurrencySymbol, brandName, logoUrl]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within a ConfigProvider');
  }
  return context;
};
