import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import base44 from '@base44/vite-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const IGNORED = [
  '**/components/internal_index/**',
  '**/components/mobile/**',
  '**/components/security/README_MFA_ROUTING*',
  '**/components/mobile/MobileLayoutFix.css.jsx',
  '**/components/mobile/MobileOptimizationSummary.md.jsx',
  '**/*.md.jsx',
  '**/*.json.jsx',
  '**/*.css.jsx',
]

export default defineConfig({
  plugins: [
    react({
      exclude: IGNORED,
    }),
    base44({
      exclude: IGNORED,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      external: IGNORED,
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-select'],
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-base44': ['@base44/sdk']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@base44/sdk'],
    exclude: IGNORED,
  }
})