import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Brauzer xotirani tozalab yubormasligi uchun "doimiy saqlash" so'raymiz
void navigator.storage?.persist?.()

// StrictMode ishlatilmaydi: u dev rejimda effektlarni ikki marta chaqiradi
// va Sheet'ning tarix (history) bilan ishlashini buzadi
createRoot(document.getElementById('root')!).render(<App />)
