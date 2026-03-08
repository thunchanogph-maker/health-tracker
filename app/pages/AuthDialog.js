"use client";

import { useEffect, useState } from "react";
import {
  register, login, loginWithGoogle,
  logout, loadAuthState, resetPassword, onAuthChange,
} from "./Auth";

export default function AuthDialog({
  onLogin,
  customClass,
  accentColor  = "#7C3AED",
  darkMode     = false,
  defaultView  = "login",   // "login" | "register"
  autoOpen     = false,     // controlled open from parent
  onModalClose = null,      // callback when modal closes
  hideTriggerWhenLoggedOut = false, // hide Sign in button when not logged in
}) {
  const [view,        setView]        = useState(defaultView);  // "login"|"register"|"forgot"
  const [isOpen,      setIsOpen]      = useState(false);
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConf,    setShowConf]    = useState(false);
  const [name,        setName]        = useState("");
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [gLoading,    setGLoading]    = useState(false);
  const [user,        setUser]        = useState(null);

  // ── ฟัง Firebase auth state เสมอ (รองรับ refresh / Google redirect) ──
  useEffect(() => {
    // โหลด localStorage ก่อน (ป้องกัน flicker)
    const cached = loadAuthState();
    if (cached) { setUser(cached); onLogin(cached); }

    // ฟัง realtime auth changes
    const unsub = onAuthChange((u) => {
      setUser(u);
      onLogin(u);
    });
    return () => unsub();
  }, []); // eslint-disable-line

  // ── Controlled open from parent (autoOpen prop) ──
  useEffect(() => {
    if (autoOpen) {
      setView(defaultView);
      setIsOpen(true);
    }
  }, [autoOpen, defaultView]); // eslint-disable-line

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirmPass(""); setName("");
    setError(null); setSuccess(null);
    setShowPass(false); setShowConf(false);
  };
  const switchView = (v) => { resetForm(); setView(v); };
  const closeModal = () => { setIsOpen(false); resetForm(); setView("login"); if (onModalClose) onModalClose(); };

  // ── แปล Firebase error ──────────────────────────────────
  const friendlyError = (err) => {
    const c = err?.code || err?.message || "";
    if (c.includes("user-not-found"))     return "ไม่พบบัญชีอีเมลนี้ในระบบ";
    if (c.includes("wrong-password"))     return "รหัสผ่านไม่ถูกต้อง";
    if (c.includes("invalid-credential")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    if (c.includes("invalid-email"))      return "รูปแบบอีเมลไม่ถูกต้อง";
    if (c.includes("email-already"))      return "อีเมลนี้ถูกใช้งานแล้ว";
    if (c.includes("weak-password"))      return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (c.includes("popup-closed"))       return "ปิดหน้าต่าง Google ก่อนเสร็จ กรุณาลองใหม่";
    if (c.includes("popup-blocked"))      return "Browser บล็อก Popup — กรุณาอนุญาตก่อน";
    if (c.includes("cancelled-popup"))    return "ยกเลิกการเข้าสู่ระบบด้วย Google";
    if (c.includes("network"))            return "ไม่มีการเชื่อมต่ออินเทอร์เน็ต";
    return err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
  };

  // ── Email/Password submit ────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (view === "login") {
        const u = await login(email, password);
        setUser(u); onLogin(u); closeModal();

      } else if (view === "register") {
        if (password !== confirmPass) { setError("รหัสผ่านไม่ตรงกัน"); setLoading(false); return; }
        if (password.length < 6)     { setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); setLoading(false); return; }
        const u = await register(email, password, name);
        setUser(u); onLogin(u); closeModal();

      } else {
        await resetPassword(email);
        setSuccess("✅ ส่งลิงก์รีเซ็ตไปที่อีเมลแล้วค่ะ กรุณาตรวจสอบ inbox");
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally { setLoading(false); }
  };

  // ── Google Sign-in ───────────────────────────────────────
  const handleGoogle = async () => {
    setError(null); setGLoading(true);
    try {
      const u = await loginWithGoogle();
      setUser(u); onLogin(u); closeModal();
    } catch (err) {
      setError(friendlyError(err));
    } finally { setGLoading(false); }
  };

  // ── Logout ───────────────────────────────────────────────
  const handleLogout = async () => {
    try { await logout(); } catch {}
    setUser(null); onLogin(null);
  };

  // ── Styles ───────────────────────────────────────────────
  const panelBg    = darkMode ? "#1E1E2E" : "#FFFFFF";
  const cardBg     = darkMode ? "#2D2D3F" : "#F8FAFC";
  const borderCol  = darkMode ? "#3D3D4F" : "#E2E8F0";
  const textMain   = darkMode ? "#F1F5F9" : "#1E293B";
  const textSub    = darkMode ? "#64748B" : "#94A3B8";

  const inputStyle = {
    background:   darkMode ? "#2D2D3F" : "#F8FAFC",
    borderColor:  darkMode ? "#3D3D4F" : "#E2E8F0",
    color:        darkMode ? "#F1F5F9" : "#1E293B",
    borderWidth:  2,
    borderStyle:  "solid",
    borderRadius: 12,
    padding:      "12px 16px",
    width:        "100%",
    fontSize:     14,
    fontWeight:   500,
    outline:      "none",
    transition:   "border-color 0.2s",
  };
  const labelStyle = {
    display:      "block",
    color:        darkMode ? "#94A3B8" : "#64748B",
    fontSize:     12,
    fontWeight:   600,
    marginBottom: 6,
  };

  return (
    <div className={customClass}>

      {/* ── Trigger ────────────────────────────────────── */}
      {!user ? (
        hideTriggerWhenLoggedOut ? null : (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: accentColor, boxShadow: `0 4px 14px ${accentColor}50` }}
          >
            🔐 Sign in
          </button>
        )
      ) : (
        <button
          onClick={handleLogout}
          className="text-sm font-semibold px-3 py-1.5 rounded-xl border transition hover:opacity-80"
          style={{ borderColor: borderCol, color: textSub }}
        >
          ออกจากระบบ
        </button>
      )}

      {/* ── Modal ──────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
            style={{ background: panelBg, maxHeight: "95vh", overflowY: "auto" }}
          >
            {/* Accent strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ background: `linear-gradient(180deg,${accentColor},${accentColor}60)` }} />

            {/* Header */}
            <div className="px-8 pt-8 pb-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style={{ background: `${accentColor}20` }}>
                {view === "login" ? "🔐" : view === "register" ? "🌱" : "📧"}
              </div>
              <h2 className="text-2xl font-black mb-1" style={{ color: textMain }}>
                {view === "login"    ? "ยินดีต้อนรับกลับ"     :
                 view === "register" ? "สร้างบัญชีใหม่"        :
                                      "รีเซ็ตรหัสผ่าน"}
              </h2>
              <p className="text-sm mb-5" style={{ color: textSub }}>
                {view === "login"    ? "เข้าสู่ระบบเพื่อใช้งาน HealthTrack"  :
                 view === "register" ? "เริ่มติดตามสุขภาพของคุณวันนี้"         :
                                      "กรอกอีเมลเพื่อรับลิงก์รีเซ็ต"}
              </p>

              {/* Tab: login / register */}
              {view !== "forgot" && (
                <div className="flex rounded-xl p-1 mb-5"
                  style={{ background: cardBg }}>
                  {["login", "register"].map((v) => (
                    <button key={v} type="button" onClick={() => switchView(v)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                      style={{
                        background: view === v ? accentColor : "transparent",
                        color:      view === v ? "#fff" : textSub,
                        boxShadow:  view === v ? `0 2px 8px ${accentColor}50` : "none",
                      }}>
                      {v === "login" ? "Sign in" : "Sign up"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">

              {/* Alerts */}
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  ❌ {error}
                </div>
              )}
              {success && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                  {success}
                </div>
              )}

              {/* Name (register) */}
              {view === "register" && (
                <div>
                  <label style={labelStyle}>👤 ชื่อ-นามสกุล</label>
                  <input
                    type="text" value={name} required
                    onChange={(e) => setName(e.target.value)}
                    placeholder="กรอกชื่อของคุณ"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = accentColor}
                    onBlur={(e)  => e.target.style.borderColor = borderCol}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label style={labelStyle}>📧 อีเมล</label>
                <input
                  type="email" value={email} required
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = accentColor}
                  onBlur={(e)  => e.target.style.borderColor = borderCol}
                />
              </div>

              {/* Password */}
              {view !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label style={{ ...labelStyle, marginBottom: 0 }}>🔑 รหัสผ่าน</label>
                    {view === "login" && (
                      <button type="button" onClick={() => switchView("forgot")}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: accentColor }}>
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password} required
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: 48 }}
                      onFocus={(e) => e.target.style.borderColor = accentColor}
                      onBlur={(e)  => e.target.style.borderColor = borderCol}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                      style={{ color: textSub, lineHeight: 1 }}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm password (register) */}
              {view === "register" && (
                <div>
                  <label style={labelStyle}>🔑 ยืนยันรหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showConf ? "text" : "password"}
                      value={confirmPass} required
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: 48 }}
                      onFocus={(e) => e.target.style.borderColor = accentColor}
                      onBlur={(e)  => e.target.style.borderColor = borderCol}
                    />
                    <button type="button" onClick={() => setShowConf(!showConf)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                      style={{ color: textSub, lineHeight: 1 }}>
                      {showConf ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background:  loading ? "#94A3B8" : `linear-gradient(135deg,${accentColor},${accentColor}CC)`,
                  boxShadow:   loading ? "none" : `0 4px 16px ${accentColor}50`,
                  cursor:      loading ? "not-allowed" : "pointer",
                  marginTop:   8,
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path  className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  view === "login"    ? "🚀 เข้าสู่ระบบ"      :
                  view === "register" ? "🌱 สมัครสมาชิก"      :
                                       "📧 ส่งลิงก์รีเซ็ต"
                )}
              </button>

              {/* ── Divider ── */}
              {view !== "forgot" && (
                <>
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px" style={{ background: borderCol }} />
                    <span className="text-xs font-medium" style={{ color: textSub }}>หรือ</span>
                    <div className="flex-1 h-px" style={{ background: borderCol }} />
                  </div>

                  {/* Google button */}
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={gLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90 hover:scale-[1.01]"
                    style={{
                      background:  darkMode ? "#2D2D3F" : "#FFFFFF",
                      border:      `2px solid ${borderCol}`,
                      color:       textMain,
                      cursor:      gLoading ? "not-allowed" : "pointer",
                      boxShadow:   "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    {gLoading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path  className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    ) : (
                      /* Google SVG logo */
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.19 29.5 1 24 1 14.82 1 7.02 6.7 3.88 14.7l7.09 5.51C12.68 13.62 17.89 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.14-3.15-.4-4.65H24v8.8h12.42c-.54 2.9-2.18 5.36-4.63 7.01l7.19 5.59C43.18 37.02 46.1 31.24 46.1 24.5z"/>
                        <path fill="#FBBC05" d="M10.97 28.79A14.6 14.6 0 0 1 9.5 24c0-1.67.29-3.29.81-4.79L3.22 13.7A23.94 23.94 0 0 0 0 24c0 3.82.92 7.43 2.55 10.61l8.42-5.82z"/>
                        <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.48-4.94l-7.19-5.59c-1.99 1.34-4.54 2.13-6.29 2.13-6.11 0-11.32-4.12-13.03-9.71l-8.42 5.82C7.02 41.3 14.82 47 24 47z"/>
                      </svg>
                    )}
                    {gLoading ? "กำลังเชื่อมต่อ..." : "Sign in ด้วย Google"}
                  </button>
                </>
              )}

              {/* Back to login (forgot view) */}
              {view === "forgot" && (
                <button type="button" onClick={() => switchView("login")}
                  className="w-full text-sm font-semibold py-2 hover:underline transition"
                  style={{ color: textSub }}>
                  ← กลับไปหน้า Sign in
                </button>
              )}

              {/* Close */}
              <button type="button" onClick={closeModal}
                className="w-full text-sm font-medium py-2.5 rounded-xl transition hover:opacity-80"
                style={{ color: textSub, background: cardBg }}>
                ยกเลิก
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}