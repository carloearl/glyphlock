import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Root-level error boundary — catches React errors anywhere in the tree,
// including AuthProvider / Router / QueryClientProvider crashes that the
// inner ErrorBoundary inside App.jsx cannot reach.
class RootErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('RootErrorBoundary caught:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: '-apple-system, Segoe UI, Roboto, sans-serif', minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: '40px 24px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 760, width: '100%', background: '#1a1a1a', border: '1px solid #ef4444', borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, margin: '0 0 8px', color: '#fca5a5' }}>App crashed during render</h1>
            <pre style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 8, padding: 16, fontSize: 12, color: '#fbbf24', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'auto', maxHeight: 200, margin: '12px 0' }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
            {this.state.error?.stack && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}>Stack trace</summary>
                <pre style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 8, padding: 12, fontSize: 11, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'auto', maxHeight: 300, marginTop: 8 }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 20px', background: '#06b6d4', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return <div data-app-mounted="true">{this.props.children}</div>;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
  // </React.StrictMode>,
)

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}