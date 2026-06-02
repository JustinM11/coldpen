import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#FAF8F3",
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif", padding: 24,
    }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <p style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: "clamp(4rem, 12vw, 7rem)",
          fontWeight: 500, color: "#E5DECF", lineHeight: 1, marginBottom: 16,
        }}>404</p>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: "1.8rem", fontWeight: 500, color: "#211E18", marginBottom: 10 }}>
          Page not found
        </h1>
        <p style={{ color: "#837A69", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          The page you're looking for doesn't exist or has moved.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Link
            to="/dashboard"
            style={{ background: "#C2683F", color: "#fff", border: "none", borderRadius: 999, padding: "12px 22px", fontWeight: 600, fontSize: 15, textDecoration: "none" }}
          >
            Go to dashboard
          </Link>
          <Link
            to="/"
            style={{ background: "#fff", color: "#211E18", border: "1px solid #E5DECF", borderRadius: 999, padding: "12px 22px", fontWeight: 600, fontSize: 15, textDecoration: "none" }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
