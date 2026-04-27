/**
 * PhoneInput — Input de teléfono inteligente con validación por país
 * 
 * Usa libphonenumber-js para:
 * - Detectar formato automático según código de país (CO, MX, US, etc.)
 * - Validar números en tiempo real
 * - Almacenar en formato E.164 (+573012345678) para WhatsApp links
 * - Mostrar indicador visual de validez (✓ verde / ✗ rojo)
 * 
 * Compatible con el design system existente de AgendiApp.
 * Usa las mismas clases CSS que los inputs de ConfiguracionPage.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountryCallingCode,
  getExampleNumber,
  AsYouType,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

// Mapping de emojis de bandera por código ISO
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const PhoneInput = ({
  value = '',
  onChange,
  countryCode = '',
  name = 'phone',
  id,
  label,
  placeholder,
  className = '',
  required = false,
  disabled = false,
  showWhatsAppIcon = false,
  helperText,
  error: externalError,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(null); // null = no validado, true/false
  const [internalError, setInternalError] = useState('');

  // Código de llamada del país
  const callingCode = useMemo(() => {
    try {
      return countryCode ? `+${getCountryCallingCode(countryCode)}` : '';
    } catch {
      return '';
    }
  }, [countryCode]);

  // Placeholder dinámico basado en el país
  const dynamicPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    if (!countryCode) return 'Selecciona un país primero';
    try {
      const example = getExampleNumber(countryCode, examples);
      if (example) {
        // Mostrar solo la parte nacional como placeholder
        return example.formatNational();
      }
    } catch {
      // fallback silencioso
    }
    return `Ej: ${callingCode} ...`;
  }, [countryCode, placeholder, callingCode]);

  // Formatear como se escribe (as you type)
  const formatAsYouType = useCallback(
    (input) => {
      if (!input || !countryCode) return input;
      try {
        const asYouType = new AsYouType(countryCode);
        return asYouType.input(input);
      } catch {
        return input;
      }
    },
    [countryCode]
  );

  // Sincronizar valor externo → display
  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      setIsValid(null);
      return;
    }
    // Si ya tiene formato E.164, mostrar en formato nacional
    try {
      const parsed = parsePhoneNumber(value, countryCode || undefined);
      if (parsed) {
        setDisplayValue(parsed.formatNational());
        setIsValid(parsed.isValid());
        return;
      }
    } catch {
      // No es un número parseable, mostramos tal cual
    }
    setDisplayValue(value);
  }, [value, countryCode]);

  // Manejar cambio de input
  const handleChange = (e) => {
    const raw = e.target.value;

    // Permitir solo dígitos, +, espacios, y paréntesis
    const cleaned = raw.replace(/[^\d+\s()-]/g, '');

    // Formatear mientras escribe
    const formatted = formatAsYouType(cleaned);
    setDisplayValue(formatted);

    // Validar y convertir a E.164
    let e164 = cleaned;
    let valid = null;

    if (cleaned.length > 3) {
      try {
        // Intentar parsear con el country code
        const fullNumber = cleaned.startsWith('+')
          ? cleaned
          : `${callingCode}${cleaned.replace(/\D/g, '')}`;

        const parsed = parsePhoneNumber(fullNumber, countryCode || undefined);

        if (parsed) {
          valid = parsed.isValid();
          e164 = parsed.format('E.164'); // +573012345678
          if (!valid) {
            setInternalError('Número incompleto o inválido');
          } else {
            setInternalError('');
          }
        }
      } catch {
        valid = false;
        e164 = cleaned;
      }
    } else {
      setInternalError('');
    }

    setIsValid(valid);

    // Reportar al padre el valor en E.164
    if (onChange) {
      onChange({
        target: {
          name,
          value: e164,
          id: id || name,
        },
        isValid: valid,
        formatted: formatted,
        e164: e164,
        nationalNumber: cleaned.replace(/\D/g, ''),
      });
    }
  };

  // Reset cuando cambia el país
  useEffect(() => {
    if (value && countryCode) {
      // Re-validar con el nuevo country
      try {
        const parsed = parsePhoneNumber(value, countryCode);
        if (parsed) {
          setIsValid(parsed.isValid());
        }
      } catch {
        setIsValid(null);
      }
    }
  }, [countryCode]);

  const errorMessage = externalError || internalError;
  const showValidation = displayValue.length > 3;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id || name}
          className="text-sm font-medium text-text-main flex items-center gap-2"
        >
          {showWhatsAppIcon && (
            <svg
              className="w-4 h-4 text-[#25D366]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          )}
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Prefijo: bandera + código de país */}
        {countryCode && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-sm select-none z-10">
            <span className="text-base leading-none">
              {getFlagEmoji(countryCode)}
            </span>
            <span className="text-text-muted text-xs">{callingCode}</span>
          </span>
        )}

        <input
          type="tel"
          id={id || name}
          name={name}
          value={displayValue}
          onChange={handleChange}
          placeholder={dynamicPlaceholder}
          disabled={disabled || !countryCode}
          required={required}
          autoComplete="tel"
          inputMode="tel"
          className={`w-full bg-bg-tertiary border rounded p-2 text-text-main focus:outline-none transition-colors ${
            countryCode ? 'pl-[5.5rem]' : 'pl-3'
          } ${
            showValidation && isValid === true
              ? 'border-green-500 focus:border-green-500'
              : showValidation && isValid === false
              ? 'border-red-400 focus:border-red-400'
              : 'border-border-main focus:border-accent'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        />

        {/* Indicador de validez */}
        {showValidation && isValid !== null && (
          <span
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold ${
              isValid ? 'text-green-500' : 'text-red-400'
            }`}
          >
            {isValid ? '✓' : '✗'}
          </span>
        )}
      </div>

      {/* Error o helper text */}
      {errorMessage ? (
        <p className="text-xs text-red-400">{errorMessage}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};

export default PhoneInput;
