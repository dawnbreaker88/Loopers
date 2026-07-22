import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log silently or to error tracking service if needed
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="bg-red-500/10 p-4 rounded-2xl text-red-500 mb-4">
            <AlertTriangle size={36} />
          </div>
          <h2 className="text-base font-black text-[#0F172A] dark:text-white">Something went wrong</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            An unexpected error occurred while loading this page. Please try refreshing or return home.
          </p>
          <div className="flex items-center space-x-3 mt-5">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#40A2E3] hover:bg-[#40A2E3]/90 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <RefreshCw size={14} />
              <span>Reload Page</span>
            </button>
            <button
              onClick={this.handleReset}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5"
            >
              <Home size={14} />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
