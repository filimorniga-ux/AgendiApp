// ===== INICIO: src/main.jsx =====
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'; // <-- Importar la configuración de i18n aquí

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// ===== FIN: src/main.jsx =====
