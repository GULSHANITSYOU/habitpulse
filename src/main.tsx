import { ClerkProvider } from '@clerk/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const DEFAULT_CLERK_PUBLISHABLE_KEY = 'pk_live_Y2xlcmsuZ3Vsc2hhbml0c3lvdS53b3JrZXJzLmRldiQ'
const PUBLISHABLE_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_PUBLISHABLE_KEY)?.trim()

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key: Ensure VITE_CLERK_PUBLISHABLE_KEY is configured.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
)