import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowRight, CheckCircle2, CreditCard, Zap, Menu, X,
  PencilLine, SlidersHorizontal, Sparkles,
  Layers, Copy, Heart, History, BarChart3, ShieldCheck, Check,
} from "lucide-react";

const VARIATIONS = [
  {
    label: "Variation A",
    badge: "Strategy · Pain-point lead",
    subject: "Losing carts at checkout, Maria?",
    body: "Hi Maria,\n\nMost Shopify stores quietly lose 7 of every 10 carts at checkout. We help teams like yours win a chunk of those back — one customer saw +38% in six weeks.\n\nWorth a 15-minute look?",
  },
  {
    label: "Variation B",
    badge: "Strategy · Social proof hook",
    subject: "How Bloom grew revenue 38% in 6 weeks",
    body: "Hi Maria,\n\nBloom and 200+ DTC brands use us to turn checkout drop-off into revenue. The average lift in quarter one is 31%.\n\nOpen to seeing how it'd map to your store?",
  },
  {
    label: "Variation C",
    badge: "Strategy · Direct value prop",
    subject: "+40% conversion, no replatforming",
    body: "Hi Maria,\n\nOne line of script, live in an afternoon, and you start recovering lost checkout revenue. No replatforming, no dev sprint.\n\nCan I send a 2-minute demo?",
  },
];

const FEATURES = [
  { Icon: Layers,      title: "Three strategies, every time",  desc: "Each generation returns a pain-point lead, a social-proof hook, and a direct value prop — so you can A/B from the start." },
  { Icon: Copy,        title: "One-click copy",                desc: "Subject and body land on your clipboard, formatted and ready to paste into any inbox or sequencer." },
  { Icon: Heart,       title: "Favorites",                     desc: "Bookmark the lines that win replies and build a personal library of proven openers." },
  { Icon: History,     title: "Searchable history",            desc: "Every generation is saved. Search, filter, and reuse past inputs in a single click." },
  { Icon: BarChart3,   title: "Usage analytics",               desc: "See what you generate, copy, and favorite most — and double down on the angles that land." },
  { Icon: ShieldCheck, title: "Yours to keep",                 desc: "Your offers and prospects stay private to your account. Export or delete any draft, anytime." },
];

const STEPS = [
  { n: "01", Icon: PencilLine,       title: "Describe your offer",    desc: "Tell ColdPen what you're selling, who you're emailing, and the one action you want them to take." },
  { n: "02", Icon: SlidersHorizontal, title: "Pick a tone",           desc: "Professional, casual, friendly, or bold. ColdPen matches the voice your prospect actually reads." },
  { n: "03", Icon: Sparkles,         title: "Get three variations",   desc: "Three distinct strategies, ready to copy. Favorite the winners and reuse what works." },
];

const STRATEGIES = [
  { tag: "A · Pain-point lead",  title: "Name the problem first", desc: "Opens on the cost of doing nothing, so the reader feels the gap before you ever pitch the fix." },
  { tag: "B · Social-proof hook", title: "Borrow credibility",    desc: "Leads with a result a peer already got, turning a stranger's pitch into a recommendation." },
  { tag: "C · Direct value prop", title: "Get to the point",      desc: "Skips the warm-up and states the outcome plainly — built for busy inboxes that skim." },
];

const TESTIMONIALS = [
  { q: "I used to spend an hour on a single first-touch email. Now I get three angles in seconds and pick the sharpest one.", initials: "JR", name: "Jules Reyes",   role: "Founder, Northwind" },
  { q: "The social-proof variation books me meetings I'd never have written that well myself. It's my default opener now.",   initials: "SM", name: "Sofia Marwick", role: "SDR Lead, Vantage" },
  { q: "Three strategies on tap means I'm always A/B testing. My reply rate went from embarrassing to actually decent.",       initials: "DK", name: "Dan Kessler",   role: "Solo consultant" },
];

const FAQS = [
  { q: "What exactly do I get per generation?",         a: "Three complete email variations — subject line and body — each built on a different persuasion strategy: a pain-point lead, a social-proof hook, and a direct value prop. Copy any of them in one click." },
  { q: "Do I need to know how to prompt an AI?",        a: "No. You fill in four short fields — what you're selling, who you're emailing, a tone, and your call-to-action — and ColdPen handles the rest." },
  { q: "What's the difference between Free and Pro?",   a: "Free gives you five generations a day with every strategy and tone. Pro lifts that to effectively unlimited, adds the full analytics dashboard, and generates with priority speed for $29/month." },
  { q: "Which AI writes the emails?",                   a: "Every draft is generated with Anthropic's Claude, which is particularly strong at natural, on-tone writing that doesn't read like a template." },
  { q: "Can I reuse a past email?",                     a: "Yes. Every generation is saved to your searchable history. Reuse the original inputs with one click, then tweak and regenerate." },
];

const NibLogo = ({ fill = "#C2683F" }) => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 3 L18 12 L12 16 L6 12 Z" fill={fill} />
    <path d="M12 16 V21" stroke={fill} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [activeTab, setActiveTab]   = useState(0);

  const ctaTo = isSignedIn ? "/dashboard" : "/sign-up";

  // Sticky nav scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll(".reveal");
    if (!prefersReduced && "IntersectionObserver" in window) {
      document.documentElement.classList.add("js-anim");
      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
      );
      els.forEach((el) => io.observe(el));
      const t = setTimeout(() => els.forEach((el) => el.classList.add("in")), 1200);
      return () => { clearTimeout(t); io.disconnect(); document.documentElement.classList.remove("js-anim"); };
    }
  }, []);

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
            <a className="lk" href="#how">How it works</a>
            <a className="lk" href="#features">Features</a>
            <a className="lk" href="#strategies">Strategies</a>
            <Link className="lk" to="/pricing">Pricing</Link>
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
            <a href="#how"        onClick={closeMobile}>How it works</a>
            <a href="#features"   onClick={closeMobile}>Features</a>
            <a href="#strategies" onClick={closeMobile}>Strategies</a>
            <Link to="/pricing"   onClick={closeMobile}>Pricing</Link>
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

      {/* ── HERO ── */}
      <section className="section" style={{ paddingTop: 76, paddingBottom: 64 }}>
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="pill tint reveal"><span className="dot" /> Powered by Claude</span>
              <h1 className="display reveal" style={{ marginTop: 22 }}>
                Cold emails that<br />actually get <em>replies.</em>
              </h1>
              <p className="lead reveal" style={{ marginTop: 22 }}>
                Describe your offer, pick a tone, and ColdPen writes three high-converting variations — each using a different persuasion strategy. Done in seconds, not afternoons.
              </p>
              <div className="flex-cta mt-m reveal">
                <Link className="btn btn-primary btn-lg" to={ctaTo}>Write my first email <ArrowRight /></Link>
                <a    className="btn btn-ghost btn-lg"   href="#how">See how it works</a>
              </div>
              <div className="hero-trust reveal">
                <span className="trust"><CheckCircle2 /> 5 free emails a day</span>
                <span className="trust"><CreditCard />   No card to start</span>
                <span className="trust"><Zap />          First draft in ~6s</span>
              </div>
            </div>

            {/* Product mockup */}
            <div className="hero-mock reveal">
              <div className="mock">
                <div className="mock-bar">
                  <span className="tl" /><span className="tl" /><span className="tl" />
                  <span className="addr">coldpen.app/generate</span>
                </div>
                <div className="mock-body">
                  <label className="field-label">What are you selling?</label>
                  <div className="field" style={{ marginBottom: 14 }}>
                    An analytics platform that helps e-commerce stores lift conversion by up to 40%.
                  </div>
                  <label className="field-label">Tone</label>
                  <div className="tone-row" style={{ marginBottom: 18 }}>
                    {["Professional", "Casual", "Friendly", "Bold"].map((t, i) => (
                      <div key={t} className={`tone${i === 0 ? " on" : ""}`}>{t}</div>
                    ))}
                  </div>

                  <div className="var-tabs">
                    {VARIATIONS.map((v, i) => (
                      <button
                        key={i} type="button"
                        className={`var-tab${activeTab === i ? " on" : ""}`}
                        onClick={() => setActiveTab(i)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>

                  {VARIATIONS.map((v, i) => (
                    <div key={i} className={`var-panel${activeTab === i ? " on" : ""}`}>
                      <span className="strategy-badge">{v.badge}</span>
                      <span className="field-cap">Subject line</span>
                      <p className="email-subject">{v.subject}</p>
                      <span className="field-cap">Email body</span>
                      <div className="email-body">{v.body}</div>
                    </div>
                  ))}

                  <div className="mock-actions">
                    <span className="btn btn-ink" style={{ fontSize: 13, padding: "10px 16px" }}><Copy /> Copy email</span>
                    <span className="btn btn-ghost" style={{ fontSize: 13, padding: "10px 16px" }}><Heart /> Favorite</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ── */}
      <section className="section-sm" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <p className="center mono" style={{ fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 32 }}>
            Outreach teams use ColdPen to book more meetings
          </p>
          <div className="logos reveal">
            {["Northwind", "Bloom DTC", "Vantage", "Meridian", "Cobalt", "Fernweh"].map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how" style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head center reveal">
            <span className="eyebrow">How it works</span>
            <h2 className="h2">From blank page to <em>sendable</em> in three steps.</h2>
            <p className="lead muted" style={{ marginLeft: "auto", marginRight: "auto" }}>
              No prompt engineering, no templates to wrestle. Just describe the offer and review your drafts.
            </p>
          </div>
          <div className="steps mt-l">
            {STEPS.map(({ n, Icon, title, desc }) => (
              <div key={n} className="step reveal">
                <span className="step-num">{n}</span>
                <div className="ic"><Icon /></div>
                <h3 className="h3 serif">{title}</h3>
                <p className="muted" style={{ marginTop: 10, fontSize: 15 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Features</span>
            <h2 className="h2">Everything you need to send <em>better</em> cold email.</h2>
          </div>
          <div className="feat-grid mt-l">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="feat reveal">
                <div className="ic"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="section-sm">
        <div className="wrap">
          <div className="card reveal" style={{ padding: 48, borderRadius: "var(--radius-lg)" }}>
            <div className="stats">
              <div className="stat"><div className="n"><em>3×</em></div><div className="l">variations per generation, each a different angle</div></div>
              <div className="stat"><div className="n">~<em>6s</em></div><div className="l">from describing your offer to a sendable draft</div></div>
              <div className="stat"><div className="n"><em>4</em></div><div className="l">tones to match any prospect, from buttoned-up to bold</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STRATEGIES ── */}
      <section className="section" id="strategies" style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">The three angles</span>
            <h2 className="h2">One offer, written <em>three ways.</em></h2>
            <p className="lead muted">Great outreach isn't one perfect email — it's testing angles until one lands. ColdPen hands you all three.</p>
          </div>
          <div className="strat-grid mt-l">
            {STRATEGIES.map(({ tag, title, desc }) => (
              <div key={tag} className="strat reveal">
                <span className="tag">{tag}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head center reveal">
            <span className="eyebrow">Loved by senders</span>
            <h2 className="h2">Less staring at a blank draft.</h2>
          </div>
          <div className="quotes mt-l">
            {TESTIMONIALS.map(({ q, initials, name, role }) => (
              <div key={name} className="quote reveal">
                <p>"{q}"</p>
                <div className="who">
                  <span className="av">{initials}</span>
                  <div><div className="nm">{name}</div><div className="rl">{role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="section" id="pricing" style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head center reveal">
            <span className="eyebrow">Pricing</span>
            <h2 className="h2">Start free. Upgrade when it's <em>working.</em></h2>
          </div>
          <div className="price-grid mt-l">
            <div className="plan reveal">
              <span className="pname">Free</span>
              <div className="amt">$0</div>
              <span className="per">forever · 5 emails a day</span>
              <ul>
                <li><Check /> 5 generations per day</li>
                <li><Check /> All 3 strategies &amp; 4 tones</li>
                <li><Check /> Copy, favorite &amp; history</li>
              </ul>
              <div className="spacer" />
              <Link className="btn btn-ghost btn-block" to={ctaTo}>Get started</Link>
            </div>
            <div className="plan pro reveal">
              <span className="tagbadge">Most popular</span>
              <span className="pname">Pro</span>
              <div className="amt">$29</div>
              <span className="per">per month · effectively unlimited</span>
              <ul>
                <li><Check /> Up to 1,000 generations a day</li>
                <li><Check /> Priority generation speed</li>
                <li><Check /> Full analytics dashboard</li>
                <li><Check /> Unlimited favorites &amp; history</li>
              </ul>
              <div className="spacer" />
              <Link className="btn btn-light btn-block" to="/pricing">Go Pro</Link>
            </div>
          </div>
          <p className="center muted mt-m" style={{ fontSize: 14 }}>
            See the full comparison on the{" "}
            <Link to="/pricing" style={{ color: "var(--clay)", fontWeight: 600 }}>pricing page →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head center reveal">
            <span className="eyebrow">Questions</span>
            <h2 className="h2">Good to know.</h2>
          </div>
          <div className="faq mt-l reveal">
            {FAQS.map(({ q, a }, i) => (
              <details key={q} className="qa" open={i === 0}>
                <summary>{q} <span className="pm" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-band reveal">
            <span className="glow" />
            <span className="eyebrow" style={{ color: "#E0935F" }}>Start writing</span>
            <h2 className="h2" style={{ marginTop: 14 }}>Your next reply is three<br />drafts away.</h2>
            <p className="lead">Five free emails a day, no card required. See your first three variations in about six seconds.</p>
            <div className="flex-cta" style={{ justifyContent: "center" }}>
              <Link className="btn btn-primary btn-lg" to={ctaTo}>Write my first email <ArrowRight /></Link>
              <Link className="btn" style={{ background: "rgba(255,255,255,.08)", color: "#fff", border: "1px solid rgba(255,255,255,.18)" }} to="/pricing">
                View pricing
              </Link>
            </div>
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
                <li><a href="#how">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#strategies">Strategies</a></li>
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
