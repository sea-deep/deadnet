import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error?: Error;
}

/**
 * A corrupted local save or a rendering fault should not leave a blank
 * browser tab. Keep the recovery actions explicit and local; the server world
 * is untouched unless the visitor chooses to clear the browser copy.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("DEADNET interface fault", error, info.componentStack);
  }

  private reload = () => window.location.reload();

  private resetLocalCopy = () => {
    try {
      localStorage.removeItem("deadnet-save-v1");
      localStorage.removeItem("deadnet-case-notes-v3");
    } catch {
      /* Storage may be unavailable; reload still re-fetches the server world. */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="fatal-screen" role="alert">
        <div className="fatal-panel">
          <h1>DEADNET could not draw this screen.</h1>
          <p>
            Your investigation is still stored on the server. Reload to
            reconnect, or clear this browser’s local copy if it keeps failing.
          </p>
          <pre>{this.state.error.message}</pre>
          <div className="fatal-actions">
            <button onClick={this.reload}>Reload</button>
            <button onClick={this.resetLocalCopy}>Clear local copy</button>
          </div>
        </div>
      </main>
    );
  }
}
