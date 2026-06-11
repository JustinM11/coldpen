import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { Check, Zap, Download, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { initials, downloadJson } from "../../lib/utils";
import { loadWritingDefaults, saveWritingDefaults } from "../../lib/writingDefaults";

const TONES      = ["Professional", "Casual", "Friendly", "Bold"];
const SECTIONS   = ["Profile", "Plan & billing", "Writing defaults", "Notifications", "Danger zone"];
const SEC_IDS    = ["profile", "plan", "defaults", "notifications", "danger"];

const DEFAULT_NOTIFS = { updates: true, recap: true, limit: false, tips: true };
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { user }     = useUser();
  const { signOut }  = useClerk();
  const navigate     = useNavigate();

  const [userInfo,    setUserInfo]    = useState(null);
  const [activeSec,   setActiveSec]   = useState("profile");
  const [portalBusy,  setPortalBusy]  = useState(false);
  const [fullName,    setFullName]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const avatarInputRef = useRef(null);

  // Writing defaults — load from localStorage
  const saved = loadWritingDefaults();
  const [defaultTone, setDefTone]    = useState(saved.tone        || "Professional");
  const [senderName,  setSenderName] = useState(saved.senderName  || "");
  const [signature,   setSignature]  = useState(saved.signature   || "");
  const [notifs,      setNotifs]     = useState(saved.notifs || DEFAULT_NOTIFS);

  useEffect(() => {
    api.get("/api/users/me", { getToken })
      .then((d) => setUserInfo(d.user))
      .catch(() => {});
  }, []);

  // Seed the editable name from Clerk once the user object is available.
  // Re-runs after a successful user.update() (new user ref) with the same value.
  useEffect(() => {
    if (user) setFullName(user.fullName || userInfo?.name || "");
  }, [user]);

  const name   = user?.fullName || userInfo?.name || "";
  const email  = user?.primaryEmailAddress?.emailAddress || userInfo?.email || "";
  const plan   = userInfo?.plan ?? "free";
  const used   = userInfo?.generationToday ?? 0;
  const cap    = userInfo?.generationLimit ?? 5;
  const avatar = user?.imageUrl;

  const scrollTo = (id) => {
    setActiveSec(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDiscard = () => {
    const s = loadWritingDefaults();
    setDefTone(s.tone || "Professional");
    setSenderName(s.senderName || "");
    setSignature(s.signature || "");
    setNotifs(s.notifs || DEFAULT_NOTIFS);
    setFullName(user?.fullName || userInfo?.name || "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Writing defaults / notifications live in localStorage.
      saveWritingDefaults({ tone: defaultTone, senderName, signature, notifs });

      // Push the profile name to Clerk (source of truth) only when it changed.
      const trimmed = fullName.trim();
      if (user && trimmed && trimmed !== (user.fullName || "")) {
        const [first, ...rest] = trimmed.split(/\s+/);
        await user.update({ firstName: first, lastName: rest.join(" ") });
      }

      toast.success("Settings saved");
    } catch (err) {
      toast.error(err?.errors?.[0]?.message || "Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = () => avatarInputRef.current?.click();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 10 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      await user.setProfileImage({ file });
      toast.success("Profile photo updated");
    } catch {
      toast.error("Could not upload that image. Please try again.");
    } finally {
      setUploading(false);
    }
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.get("/api/users/export", { getToken });
      downloadJson(`coldpen-export-${new Date().toISOString().slice(0, 10)}.json`, data);
      toast.success("Your data has been exported");
    } catch { toast.error("Failed to export your data"); }
    finally { setExporting(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/api/users/me", { getToken });
      // The Clerk user is gone; end the local session and leave the app.
      await signOut();
      navigate("/", { replace: true });
    } catch {
      toast.error("Could not delete your account. Please try again or email support.");
      setDeleting(false);
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
          <button className="btn btn-ghost" style={{ fontSize: 14, padding: "10px 16px" }} disabled={saving}
            onClick={handleDiscard}>
            Discard
          </button>
          <button className="btn btn-primary" style={{ fontSize: 14, padding: "10px 18px" }} onClick={handleSave} disabled={saving}>
            {saving
              ? <><Loader2 style={{ width: 16, height: 16, animation: "dash-spin .7s linear infinite" }} /> Saving…</>
              : <><Check style={{ width: 16, height: 16 }} /> Save changes</>}
          </button>
        </div>
      </header>

      <div className="page">
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
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                  <button className="btn btn-ghost" style={{ fontSize: 13.5, padding: "9px 15px" }} onClick={handleAvatarPick} disabled={uploading}>
                    {uploading
                      ? <><Loader2 style={{ width: 14, height: 14, animation: "dash-spin .7s linear infinite" }} /> Uploading…</>
                      : "Upload image"}
                  </button>
                </div>
              </div>
              <div className="frow">
                <div className="fl">Full name</div>
                <input className="inp" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="frow">
                <div className="fl">Email <small>Managed by your login provider</small></div>
                <input className="inp" type="email" value={email} disabled readOnly
                  style={{ opacity: 0.65, cursor: "not-allowed" }} title="Your sign-in email can't be changed here" />
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
                <button className="btn btn-ghost" style={{ fontSize: 13.5 }} onClick={handleExport} disabled={exporting}>
                  {exporting
                    ? <><Loader2 style={{ width: 15, height: 15, animation: "dash-spin .7s linear infinite" }} /> Exporting…</>
                    : <><Download style={{ width: 15, height: 15 }} /> Export</>}
                </button>
              </div>
              <div className="danger-row">
                <div className="dr-l"><b>Delete account</b><p>Permanently remove your account and all saved drafts. This can't be undone.</p></div>
                <button className="btn btn-danger" style={{ fontSize: 13.5 }} onClick={() => setDeleteOpen(true)}>Delete account</button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Delete account confirmation */}
      <div
        className={`modal-scrim${deleteOpen ? " open" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteOpen(false); }}
      >
        <div className="modal-box" role="dialog" aria-modal="true">
          <div className="m-ic"><Trash2 /></div>
          <h3>Delete your account?</h3>
          <p>
            This permanently removes <b>{email}</b>, every brief, every draft, and every
            favorite. There is no way to recover them afterwards.
          </p>
          <div className="m-acts">
            <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Keep my account
            </button>
            <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting
                ? <><Loader2 style={{ width: 15, height: 15, animation: "dash-spin .7s linear infinite" }} /> Deleting…</>
                : "Delete forever"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
