import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initI18n } from './lib/i18n'
import { useStore } from './lib/store'
import './index.css'

// Inicializa i18n con el idioma persistido antes del primer render;
// solo se descarga el chunk del idioma activo (los demás cargan on demand)
initI18n(useStore.getState().uiLanguage).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
