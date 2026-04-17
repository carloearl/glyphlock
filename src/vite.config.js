import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import base44 from '@base44/vite-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ghost files = platform-injected markdown/JSON/CSS files given invalid .jsx extensions.
// Pattern targets ONLY those specific files (by double-extension) + the entire
// internal_index directory (which contains only ghost reports).
// Real components in mobile/ and security/ remain fully usable.
const GHOST_PATTERN = /(components\/internal_index\/|\.(md|json|css)\.jsx$)/

const IGNORED = [
  '**/components/internal_index/**',
  '**/*.md.jsx',
  '**/*.json.jsx',
  '**/*.css.jsx',
]

// LAYER 1 — Ghost Firewall: hard-block any resolve/load of platform-injected files
const ghostFirewall = {
  name: 'ghost-firewall',
  enforce: 'pre',
  resolveId(id) {
    if (GHOST_PATTERN.test(id)) {
      return { id, external: true }
    }
  },
  load(id) {
    if (GHOST_PATTERN.test(id)) {
      return 'export default null;'
    }
  },
}

export default defineConfig({
  plugins: [
    ghostFirewall,
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
  server: {
    watch: {
      ignored: IGNORED,
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      external: (id) => GHOST_PATTERN.test(id),
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
    exclude: [
      'src/components/internal_index',
    ],
  }
})