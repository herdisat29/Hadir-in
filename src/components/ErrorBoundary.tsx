import React, { ErrorInfo, ReactNode } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.handleReset = this.handleReset.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset() {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-darker/60 backdrop-blur-xl border border-offwhite/10 rounded-[32px] p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="text-rose" size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-offwhite tracking-tight">Waduh, ada yang macet...</h1>
              <p className="text-offwhite/60 text-sm leading-relaxed">
                Kepala gue (sistem) kayaknya lagi agak capek. Coba segarkan halaman ya, semoga nanti udah oke lagi.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/20 rounded-xl p-4 text-left overflow-auto max-h-32">
                <code className="text-[10px] text-rose/50 font-mono italic">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full h-14 bg-rose text-on-primary rounded-full font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCcw size={18} />
              Segarkan Halaman
            </button>
            
            <p className="text-[10px] text-offwhite/20 uppercase tracking-[0.2em]">
              Hadir.in • Ruang Refleksi
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
