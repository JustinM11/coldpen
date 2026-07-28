import { useState, useRef } from "react";
import { Search, PenLine, Folder, CreditCard, Mail, MessageCircle, BookOpen, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { key: "writing", Icon: PenLine,    title: "Writing emails",      desc: "Briefs, tones, the three strategies, and getting sharper drafts." },
  { key: "history", Icon: Folder,     title: "History & favorites", desc: "Reopen past briefs, search drafts, and build your swipe file."    },
  { key: "billing", Icon: CreditCard, title: "Plans & billing",     desc: "Free limits, upgrading to Pro, invoices, and cancellation."       },
];

const FAQS = [
  { cat: "writing", q: "What do I get per generation?",                 a: "Three complete email variations — subject line and body — each built on a different persuasion strategy: a pain-point lead, a social-proof hook, and a direct value prop. Copy any of them in one click." },
  { cat: "billing", q: "How many emails can I write on the Free plan?", a: "Five generations a day, with every tone and all three strategies included. Your count resets at midnight. Pro lifts this to effectively unlimited." },
  { cat: "history", q: "Can I reopen and reuse an old brief?",          a: "Yes. Every brief is saved to your History. Open it, tweak the inputs, and regenerate — or copy a past favorite straight from the Favorites page." },
  { cat: "writing", q: "How do I set a default tone and signature?",    a: "Head to Settings → Writing defaults. Pick a default tone, add your sender name and signature, and every new brief starts pre-filled." },
  { cat: "history", q: "Is my data private?",                           a: "Your offers, prospects, and drafts stay private to your account. You can export everything as JSON or delete any draft — or your whole account — at any time from Settings." },
  { cat: "billing", q: "How do I cancel Pro?",                          a: "Settings → Plan & billing → Manage subscription. You keep Pro features until the end of your billing period, then drop back to Free with all your drafts intact." },
];

const GITHUB_URL = "https://github.com/JustinM11";

export default function HelpPage() {
  const [query,     setQuery]     = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const faqRef = useRef(null);

  const onSearch = (value) => {
    setQuery(value);
    if (value.trim()) setActiveCat(null); // a search is always global
  };

  const pickCategory = (key) => {
    setActiveCat((prev) => (prev === key ? null : key));
    setQuery("");
    requestAnimationFrame(() => faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const q = query.trim().toLowerCase();
  const filtered = FAQS.filter((f) => {
    if (activeCat && f.cat !== activeCat) return false;
    if (q && !f.q.toLowerCase().includes(q) && !f.a.toLowerCase().includes(q)) return false;
    return true;
  });

  const activeTitle = CATEGORIES.find((c) => c.key === activeCat)?.title;
  const faqLabel = q
    ? `Results for “${query.trim()}”`
    : activeTitle
      ? `${activeTitle} questions`
      : "Common questions";

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Help</h1>
          <div className="sub">Guides, answers, and a real human when you need one.</div>
        </div>
        <div className="topbar-right">
          <a className="btn btn-primary" href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ fontSize: 14, padding: "11px 18px" }}>
            <MessageCircle style={{ width: 16, height: 16 }} /> Contact support
          </a>
        </div>
      </header>

      <div className="page">
        {/* Hero */}
        <div className="help-hero">
          <span className="glow" />
          <h2>How can we help?</h2>
          <p>Search the guides or browse the topics below.</p>
          <div className="help-search">
            <Search />
            <input
              type="text"
              placeholder='Search help articles — e.g. "export my drafts"'
              value={query}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="help-section-label">Browse by topic</div>
        <div className="cat-grid">
          {CATEGORIES.map(({ key, Icon, title, desc }) => {
            const count = FAQS.filter((f) => f.cat === key).length;
            return (
              <div
                key={key}
                className={`cat${activeCat === key ? " on" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => pickCategory(key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickCategory(key); } }}
              >
                <div className="c-ic"><Icon /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="n">{count} {count === 1 ? "article" : "articles"}</span>
              </div>
            );
          })}
        </div>

        {/* FAQ + contact */}
        <div className="help-cols">
          <div ref={faqRef} style={{ scrollMarginTop: 90 }}>
            <div className="help-section-label" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {faqLabel}
              {(activeCat || q) && (
                <button
                  type="button"
                  onClick={() => { setActiveCat(null); setQuery(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clay)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase" }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="faq-card">
              {filtered.length === 0 ? (
                <p style={{ padding: "26px 0", color: "var(--muted)", fontSize: 14.5 }}>
                  No articles match that search. Try a different term, or{" "}
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ color: "var(--clay)", fontWeight: 600 }}>reach out on GitHub</a>.
                </p>
              ) : (
                filtered.map(({ q: question, a }, i) => (
                  <details key={question} className="qa" open={i === 0}>
                    <summary>{question} <span className="pm" /></summary>
                    <p>{a}</p>
                  </details>
                ))
              )}
            </div>
          </div>

          <aside className="contact-card">
            <h3>Still stuck?</h3>
            <p>Our team replies to most messages within a few hours, Monday to Friday.</p>

            <a className="contact-item" href={GITHUB_URL} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <span className="ci-ic"><Mail /></span>
              <div><b>GitHub</b><small>github.com/JustinM11</small></div>
              <span className="arw"><ArrowUpRight /></span>
            </a>

            <div className="contact-item" role="button" tabIndex={0}
              onClick={() => toast("Live chat is coming soon.")}
              onKeyDown={(e) => { if (e.key === "Enter") toast("Live chat is coming soon."); }}>
              <span className="ci-ic"><MessageCircle /></span>
              <div><b>Live chat</b><small>Weekdays, 9am–6pm ET</small></div>
              <span className="arw"><ArrowUpRight /></span>
            </div>

            <div className="contact-item" role="button" tabIndex={0}
              onClick={() => toast("Documentation is coming soon.")}
              onKeyDown={(e) => { if (e.key === "Enter") toast("Documentation is coming soon."); }}>
              <span className="ci-ic"><BookOpen /></span>
              <div><b>Documentation</b><small>Guides & best practices</small></div>
              <span className="arw"><ArrowUpRight /></span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
