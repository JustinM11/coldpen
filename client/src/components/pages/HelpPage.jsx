import { Search, PenLine, Folder, CreditCard, Mail, MessageCircle, BookOpen, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { Icon: PenLine,     title: "Writing emails",        desc: "Briefs, tones, the three strategies, and getting sharper drafts.", n: "8 articles" },
  { Icon: Folder,      title: "History & favorites",   desc: "Reopen past briefs, search drafts, and build your swipe file.",    n: "5 articles" },
  { Icon: CreditCard,  title: "Plans & billing",       desc: "Free limits, upgrading to Pro, invoices, and cancellation.",       n: "6 articles" },
];

const FAQS = [
  { q: "What do I get per generation?",              a: "Three complete email variations — subject line and body — each built on a different persuasion strategy: a pain-point lead, a social-proof hook, and a direct value prop. Copy any of them in one click." },
  { q: "How many emails can I write on the Free plan?", a: "Five generations a day, with every tone and all three strategies included. Your count resets at midnight. Pro lifts this to effectively unlimited." },
  { q: "Can I reopen and reuse an old brief?",       a: "Yes. Every brief is saved to your History. Open it, tweak the inputs, and regenerate — or copy a past favorite straight from the Favorites page." },
  { q: "How do I set a default tone and signature?", a: "Head to Settings → Writing defaults. Pick a default tone, add your sender name and signature, and every new brief starts pre-filled." },
  { q: "Is my data private?",                        a: "Your offers, prospects, and drafts stay private to your account. You can export everything as JSON or delete any draft — or your whole account — at any time from Settings." },
  { q: "How do I cancel Pro?",                       a: "Settings → Plan & billing → Manage subscription. You keep Pro features until the end of your billing period, then drop back to Free with all your drafts intact." },
];

const CONTACTS = [
  { Icon: Mail,          title: "Email support",  desc: "help@coldpen.app",           },
  { Icon: MessageCircle, title: "Live chat",      desc: "Weekdays, 9am–6pm ET"        },
  { Icon: BookOpen,      title: "Documentation",  desc: "Guides & best practices"     },
];

export default function HelpPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1>Help</h1>
          <div className="sub">Guides, answers, and a real human when you need one.</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" style={{ fontSize: 14, padding: "11px 18px" }} onClick={() => toast.success("Opening support…")}>
            <MessageCircle style={{ width: 16, height: 16 }} /> Contact support
          </button>
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
            <input type="text" placeholder='Search help articles — e.g. "export my drafts"' />
          </div>
        </div>

        {/* Categories */}
        <div className="help-section-label">Browse by topic</div>
        <div className="cat-grid">
          {CATEGORIES.map(({ Icon, title, desc, n }) => (
            <div key={title} className="cat" onClick={() => toast.success(`Opening ${title}…`)}>
              <div className="c-ic"><Icon /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <span className="n">{n}</span>
            </div>
          ))}
        </div>

        {/* FAQ + contact */}
        <div className="help-cols">
          <div>
            <div className="help-section-label">Common questions</div>
            <div className="faq-card">
              {FAQS.map(({ q, a }, i) => (
                <details key={q} className="qa" open={i === 0}>
                  <summary>{q} <span className="pm" /></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="contact-card">
            <h3>Still stuck?</h3>
            <p>Our team replies to most messages within a few hours, Monday to Friday.</p>
            {CONTACTS.map(({ Icon, title, desc }) => (
              <div key={title} className="contact-item" onClick={() => toast.success(`Opening ${title}…`)}>
                <span className="ci-ic"><Icon /></span>
                <div><b>{title}</b><small>{desc}</small></div>
                <span className="arw"><ArrowUpRight /></span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  );
}
