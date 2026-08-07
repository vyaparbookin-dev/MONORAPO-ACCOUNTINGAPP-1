import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4 text-sm">We couldn't load this part of the app. Please try reloading.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition">
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;