import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'حدث خطأ غير متوقع في النظام.';
      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error && parsedError.error.includes('Missing or insufficient permissions')) {
          errorMessage = 'ليس لديك الصلاحيات الكافية للقيام بهذه العملية أو الوصول لهذه البيانات.';
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-right" dir="rtl">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">عذراً، حدث خطأ</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>إعادة تحميل الصفحة</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
