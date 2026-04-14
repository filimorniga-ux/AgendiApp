import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('🚨 ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          background: 'var(--color-bg-main, #131317)',
          color: 'var(--color-text-main, #fff)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '500px',
            background: 'var(--color-bg-card, #1E1E24)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid var(--color-border, #2d2d3a)',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              ⚠️ Algo salió mal
            </h2>
            <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Ocurrió un error inesperado. Intenta recargar la página.
            </p>
            <details style={{
              textAlign: 'left',
              background: '#0d0d12',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.75rem',
              color: '#ef4444',
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              <summary style={{ cursor: 'pointer', color: '#a0aec0' }}>Detalles técnicos</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#D4A853',
                color: '#1a202c',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
