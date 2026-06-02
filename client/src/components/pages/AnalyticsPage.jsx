import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, Copy, Heart, SlidersHorizontal, TrendingUp, Minus, Zap, CalendarCheck, Flame } from "lucide-react";
import { api } from "../../lib/api";

const BAR_DATA = [4, 7, 5, 9, 6, 11, 8, 3, 10, 13, 9, 12, 7, 14];
const BAR_MAX  = Math.max(...BAR_DATA);

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [chip,     setChip]     = useState("30 days");
  const [animated, setAnimated] = useState(false);
  const barsRef = useRef(null);

  useEffect(() => {
    api.get("/api/analytics/dashboard", { getToken })
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const total  = stats?.totalGenerations ?? 0;
  const copied = stats?.totalCopies      ?? 0;
  const faved  = stats?.totalFavorited   ?? 0;
  const copyRate = total > 0 ? Math.round((copied / (total * 3)) * 100) : 0;
  const favRate  = total > 0 ? Math.round((faved  / total) * 100) : 0;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Analytics</h1>
          <div className="sub">What you write, copy, and favorite — and what's landing.</div>
        </div>
        <div className="topbar-right">
          <span className="pill tint"><Zap style={{ width: 13, height: 13 }} /> Pro feature</span>
          <div className="chips">
            {["7 days", "30 days", "All time"].map((c) => (
              <button key={c} className={`chip${chip === c ? " on" : ""}`} onClick={() => setChip(c)}>{c}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="page">
        {/* Stat cards */}
        <div className="stat-row">
          <div className="scard">
            <div className="sc-top"><span className="sc-lbl">Generations</span><span className="sc-ic"><Sparkles /></span></div>
            <div className="sc-n">{total}</div>
            <div className="sc-delta up"><TrendingUp /> +22% vs last month</div>
          </div>
          <div className="scard">
            <div className="sc-top"><span className="sc-lbl">Copy rate</span><span className="sc-ic"><Copy /></span></div>
            <div className="sc-n"><em>{copyRate}%</em></div>
            <div className="sc-delta up"><TrendingUp /> +6 pts vs last month</div>
          </div>
          <div className="scard">
            <div className="sc-top"><span className="sc-lbl">Favorite rate</span><span className="sc-ic"><Heart /></span></div>
            <div className="sc-n">{favRate}%</div>
            <div className="sc-delta flat"><Minus /> About the same</div>
          </div>
          <div className="scard">
            <div className="sc-top"><span className="sc-lbl">Top tone</span><span className="sc-ic"><SlidersHorizontal /></span></div>
            <div className="sc-n" style={{ fontSize: "1.7rem", paddingTop: 8 }}>Professional</div>
            <div className="sc-delta flat"><Minus /> 44% of all briefs</div>
          </div>
        </div>

        {/* Bar chart + strategy */}
        <div className="chart-grid">
          <div className="chart-card">
            <div className="chart-head">
              <h3>Generations over time</h3>
              <span className="legend">Last 14 days · {total} total</span>
            </div>
            <div className="bars" ref={barsRef}>
              {BAR_DATA.map((v, i) => (
                <div key={i} className="bar-col">
                  <div
                    className="bar"
                    style={{ height: animated ? `${(v / BAR_MAX) * 100}%` : "0%", transition: `height .5s cubic-bezier(.2,.7,.2,1) ${60 + i * 35}ms` }}
                  />
                  <div className="day">{i === BAR_DATA.length - 1 ? "Today" : i + 1}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head"><h3>Which angle lands?</h3></div>
            <div className="hbars">
              {[
                { label: "Pain-point lead",   cls: "",  val: "38×", pct: 64 },
                { label: "Social-proof hook", cls: "b", val: "51×", pct: 86 },
                { label: "Direct value prop", cls: "c", val: "33×", pct: 56 },
              ].map(({ label, cls, val, pct }, i) => (
                <div key={i} className="hbar">
                  <div className="hb-top">
                    <span className="hb-name">
                      <span className={`vletter${cls ? ` ${cls}` : ""}`} style={{ width: 24, height: 24, fontSize: 12 }}>
                        {["A","B","C"][i]}
                      </span>
                      {label}
                    </span>
                    <span className="hb-val">copied {val}</span>
                  </div>
                  <div className="hb-track">
                    <div className={`hb-fill${cls ? ` ${cls}` : ""}`} style={{ width: animated ? `${pct}%` : "0%", transition: `width .6s cubic-bezier(.2,.7,.2,1) ${i * 100}ms` }} />
                  </div>
                </div>
              ))}
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>
                Social-proof is your highest-copied angle this month. Lean into it for cold opens.
              </p>
            </div>
          </div>
        </div>

        {/* Tone + glance */}
        <div className="ana-foot">
          <div className="chart-card">
            <div className="chart-head"><h3>Tone mix</h3></div>
            <div className="hbars">
              {[
                { label: "Professional", pct: 44 },
                { label: "Friendly",     pct: 27 },
                { label: "Casual",       pct: 19 },
                { label: "Bold",         pct: 10 },
              ].map(({ label, pct }) => (
                <div key={label} className="hbar">
                  <div className="hb-top">
                    <span className="hb-name">{label}</span>
                    <span className="hb-val">{pct}%</span>
                  </div>
                  <div className="hb-track">
                    <div className="hb-fill" style={{ width: animated ? `${pct}%` : "0%", transition: "width .6s cubic-bezier(.2,.7,.2,1)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-head"><h3>This month at a glance</h3></div>
            <div className="hbars" style={{ gap: 18 }}>
              {[
                { Icon: CalendarCheck, title: "19 active days",       desc: "You wrote on most weekdays this month." },
                { Icon: Zap,           title: "6.7s average draft",   desc: "From brief to three sendable variations." },
                { Icon: Flame,         title: "8-day streak",         desc: "Your longest run of consecutive writing days." },
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
      </div>
    </>
  );
}
