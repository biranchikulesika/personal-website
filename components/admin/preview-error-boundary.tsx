'use client';

import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches rendering errors in the post preview and displays a fallback
 * instead of crashing the entire compose page with "[object Object]".
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.warn('[PreviewErrorBoundary] Caught preview render error:', error?.message || error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-neutral-500">
          <RefreshCw className="w-5 h-5 text-neutral-600" />
          <span className="text-xs font-mono">Preview could not be rendered</span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Retry
          </button>
          {this.state.error && (
            <div className="text-[9px] font-mono text-red-500/60 max-w-sm text-center">
              {this.state.error.message || 'Unknown error'}
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
