import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#FAF8F3",
        fontFamily: "'Hanken Grotesk', system-ui, sans-serif", padding: 24,
      }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "#F6E8DD", color: "#A8552F",
            display: "grid", placeItems: "center", margin: "0 auto 20px",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: "1.8rem", fontWeight: 500, color: "#211E18", marginBottom: 10 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#837A69", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred. Your drafts and favorites are safe — try refreshing or heading back to the dashboard.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{ background: "#C2683F", color: "#fff", border: "none", borderRadius: 999, padding: "12px 22px", fontWeight: 600, cursor: "pointer", fontSize: 15 }}
            >
              Refresh page
            </button>
            <Link
              to="/dashboard"
              onClick={() => this.setState({ error: null })}
              style={{ background: "#fff", color: "#211E18", border: "1px solid #E5DECF", borderRadius: 999, padding: "12px 22px", fontWeight: 600, fontSize: 15, textDecoration: "none" }}
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
