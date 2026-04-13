/**
 * 馥靈之鑰 會員系統核心邏輯
 * 在每個需要追蹤的頁面引入此檔案
 */

(function() {
  'use strict';

  // Firebase SDK (compat v9)
  const FB_SDK_BASE = 'https://www.gstatic.com/firebasejs/9.23.0/';

  // 檢查 Firebase 是否已初始化
  function waitForFirebase(callback, retries = 20) {
    if (typeof firebase !== 'undefined' && firebase.apps) {
      callback();
    } else if (retries > 0) {
      setTimeout(() => waitForFirebase(callback, retries - 1), 200);
    }
  }

  // 載入 Firebase SDK
  function loadFirebaseSDK() {
    const scripts = [
      FB_SDK_BASE + 'firebase-app-compat.js',
      FB_SDK_BASE + 'firebase-auth-compat.js',
      FB_SDK_BASE + 'firebase-firestore-compat.js'
    ];

    let loaded = 0;
    scripts.forEach(src => {
      if (document.querySelector(`script[src="${src}"]`)) { loaded++; return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { loaded++; if (loaded === scripts.length) initApp(); };
      document.head.appendChild(s);
    });
    if (loaded === scripts.length) initApp();
  }

  // 初始化 Firebase App
  function initApp() {
    if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      // Firebase 尚未設定，靜默處理
      return;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // 監聽登入狀態
    auth.onAuthStateChanged(user => {
      if (user) {
        window.hlCurrentUser = user;
        updateNavForLoggedIn(user);
        updateLastSeen(db, user.uid);
        trackPageVisit(db, user.uid);
      } else {
        window.hlCurrentUser = null;
        updateNavForLoggedOut();
      }
    });

    // 暴露全域方法
    window.HLMember = {
      auth, db,
      login: (email, pw) => auth.signInWithEmailAndPassword(email, pw),
      register: (email, pw) => auth.createUserWithEmailAndPassword(email, pw),
      loginGoogle: () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()),
      logout: () => auth.signOut(),
      getCurrentUser: () => auth.currentUser,

      // 記錄抽牌
      recordDraw: (cards, spread, page) => {
        const user = auth.currentUser;
        if (!user) return;
        return db.collection(`users/${user.uid}/history`).add({
          type: 'draw',
          title: `${spread || '單張'} 抽牌`,
          detail: Array.isArray(cards) ? cards.join('、') : cards,
          page: page || document.title,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          tags: ['draw', spread || 'single']
        }).then(() => {
          db.doc(`users/${user.uid}`).set({
            totalDraws: firebase.firestore.FieldValue.increment(1)
          }, { merge: true });
        });
      },

      // 記錄測驗
      recordQuiz: (quizName, result) => {
        const user = auth.currentUser;
        if (!user) return;
        return db.collection(`users/${user.uid}/history`).add({
          type: 'quiz',
          title: quizName,
          detail: result,
          page: document.title,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          tags: ['quiz', quizName]
        });
      },

      // 上傳解析記錄
      saveAnalysis: (title, content, type, tags) => {
        const user = auth.currentUser;
        if (!user) return Promise.reject('未登入');
        return db.collection(`users/${user.uid}/analyses`).add({
          title: title || '未命名解析',
          content,
          type: type || 'note',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          tags: tags || [],
          wordCount: content ? content.length : 0
        }).then(() => {
          db.doc(`users/${user.uid}`).set({
            totalAnalyses: firebase.firestore.FieldValue.increment(1)
          }, { merge: true });
        });
      },

      // 讀取歷史
      getHistory: (limit) => {
        const user = auth.currentUser;
        if (!user) return Promise.resolve([]);
        return db.collection(`users/${user.uid}/history`)
          .orderBy('timestamp', 'desc')
          .limit(limit || 20)
          .get()
          .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },

      // 讀取解析
      getAnalyses: (limit) => {
        const user = auth.currentUser;
        if (!user) return Promise.resolve([]);
        return db.collection(`users/${user.uid}/analyses`)
          .orderBy('createdAt', 'desc')
          .limit(limit || 20)
          .get()
          .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },

      // 讀取個人資料
      getProfile: () => {
        const user = auth.currentUser;
        if (!user) return Promise.resolve(null);
        return db.doc(`users/${user.uid}`).get()
          .then(d => d.exists ? d.data() : null);
      }
    };
  }

  // 追蹤頁面訪問
  function trackPageVisit(db, uid) {
    const pageName = document.title || window.location.pathname;
    // 不追蹤登入/儀表板頁面本身
    if (window.location.pathname.includes('member-')) return;

    db.collection(`users/${uid}/history`).add({
      type: 'page',
      title: pageName,
      detail: window.location.href,
      page: pageName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      tags: ['page']
    }).catch(() => {}); // 靜默失敗
  }

  // 更新最後上線時間
  function updateLastSeen(db, uid) {
    db.doc(`users/${uid}`).set({
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }

  // 更新導覽列（已登入）
  function updateNavForLoggedIn(user) {
    // 更新 nav 內的「登入」連結 → 顯示名稱並指向會員中心
    const navLogin = document.getElementById('hl-nav-login');
    if (navLogin) {
      const name = user.displayName || user.email.split('@')[0];
      navLogin.textContent = '👑 ' + name;
      navLogin.href = 'app.html';
    }
  }

  // 更新導覽列（未登入）
  function updateNavForLoggedOut() {
    const navLogin = document.getElementById('hl-nav-login');
    if (navLogin) {
      navLogin.textContent = '登入';
      navLogin.href = 'app.html';
    }
  }

  // 啟動
  loadFirebaseSDK();

  // 等 DOM 載入
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // DOM 已就緒
    });
  }

})();
