import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: '#6b7280', minHeight: '40vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠</div>
          <h3 style={{ color: '#e8eaf0', marginBottom: 8, fontSize: 18 }}>Something went wrong</h3>
          <p style={{ marginBottom: 8, fontSize: 13, maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12, padding: '8px 24px', cursor: 'pointer',
              background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)',
              borderRadius: 8, color: '#06b6d4', fontSize: 13
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;