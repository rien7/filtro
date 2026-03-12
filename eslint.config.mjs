// @ts-check
import { defineConfig } from 'eslint-config-hyoban'

export default defineConfig(
  {
    ignores: ['**/*.md'],
  },
  {
    files: [
      'src/**/*.{ts,tsx}',
      'playground/**/*.{ts,tsx}',
      'vite.config.ts',
    ],
    rules: {
      'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['playground/internal/calendar.tsx'],
    rules: {
      'react/no-nested-component-definitions': 'off',
    },
  },
)
