import { useState, useEffect } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";

const INK   = "#211E18";
const PAPER = "#FAF8F3";
const MUTED = "#837A69";
const CLAY  = "#C2683F";
const LINE  = "#E5DECF";
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const SANS  = "'Hanken Grotesk', -apple-system, system-ui, sans-serif";

// Radius constants — kept in one place so everything matches
const R_INPUT  = "11px";   // inputs
const R_BTN    = "999px";  // buttons & pills
const R_SEG    = "12px";   // segmented control outer
const R_SEG_IN = "9px";    // segmented control inner tab (outer − padding)
const PAD_SEG  = 3;        // px padding inside seg control

const CLERK_APPEARANCE = {
  variables: {
    colorPrimary:                 CLAY,
    colorBackground:              "transparent",
    colorInputBackground:         "#ffffff",
    colorText:                    INK,
    colorTextSecondary:           MUTED,
    colorTextOnPrimaryBackground: "#ffffff",
    fontFamily:                   SANS,
    borderRadius:                 R_INPUT,
    fontSize:                     "15px",
  },
  elements: {
    rootBox:    { width: "100%" },
    cardBox:    { boxShadow: "none", background: "transparent", border: "none", width: "100%", padding: 0, overflow: "visible" },
    card:       { boxShadow: "none", background: "transparent", border: "none", padding: 0, gap: "14px", overflow: "visible" },
    header:         { display: "none" },
    headerTitle:    { display: "none" },
    headerSubtitle: { display: "none" },
    logoBox:        { display: "none" },
    logoImage:      { display: "none" },
    footer:         { display: "none" },
    footerAction:   { display: "none" },
    footerPages:    { display: "none" },
    socialButtonsBlockButton: {
      border:       `1px solid ${LINE}`,
      background:   "#fff",
      color:        INK,
      fontWeight:   "600",
      fontSize:     "15px",
      borderRadius: R_INPUT,   // match inputs, not 999px
      padding:      "11px 18px",
      boxShadow:    "none",
    },
    socialButtonsBlockButtonText: { fontWeight: "600" },
    dividerRow:  { margin: "18px 0" },
    dividerLine: { background: LINE },
    dividerText: { color: MUTED, fontSize: "12.5px" },
    formFieldLabel:          { fontSize: "13px", fontWeight: "600", color: "#4C463B", marginBottom: "6px" },
    formFieldInput:          { fontSize: "15px", padding: "11px 14px", border: `1px solid ${LINE}`, borderRadius: R_INPUT, background: "#fff", color: INK, boxShadow: "none" },
    formFieldInputGroup:     { border: "none", background: "transparent", boxShadow: "none", borderRadius: 0, overflow: "visible", padding: 0 },
    formFieldInputShowPasswordButton: { color: MUTED },
    formFieldErrorText:      { fontSize: "12.5px", color: "#B23A22" },
    formFieldHintText:       { fontSize: "12.5px", color: MUTED },
    formButtonPrimary:       { background: CLAY, borderRadius: R_BTN, border: "none", fontSize: "15px", fontWeight: "600", padding: "13px 24px", boxShadow: "0 1px 2px rgba(168,85,47,.25)" },
    alternativeMethodsBlockButton: { border: `1px solid ${LINE}`, background: "#fff", borderRadius: R_INPUT, boxShadow: "none" },
    identityPreviewText:       { color: INK },
    identityPreviewEditButton: { color: CLAY },
    alertText:                 { fontSize: "13px" },
  },
};

const STATS = [
  { n: "3×",    l: "strategies per draft" },
  { n: "~6s",   l: "to a sendable email"  },
  { n: "5/day", l: "free, no card"        },
];

export default function AuthPage({ mode }) {
  const navigate   = useNavigate();
  const isSignUp   = mode === "signUp";
  const [fading,   setFading]   = useState(false);

  // Fade out → navigate → fade back in
  const switchTab = (to) => {
    setFading(true);
    setTimeout(() => navigate(to), 140);
  };

  // Reset fade when mode actually changes
  useEffect(() => {
    const t = setTimeout(() => setFading(false), 30);
    return () => clearTimeout(t);
  }, [mode]);

  return (
    <div className="auth-split" style={{ fontFamily: SANS, background: PAPER }}>

      {/* ── Brand panel ── */}
      <aside
        className="auth-brand"
        style={{ background: INK, color: PAPER, padding: "48px 56px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", width: 540, height: 540, borderRadius: "50%", background: "radial-gradient(circle, rgba(194,104,63,.32), transparent 65%)", filter: "blur(10px)", bottom: -200, left: -160, pointerEvents: "none" }} />

        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: SERIF, fontSize: "1.4rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em", position: "relative", zIndex: 1, textDecoration: "none" }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: CLAY, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 15, height: 15 }}>
              <path d="M12 3 L18 12 L12 16 L6 12 Z" fill="#fff" />
              <path d="M12 16 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          ColdPen
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, maxWidth: 480 }}>
          <p style={{ fontFamily: SERIF, fontSize: "clamp(1.7rem, 3vw, 2.5rem)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            "The blank draft is the enemy. ColdPen hands me three{" "}
            <em style={{ fontStyle: "italic", color: CLAY }}>angles</em>{" "}
            before I've finished my coffee."
          </p>
          <p style={{ color: "#B7AC98", marginTop: 22, fontSize: 15.5, lineHeight: 1.6, maxWidth: "40ch" }}>
            Describe your offer once and get three high‑converting variations — each built on a different persuasion strategy.
          </p>
          <div style={{ display: "flex", gap: 26, marginTop: 36 }}>
            {STATS.map(({ n, l }) => (
              <div key={l}>
                <div style={{ fontFamily: SERIF, fontSize: "1.7rem", color: "#fff" }}>{n}</div>
                <div style={{ fontSize: 12.5, color: "#9A9180", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: "relative", zIndex: 1, fontSize: 13, color: "#8A8170" }}>
          © 2026 ColdPen · Built with Claude
        </p>
      </aside>

      {/* ── Form panel ── */}
      <main style={{ display: "flex", flexDirection: "column", background: PAPER, minHeight: "100vh" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px 0", flexShrink: 0 }}>
          <Link to="/" className="auth-mobile-logo" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 600, color: INK, textDecoration: "none" }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, background: CLAY, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 13, height: 13 }}>
                <path d="M12 3 L18 12 L12 16 L6 12 Z" fill="#fff" />
                <path d="M12 16 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            ColdPen
          </Link>
          <Link to="/" style={{ fontSize: 13.5, color: MUTED, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            ← Back to home
          </Link>
        </div>

        {/* Centered form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 32px 48px" }}>
          <div style={{ width: "100%", maxWidth: 400 }}>

            {/* ── Segmented control ── */}
            <div style={{
              display: "flex",
              padding: PAD_SEG,
              background: "#F3EEE3",
              border: `1px solid ${LINE}`,
              borderRadius: R_SEG,
              marginBottom: 28,
            }}>
              {[
                { label: "Sign up", to: "/sign-up", active: isSignUp  },
                { label: "Log in",  to: "/sign-in", active: !isSignUp },
              ].map(({ label, to, active }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => switchTab(to)}
                  style={{
                    flex: 1,
                    border: "none",
                    margin: 0,
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "9px 16px",
                    borderRadius: R_SEG_IN,
                    cursor: "pointer",
                    transition: "background .18s, color .18s, box-shadow .18s",
                    background: active ? "#fff" : "transparent",
                    color:      active ? INK   : MUTED,
                    boxShadow:  active ? "0 1px 2px rgba(33,30,24,.06), 0 1px 4px rgba(33,30,24,.04)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Heading */}
            <h1 style={{ fontFamily: SERIF, fontSize: "1.9rem", fontWeight: 500, letterSpacing: "-0.01em", color: INK }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p style={{ color: MUTED, fontSize: 15, marginTop: 6, marginBottom: 26 }}>
              {isSignUp
                ? "Start writing better cold email in seconds — free."
                : "Log in to pick up where your last draft left off."}
            </p>

            {/* ── Clerk form — fixed min-height prevents layout shift ── */}
            <div style={{
              minHeight: 420,
              opacity:    fading ? 0 : 1,
              transition: "opacity 0.14s ease",
            }}>
              {mode === "signIn" ? (
                <SignIn
                  routing="path"
                  path="/sign-in"
                  fallbackRedirectUrl="/dashboard"
                  signUpUrl="/sign-up"
                  appearance={CLERK_APPEARANCE}
                />
              ) : (
                <SignUp
                  routing="path"
                  path="/sign-up"
                  fallbackRedirectUrl="/dashboard"
                  signInUrl="/sign-in"
                  appearance={CLERK_APPEARANCE}
                />
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
