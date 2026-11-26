import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = 'Something unexpected happened while loading this page.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed && typeof parsed.error === 'string') {
        friendly = parsed.error.includes('Missing or insufficient permissions')
          ? 'You do not have permission to access this resource.'
          : 'Unable to complete the request right now. Please try again.';
      }
    } catch {
      if (error.message) {
        friendly = error.message;
      }
    }
    return { hasError: true, message: friendly };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application error caught by ErrorBoundary:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <h1 className="text-2xl font-display font-semibold text-stone-900">
              Unable to display this view
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              {this.state.message}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827]"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  window.location.reload();
                }}
                className="px-4 py-2 text-xs font-medium bg-white border border-stone-200 text-stone-800 rounded-lg hover:bg-stone-50"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
