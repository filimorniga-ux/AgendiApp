/**
 * mathUtils.js
 * Utilidades matemáticas para la aplicación, garantizando null-safety y previniendo NaNs.
 */

/**
 * Convierte un valor a un número seguro. Si es inválido, nulo o NaN, retorna 0 (o el fallback especificado).
 * @param {any} val - El valor a convertir.
 * @param {number} fallback - Valor por defecto si la conversión falla (por defecto 0).
 * @returns {number} Número seguro.
 */
export const safeNum = (val, fallback = 0) => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  return Number.isNaN(num) || !Number.isFinite(num) ? fallback : num;
};

/**
 * Suma un arreglo de valores, garantizando que ninguno inyecte un NaN en el resultado.
 * @param {Array<any>} arr - Arreglo de valores a sumar.
 * @returns {number} Suma total.
 */
export const safeSum = (arr) => {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((acc, curr) => acc + safeNum(curr), 0);
};
