import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  Sparkles, Copy, Heart, SlidersHorizontal, TrendingUp, TrendingDown,
  Minus, Zap, CalendarCheck, Flame,
} from "lucide-react";
import { api } from "../../lib/api";
import Spinner from "../Spinner";

const TONE_LABELS = { professional: "Professional", casual: "Casual", friendly: "Friendly", bold: "Bold" };

function MonthDelta({ thisMonth, lastMonth }) {
  if (lastMonth === 0 && thisMonth === 0) {
    return <div className="sc-delta flat"><Minus /> No activity yet this month</div>;
  }
  if (lastMonth === 0) {
    return <div className="sc-delta up"><TrendingUp /> {thisMonth} this month</div>;
  }
  const diff = thisMonth - lastMonth;
  if (diff === 0) return <div className="sc-delta flat"><Minus /> Same as last month</div>;
  const pct = Math.round((diff / lastMonth) * 100);
  return diff > 0
    ? <div className="sc-delta up"><TrendingUp /> +{pct}% vs last month</div>
    : <div className="sc-delta flat"><TrendingDown /> {pct}% vs last month</div>;
}

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [error,    setError]    = useState(false);
  const [animated, setAnimated] = useState(false);

  const fetchStats = useCallback(() => {
    api.get("/api/analytics/dashboard", { getToken })
      .then((d) => setStats(d.stats))
      .catch(() => setError(true));
  }, [getToken]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const retry = () => {
    setError(false);
    setStats(null);
    fetchStats();
  };

  useEffect(() => {
    if (!stats) return;
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [stats]);

  const total  = stats?.totalGenerations ?? 0;
  const copied = stats?.totalCopies      ?? 0;
  const faved  = stats?.totalFavorited   ?? 0;
  const copyRate = total > 0 ? Math.round((copied / (total * 3)) * 100) : 0;
  const favRate  = total > 0 ? Math.round((faved  / total) * 100) : 0;

  const daily   = stats?.daily ?? [];
  const barMax  = Math.max(1, ...daily.map((d) => d.count));
  const toneMix = stats?.toneMix ?? [];
  const toneTotal = toneMix.reduce((s, t) => s + t.count, 0);
  const topTone = toneMix[0];
  const topCopied = stats?.topCopied ?? [];
  const copiedMax = Math.max(1, ...topCopied.map((e) => e.copiedCount));

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Analytics</h1>
          <div className="sub">What you write, copy, and favorite — and what's landing.</div>
        </div>
        <div className="topbar-right">
          <span className="pill tint"><Zap style={{ width: 13, height: 13 }} /> Updated live</span>
        </div>
      </header>

      <div className="page">
        {error ? (
          <div className="panel" style={{ padding: "64px 32px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 500, color: "var(--ink)" }}>
              Couldn't load your analytics
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
              Check your connection and try again.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={retry}>Retry</button>
          </div>
        ) : !stats ? (
          <Spinner padded />
        ) : total === 0 ? (
          <div className="panel" style={{ padding: "64px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--clay-tint)", color: "var(--clay-deep)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}>
              <Sparkles style={{ width: 24, height: 24 }} />
            </div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 500, color: "var(--ink)" }}>
              No data yet
            </p>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
              Generate your first emails and your analytics will build up here.
            </p>
            <Link className="btn btn-primary" to="/dashboard" style={{ marginTop: 20, display: "inline-flex" }}>
              <Sparkles style={{ width: 16, height: 16 }} /> Generate emails
            </Link>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="stat-row">
              <div className="scard">
                <div className="sc-top"><span className="sc-lbl">Generations</span><span className="sc-ic"><Sparkles /></span></div>
                <div className="sc-n">{total}</div>
                <MonthDelta thisMonth={stats.thisMonth} lastMonth={stats.lastMonth} />
              </div>
              <div className="scard">
                <div className="sc-top"><span className="sc-lbl">Copy rate</span><span className="sc-ic"><Copy /></span></div>
                <div className="sc-n"><em>{copyRate}%</em></div>
                <div className="sc-delta flat">{copied} {copied === 1 ? "copy" : "copies"} across all variations</div>
              </div>
              <div className="scard">
                <div className="sc-top"><span className="sc-lbl">Favorite rate</span><span className="sc-ic"><Heart /></span></div>
                <div className="sc-n">{favRate}%</div>
                <div className="sc-delta flat">{faved} {faved === 1 ? "brief" : "briefs"} favorited</div>
              </div>
              <div className="scard">
                <div className="sc-top"><span className="sc-lbl">Top tone</span><span className="sc-ic"><SlidersHorizontal /></span></div>
                <div className="sc-n" style={{ fontSize: "1.7rem", paddingTop: 8 }}>
                  {topTone ? (TONE_LABELS[topTone.tone] || topTone.tone) : "—"}
                </div>
                <div className="sc-delta flat">
                  {topTone ? `${Math.round((topTone.count / toneTotal) * 100)}% of all briefs` : "No briefs yet"}
                </div>
              </div>
            </div>

            {/* Bar chart + most copied */}
            <div className="chart-grid">
              <div className="chart-card">
                <div className="chart-head">
                  <h3>Generations over time</h3>
                  <span className="legend">Last 14 days · {daily.reduce((s, d) => s + d.count, 0)} total</span>
                </div>
                <div className="bars">
                  {daily.map((d, i) => (
                    <div key={d.day} className="bar-col">
                      <div
                        className="bar"
                        title={`${d.day}: ${d.count}`}
                        style={{
                          height: animated ? `${Math.max(d.count > 0 ? 4 : 0, (d.count / barMax) * 100)}%` : "0%",
                          transition: `height .5s cubic-bezier(.2,.7,.2,1) ${60 + i * 35}ms`,
                        }}
                      />
                      <div className="day">{i === daily.length - 1 ? "Today" : Number(d.day.slice(8, 10))}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-head"><h3>Most copied briefs</h3></div>
                <div className="hbars">
                  {topCopied.length === 0 ? (
                    <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                      Nothing copied yet. Copy a variation on the Generate page and your
                      most-used briefs will rank here.
                    </p>
                  ) : (
                    <>
                      {topCopied.map((e, i) => (
                        <div key={e.id} className="hbar">
                          <div className="hb-top">
                            <span className="hb-name" style={{ minWidth: 0 }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {e.productDescription}
                              </span>
                            </span>
                            <span className="hb-val" style={{ flex: "none" }}>copied {e.copiedCount}×</span>
                          </div>
                          <div className="hb-track">
                            <div
                              className={`hb-fill${["", " b", " c"][i] || ""}`}
                              style={{ width: animated ? `${(e.copiedCount / copiedMax) * 100}%` : "0%", transition: `width .6s cubic-bezier(.2,.7,.2,1) ${i * 100}ms` }}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>
                        Copies are tracked per brief — the offers you reach for most often.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tone mix + glance */}
            <div className="ana-foot">
              <div className="chart-card">
                <div className="chart-head"><h3>Tone mix</h3></div>
                <div className="hbars">
                  {toneMix.map(({ tone, count }) => {
                    const pct = Math.round((count / toneTotal) * 100);
                    return (
                      <div key={tone} className="hbar">
                        <div className="hb-top">
                          <span className="hb-name">{TONE_LABELS[tone] || tone}</span>
                          <span className="hb-val">{pct}%</span>
                        </div>
                        <div className="hb-track">
                          <div className="hb-fill" style={{ width: animated ? `${pct}%` : "0%", transition: "width .6s cubic-bezier(.2,.7,.2,1)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-head"><h3>At a glance</h3></div>
                <div className="hbars" style={{ gap: 18 }}>
                  {[
                    { Icon: CalendarCheck, title: `${stats.activeDaysThisMonth} active ${stats.activeDaysThisMonth === 1 ? "day" : "days"} this month`, desc: "Days you generated at least one brief." },
                    { Icon: Flame,         title: `${stats.longestStreak}-day streak`, desc: "Your longest run of consecutive writing days, last 90 days." },
                    { Icon: Heart,         title: `${faved} ${faved === 1 ? "favorite" : "favorites"} saved`, desc: "Your swipe file of proven openers keeps growing." },
                  ].map(({ Icon, title, desc }) => (
                    <div key={title} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                      <span className="sc-ic" style={{ background: "var(--clay-tint)", color: "var(--clay-deep)", width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center" }}>
                        <Icon style={{ width: 17, height: 17 }} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
                        <div className="muted" style={{ fontSize: 13 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
