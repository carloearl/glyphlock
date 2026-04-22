import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class SuiteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error('[MusicSuite] tab crashed', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 rounded-lg border border-red-500/40 bg-red-500/5 text-red-300">
          <div className="flex items-center gap-2 font-bold mb-2">
            <AlertTriangle className="w-5 h-5" /> Tab failed to load
          </div>
          <div className="text-sm text-red-200/80 font-mono break-all">
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-sm"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}