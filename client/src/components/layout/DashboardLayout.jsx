import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import {
  PenLine, History, Heart, BarChart3, Settings, LifeBuoy,
  LogOut, Zap, ArrowRight, Menu, X,
} from "lucide-react";
import { api } from "../../lib/api";

const NAV = [
  { sec: "Workspace" },
  { id: "generate",  label: "Generate",  Icon: PenLine,   to: "/dashboard" },
  { id: "history",   label: "History",    Icon: History,   to: "/dashboard/history" },
  { id: "favorites", label: "Favorites",  Icon: Heart,     to: "/dashboard/favorites" },
  { id: "analytics", label: "Analytics",  Icon: BarChart3, to: "/dashboard/analytics" },
  { sec: "Account" },
  { id: "settings",  label: "Settings",   Icon: Settings,  to: "/dashboard/settings" },
  { id: "help",      label: "Help",       Icon: LifeBuoy,  to: "/dashboard/help" },
];

const MIN_WIDTH     = 180;
const MAX_WIDTH     = 400;
const DEFAULT_WIDTH = 256;
const STORAGE_KEY   = "coldpen-sidebar-width";

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Shared sidebar content used by both the desktop .side and mobile drawer ──
function SidebarContent({ used, cap, plan, name, email, avatar, compact, onNavClick, onLogout }) {
  const ini = initials(name);
  return (
    <>
      <Link to="/" className="brand" onClick={onNavClick} style={{ gap: compact ? 0 : 10 }}>
        <span className="nib">
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 15, height: 15 }}>
            <path d="M12 3 L18 12 L12 16 L6 12 Z" fill="#fff" />
            <path d="M12 16 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        {!compact && "ColdPen"}
      </Link>

      {NAV.map((item, i) =>
        item.sec ? (
          !compact && <div key={i} className="side-sec">{item.sec}</div>
        ) : (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) => `nav-item${isActive ? " on" : ""}`}
            title={compact ? item.label : undefined}
            style={{ justifyContent: compact ? "center" : undefined, padding: compact ? "10px" : undefined }}
            onClick={onNavClick}
          >
            <item.Icon />
            {!compact && item.label}
          </NavLink>
        )
      )}

      <div className="side-foot">
        {!compact && (
          <div className="usage">
            <div className="usage-top">
              <span className="lbl">Daily generations</span>
              <span className="ct">{used} / {cap}</span>
            </div>
            <div className="meter"><span style={{ width: `${Math.min(100, (used / cap) * 100)}%` }} /></div>
            <p className="hint">
              {plan === "pro"
                ? "Pro plan — effectively unlimited."
                : "Free plan resets at midnight. Go Pro for effectively unlimited."}
            </p>
            {plan !== "pro" && (
              <Link className="up" to="/pricing" onClick={onNavClick}>
                <Zap /> Upgrade to Pro
              </Link>
            )}
          </div>
        )}

        <div className="user-chip" style={{ justifyContent: compact ? "center" : undefined }}>
          <span className="av" title={compact ? `${name} — click to log out` : undefined}
            style={{ cursor: compact ? "pointer" : undefined }}
            onClick={compact ? onLogout : undefined}
          >
            {avatar ? <img src={avatar} alt={name} /> : ini}
          </span>
          {!compact && (
            <>
              <div>
                <div className="nm">{name || "—"}</div>
                <div className="em">{email}</div>
              </div>
              <button className="gear" title="Log out" onClick={onLogout}><LogOut /></button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const { getToken } = useAuth();
  const { user }     = useUser();
  const { signOut }  = useClerk();
  const navigate     = useNavigate();

  const [userInfo,    setUserInfo]    = useState(null);
  const [logoutOpen,  setLogoutOpen]  = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [sideWidth,   setSideWidth]   = useState(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? Number(s) : DEFAULT_WIDTH;
  });
  const [dragging, setDragging] = useState(false);
  const dragStart  = useRef(null);

  useEffect(() => {
    api.get("/api/users/me", { getToken })
      .then((d) => setUserInfo(d.user))
      .catch(() => {});
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Mouse resize ──
  const onHandleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, width: sideWidth };
    setDragging(true);
  }, [sideWidth]);

  // ── Touch resize ──
  const onHandleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    dragStart.current = { x: t.clientX, width: sideWidth };
    setDragging(true);
  }, [sideWidth]);

  useEffect(() => {
    if (!dragging) return;

    const clamp = (v) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, v));

    const onMouseMove  = (e) => setSideWidth(clamp(dragStart.current.width + e.clientX - dragStart.current.x));
    const onTouchMove  = (e) => { e.preventDefault(); const t = e.touches[0]; setSideWidth(clamp(dragStart.current.width + t.clientX - dragStart.current.x)); };
    const onEnd        = () => setDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  onEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onEnd);
    };
  }, [dragging]);

  useEffect(() => {
    if (!dragging) localStorage.setItem(STORAGE_KEY, String(sideWidth));
  }, [dragging, sideWidth]);

  const used    = userInfo?.generationToday ?? 0;
  const cap     = userInfo?.generationLimit ?? 5;
  const plan    = userInfo?.plan            ?? "free";
  const name    = user?.fullName || user?.firstName || userInfo?.name || "";
  const email   = user?.primaryEmailAddress?.emailAddress || userInfo?.email || "";
  const avatar  = user?.imageUrl;
  const compact = sideWidth < 220;

  const sideProps = { used, cap, plan, name, email, avatar, onLogout: () => setLogoutOpen(true) };

  return (
    <div
      className="app"
      style={{
        fontFamily: "var(--font-sans)",
        gridTemplateColumns: `${sideWidth}px 1fr`,
        userSelect: dragging ? "none" : undefined,
        cursor: dragging ? "col-resize" : undefined,
      }}
    >
      {/* ── Desktop sidebar ── */}
      <aside className="side" style={{ padding: compact ? "22px 12px" : "22px 18px" }}>
        <SidebarContent {...sideProps} compact={compact} onNavClick={undefined} />
      </aside>

      {/* ── Drag-to-resize handle ── */}
      <div
        className="resize-handle"
        onMouseDown={onHandleMouseDown}
        onTouchStart={onHandleTouchStart}
        style={{
          position: "absolute", left: sideWidth - 3, top: 0,
          width: 6, height: "100vh", cursor: "col-resize", zIndex: 50,
          background: dragging ? "var(--clay)" : "transparent",
          transition: dragging ? "none" : "background .15s",
        }}
        onMouseEnter={(e) => { if (!dragging) e.currentTarget.style.background = "rgba(194,104,63,.25)"; }}
        onMouseLeave={(e) => { if (!dragging) e.currentTarget.style.background = "transparent"; }}
      />

      {/* ── Main ── */}
      <div className="main">

        {/* Mobile top bar */}
        <div className="mobile-bar">
          <button className="m-ham" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <Link to="/" className="m-logo">
            <span className="nib">
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 13, height: 13 }}>
                <path d="M12 3 L18 12 L12 16 L6 12 Z" fill="#fff" />
                <path d="M12 16 V21" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            ColdPen
          </Link>
          <span className="m-av" onClick={() => setLogoutOpen(true)} title="Log out">
            {avatar ? <img src={avatar} alt={name} /> : initials(name)}
          </span>
        </div>

        <div className="scroll">
          <Outlet />
        </div>
      </div>

      {/* ── Mobile drawer backdrop ── */}
      <div
        className={`drawer-backdrop${mobileOpen ? " open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile drawer ── */}
      <nav className={`drawer${mobileOpen ? " open" : ""}`} aria-label="Mobile navigation">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
          <button
            style={{ background: "none", border: "none", color: "#C8C0B0", cursor: "pointer", padding: 4 }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <SidebarContent
          {...sideProps}
          compact={false}
          onNavClick={() => setMobileOpen(false)}
        />
      </nav>

      {/* ── Logout modal ── */}
      <div
        className={`modal-scrim${logoutOpen ? " open" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) setLogoutOpen(false); }}
      >
        <div className="modal-box" role="dialog" aria-modal="true">
          <div className="m-ic"><LogOut /></div>
          <h3>Log out of ColdPen?</h3>
          <p>
            You're signed in as <b>{email}</b>. Your drafts and favorites
            stay saved — you can pick up right where you left off.
          </p>
          <div className="m-acts">
            <button className="btn btn-ghost" onClick={() => setLogoutOpen(false)}>
              Stay logged in
            </button>
            <button className="btn btn-primary" onClick={() => signOut(() => navigate("/sign-in"))}>
              Log out <ArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
