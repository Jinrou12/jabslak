import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Global Error Boundary — catches any unhandled render errors and shows
 * a friendly recovery screen instead of a blank/black page.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-5 p-6 font-kantumruy z-[99999]">
          <div className="w-20 h-20 rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </div>
          <div className="text-center max-w-sm">
            <h1 className="text-xl font-black text-rose-300 font-moul mb-2">
              កំហុសក្នុងកម្មវិធី
            </h1>
            <p className="text-sm text-slate-400 mb-1">
              កម្មវិធីបានជួបបញ្ហា។ សូមបើកឡើងវិញ។
            </p>
            {this.state.error && (
              <p className="text-[11px] text-slate-600 font-mono mt-2 break-all">
                {String(this.state.error.message || this.state.error)}
              </p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-500/30"
          >
            <RefreshCw className="w-5 h-5" />
            <span>បើកឡើងវិញ (Reload)</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
