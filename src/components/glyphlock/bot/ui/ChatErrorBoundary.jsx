import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ChatErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Chat Interface Error
              </h3>
              <p className="text-slate-400 text-sm">
                GlyphBot encountered an unexpected error. This has been logged for investigation.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-red-400 mt-3 font-mono bg-red-950/30 p-3 rounded-lg border border-red-500/30">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <Button
              onClick={this.handleReset}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart Chat
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;