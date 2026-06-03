import { useState, useEffect, useRef } from "react";
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

// ── Instant client-side validation for Clerk's drop-in forms ──
// Clerk's <SignIn>/<SignUp> own the submit and the network request, so a bad
// email or empty field otherwise waits ~3–5s for Clerk's server to reject it.
// We intercept the form's submit in the CAPTURE phase — before Clerk's React
// handler runs — and block the request when these two purely-local checks fail,
// showing a styled inline error that matches Clerk's own (#B23A22 / 12.5px).
// Server-only checks (wrong password, duplicate email) are deliberately left to
// Clerk and still round-trip as before.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERR_FLAG = "data-coldpen-fielderror"; // marks error nodes we inject

// This app authenticates by email, so the sign-in "identifier" is an email.
function isEmailField(input) {
  return input.type === "email" || /email|identifier/i.test(input.name || "");
}

function fieldGroup(input) {
  return input.closest(".cl-formField") || input.parentElement;
}

function clearFieldError(input) {
  fieldGroup(input)
    ?.querySelectorAll(`[${ERR_FLAG}]`)
    .forEach((n) => n.remove());
}

function showFieldError(input, message) {
  clearFieldError(input);
  const err = document.createElement("p");
  err.setAttribute(ERR_FLAG, "");
  err.textContent = message;
  err.style.cssText =
    "color:#B23A22;font-size:12.5px;line-height:1.4;margin-top:6px;";
  fieldGroup(input)?.appendChild(err);
}

// True only for inputs the user can actually see and edit on the CURRENT step.
// Must be ancestor-aware: Clerk hides the inactive step (e.g. the password field
// while you're on the email step of Log in) by collapsing a wrapper to height:0
// with overflow:hidden. The input's own box stays non-zero and its own styles
// look normal, so a per-element check isn't enough — we walk up to the form.
function isUserVisible(el) {
  if (el.type === "hidden" || el.disabled || el.readOnly) return false;

  // Covers display:none / visibility / content-visibility / opacity on the
  // element and its ancestors, where the browser supports it.
  if (
    typeof el.checkVisibility === "function" &&
    !el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })
  ) {
    return false;
  }

  // The field must render a box of its own.
  const rect = el.getBoundingClientRect();
  if (rect.width <= 1 || rect.height <= 1) return false;

  // Walk ancestors up to the form, catching collapsed/clipped wrappers that hide
  // the field even though its own rect is non-zero.
  for (let node = el.parentElement; node; node = node.parentElement) {
    const s = window.getComputedStyle(node);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") {
      return false;
    }
    const clips =
      s.overflow === "hidden" ||
      s.overflowX === "hidden" ||
      s.overflowY === "hidden";
    if (clips) {
      const r = node.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return false; // collapsed clipping box
    }
    if (node.tagName === "FORM") break;
  }

  return true;
}

// Validate only the email + password fields (the inherently-required ones we
// can check without the server). Returns true when it's safe to let Clerk submit.
function runLocalValidation(form) {
  // Scope to Clerk's real field inputs (.cl-formFieldInput) and require them to
  // be visible. Targeting all <input>s previously matched Clerk's hidden decoy
  // fields, which read as empty and blocked otherwise-valid submissions.
  const fields = [...form.querySelectorAll("input.cl-formFieldInput")].filter(
    (i) => (isEmailField(i) || i.type === "password") && isUserVisible(i),
  );
  let firstInvalid = null;
  for (const input of fields) {
    clearFieldError(input);
    const value = input.value.trim();
    const email = isEmailField(input);
    if (!value) {
      showFieldError(input, email ? "Enter your email address." : "Enter your password.");
      firstInvalid = firstInvalid || input;
    } else if (email && !EMAIL_RE.test(value)) {
      showFieldError(input, "Enter a valid email address.");
      firstInvalid = firstInvalid || input;
    }
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}

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

  // Clerk's inputs carry the HTML5 `required` attribute, so the browser shows
  // its native "Please fill out this field." popup on empty submit — before
  // Clerk's own validation can run. Strip `required` from every field and set
  // `noValidate` on the form so the browser never runs constraint validation on
  // ANY input, across both Sign up and Log in (and every step). Clerk then
  // renders its own inline error text, already styled to match our other field
  // errors (#B23A22 / 12.5px via CLERK_APPEARANCE.elements.formFieldErrorText).
  // Removing `required` from the DOM does not disable Clerk's validation — Clerk
  // validates from its internal state in its submit handler, not the attribute.
  // Re-applied through a MutationObserver because Clerk re-renders fields and
  // swaps the form between steps (e.g. sign-in → email verification).
  const formWrapRef = useRef(null);
  useEffect(() => {
    const root = formWrapRef.current;
    if (!root) return;

    // Timestamp of the last user-driven Continue (click/Enter). Used to detect
    // password fields that mount as a result of a step transition, so we can
    // suppress Clerk's autofocus highlight on them — see below.
    let transitionAt = 0;

    const applyToForms = () => {
      root.querySelectorAll("form").forEach((form) => {
        // Belt: turn off native constraint validation so no popup can appear.
        form.noValidate = true;

        // Attach the instant validator once per form (Clerk swaps forms between
        // steps; the observer below re-runs this for each new form).
        if (!form.hasAttribute("data-coldpen-intercept")) {
          form.setAttribute("data-coldpen-intercept", "");

          // Validate ONLY on a deliberate user submit. Clerk advances between
          // steps (email → password) by dispatching its own submit, which would
          // otherwise validate the freshly-shown, still-empty field before the
          // user has touched it. We arm validation only on a trusted click of
          // the submit button or a trusted Enter keypress, and disarm on every
          // submit — so Clerk's programmatic step transitions never validate.
          let userInitiated = false;
          const submitButton = 'button[type="submit"], button:not([type])';
          form.addEventListener(
            "click",
            (e) => {
              if (e.isTrusted && e.target.closest(submitButton)) {
                userInitiated = true;
                transitionAt = performance.now(); // a step transition may follow
              }
            },
            true,
          );
          form.addEventListener(
            "keydown",
            (e) => {
              if (e.isTrusted && e.key === "Enter") {
                userInitiated = true;
                transitionAt = performance.now();
              }
            },
            true,
          );

          // Capture phase → runs before Clerk's submit handler, so a failed
          // local check blocks the request entirely (empties never round-trip).
          form.addEventListener(
            "submit",
            (e) => {
              const intentional = userInitiated;
              userInitiated = false;
              if (!intentional) return; // Clerk step transition / programmatic
              if (!runLocalValidation(form)) {
                e.preventDefault();
                e.stopImmediatePropagation();
              }
            },
            true,
          );

          // Clear a field's inline error as soon as the user edits it.
          form.addEventListener(
            "input",
            (e) => {
              if (e.target instanceof HTMLInputElement) clearFieldError(e.target);
            },
            true,
          );
        }
      });
      // Suppress Clerk's autofocus on a password field that mounts right after a
      // user-driven step transition (Log in: email → password). Clerk focuses it
      // on mount, which paints the clay focus border before the user has done
      // anything. We blur that first (programmatic) focus so the step loads
      // visually neutral; the user's own later click/tab focuses it normally.
      // Gated on `transitionAt` so Sign up — where the password field is present
      // from the start and focused by the user — is never affected.
      root
        .querySelectorAll("input.cl-formFieldInput[type='password']")
        .forEach((pw) => {
          if (pw.hasAttribute("data-coldpen-nofocus")) return;
          pw.setAttribute("data-coldpen-nofocus", "");
          if (performance.now() - transitionAt < 2000) {
            const blurAutofocus = () => pw.blur();
            pw.addEventListener("focus", blurAutofocus, { once: true });
            // If no autofocus arrives shortly, stop listening so a much later
            // user focus is never blurred.
            setTimeout(() => pw.removeEventListener("focus", blurAutofocus), 1500);
          }
        });

      // Suspenders: strip `required` so the native popup can't fire even in the
      // brief window before noValidate is applied to a freshly rendered form.
      root.querySelectorAll("[required]").forEach((field) => {
        field.required = false;
      });
    };

    applyToForms();
    const observer = new MutationObserver(applyToForms);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["required"],
    });
    return () => observer.disconnect();
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
            <div ref={formWrapRef} style={{
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
