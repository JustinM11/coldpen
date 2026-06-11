import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { Search, FileText, Copy, Heart, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { STRATEGY_META } from "../../lib/strategies";
import Spinner from "../Spinner";

const STRAT_CHIPS = ["All strategies", "Pain-point", "Social-proof", "Value prop"];
const PAGE_SIZE = 50;

export default function FavoritesPage() {
  const { getToken } = useAuth();
  const [emails,  setEmails]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [chip,    setChip]    = useState("All strategies");
  const [offset,  setOffset]  = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Paged like History — previously this fetched a single page of 100 and
  // silently dropped any favorites beyond it.
  useEffect(() => {
    let cancelled = false;
    const appending = offset > 0;

    api.get(`/api/emails?favorites=true&limit=${PAGE_SIZE}&offset=${offset}`, { getToken })
      .then((d) => {
        if (cancelled) return;
        setEmails((p) => appending ? [...p, ...d.emails] : d.emails);
        setHasMore(d.emails.length === PAGE_SIZE);
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load favorites"); })
      .finally(() => { if (!cancelled) { setLoading(false); setLoadingMore(false); } });
    return () => { cancelled = true; };
  }, [offset]);

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
          <Spinner padded />
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
            {filtered.map(({ email, variation, idx }) => {
              const m = STRATEGY_META[idx] ?? STRATEGY_META[0];
              return (
              <article key={`${email.id}-${idx}`} className="fcard">
                <div className="fcard-top">
                  <span className={`vletter${m.cls ? ` ${m.cls}` : ""}`}>
                    {m.letter}
                  </span>
                  <div>
                    <div className="vstrat">{variation.label || m.strat}</div>
                    <div className="vname">{m.name}</div>
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
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
            <button
              className="btn btn-ghost"
              disabled={loadingMore}
              onClick={() => { setLoadingMore(true); setOffset((p) => p + PAGE_SIZE); }}
            >
              {loadingMore ? "Loading…" : "Load more favorites"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
