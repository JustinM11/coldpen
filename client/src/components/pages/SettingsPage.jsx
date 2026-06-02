import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { Check, Zap, Download, ExternalLink, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

const TONES      = ["Professional", "Casual", "Friendly", "Bold"];
const SECTIONS   = ["Profile", "Plan & billing", "Writing defaults", "Notifications", "Danger zone"];
const SEC_IDS    = ["profile", "plan", "defaults", "notifications", "danger"];
const DEFAULTS_KEY = "coldpen-writing-defaults";

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function loadDefaults() {
  try { return JSON.parse(localStorage.getItem(DEFAULTS_KEY)) || {}; } catch { return {}; }
}

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { user }     = useUser();
  const scrollRef    = useRef(null);

  const [userInfo,    setUserInfo]    = useState(null);
  const [activeSec,   setActiveSec]   = useState("profile");
  const [portalBusy,  setPortalBusy]  = useState(false);

  // Writing defaults — load from localStorage
  const saved = loadDefaults();
  const [defaultTone, setDefTone]   = useState(saved.tone        || "Professional");
  const [senderName,  setSenderName] = useState(saved.senderName  || "");
  const [signature,   setSignature]  = useState(saved.signature   || "");
  const [notifs,      setNotifs]     = useState(saved.notifs || { updates: true, recap: true, limit: false, tips: true });

  useEffect(() => {
    api.get("/api/users/me", { getToken })
      .then((d) => setUserInfo(d.user))
      .catch(() => {});
  }, []);

  const name   = user?.fullName || userInfo?.name || "";
  const email  = user?.primaryEmailAddress?.emailAddress || userInfo?.email || "";
  const plan   = userInfo?.plan ?? "free";
  const used   = userInfo?.generationToday ?? 0;
  const cap    = userInfo?.generationLimit ?? 5;
  const avatar = user?.imageUrl;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
    setActiveSec(id);
  };

  const handleSave = () => {
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ tone: defaultTone, senderName, signature, notifs }));
    toast.success("Settings saved");
  };

  const handlePortal = async () => {
    setPortalBusy(true);
    try {
      const data = await api.post("/api/billing/create-portal-session", { getToken });
      window.location.href = data.url;
    } catch {
      toast.error("Could not open billing portal. Please try again.");
      setPortalBusy(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Settings</h1>
          <div className="sub">Manage your account, plan, and writing defaults.</div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost" style={{ fontSize: 14, padding: "10px 16px" }}
            onClick={() => { const s = loadDefaults(); setDefTone(s.tone || "Professional"); setSenderName(s.senderName || ""); setSignature(s.signature || ""); }}>
            Discard
          </button>
          <button className="btn btn-primary" style={{ fontSize: 14, padding: "10px 18px" }} onClick={handleSave}>
            <Check style={{ width: 16, height: 16 }} /> Save changes
          </button>
        </div>
      </header>

      <div className="page" ref={scrollRef}>
        <div className="set-wrap">
          {/* Sub-nav */}
          <nav className="set-nav">
            {SECTIONS.map((s, i) => (
              <a key={s} href={`#${SEC_IDS[i]}`} className={activeSec === SEC_IDS[i] ? "on" : ""}
                onClick={(e) => { e.preventDefault(); scrollTo(SEC_IDS[i]); }}>{s}</a>
            ))}
          </nav>

          <div>
            {/* Profile */}
            <section className="sect" id="profile">
              <div className="sect-head"><h2>Profile</h2><p>This is how you appear inside ColdPen.</p></div>
              <div className="frow">
                <div className="fl">Avatar</div>
                <div className="avatar-row">
                  <span className="big-av">{avatar ? <img src={avatar} alt={name} /> : initials(name)}</span>
                  <button className="btn btn-ghost" style={{ fontSize: 13.5, padding: "9px 15px" }}>Upload image</button>
                </div>
              </div>
              <div className="frow">
                <div className="fl">Full name</div>
                <input className="inp" type="text" defaultValue={name} />
              </div>
              <div className="frow">
                <div className="fl">Email <small>Used to sign in</small></div>
                <input className="inp" type="email" defaultValue={email} />
              </div>
            </section>

            {/* Plan & billing */}
            <section className="sect" id="plan">
              <div className="sect-head">
                <h2>Plan &amp; billing</h2>
                <p>You're on the {plan === "pro" ? "Pro" : "Free"} plan.</p>
              </div>
              <div className="plan-card">
                <span className="pc-badge" style={{ textTransform: "capitalize" }}>{plan}</span>
                <div className="pc-main">
                  <b>{used} of {cap} generations used today</b>
                  <p>{plan === "pro" ? "Pro plan — effectively unlimited." : "Resets at midnight. No card on file."}</p>
                </div>
                {plan === "pro" ? (
                  <button
                    className="btn btn-ghost"
                    style={{ marginLeft: "auto", fontSize: 14 }}
                    onClick={handlePortal}
                    disabled={portalBusy}
                  >
                    {portalBusy
                      ? <><Loader2 style={{ width: 15, height: 15, animation: "dash-spin .7s linear infinite" }} /> Opening…</>
                      : <><ExternalLink style={{ width: 15, height: 15 }} /> Manage subscription</>}
                  </button>
                ) : (
                  <Link className="btn btn-primary" to="/pricing" style={{ marginLeft: "auto", fontSize: 14 }}>
                    <Zap style={{ width: 16, height: 16 }} /> Upgrade to Pro
                  </Link>
                )}
              </div>
            </section>

            {/* Writing defaults */}
            <section className="sect" id="defaults">
              <div className="sect-head"><h2>Writing defaults</h2><p>Pre-fill new briefs so you start a step ahead.</p></div>
              <div className="frow">
                <div className="fl">Default tone</div>
                <div className="tone-grid" style={{ maxWidth: 360 }}>
                  {TONES.map((t) => (
                    <button key={t} type="button" className={`tone-pick${defaultTone === t ? " on" : ""}`} onClick={() => setDefTone(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="frow">
                <div className="fl">Sender name <small>Signs your emails</small></div>
                <input className="inp" type="text" value={senderName} placeholder="e.g. Sam Okafor"
                  onChange={(e) => setSenderName(e.target.value)} />
              </div>
              <div className="frow">
                <div className="fl">Signature <small>Appended to every draft</small></div>
                <textarea className="inp" rows={3} value={signature} placeholder={"Sam Okafor\nGrowth, Northwind\nnorthwind.io"}
                  onChange={(e) => setSignature(e.target.value)} />
              </div>
            </section>

            {/* Notifications */}
            <section className="sect" id="notifications">
              <div className="sect-head"><h2>Notifications</h2><p>Choose what lands in your inbox.</p></div>
              {[
                { key: "updates", label: "Product updates",             desc: "New features and improvements, roughly monthly." },
                { key: "recap",   label: "Weekly writing recap",        desc: "A short summary of what you generated and copied." },
                { key: "limit",   label: "Daily limit reached",         desc: "Tell me when I've used all free generations." },
                { key: "tips",    label: "Tips & cold-email playbooks",  desc: "Occasional advice on what's landing replies." },
              ].map(({ key, label, desc }) => (
                <div key={key} className="switch-row">
                  <div className="sr-l">{label} <small>{desc}</small></div>
                  <button className={`tog${notifs[key] ? " on" : ""}`} aria-pressed={notifs[key]}
                    onClick={() => setNotifs((p) => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </section>

            {/* Danger zone */}
            <section className="sect danger" id="danger">
              <div className="sect-head"><h2>Danger zone</h2><p>Irreversible account actions.</p></div>
              <div className="danger-row" style={{ paddingBottom: 16, borderBottom: "1px solid var(--line-soft)", marginBottom: 16 }}>
                <div className="dr-l"><b>Export all data</b><p>Download every brief, draft, and favorite as a JSON file.</p></div>
                <button className="btn btn-ghost" style={{ fontSize: 13.5 }}>
                  <Download style={{ width: 15, height: 15 }} /> Export
                </button>
              </div>
              <div className="danger-row">
                <div className="dr-l"><b>Delete account</b><p>Permanently remove your account and all saved drafts. This can't be undone.</p></div>
                <button className="btn btn-danger" style={{ fontSize: 13.5 }}>Delete account</button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <style>{`@keyframes dash-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
