import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { Search, Download, Plus, CornerUpLeft, Copy, Trash2 } from "lucide-react";
import { api } from "../../lib/api";

const PAGE_SIZE = 20;
const CHIPS = ["All", "Favorited", "Professional", "Casual", "Friendly", "Bold"];

function groupByDay(emails) {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const groups = {};
  emails.forEach((e) => {
    const d = new Date(e.created_at); d.setHours(0,0,0,0);
    let label;
    if (d >= today)     label = "Today";
    else if (d >= yesterday) label = "Yesterday";
    else if (d >= weekAgo)   label = "Earlier this week";
    else label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });
  return groups;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function HistoryPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [emails,   setEmails]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [debSearch,setDebSearch]= useState("");
  const [chip,     setChip]     = useState("All");
  const [offset,   setOffset]   = useState(0);
  const [hasMore,  setHasMore]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setOffset(0); setEmails([]); }, [debSearch, chip]);

  useEffect(() => {
    let cancelled = false;
    const appending = offset > 0;
    if (appending) setLoadingMore(true); else setLoading(true);

    const params = new URLSearchParams();
    if (debSearch) params.set("search", debSearch);
    if (chip === "Favorited") params.set("favorites", "true");
    else if (chip !== "All") params.set("tone", chip.toLowerCase());
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));

    api.get(`/api/emails?${params}`, { getToken })
      .then((d) => {
        if (cancelled) return;
        setEmails((p) => appending ? [...p, ...d.emails] : d.emails);
        setHasMore(d.emails.length === PAGE_SIZE);
      })
      .catch(() => { if (!cancelled) toast.error("Failed to load history"); })
      .finally(() => { if (!cancelled) { setLoading(false); setLoadingMore(false); } });

    return () => { cancelled = true; };
  }, [debSearch, chip, offset]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/emails/${id}`, { getToken });
      setEmails((p) => p.filter((x) => x.id !== id));
      toast.success("Brief deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleCopy = async (email, e) => {
    e.stopPropagation();
    const variations = email.variations || [];
    if (variations.length === 0) { toast.error("Nothing to copy"); return; }
    const text = variations
      .map((v, i) => `Variation ${String.fromCharCode(65 + i)}\nSubject: ${v.subject}\n\n${v.body}`)
      .join("\n\n———\n\n");
    try {
      await navigator.clipboard.writeText(text);
      api.patch(`/api/emails/${email.id}/copy`, { getToken }).catch(() => {});
      toast.success(variations.length > 1 ? "All variations copied" : "Copied to clipboard");
    } catch { toast.error("Failed to copy"); }
  };

  const handleReopen = (email, e) => {
    e.stopPropagation();
    navigate("/dashboard", {
      state: { prefill: { productDescription: email.product_description, targetAudience: email.target_audience, tone: email.tone, ctaGoal: email.cta_goal } },
    });
  };

  const grouped = groupByDay(emails);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>History</h1>
          <div className="sub">Every brief you've run — search, reopen, reuse.</div>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" title="Export" onClick={() => toast("History export is coming soon.")}><Download /></button>
          <Link className="btn btn-primary" to="/dashboard" style={{ fontSize: 14, padding: "11px 18px" }}>
            <Plus style={{ width: 16, height: 16 }} /> New brief
          </Link>
        </div>
      </header>

      <div className="page">
        <div className="hist-tools">
          <div className="search">
            <Search />
            <input
              type="text"
              placeholder="Search by offer, prospect, or subject line…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="chips">
            {CHIPS.map((c) => (
              <button key={c} className={`chip${chip === c ? " on" : ""}`} onClick={() => setChip(c)}>{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--line)", borderTopColor: "var(--clay)", animation: "dash-spin .8s linear infinite" }} />
          </div>
        ) : emails.length === 0 ? (
          <div className="panel" style={{ padding: "64px 32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 500, color: "var(--ink)" }}>
              {debSearch || chip !== "All" ? "No matches found" : "No briefs yet"}
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
              {debSearch || chip !== "All" ? "Try adjusting your search or filter." : "Generate your first email to see it here."}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([label, group]) => (
            <div key={label} className="day-group">
              <div className="day-label">{label}</div>
              {group.map((email) => (
                <div key={email.id} className="hrow" onClick={() => handleReopen(email, { stopPropagation: () => {} })}>
                  <div className="htime">{formatTime(email.created_at)}</div>
                  <div className="hmain">
                    <div className="hoffer">{email.product_description}</div>
                    <div className="hmeta">
                      <span className="tbadge" style={{ textTransform: "capitalize" }}>{email.tone}</span>
                      <span className="seg-strats">
                        <span className="strat-dot">A</span>
                        <span className="strat-dot b">B</span>
                        <span className="strat-dot c">C</span>
                      </span>
                      {email.is_favorited && (
                        <span className="favd">
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          Favorited
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hactions">
                    <button className="mini" title="Reopen" onClick={(e) => handleReopen(email, e)}><CornerUpLeft /></button>
                    <button className="mini" title="Copy" onClick={(e) => handleCopy(email, e)}><Copy /></button>
                    <button className="mini danger" title="Delete" onClick={(e) => handleDelete(email.id, e)}><Trash2 /></button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {hasMore && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
            <button
              className="btn btn-ghost"
              disabled={loadingMore}
              onClick={() => setOffset((p) => p + PAGE_SIZE)}
            >
              {loadingMore ? "Loading…" : "Load older briefs"}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes dash-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
