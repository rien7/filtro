import '../src/presets/default-theme/styles.css'
import './styles.css'

import { NuqsAdapter } from 'nuqs/adapters/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { PlaygroundApp } from './playground-app'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Missing root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <NuqsAdapter>
      <PlaygroundApp />
    </NuqsAdapter>
  </StrictMode>,
)
