/**
 * BarcodeScannerButton.jsx
 * Botón que activa/desactiva el BarcodeScanner en modo teclado.
 * Se reutiliza en InventarioPage, InventarioTecnicoPage y CajaDiariaPage.
 *
 * Props:
 *  - active: boolean
 *  - onToggle()
 *  - label?: string
 */
export function BarcodeScannerButton({ active, onToggle, label = 'Escanear' }) {
  return (
    <button
      className={`bc-btn ${active ? 'bc-btn--active' : ''}`}
      onClick={onToggle}
      title={active ? 'Desactivar lector de código de barras' : 'Activar lector de código de barras'}
      aria-pressed={active}
    >
      {/* Barcode icon (inline SVG, sin dependencias) */}
      <svg
        width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 5v3M3 16v3M8 5v14M12 5v14M16 5v14M21 5v3M21 16v3" />
      </svg>
      <span>{active ? 'Scanner ON' : label}</span>
      {active && <span className="bc-btn__pulse" aria-hidden="true" />}
    </button>
  );
}
