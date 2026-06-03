import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  Sparkles, RefreshCw, Heart, Copy, Type, Clock, History, Plus,
} from "lucide-react";
import { api } from "../../lib/api";

const TONES = ["Professional", "Casual", "Friendly", "Bold"];

const VARIATION_META = [
  { letter: "A", cls: "",  strat: "Pain-point lead",   name: "Name the problem first" },
  { letter: "B", cls: "b", strat: "Social-proof hook",  name: "Borrow credibility"     },
  { letter: "C", cls: "c", strat: "Direct value prop",  name: "Get to the point"       },
];

function wordCount(text) { return text ? text.trim().split(/\s+/).length : 0; }
function readSec(words)   { return Math.round(words / 200 * 60); }

const DEFAULTS_KEY = "coldpen-writing-defaults";

export default function GeneratePage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const prefill   = location.state?.prefill;
  const { getToken } = useAuth();

  // Show upgrade success toast once after Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("upgraded") === "true") {
      toast.success("Welcome to Pro! Unlimited generations unlocked.");
      navigate("/dashboard", { replace: true });
    }
  }, []);

  const saved = (() => { try { return JSON.parse(localStorage.getItem(DEFAULTS_KEY)) || {}; } catch { return {}; } })();
  const [offer,      setOffer]      = useState(prefill?.productDescription || "");
  const [who,        setWho]        = useState(prefill?.targetAudience     || "");
  const [cta,        setCta]        = useState(prefill?.ctaGoal            || "");
  const [tone,       setTone]       = useState(prefill?.tone ? TONES.find(t => t.toLowerCase() === prefill.tone) || TONES[0] : (saved.tone ? TONES.find(t => t.toLowerCase() === saved.tone) || TONES[0] : TONES[0]));
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [favorited,  setFavorited]  = useState({});
  const [copied,     setCopied]     = useState({});

  const generate = async () => {
    if (!offer.trim() || !cta.trim()) {
      toast.error("Please fill in what you're selling and the action you want.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post("/api/emails/generate", {
        body: {
          productDescription: offer.trim(),
          targetAudience:     who.trim() || "your target audience",
          tone:               tone.toLowerCase(),
          ctaGoal:            cta.trim(),
          // Sign-off defaults from Settings → Writing defaults.
          senderName:         saved.senderName || "",
          signature:          saved.signature || "",
        },
        getToken,
      });
      setResult(data);
      setFavorited({});
      setCopied({});
    } catch (err) {
      if (err.status === 429) toast.error("Daily limit reached. Upgrade to Pro for unlimited generations.");
      else toast.error(err.message || "Failed to generate — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (idx) => {
    if (!result) return;
    try {
      const data = await api.patch(`/api/emails/${result.email.id}/favorite`, { getToken });
      setFavorited((p) => ({ ...p, [idx]: data.email.is_favorited }));
      toast.success(data.email.is_favorited ? "Saved to favorites" : "Removed from favorites");
    } catch { toast.error("Failed to update"); }
  };

  const handleCopy = async (variation, idx) => {
    const text = `Subject: ${variation.subject}\n\n${variation.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied((p) => ({ ...p, [idx]: true }));
      setTimeout(() => setCopied((p) => ({ ...p, [idx]: false })), 2000);
      toast.success("Copied to clipboard");
      if (result) api.patch(`/api/emails/${result.email.id}/copy`, { getToken }).catch(() => {});
    } catch { toast.error("Failed to copy"); }
  };

  const variations = result?.email?.variations ?? [];

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Generate</h1>
          <div className="sub">Describe your offer once — get three angles to test.</div>
        </div>
        <div className="topbar-right">
          <span className="pill tint"><span className="dot" /> Powered by Claude</span>
          <Link className="icon-btn" to="/dashboard/history" title="History"><History /></Link>
          <button className="icon-btn" title="New brief" onClick={() => {
            setOffer(""); setWho(""); setCta(""); setResult(null);
          }}><Plus /></button>
        </div>
      </header>

      <div className="canvas">
        {/* ── Brief panel ── */}
        <section className="panel gpanel">
          <div className="panel-head">
            <span className="eyebrow">The brief</span>
            <h2>What are we writing?</h2>
          </div>
          <div className="panel-body">
            <div className="fld">
              <label>What are you selling?</label>
              <textarea
                rows={3}
                placeholder="e.g. An analytics platform that helps e-commerce stores recover lost checkout revenue"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div className="fld">
              <label>Who are you emailing? <span className="opt">— optional</span></label>
              <input
                type="text"
                placeholder="e.g. Maria, Head of Growth at a mid-size Shopify brand"
                value={who}
                onChange={(e) => setWho(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="fld">
              <label>The one action you want</label>
              <input
                type="text"
                placeholder="e.g. Book a 15-minute demo this week"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="fld">
              <label>Tone</label>
              <div className="tone-grid">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tone-pick${tone === t ? " on" : ""}`}
                    onClick={() => setTone(t)}
                  >{t}</button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary btn-block"
              onClick={generate}
              disabled={loading}
              style={{ gap: 8 }}
            >
              {loading
                ? <><RefreshCw style={{ width: 16, height: 16, animation: "dash-spin .7s linear infinite" }} /> Generating…</>
                : <><Sparkles style={{ width: 16, height: 16 }} /> Generate 3 variations</>}
            </button>
          </div>
        </section>

        {/* ── Results ── */}
        <section className={`results${loading ? " loading" : ""}`}>
          {(variations.length > 0 || loading) && (
            <div className="results-head">
              <div className="ttl">
                <b>Three variations</b> · <span className="for">{tone.toLowerCase()}</span> tone
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13, padding: "9px 15px" }}
                onClick={generate}
                disabled={loading}
              >
                <RefreshCw style={{ width: 15, height: 15 }} /> Regenerate
              </button>
            </div>
          )}

          {loading && VARIATION_META.map((m) => (
            <article key={m.letter} className="vcard">
              <div className="vcard-top">
                <span className={`vletter${m.cls ? ` ${m.cls}` : ""}`}>{m.letter}</span>
                <div><div className="vstrat">{m.strat}</div><div className="vname">{m.name}</div></div>
              </div>
              <div className="vcard-body">
                <span className="vcap">Subject line</span>
                <div className="vsubject">Loading…</div>
                <span className="vcap">Email body</span>
                <div className="vbody">Loading…</div>
              </div>
            </article>
          ))}

          {!loading && variations.map((v, idx) => {
            const m     = VARIATION_META[idx] ?? VARIATION_META[0];
            const words = wordCount(v.body);
            const secs  = readSec(words);
            return (
              <article key={idx} className="vcard">
                <div className="vcard-top">
                  <span className={`vletter${m.cls ? ` ${m.cls}` : ""}`}>{m.letter}</span>
                  <div>
                    <div className="vstrat">{v.label || m.strat}</div>
                    <div className="vname">{m.name}</div>
                  </div>
                  <div className="vcard-acts">
                    <button
                      className={`mini fav${favorited[idx] ? " on" : ""}`}
                      title="Favorite"
                      onClick={() => handleFavorite(idx)}
                    ><Heart style={{ width: 16, height: 16, fill: favorited[idx] ? "currentColor" : "none" }} /></button>
                  </div>
                </div>
                <div className="vcard-body">
                  <span className="vcap">Subject line</span>
                  <div className="vsubject">{v.subject}</div>
                  <span className="vcap">Email body</span>
                  <div className="vbody">{v.body}</div>
                </div>
                <div className="vcard-foot">
                  <span className="vmeta"><Type /> {words} words</span>
                  <span className="vmeta"><Clock /> ~{secs}s read</span>
                  <button className="btn btn-ink vcopy" onClick={() => handleCopy(v, idx)}>
                    <Copy /> {copied[idx] ? "Copied!" : "Copy email"}
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && variations.length === 0 && (
            <div className="panel" style={{ padding: "64px 32px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--clay-tint)", color: "var(--clay-deep)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
                <Sparkles style={{ width: 24, height: 24 }} />
              </div>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 500, color: "var(--ink)" }}>
                Your three variations will appear here
              </p>
              <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
                Fill in the brief and click Generate.
              </p>
            </div>
          )}
        </section>
      </div>

      <style>{`@keyframes dash-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
