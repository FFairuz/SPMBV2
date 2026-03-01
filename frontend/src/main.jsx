import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0f1e', color: '#fff', padding: 24, fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Terjadi Kesalahan</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24, textAlign: 'center' }}>
            Aplikasi mengalami error. Coba refresh halaman.
          </p>
          <pre style={{
            background: '#1e293b', color: '#f87171', padding: 16, borderRadius: 8,
            fontSize: 12, maxWidth: 600, overflow: 'auto', whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24, padding: '10px 24px', background: '#2563eb',
              color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14
            }}
          >
            Refresh Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
