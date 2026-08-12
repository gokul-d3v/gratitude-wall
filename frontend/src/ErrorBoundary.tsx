import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#fffcf9',
            backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '3rem',
              marginBottom: '0.5rem',
            }}
          >
            🙏
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191c1d', margin: 0 }}>
            BROTIFY
          </h1>
          <p style={{ color: '#424753', fontSize: '0.9rem', margin: 0 }}>
            Something went wrong loading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              backgroundColor: '#0058bd',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
          {import.meta.env.DEV && (
            <pre
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                textAlign: 'left',
                maxWidth: '90vw',
                overflow: 'auto',
              }}
            >
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
