import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { Search, FileText, Copy, Heart, Plus } from "lucide-react";
import { api } from "../../lib/api";

const STRAT_CHIPS = ["All strategies", "Pain-point", "Social-proof", "Value prop"];
const STRAT_MAP   = ["A", "B", "C"];
const VLETTER_CLS = ["", "b", "c"];
const VSTRAT_LABELS = ["Pain-point lead", "Social-proof hook", "Direct value prop"];
const VNAME_LABELS  = ["Name the problem first", "Borrow credibility", "Get to the point"];

export default function FavoritesPage() {
  const { getToken } = useAuth();
  const [emails,  setEmails]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [chip,    setChip]    = useState("All strategies");

  useEffect(() => {
    let cancelled = false;
    api.get("/api/emails?favorites=true&limit=100", { getToken })
      .then((d) => { if (!cancelled) setEmails(d.emails); })
      .catch(() => { if (!cancelled) toast.error("Failed to load favorites"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleUnfavorite = async (emailId) => {
    try {
      await api.patch(`/api/emails/${emailId}/favorite`, { getToken });
      setEmails((p) => p.filter((e) => e.id !== emailId));
      toast.success("Removed from favorites");
    } catch { toast.error("Failed to update"); }
  };

  const handleCopy = async (variation, emailId) => {
    const text = `Subject: ${variation.subject}\n\n${variation.body}`;
    try {
      await navigator.clipboard.writeText(text);
      api.patch(`/api/emails/${emailId}/copy`, { getToken }).catch(() => {});
      toast.success("Copied to clipboard");
    } catch { toast.error("Failed to copy"); }
  };

  // Flatten to individual favorited variations
  const cards = [];
  emails.forEach((email) => {
    (email.variations || []).forEach((v, idx) => {
      cards.push({ email, variation: v, idx });
    });
  });

  const filtered = cards.filter(({ variation, idx }) => {
    if (search) {
      const q = search.toLowerCase();
      if (!variation.subject?.toLowerCase().includes(q) && !variation.body?.toLowerCase().includes(q)) return false;
    }
    if (chip !== "All strategies") {
      if (chip === "Pain-point"  && idx !== 0) return false;
      if (chip === "Social-proof" && idx !== 1) return false;
      if (chip === "Value prop"  && idx !== 2) return false;
    }
    return true;
  });

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Favorites</h1>
          <div className="sub">Your proven openers — the lines that win replies.</div>
        </div>
        <div className="topbar-right">
          <span className="tbadge">
            <Heart style={{ width: 13, height: 13, fill: "var(--clay)", color: "var(--clay)", marginRight: 6 }} />
            {emails.length} saved
          </span>
        </div>
      </header>

      <div className="page">
        <div className="fav-tools">
          <div className="search">
            <Search />
            <input
              type="text"
              placeholder="Search favorites…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="chips">
            {STRAT_CHIPS.map((c) => (
              <button key={c} className={`chip${chip === c ? " on" : ""}`} onClick={() => setChip(c)}>{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--line)", borderTopColor: "var(--clay)", animation: "dash-spin .8s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel" style={{ padding: "64px 32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 500, color: "var(--ink)" }}>
              {emails.length === 0 ? "No favorites yet" : "No matches"}
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
              {emails.length === 0
                ? "Heart a variation on the Generate page to save it here."
                : "Try a different search or filter."}
            </p>
            {emails.length === 0 && (
              <Link className="btn btn-primary" to="/dashboard" style={{ marginTop: 20, display: "inline-flex" }}>
                <Plus style={{ width: 16, height: 16 }} /> Generate emails
              </Link>
            )}
          </div>
        ) : (
          <div className="fav-grid">
            {filtered.map(({ email, variation, idx }) => (
              <article key={`${email.id}-${idx}`} className="fcard">
                <div className="fcard-top">
                  <span className={`vletter${VLETTER_CLS[idx] ? ` ${VLETTER_CLS[idx]}` : ""}`}>
                    {STRAT_MAP[idx]}
                  </span>
                  <div>
                    <div className="vstrat">{VSTRAT_LABELS[idx]}</div>
                    <div className="vname">{VNAME_LABELS[idx]}</div>
                  </div>
                  <div className="fav-acts">
                    <button
                      className="mini fav on"
                      title="Remove from favorites"
                      onClick={() => handleUnfavorite(email.id)}
                    ><Heart style={{ width: 16, height: 16, fill: "currentColor" }} /></button>
                  </div>
                </div>
                <div className="fcard-body">
                  <div className="fsubject">{variation.subject}</div>
                  <p className="fexcerpt">{variation.body}</p>
                </div>
                <div className="fcard-foot">
                  <span className="from">
                    <FileText />
                    <span>{email.product_description}</span>
                  </span>
                  <button className="btn btn-ink fcopy" onClick={() => handleCopy(variation, email.id)}>
                    <Copy /> Copy
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes dash-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
