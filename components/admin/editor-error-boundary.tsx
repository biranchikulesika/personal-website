'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for the Monaco editor panel.
 * Catches rendering errors (like `[object Event]` from failed worker loading)
 * and shows a fallback UI instead of crashing the whole page.
 */
export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[EditorErrorBoundary] Caught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-neutral-400 gap-4 p-8">
            <div className="w-12 h-12 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin" />
            <p className="text-sm font-sans text-neutral-500">
              Editor unavailable
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-xs font-mono text-neutral-600 hover:text-neutral-300 underline underline-offset-4 transition-colors"
            >
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
