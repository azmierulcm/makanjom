'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-black text-neutral-900">Something went wrong</h2>
          <p className="mb-6 text-sm font-medium text-neutral-500">
            {this.state.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="rounded-full bg-neutral-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-black"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
