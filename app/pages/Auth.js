import { ref, set, get } from "firebase/database";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "./firebase";

// ── Helper: ดึงข้อมูล user จาก DB ──────────────────────────
const getUserData = async (uid) => {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    return snap.exists() ? snap.val() : {};
  } catch { return {}; }
};

// ── Helper: แปลง Firebase User → plain object (serialize ได้) ──
const serializeUser = (firebaseUser, extra = {}) => ({
  uid:         firebaseUser.uid,
  email:       firebaseUser.email,
  displayName: firebaseUser.displayName || extra.name || "",
  photoURL:    firebaseUser.photoURL    || "",
  ...extra,
});

// ── Helper: บันทึกลง localStorage ─────────────────────────
const saveAuthState  = (user) => localStorage.setItem("authUser", JSON.stringify(user));
const clearAuthState = ()     => localStorage.removeItem("authUser");

// ══════════════════════════════════════════════════════════
// REGISTER (Email/Password)
// ══════════════════════════════════════════════════════════
export const register = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const userData = { name, email, createdAt: new Date().toISOString() };
  await set(ref(db, `users/${cred.user.uid}`), userData);

  const user = serializeUser(cred.user, userData);
  saveAuthState(user);
  return user;
};

// ══════════════════════════════════════════════════════════
// LOGIN (Email/Password)
// ══════════════════════════════════════════════════════════
export const login = async (email, password) => {
  const cred     = await signInWithEmailAndPassword(auth, email, password);
  const extra    = await getUserData(cred.user.uid);
  const user     = serializeUser(cred.user, extra);
  saveAuthState(user);
  return user;
};

// ══════════════════════════════════════════════════════════
// GOOGLE SIGN-IN
// ══════════════════════════════════════════════════════════
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const cred  = await signInWithPopup(auth, provider);
  const extra = await getUserData(cred.user.uid);

  // ถ้าเป็น user ใหม่ → บันทึกข้อมูลลง DB
  if (!extra.email) {
    const userData = {
      name:      cred.user.displayName || "",
      email:     cred.user.email       || "",
      photoURL:  cred.user.photoURL    || "",
      createdAt: new Date().toISOString(),
    };
    await set(ref(db, `users/${cred.user.uid}`), userData);
    const user = serializeUser(cred.user, userData);
    saveAuthState(user);
    return user;
  }

  const user = serializeUser(cred.user, extra);
  saveAuthState(user);
  return user;
};

// ══════════════════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════════════════
export const logout = async () => {
  await signOut(auth);
  clearAuthState();
};

// ══════════════════════════════════════════════════════════
// RESET PASSWORD
// ══════════════════════════════════════════════════════════
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

// ══════════════════════════════════════════════════════════
// LOAD SAVED SESSION (localStorage fallback)
// ══════════════════════════════════════════════════════════
export const loadAuthState = () => {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

// ══════════════════════════════════════════════════════════
// LISTEN TO AUTH STATE (realtime — ใช้ใน useEffect)
// ══════════════════════════════════════════════════════════
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const extra = await getUserData(firebaseUser.uid);
      const user  = serializeUser(firebaseUser, extra);
      saveAuthState(user);
      callback(user);
    } else {
      clearAuthState();
      callback(null);
    }
  });
};