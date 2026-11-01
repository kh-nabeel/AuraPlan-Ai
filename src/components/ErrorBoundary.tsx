// ============================================================================
// AuraPlan AI — Enterprise React Error Boundary
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Enterprise-grade Error Boundary component that traps unexpected rendering crashes,
 * displays a recovery state, and prevents blank white screens.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AuraPlan AI ErrorBoundary trapped an unhandled error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#101114] text-black dark:text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl p-8 border-2 border-black dark:border-zinc-700 bg-white dark:bg-[#17181D] shadow-brutal-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FFECE8] dark:bg-red-950/60 border-2 border-[#FF7A59] mx-auto flex items-center justify-center text-[#FF7A59]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider font-bold">
                [ RUNTIME SAFEGUARD ACTIVATED ]
              </span>
              <h2 className="font-serif text-2xl font-bold">Something went wrong</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                AuraPlan AI encountered an unexpected rendering error. Your local planning session data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/20 text-left font-mono text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-black text-[#C3FF16] dark:bg-[#C3FF16] dark:text-black border-2 border-black text-xs font-bold px-6 py-3 rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all w-full justify-center"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload AuraPlan AI</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
