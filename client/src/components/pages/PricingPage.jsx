import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  ArrowRight, Menu, X,
  Check, Minus, Lock, Loader2,
} from "lucide-react";
import { api } from "../../lib/api";
import NibLogo from "../NibLogo";

const FREE_FEATURES = [
  "5 generations per day",
  "All 3 persuasion strategies",
  "All 4 tones",
  "One-click copy",
  "Favorites & searchable history",
];

const PRO_FEATURES = [
  "Up to 1,000 generations a day",
  "Everything in Free",
  "Priority generation speed",
  "Full analytics dashboard",
  "Unlimited favorites & history",
];

const TABLE_ROWS = [
  { label: "Daily generations",        free: "5 / day",  pro: "1,000 / day", type: "val" },
  { label: "Variations per generation", free: "3",        pro: "3",           type: "val" },
  { label: "Persuasion strategies",    free: "All 3",    pro: "All 3",       type: "val" },
  { label: "Tones",                    free: "All 4",    pro: "All 4",       type: "val" },
  { label: "One-click copy",           free: true,       pro: true,          type: "bool" },
  { label: "Favorites & history",      free: true,       pro: true,          type: "bool" },
  { label: "Priority generation speed", free: false,     pro: true,          type: "bool" },
  { label: "Analytics dashboard",      free: false,      pro: true,          type: "bool" },
  { label: "Email support",            free: false,      pro: true,          type: "bool" },
];

const FAQS = [
  { q: "Can I cancel anytime?",                    a: "Yes. Manage or cancel your subscription in one click from your billing portal. You keep Pro access until the end of the period you've paid for, then drop back to Free." },
  { q: "What happens when I hit the Free daily limit?", a: "Your counter resets every day. If you need more before then, upgrading to Pro lifts you to 1,000 generations a day instantly." },
  { q: "Do you offer annual billing?",             a: "Pro is billed monthly at $29 today. Annual pricing is on the roadmap — reach out if you'd like to be notified." },
  { q: "Is my payment secure?",                    a: "All payments are handled by Stripe. ColdPen never sees or stores your full card details." },
];

function TableCell({ type, free, val }) {
  if (type === "val") return <span className="val">{val}</span>;
  return free
    ? <Check style={{ width: 18, height: 18, color: "var(--clay)", display: "inline-block" }} />
    : <Minus style={{ width: 18, height: 18, color: "var(--line)", display: "inline-block" }} />;
}

export default function PricingPage() {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Sticky nav scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ctaTo = isSignedIn ? "/dashboard" : "/sign-up";

  const handleProClick = async () => {
    if (!isSignedIn) { navigate("/sign-up"); return; }
    setCheckingOut(true);
    try {
      const data = await api.post("/api/billing/create-checkout-session", { getToken });
      window.location.href = data.url;
    } catch (err) {
      if (err.code === "ALREADY_PRO") {
        toast.error("You're already on the Pro plan.");
        navigate("/dashboard");
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="landing-page" style={{ background: "var(--paper)", fontFamily: "var(--font-sans)" }}>

      {/* ── NAV ── */}
      <header className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="wrap nav-inner">
          <Link to="/" className="brand">
            <span className="nib"><NibLogo /></span>
            ColdPen
          </Link>
          <nav className="nav-links">
            <a className="lk" href="/#how">How it works</a>
            <a className="lk" href="/#features">Features</a>
            <a className="lk" href="/#strategies">Strategies</a>
            <Link className="lk" to="/pricing" style={{ color: "var(--ink)" }}>Pricing</Link>
          </nav>
          <div className="nav-cta">
            {isSignedIn ? (
              <Link className="btn btn-primary" to="/dashboard">Dashboard <ArrowRight /></Link>
            ) : (
              <>
                <Link className="nav-login" to="/sign-in">Log in</Link>
                <Link className="btn btn-primary" to="/sign-up">Start free <ArrowRight /></Link>
              </>
            )}
          </div>
          <button className="menu-btn" aria-label="Menu" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        <div className="wrap">
          <div className={`sheet${mobileOpen ? " open" : ""}`}>
            <a href="/#how"        onClick={closeMobile}>How it works</a>
            <a href="/#features"   onClick={closeMobile}>Features</a>
            <a href="/#strategies" onClick={closeMobile}>Strategies</a>
            <Link to="/pricing"    onClick={closeMobile}>Pricing</Link>
            {isSignedIn ? (
              <Link className="btn btn-primary btn-block" to="/dashboard" onClick={closeMobile}>Dashboard</Link>
            ) : (
              <>
                <Link to="/sign-in" onClick={closeMobile}>Log in</Link>
                <Link className="btn btn-primary btn-block" to="/sign-up" onClick={closeMobile}>Start free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── PAGE HEADER ── */}
      <section className="section" style={{ paddingBottom: 56 }}>
        <div className="wrap">
          <div className="section-head center" style={{ margin: "0 auto" }}>
            <span className="eyebrow">Pricing</span>
            <h1 className="display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", marginTop: 16 }}>
              Simple pricing.<br />Start <em>free.</em>
            </h1>
            <p className="lead muted" style={{ margin: "18px auto 0" }}>
              Five emails a day, free forever. Move to Pro when ColdPen is booking you meetings — cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ── */}
      <section style={{ paddingBottom: 64 }}>
        <div className="wrap">
          <div className="price-grid">
            {/* Free */}
            <div className="plan">
              <span className="pname">Free</span>
              <div className="amt">$0</div>
              <span className="per">forever</span>
              <ul>
                {FREE_FEATURES.map((f) => (
                  <li key={f}><Check /> {f}</li>
                ))}
              </ul>
              <div className="spacer" />
              <Link className="btn btn-ghost btn-block btn-lg" to={ctaTo}>Get started free</Link>
            </div>

            {/* Pro */}
            <div className="plan pro">
              <span className="tagbadge">Most popular</span>
              <span className="pname">Pro</span>
              <div className="amt">
                $29
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "1.1rem", fontWeight: 500, color: "#B7AC98" }}>/mo</span>
              </div>
              <span className="per">billed monthly · cancel anytime</span>
              <ul>
                {PRO_FEATURES.map((f) => (
                  <li key={f}><Check /> {f}</li>
                ))}
              </ul>
              <div className="spacer" />
              <button
                onClick={handleProClick}
                disabled={checkingOut}
                className="btn btn-light btn-block btn-lg"
                style={{ opacity: checkingOut ? 0.6 : 1, cursor: checkingOut ? "not-allowed" : "pointer" }}
              >
                {checkingOut ? (
                  <><Loader2 style={{ width: 16, height: 16, animation: "dash-spin 1s linear infinite" }} /> Redirecting...</>
                ) : (
                  <>Go Pro <ArrowRight /></>
                )}
              </button>
            </div>
          </div>

          <p className="center trust" style={{ justifyContent: "center", marginTop: 26 }}>
            <Lock style={{ width: 16, height: 16, color: "var(--clay)" }} />
            Secure checkout via Stripe · no card needed for Free
          </p>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="section" style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", paddingTop: 80 }}>
        <div className="wrap">
          <div className="section-head center" style={{ margin: "0 auto 44px" }}>
            <span className="eyebrow">Compare</span>
            <h2 className="h2">Every detail, side by side.</h2>
          </div>
          <div className="compare card" style={{ padding: "8px 14px", borderRadius: "var(--radius-lg)" }}>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="c">Free</th>
                  <th className="c">Pro</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(({ label, free, pro, type }) => (
                  <tr key={label}>
                    <td className="feat-name">{label}</td>
                    <td className="c"><TableCell type={type} free={free}  val={free} /></td>
                    <td className="c"><TableCell type={type} free={pro}   val={pro}  /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── BILLING FAQ ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head center" style={{ margin: "0 auto" }}>
            <span className="eyebrow">Billing questions</span>
            <h2 className="h2">Before you upgrade.</h2>
          </div>
          <div className="faq mt-l">
            {FAQS.map(({ q, a }, i) => (
              <details key={q} className="qa" open={i === 0}>
                <summary>{q} <span className="pm" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div className="center mt-l">
            <Link className="btn btn-primary btn-lg" to={ctaTo}>
              Start free <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <Link to="/" className="brand">
                <span className="nib"><NibLogo fill="#fff" /></span>
                ColdPen
              </Link>
              <p style={{ marginTop: 16, fontSize: 14.5, maxWidth: "30ch", color: "#A89F8D" }}>
                AI-powered cold outreach that actually gets replies. Three strategies, one click.
              </p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="/#how">How it works</a></li>
                <li><a href="/#features">Features</a></li>
                <li><a href="/#strategies">Strategies</a></li>
                <li><Link to="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="mailto:help@coldpen.app">Contact</a></li>
                <li><Link to="/sign-in">Log in</Link></li>
                <li><Link to="/sign-up">Start free</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 ColdPen. All rights reserved.</span>
            <span>Built with Claude.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
