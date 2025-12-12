import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-forge-bg text-forge-text-primary flex items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Forge Error</h1>
            <p className="text-forge-text-secondary mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-dragon-fire text-black rounded font-bold hover:bg-yellow-500"
            >
              Restart
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
