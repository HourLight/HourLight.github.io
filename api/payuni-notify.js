// ═══════════════════════════════════════
// 馥靈之鑰 · PAYUNi 付款通知 API (NotifyURL)
// 接收 PAYUNi 背景 POST 通知 → 寫入 Firestore
// v2.1 · 加入會員方案升級邏輯 + prevPlan 備份（小花事件 patch）
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// Vercel 環境變數需設定：
// ► PAYUNI_HASH_KEY   → PAYUNi 後台的 HashKey
// ► PAYUNI_HASH_IV    → PAYUNi 後台的 HashIV
// ► FIREBASE_SERVICE_ACCOUNT → Firebase 服務帳號 JSON（整串，不換行）
//   取得方式：Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰
//
// ═══════════════════════════════════════

const crypto = require('crypto');

// ── PAYUNi 解密工具（照抄官方 Node.js 範例 docs.payuni.com.tw/web/#/7/312）──
function payuniDecrypt(encryptedHex, key, iv) {
  // 1. hex → string → split ":::" → [base64_ciphertext, base64_tag]
  const [encryptData, tag] = Buffer.from(encryptedHex, 'hex').toString().split(':::');
  // 2. AES-256-GCM 解密（iv 必須是 Buffer）
  const ivBuf = Buffer.from(iv);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuf);
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  let decrypted = decipher.update(encryptData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  // 3. 解析 URL-encoded query string
  const result = {};
  decrypted.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return result;
}

function payuniHash(encryptedStr, key, iv) {
  // PAYUNi 官方公式：SHA256( key + encryptedStr + iv ).toUpperCase()
  // 注意順序：key 在前、iv 在後（不是 iv + encrypted + key）
  const hash = crypto.createHash('sha256').update(`${key}${encryptedStr}${iv}`);
  return hash.digest('hex').toUpperCase();
}

// ── 商品 ID → 會員方案對照（可擴充）──
// productId 命名規則：
//   plus-30 / plus-90 / plus-365  → 馥靈鑰友 N 天
//   pro-30  / pro-90  / pro-365   → 馥靈大師 N 天
//   pro-permanent / plus-permanent → 永久
// 其他 productId（pet-/spa-/nail-/family-/course-...）→ 不動會員方案，只開通課程（沿用既有邏輯）
function parseMembershipProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  const m = productId.match(/^(plus|pro)-(\d+|permanent)$/i);
  if (!m) return null;
  const plan = m[1].toLowerCase();
  const daysOrPerm = m[2].toLowerCase();
  if (daysOrPerm === 'permanent') return { plan, days: 0, permanent: true };
  const days = parseInt(daysOrPerm, 10);
  if (!days || days <= 0 || days > 36500) return null;
  return { plan, days, permanent: false };
}

// ── 商品 ID → 加購次數對照 ──
// productId 命名規則：
//   topup-10  → AI 解讀指令加購 10 次（永久有效，每日配額用完才扣）
//   topup-30  → 加購 30 次
//   topup-100 → 加購 100 次
function parseTopupProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  const m = productId.match(/^topup-(\d+)$/i);
  if (!m) return null;
  const count = parseInt(m[1], 10);
  if (!count || count <= 0 || count > 100000) return null;
  return { count };
}

// ── 商品 ID → 抽牌張數對照（draw-hl / pet / family / 等）──
// productId 命名規則：
//   draw-3 / draw-5 / draw-7  → 馥靈智慧牌 N 張 AI 即時解讀
//   pet-3 / pet-5 / pet-7      → 寵物溝通 N 張
//   family-3 / family-5 / family-7 → 家族覺察 N 張
//   spa-3 / spa-5 / spa-9      → SPA 處方箋 N 張
//   nail-3 / nail-5 / nail-9   → 美甲指尖 N 張
function parseDrawProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  const m = productId.match(/^(draw|pet|family|spa|nail|light)-(\d+)$/i);
  if (!m) return null;
  const category = m[1].toLowerCase();
  const n = parseInt(m[2], 10);
  if (!n || n <= 0 || n > 99) return null;
  return { category, n };
}

// ── 服務類商品解析（阿卡西 / 元辰宮 / 前世 / 姓名分析 / 桌布）──
// productId 命名規則：
//   akashic-1  → 阿卡西紀錄翻閱
//   yuan-chen-1 → 元辰宮導覽
//   past-life-1 → 前世故事
//   name-1 → 姓名覺察分析
//   wallpaper-1 → 馥靈蘊福桌布
function parseServiceProduct(productId) {
  if (!productId || typeof productId !== 'string') return null;
  const m = productId.match(/^(akashic|yuan-chen|past-life|name|wallpaper)-(\d+)$/i);
  if (!m) return null;
  return { category: m[1].toLowerCase(), n: parseInt(m[2], 10) || 1 };
}

// ── Firebase Admin 初始化（懶載入）──
let adminDb = null;

function getFirestore() {
  if (adminDb) return adminDb;

  const SA_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!SA_JSON) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT 未設定，Firestore 寫入跳過');
    return null;
  }

  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(SA_JSON)),
      });
    }
    adminDb = admin.firestore();
    return adminDb;
  } catch (err) {
    console.error('Firebase Admin 初始化失敗：', err.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  // ── PAYUNi 付款返回中繼（302 GET redirect）──
  // PAYUNi 付完款後 POST 導回 ReturnURL，但 GitHub Pages 不接受 POST（405）
  // 所以 ReturnURL 指向這裡（api/payuni-notify?to=目標URL），
  // 有 ?to= 參數就直接 302 redirect，不走 notify 邏輯
  // Notify URL（server-to-server）不帶 ?to=，會正常走下面的 notify 流程
  if (req.query && req.query.to) {
    let target = 'https://hourlightkey.com/member-dashboard.html?payment=success';
    try {
      const u = new URL(req.query.to);
      if (u.hostname === 'hourlightkey.com' || u.hostname === 'www.hourlightkey.com') {
        target = req.query.to;
      }
    } catch (e) { /* invalid URL, use default */ }
    return res.redirect(302, target);
  }

  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const HASH_KEY = process.env.PAYUNI_HASH_KEY;
  const HASH_IV  = process.env.PAYUNI_HASH_IV;

  if (!HASH_KEY || !HASH_IV) {
    console.error('PAYUNi notify: missing config');
    return res.status(500).send('Config error');
  }

  try {
    const { EncryptInfo, HashInfo } = req.body || {};

    if (!EncryptInfo || !HashInfo) {
      console.error('PAYUNi notify: missing EncryptInfo or HashInfo');
      return res.status(400).send('Bad request');
    }

    // 驗證 Hash
    const expectedHash = payuniHash(EncryptInfo, HASH_KEY, HASH_IV);
    if (expectedHash !== HashInfo) {
      console.error('PAYUNi notify: hash mismatch');
      return res.status(400).send('Hash mismatch');
    }

    // 解密
    const data = payuniDecrypt(EncryptInfo, HASH_KEY, HASH_IV);
    const { MerTradeNo, TradeNo, TradeAmt, Status, Message } = data;

    console.log(`PAYUNi notify | ${MerTradeNo} | Status: ${Status} | NT$${TradeAmt}`);

    if (Status === 'SUCCESS') {
      const db = getFirestore();

      if (db) {
        // ── 1. 查找 pendingOrders 取得 userId + productId ──
        const pendingRef = db.collection('pendingOrders').doc(MerTradeNo);
        const pendingDoc = await pendingRef.get();

        let userId    = null;
        let productId = null;
        let userEmail = null;

        if (pendingDoc.exists) {
          userId    = pendingDoc.data().userId    || null;
          productId = pendingDoc.data().productId || null;
          userEmail = pendingDoc.data().userEmail || null;
        } else {
          console.warn(`⚠️  pendingOrders/${MerTradeNo} 不存在，無法對應 userId`);
        }

        const now = new Date();
        const orderPayload = {
          tradeNo:   TradeNo,
          merTradeNo: MerTradeNo,
          amount:    Number(TradeAmt),
          status:    'paid',
          paidAt:    now,
          userId:    userId,
          productId: productId,
          userEmail: userEmail,
          raw:       data,
        };

        // ── 2. 寫入訂單記錄（總表）──
        await db.collection('orders').doc(MerTradeNo).set(orderPayload);

        // ── 3. 若是課程商品（course-*），在 user 的課程記錄中開通 ──
        const courseMatch = (productId || '').match(/^course-(.+)$/i);
        if (userId && courseMatch) {
          const realCourseId = courseMatch[1]; // 去掉 course- 前綴
          await db.collection('users').doc(userId)
            .collection('courses').doc(realCourseId)
            .set({
              paid:       true,
              paidAt:     now,
              orderId:    MerTradeNo,
              tradeNo:    TradeNo,
              amount:     Number(TradeAmt),
              productId:  productId,
            }, { merge: true });
          console.log(`✅ 課程開通：userId=${userId} courseId=${realCourseId} orderId=${MerTradeNo}`);
        }

        if (userId && productId) {
          // ── 4. 更新 pendingOrder 狀態為已付款 ──
          await pendingRef.update({ status: 'paid', paidAt: now });

          console.log(`✅ 訂單完成：userId=${userId} productId=${productId} orderId=${MerTradeNo}`);

          // ── 5z. 若是抽牌商品或服務類商品，啟用 reading_codes ──
          // pendingOrders 在 create 時已先產生 unlockCode，這邊把它正式寫入 reading_codes 集合
          // （reading_codes 是官網現役 collection，draw-hl/pet-reading 等讀這個；unlock_codes 是 legacy）
          const draw = parseDrawProduct(productId);
          const service = !draw ? parseServiceProduct(productId) : null;
          const readingKind = draw || service;

          if (readingKind && pendingDoc.exists) {
            const unlockCode = pendingDoc.data().unlockCode;
            if (unlockCode) {
              try {
                // 寫入格式對齊 admin-unlock.html 第 241 行（service / n / spreads / price / used）
                await db.collection('reading_codes').doc(unlockCode).set({
                  service:   readingKind.category,   // draw / pet / family / spa / nail / akashic / yuan-chen / past-life
                  n:         readingKind.n,
                  spreads:   readingKind.n,
                  price:     Number(TradeAmt),
                  used:      false,
                  source:    'payuni',
                  orderId:   MerTradeNo,
                  userId:    userId,
                  userEmail: userEmail || null,
                  paidAt:    now,
                  createdAt: now,
                  memo:      `PAYUNi 線上付款 ${MerTradeNo}`,
                });
                console.log(`✅ reading_codes 啟用：${unlockCode} (${readingKind.category}-${readingKind.n}) userId=${userId} orderId=${MerTradeNo}`);

                // ── 超商/ATM 延遲付款：自動觸發 AI 解讀 + 寄信 ──
                // 兩條路徑（擇一）：
                //  A. pendingOrders 有 readingEndpoint + readingBody → 泛用觸發（pet/family/spa/nail/akashic/yuan-chen/past-life 都走這條）
                //  B. 舊路徑 - pendingOrders 有 cards + draw.category === 'draw' → 呼叫 ai-draw-reading
                const pendingData = pendingDoc.data();

                if (pendingData.readingEndpoint && pendingData.readingBody && userEmail) {
                  // 路徑 A：泛用 endpoint 觸發
                  try {
                    console.log(`📮 自動觸發解讀（通用）：${pendingData.readingEndpoint} for ${userEmail}`);
                    const readingBody = Object.assign({}, pendingData.readingBody, {
                      email: userEmail,         // 讓 API 內部自動寄信
                      unlockCode: unlockCode,
                      uid: userId,
                    });
                    await fetch(pendingData.readingEndpoint, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(readingBody)
                    });
                    // API 內部會自動 call send-report 寄信給 userEmail
                    console.log(`✅ 通用解讀觸發完成：${pendingData.readingEndpoint}`);
                  } catch (readErr) {
                    console.error('通用解讀觸發失敗:', readErr.message);
                  }
                } else if (draw && draw.category === 'draw' && pendingData.cards && pendingData.cards.length > 0) {
                  // 路徑 B：舊 draw-hl 相容路徑
                  try {
                    console.log(`📮 自動觸發 draw-hl 解讀：${draw.n}張 for ${userEmail}`);
                    await fetch(`https://app.hourlightkey.com/api/ai-draw-reading`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        n: draw.n,
                        cards: pendingData.cards,
                        question: pendingData.question || '',
                        unlockCode: unlockCode,
                        uid: userId,
                        email: userEmail || ''     // API 內部會自動寄信（本 PR 新加）
                      })
                    });
                    console.log(`✅ draw-hl 解讀觸發完成`);
                  } catch (readErr) {
                    console.error('draw-hl 自動解讀觸發失敗:', readErr.message);
                  }
                }

              } catch (drawErr) {
                console.error('PAYUNi notify: reading_codes 寫入失敗', drawErr.message);
              }
            } else {
              console.warn(`⚠️  解讀類商品 ${productId} 但 pendingOrders 沒有 unlockCode，無法啟用`);
            }
          }

          // ── 5b. 若是桌布商品（wallpaper-N），把張數加到 user.wallpaper_bonus ──
          const wallpaperMatch = service && service.category === 'wallpaper';
          if (wallpaperMatch && userId) {
            try {
              const admin = require('firebase-admin');
              await db.collection('users').doc(userId).set({
                wallpaper_bonus: admin.firestore.FieldValue.increment(service.n),
                lastWallpaperPurchaseAt: now,
                lastWallpaperOrderId: MerTradeNo,
              }, { merge: true });
              console.log(`✅ 桌布點數增加：userId=${userId} +${service.n} 張 orderId=${MerTradeNo}`);
            } catch (wpErr) {
              console.error('PAYUNi notify: 桌布點數寫入失敗', wpErr.message);
            }
          }

          // ── 5a. 若是加購商品（topup-N），把次數加到 user.aiBonus ──
          const topup = parseTopupProduct(productId);
          if (topup) {
            try {
              const userRef = db.collection('users').doc(userId);
              await userRef.set({
                aiBonus: require('firebase-admin').firestore.FieldValue.increment(topup.count),
                lastTopupAt: now,
                lastTopupOrderId: MerTradeNo,
              }, { merge: true });
              console.log(`✅ 加購開通：userId=${userId} +${topup.count} 次 orderId=${MerTradeNo}`);
            } catch (topupErr) {
              console.error('PAYUNi notify: 加購寫入失敗', topupErr.message);
            }
          }

          // ── 5b. 若是會員方案商品，升級 user.plan + planExpiry（小花事件 patch）──
          const membership = parseMembershipProduct(productId);
          if (membership) {
            try {
              const userRef = db.collection('users').doc(userId);
              const userSnap = await userRef.get();
              const userData = userSnap.exists ? userSnap.data() : {};

              // 計算新的到期日
              let newExpiry;
              let newExpiryLabel;
              if (membership.permanent) {
                newExpiry = 'permanent';
                newExpiryLabel = '永久';
              } else {
                // 若原方案還沒到期且是同 tier 或更低 tier，從原到期日往後加；否則從現在加
                let baseDate = now;
                if (userData.planExpiry && userData.planExpiry !== 'permanent') {
                  const origExp = new Date(userData.planExpiry);
                  if (origExp instanceof Date && !isNaN(origExp) && origExp > now) {
                    // 同 tier：續訂往後加
                    if (userData.plan === membership.plan) baseDate = origExp;
                  }
                }
                const exp = new Date(baseDate);
                exp.setDate(exp.getDate() + membership.days);
                newExpiry = exp.toISOString();
                newExpiryLabel = exp.toLocaleDateString('zh-TW') + '（+' + membership.days + ' 天）';
              }

              const planUpdate = {
                plan: membership.plan,
                planExpiry: newExpiry,
                planUpgradedAt: now,
                planUpgradedFrom: userData.plan || 'free',
                planUpgradedBy: 'payuni:' + MerTradeNo,
              };

              // ─── 備份原本的付費方案（小花事件 patch）───
              // 條件：原方案是付費（plus/pro）且未到期，且新方案不會完全覆蓋原效期
              if (userData.plan && userData.plan !== 'free') {
                const prevValid = userData.planExpiry === 'permanent' ||
                  (userData.planExpiry && new Date(userData.planExpiry) > now);
                if (prevValid) {
                  // 跨 tier 升級（例如 plus → pro）才需要備份，避免 pro 到期後掉到 free
                  // 若是同 tier 續訂，已合併在 baseDate 計算中，不需備份
                  const isCrossTierUpgrade = userData.plan !== membership.plan;
                  if (isCrossTierUpgrade && newExpiry !== 'permanent') {
                    planUpdate.prevPlan = userData.plan;
                    planUpdate.prevPlanExpiry = userData.planExpiry;
                    planUpdate.prevPlanSavedAt = now.toISOString();
                  }
                }
              }

              await userRef.update(planUpdate);
              console.log(`✅ 會員方案升級：userId=${userId} → ${membership.plan} (${newExpiryLabel})`);

              // ── 產生贈送序號並寄送 email ──
              // plus（馥靈鑰友）：每月贈 3 次 3 張牌 AI 解析
              // pro（馥靈大師）：每月贈 10 次 AI 解讀（aiBonus）+ 2 張 $500 抵用券
              try {
                const bonusCodes = [];
                const coupons = [];
                const randCode = () => Math.random().toString(36).substring(2, 10).toUpperCase().replace(/[^A-Z0-9]/g, 'X');

                if (membership.plan === 'plus') {
                  // 產生 3 組 draw-3 解讀代碼
                  for (let i = 0; i < 3; i++) {
                    const code = `BONUS3-${randCode()}`;
                    await db.collection('reading_codes').doc(code).set({
                      service: 'draw',
                      n: 3,
                      spreads: 3,
                      price: 0,
                      used: false,
                      source: 'membership-bonus',
                      orderId: MerTradeNo,
                      userId: userId,
                      userEmail: userEmail || null,
                      paidAt: now,
                      createdAt: now,
                      memo: `馥靈鑰友月禮（升級贈送）`,
                    });
                    bonusCodes.push(code);
                  }
                } else if (membership.plan === 'pro') {
                  // 增加 aiBonus +10
                  await userRef.set({
                    aiBonus: require('firebase-admin').firestore.FieldValue.increment(10),
                  }, { merge: true });
                  // 產生 2 張 NT$500 抵用券（馥靈大師月禮）
                  // 規格：只能折抵一對一解讀（>= 1800）｜一次用一張｜使用期限 3 個月
                  for (let i = 0; i < 2; i++) {
                    const code = `VIP500-${randCode()}`;
                    await db.collection('coupons').doc(code).set({
                      amount: 500,
                      used: false,
                      source: 'membership-bonus',
                      orderId: MerTradeNo,
                      userId: userId,
                      userEmail: userEmail || null,
                      createdAt: now,
                      expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 3 個月
                      // ═ 使用限制 ═
                      minOrderAmount: 1800,           // 訂單最低金額 NT$1800
                      restrictedTo: 'one-on-one',     // 只能用於一對一解讀
                      maxUsePerOrder: 1,              // 一次一張
                      applicableServices: [
                        'prayer-6800',   // 馥靈初探 6800
                        'prayer-8800',   // 深度覺醒 8800
                        'prayer-12800',  // 三次轉化 12800
                        'prayer-39800',  // 半年陪伴 39800
                        'prayer-59800',  // VIP 年度 59800
                        'prayer-16800',  // VIP 紫微 16800
                        'one-on-one',    // 通用一對一
                      ],
                      memo: `馥靈大師月禮（升級贈送）｜一對一 1800+ 可折 500｜3 個月內有效`,
                    });
                    coupons.push(code);
                  }
                }

                // 寄送會員方案升級通知信
                if (userEmail) {
                  let body = '';
                  const planName = membership.plan === 'plus' ? '馥靈鑰友' : '馥靈大師';
                  const planBenefits = membership.plan === 'plus'
                    ? '► 每天 12 次 AI 深度解讀\n► 每月贈 3 次 3 張牌 AI 解析\n► 完整馥靈牌卡資料庫存取'
                    : '► 無限次 AI 深度解讀\n► 每月贈 10 次 AI 解讀\n► 每月 2 張 NT$500 抵用券\n► 完整功能全開通';

                  body = `您好：\n\n謝謝您成為「${planName}」會員！\n\n`;
                  body += `方案到期日：${newExpiryLabel}\n`;
                  body += `訂單編號：${MerTradeNo}\n\n`;
                  body += `══ 會員權益 ══\n${planBenefits}\n\n`;

                  if (bonusCodes.length > 0) {
                    body += `══ 月禮解讀代碼（3 組，每組可兌換一次 3 張牌 AI 解讀）══\n`;
                    bonusCodes.forEach((c, i) => { body += `${i + 1}. ${c}\n`; });
                    body += `\n使用方式：到 draw-hl 抽完 3 張牌後，在付款區輸入代碼即可自動解讀。\n\n`;
                  }

                  if (coupons.length > 0) {
                    body += `══ NT$500 抵用券（2 張，3 個月內有效 ※ 只能折抵一對一解讀 NT$1800 以上，一次一張）══\n`;
                    coupons.forEach((c, i) => { body += `${i + 1}. ${c}\n`; });
                    body += `\n使用方式：結帳時輸入代碼折抵。\n\n`;
                  }

                  body += `══ 會員中心 ══\nhttps://hourlightkey.com/member-dashboard.html\n\n`;
                  body += `有任何問題請回覆此信或聯絡 LINE 官方帳號：https://lin.ee/RdQBFAN\n\n`;
                  body += `馥靈之鑰 Hour Light\n`;

                  try {
                    await fetch('https://app.hourlightkey.com/api/send-report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: userEmail,
                        name: '',
                        subject: `歡迎成為「${planName}」會員 ｜ 您的月禮序號已發送`,
                        content: body,
                        system: `${planName} 方案升級`,
                        type: 'notification'
                      })
                    });
                    console.log(`📧 會員升級通知信已寄送：${userEmail}`);
                  } catch (mailErr) {
                    console.error('會員升級寄信失敗:', mailErr.message);
                  }
                }
              } catch (bonusErr) {
                console.error('會員方案贈送序號失敗:', bonusErr.message);
              }
            } catch (planErr) {
              console.error('PAYUNi notify: 會員方案升級失敗', planErr.message);
              // 不阻斷主流程，付款仍視為成功
            }
          }

          // ── 5c. 若是預約商品（booking-{bookingId}），更新預約狀態 + LINE 通知 ──
          const bookingMatch = (productId || '').match(/^booking-(.+)$/i);
          if (bookingMatch) {
            const bookingId = bookingMatch[1];
            const bizId = pendingDoc.exists ? (pendingDoc.data().businessId || 'hourlight-spa') : 'hourlight-spa';
            try {
              // 更新預約狀態為已確認
              const bookingRef = db.collection('businesses').doc(bizId).collection('bookings').doc(bookingId);
              await bookingRef.update({
                status: 'confirmed',
                paidAt: now,
                paidOrderId: MerTradeNo,
                paidAmount: Number(TradeAmt),
              });
              console.log(`✅ 預約確認：bizId=${bizId} bookingId=${bookingId} orderId=${MerTradeNo}`);

              // 讀預約資料 + 店家 LINE Channel Access Token → 發 Messaging API push / broadcast
              // LINE Notify 已於 2025/3/31 結束服務，改用 Messaging API
              const bookingSnap = await bookingRef.get();
              const bizSnap = await db.collection('businesses').doc(bizId).get();
              if (bookingSnap.exists && bizSnap.exists) {
                const bk = bookingSnap.data();
                const biz = bizSnap.data();
                const lineToken = biz.lineToken; // LINE Channel Access Token（Messaging API）

                if (lineToken) {
                  // 建立 Flex Message（對齊美業歐巴的預約成功卡片）
                  const flexMsg = {
                    type: 'flex',
                    altText: `預約成功 - ${bk.customerName || '客人'} ${bk.serviceName || ''}`,
                    contents: {
                      type: 'bubble',
                      header: {
                        type: 'box', layout: 'vertical',
                        backgroundColor: '#f8dfa5',
                        contents: [
                          { type: 'text', text: '預約成功', weight: 'bold', size: 'lg', color: '#1a1520', align: 'center' }
                        ]
                      },
                      body: {
                        type: 'box', layout: 'vertical', spacing: 'md',
                        contents: [
                          { type: 'text', text: '訂單資訊', weight: 'bold', size: 'sm', color: '#8b6f4e' },
                          { type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '預約日期', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: bk.date || '-', size: 'sm', color: '#333333', flex: 5, align: 'end' }
                          ]},
                          { type: 'separator' },
                          { type: 'text', text: '詳細資訊', weight: 'bold', size: 'sm', color: '#8b6f4e', margin: 'md' },
                          { type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '服務項目', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: bk.serviceName || '-', size: 'sm', color: '#333333', flex: 5, align: 'end' }
                          ]},
                          ...(bk.addonNames && bk.addonNames.length ? [{ type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '附加服務', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: bk.addonNames.join('、'), size: 'sm', color: '#333333', flex: 5, align: 'end', wrap: true }
                          ]}] : []),
                          { type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '預約時間', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: bk.time || '系統安排', size: 'sm', color: '#333333', flex: 5, align: 'end' }
                          ]},
                          { type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '服務人員', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: bk.staffName || '系統安排', size: 'sm', color: '#333333', flex: 5, align: 'end' }
                          ]},
                          { type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '金額', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: 'NT$ ' + (bk.price||0).toLocaleString(), size: 'sm', color: '#333333', weight: 'bold', flex: 5, align: 'end' }
                          ]},
                          ...(bk.customerPhone ? [{ type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '客人電話', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: bk.customerPhone, size: 'sm', color: '#333333', flex: 5, align: 'end' }
                          ]}] : []),
                          ...(bk.note ? [{ type: 'box', layout: 'horizontal', contents: [
                            { type: 'text', text: '備註', size: 'sm', color: '#888888', flex: 3 },
                            { type: 'text', text: bk.note, size: 'sm', color: '#333333', flex: 5, align: 'end', wrap: true }
                          ]}] : [])
                        ]
                      },
                      footer: {
                        type: 'box', layout: 'vertical', spacing: 'sm',
                        contents: [
                          { type: 'button', style: 'primary', color: '#8b6f4e', action: {
                            type: 'uri', label: '查看預約管理',
                            uri: `https://hourlightkey.com/booking-admin.html?biz=${bizId}`
                          }}
                        ]
                      }
                    }
                  };

                  // 用 Messaging API broadcast（發給所有追蹤者）
                  // 如果要發給特定人，需要 userId，這裡先用 broadcast 通知管理者
                  try {
                    const https = require('https');
                    const postData = JSON.stringify({ messages: [flexMsg] });
                    const options = {
                      hostname: 'api.line.me',
                      path: '/v2/bot/message/broadcast',
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + lineToken,
                        'Content-Length': Buffer.byteLength(postData)
                      }
                    };
                    const req2 = https.request(options, (res2) => {
                      let body = '';
                      res2.on('data', c => body += c);
                      res2.on('end', () => {
                        console.log(`✅ LINE Messaging API broadcast: status=${res2.statusCode} body=${body}`);
                      });
                    });
                    req2.on('error', (e) => {
                      console.error('⚠️ LINE Messaging API 發送失敗：', e.message);
                    });
                    req2.write(postData);
                    req2.end();
                  } catch (lineErr) {
                    console.error('⚠️ LINE Messaging API error：', lineErr.message);
                  }
                } else {
                  console.log('ℹ️  LINE Channel Access Token 未設定，跳過通知');
                }
              }
            } catch (bookingErr) {
              console.error('PAYUNi notify: 預約確認失敗', bookingErr.message);
            }
          }
        }
      } else {
        // Firestore 未設定時，至少把訂單記到 console 方便人工處理
        console.log(`✅ 付款成功（Firestore 未設定，需人工處理）：${JSON.stringify(data)}`);
      }
    } else {
      console.log(`❌ 付款未成功：${MerTradeNo} | Status: ${Status} | ${Message}`);

      // 把失敗記錄也寫進 Firestore（方便追蹤）
      const db = getFirestore();
      if (db) {
        await db.collection('orders').doc(MerTradeNo).set({
          merTradeNo: MerTradeNo,
          status:     'failed',
          failReason: Message,
          failAt:     new Date(),
          raw:        data,
        }, { merge: true }).catch(() => {});
      }
    }

    // PAYUNi 要求回傳 SUCCESS 字串
    return res.status(200).send('SUCCESS');

  } catch (err) {
    console.error('PAYUNi notify error:', err);
    return res.status(500).send('Server error');
  }
};
