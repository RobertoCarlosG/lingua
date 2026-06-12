import '@testing-library/jest-dom/vitest'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from '../locales/es/common.json'

// i18n con recursos en memoria: los componentes bajo test renderizan
// los textos en español sin cargar chunks dinámicos
await i18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: ['common'],
  defaultNS: 'common',
  resources: { es: { common: es } },
  interpolation: { escapeValue: false },
})
