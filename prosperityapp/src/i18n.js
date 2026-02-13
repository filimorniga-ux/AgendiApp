// ===== INICIO: src/i18n.js (Ajustado) =====
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    debug: true,

    // --- AJUSTE: Mapear 'es-CO', 'es-MX' a 'es' ---
    supportedLngs: ['es', 'en', 'pt', 'fr', 'it', 'de'],
    nonExplicitSupportedLngs: true, // Permite 'es-CO' si 'es' está soportado
    load: 'languageOnly', // Carga solo 'es', ignora el código de país '-CO'

    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    }
  });

export default i18n;
// ===== FIN: src/i18n.js =====