import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '24px',
          background: '#06080d',
          color: '#f2f5fb',
          textAlign: 'center',
          fontFamily: "'Manrope', 'Avenir Next', sans-serif",
        }}>
          <div style={{ fontSize: '3rem' }}>😵</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Something went wrong</h2>
          <p style={{
            color: '#8a95a6',
            fontSize: '0.88rem',
            maxWidth: 280,
            margin: 0,
            lineHeight: 1.55,
          }}>
            The app ran into an unexpected error. Your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '13px 28px',
              background: '#ffffffb8',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Refresh app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
