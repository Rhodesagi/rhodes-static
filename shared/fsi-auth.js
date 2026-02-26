/**
 * Rhodes Language Courses - Unified Firebase Auth + Firestore
 * SSO: supports Google (Firebase) login AND Rhodes username/password login
 * Uses rhodes-agi-and-languages Firebase project (shared with main site)
 */
const FSI_Auth = {
  firebaseConfig: {
    apiKey: "AIzaSyBZ1BCmsiSCgEjEMXkeMxedzqUtzQMJnO4",
    authDomain: "rhodes-agi-and-languages.firebaseapp.com",
    projectId: "rhodes-agi-and-languages",
    storageBucket: "rhodes-agi-and-languages.firebasestorage.app",
    messagingSenderId: "633559429572",
    appId: "1:633559429572:web:4673318365851b0553f491"
  },
  courseName: document.querySelector("meta[name=rhodes-course]")?.content || "unknown",
  app: null, auth: null, db: null,
  user: null,          // Firebase Google user (or null)
  rhodesUser: null,    // Rhodes JWT user { uid, username } (or null)
  initialized: false,
  saveQueue: [], saveTimeout: null,
  _progressSynced: false,

  // Decode JWT payload without verification (client-side identity only)
  _decodeJWT(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload;
    } catch (e) { return null; }
  },

  // Check for Rhodes username/password login via localStorage token
  _checkRhodesToken() {
    const token = localStorage.getItem("rhodes_user_token");
    const username = localStorage.getItem("rhodes_username");
    if (!token || !username) { this.rhodesUser = null; return; }
    const payload = this._decodeJWT(token);
    if (payload && payload.user_id) {
      this.rhodesUser = { uid: "rhodes_" + payload.user_id, username: username };
      console.log("Rhodes token login detected:", username, "(user_id:", payload.user_id + ")");
    } else {
      this.rhodesUser = null;
    }
  },

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Check for Rhodes JWT login first
    this._checkRhodesToken();

    if (typeof firebase === "undefined") {
      console.warn("Firebase SDK not loaded");
      // Even without Firebase, if we have a Rhodes token we can show auth state
      if (this.rhodesUser) this._showRhodesUserUI();
      return;
    }

    // Use existing Firebase app if already initialized (SSO with main Rhodes app)
    try {
      this.app = firebase.app();
    } catch (e) {
      this.app = firebase.initializeApp(this.firebaseConfig);
    }
    this.auth = firebase.auth();
    this.db = firebase.firestore();

    // Show auth section
    const authSection = document.getElementById("authSection");
    if (authSection) authSection.style.display = "block";

    this.auth.onAuthStateChanged(async (user) => {
      this.user = user;
      if (user && !user.isAnonymous) {
        // Google user — full identity
        this.updateSignInUI(true);
        console.log("Signed in via Google:", user.email);
        this.syncProgressFromFirestore();
      } else if (this.rhodesUser) {
        // Rhodes JWT user — sign in anonymously to get Firestore access
        if (!user) {
          try {
            await this.auth.signInAnonymously();
            // onAuthStateChanged will fire again with the anonymous user
            return;
          } catch (e) { console.warn("Anonymous auth failed:", e.message); }
        }
        this._showRhodesUserUI();
        this.syncProgressFromFirestore();
      } else {
        this.updateSignInUI(false);
        this._progressSynced = false;
      }
    });
  },

  // Show UI for Rhodes JWT-authenticated user
  _showRhodesUserUI() {
    const authSection = document.getElementById("authSection");
    if (authSection) authSection.style.display = "block";
    const btn = document.getElementById("authBtn") || document.getElementById("auth-btn");
    const userInfo = document.getElementById("userInfo");
    if (btn) {
      btn.textContent = "Sign Out";
      btn.onclick = () => {
        // Just clear the courses auth display; main app handles actual logout
        this.rhodesUser = null;
        this.updateSignInUI(false);
      };
      btn.style.background = "#28a745";
    }
    if (userInfo) {
      userInfo.textContent = this.rhodesUser.username;
      userInfo.style.display = "inline";
    }
  },

  async signIn() {
    if (!this.auth) return;
    try {
      await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch (e) { console.error("Sign in failed:", e.message); alert("Sign in failed: " + e.message); }
  },

  async signOut() {
    if (!this.auth) return;
    try { await this.auth.signOut(); } catch (e) { console.error("Sign out failed:", e.message); }
  },

  updateSignInUI(signedIn) {
    const btn = document.getElementById("authBtn") || document.getElementById("auth-btn");
    const userInfo = document.getElementById("userInfo");
    if (!btn) return;
    if (signedIn && this.user) {
      btn.textContent = "Sign Out";
      btn.onclick = () => this.signOut();
      btn.style.background = "#28a745";
      if (userInfo) {
        userInfo.textContent = this.user.displayName || this.user.email;
        userInfo.style.display = "inline";
      }
    } else if (this.rhodesUser) {
      // Rhodes token user — already handled by _showRhodesUserUI
      return;
    } else {
      btn.textContent = "Sign In";
      btn.onclick = () => this.signIn();
      btn.style.background = "#4285f4";
      if (userInfo) userInfo.style.display = "none";
    }
  },

  // Returns true if user is authenticated via either method
  isSignedIn() { return !!(this.user || this.rhodesUser); },

  // Stable user ID for Firestore: Firebase UID or "rhodes_N"
  getUserId() {
    if (this.user) return this.user.uid;
    if (this.rhodesUser) return this.rhodesUser.uid;
    return localStorage.getItem("fsi_user_id") || this.createAnonId();
  },

  createAnonId() {
    const id = "anon_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("fsi_user_id", id);
    return id;
  },

  getUser() { return this.user; },

  getUserProfile() {
    if (this.user) return { uid: this.user.uid, email: this.user.email, displayName: this.user.displayName };
    if (this.rhodesUser) return { uid: this.rhodesUser.uid, email: null, displayName: this.rhodesUser.username };
    return { uid: this.getUserId(), email: null, displayName: "Anonymous" };
  },

  // Get display name for Firestore records
  _getDisplayName() {
    if (this.user) return this.user.displayName || this.user.email;
    if (this.rhodesUser) return this.rhodesUser.username;
    return "Anonymous";
  },

  _getEmail() {
    if (this.user) return this.user.email;
    return null;
  },

  async saveResponse(response) {
    this.saveQueue.push({ timestamp: new Date().toISOString(), ...response });
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.flushQueue(), 2000);
    return true;
  },

  async flushQueue() {
    if (this.saveQueue.length === 0 || !this.db) { this.saveQueue = []; return; }
    if (!this.isSignedIn()) { this.saveQueue = []; return; }
    const toSave = [...this.saveQueue]; this.saveQueue = [];
    const userId = this.getUserId();
    try {
      const batch = this.db.batch();
      const courseRef = this.db.collection("users").doc(userId).collection("courses").doc(this.courseName);
      batch.set(courseRef, {
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
        email: this._getEmail(),
        displayName: this._getDisplayName()
      }, { merge: true });
      for (const response of toSave) {
        const responseRef = courseRef.collection("responses").doc();
        batch.set(responseRef, { ...response, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      await batch.commit();
    } catch (e) { console.warn("Firestore save error:", e.message); this.saveQueue = [...toSave, ...this.saveQueue]; }
  },

  async loadProgress() {
    if (!this.db || !this.isSignedIn()) return null;
    try {
      const doc = await this.db.collection("users").doc(this.getUserId()).collection("courses").doc(this.courseName).get();
      if (doc.exists) return doc.data();
    } catch (e) { console.warn("Failed to load progress:", e.message); }
    return null;
  },

  async saveProgress(progressData) {
    if (!this.db || !this.isSignedIn()) return false;
    try {
      await this.db.collection("users").doc(this.getUserId()).collection("courses").doc(this.courseName).set({
        ...progressData,
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
        email: this._getEmail(), displayName: this._getDisplayName()
      }, { merge: true });
      return true;
    } catch (e) { console.warn("Failed to save progress:", e.message); return false; }
  },

  // Sync Firestore progress into localStorage on sign-in
  async syncProgressFromFirestore() {
    if (!this.db || !this.isSignedIn() || this._progressSynced) return;
    this._progressSynced = true;
    const userId = this.getUserId();
    try {
      const doc = await this.db.collection("users").doc(userId).collection("courses").doc(this.courseName).get();
      if (!doc.exists) {
        await this.uploadLocalProgress();
        return;
      }
      const remote = doc.data();
      if (!remote.cards) return;

      const storageKey = (typeof RhodesEngine !== "undefined" && RhodesEngine.cfg?.().storage?.progress) || "rhodes_course_progress";
      const local = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const localCards = local.cards || {};
      const remoteCards = remote.cards || {};

      const merged = { ...localCards };
      for (const [id, rCard] of Object.entries(remoteCards)) {
        const lCard = merged[id];
        if (!lCard || (rCard.reps || 0) > (lCard.reps || 0)) {
          merged[id] = rCard;
        }
      }
      local.cards = merged;

      if (remote.stats) {
        local.stats = local.stats || {};
        local.stats.totalReviews = Math.max(local.stats.totalReviews || 0, remote.stats.totalReviews || 0);
        local.stats.streak = Math.max(local.stats.streak || 0, remote.stats.streak || 0);
      }

      localStorage.setItem(storageKey, JSON.stringify(local));
      console.log("Synced progress from Firestore:", Object.keys(merged).length, "cards");

      if (typeof RhodesEngine !== "undefined") {
        RhodesEngine.updateStatsBar();
        RhodesEngine.renderUnits?.();
      }
    } catch (e) { console.warn("Firestore sync error:", e.message); }
  },

  async uploadLocalProgress() {
    if (!this.db || !this.isSignedIn()) return;
    const storageKey = (typeof RhodesEngine !== "undefined" && RhodesEngine.cfg?.().storage?.progress) || "rhodes_course_progress";
    const local = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!local.cards || Object.keys(local.cards).length === 0) return;
    try {
      await this.db.collection("users").doc(this.getUserId()).collection("courses").doc(this.courseName).set({
        cards: local.cards,
        stats: local.stats || {},
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
        email: this._getEmail(), displayName: this._getDisplayName()
      }, { merge: true });
      console.log("Uploaded local progress to Firestore:", Object.keys(local.cards).length, "cards");
    } catch (e) { console.warn("Failed to upload local progress:", e.message); }
  },

  async syncCardToFirestore(cardId, cardData) {
    if (!this.db || !this.isSignedIn()) return;
    try {
      const courseRef = this.db.collection("users").doc(this.getUserId()).collection("courses").doc(this.courseName);
      const update = {};
      update["cards." + cardId] = cardData;
      update.lastUpdate = firebase.firestore.FieldValue.serverTimestamp();
      await courseRef.set(update, { merge: true });
    } catch (e) { console.warn("Card sync error:", e.message); }
  }
};
if (typeof window !== "undefined") FSI_Auth.init();
