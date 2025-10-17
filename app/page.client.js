// Replace your ErrorBoundary in app/page.client.js with this:
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err) {
    console.error("Output panel crashed:", err);
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.err?.message || String(this.state.err || "");
      const stack = this.state.err?.stack || "";
      return (
        <div className="h-full w-full p-4 text-sm">
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-900">
            <div className="font-medium mb-1">This panel failed to load.</div>
            <div className="opacity-80 mb-2">{msg}</div>
            <details className="opacity-70">
              <summary>Stack</summary>
              <pre className="whitespace-pre-wrap text-xs mt-1">{stack}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
