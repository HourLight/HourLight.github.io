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

// ── PAYUNi 解密工具 ──
function payuniDecrypt(encryptedHex, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  const result = {};
  decrypted.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return result;
}

function payuniHash(encryptedStr, key, iv) {
  const raw = iv + encryptedStr + key;
  return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
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
  const m = productId.match(/^(draw|pet|family|spa|nail)-(\d+)$/i);
  if (!m) return null;
  const category = m[1].toLowerCase();
  const n = parseInt(m[2], 10);
  if (!n || n <= 0 || n > 99) return null;
  return { category, n };
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

        // ── 3. 在 user 的課程記錄中開通課程 ──
        if (userId && productId) {
          await db.collection('users').doc(userId)
            .collection('courses').doc(productId)
            .set({
              paid:       true,
              paidAt:     now,
              orderId:    MerTradeNo,
              tradeNo:    TradeNo,
              amount:     Number(TradeAmt),
              productId:  productId,
            }, { merge: true });

          // ── 4. 更新 pendingOrder 狀態為已付款 ──
          await pendingRef.update({ status: 'paid', paidAt: now });

          console.log(`✅ 課程開通：userId=${userId} productId=${productId} orderId=${MerTradeNo}`);

          // ── 5z. 若是抽牌商品（draw-N / pet-N / family-N / spa-N / nail-N），啟用 reading_codes ──
          // pendingOrders 在 create 時已先產生 unlockCode，這邊把它正式寫入 reading_codes 集合
          // （reading_codes 是官網現役 collection，draw-hl/pet-reading 等讀這個；unlock_codes 是 legacy）
          const draw = parseDrawProduct(productId);
          if (draw && pendingDoc.exists) {
            const unlockCode = pendingDoc.data().unlockCode;
            if (unlockCode) {
              try {
                // 寫入格式對齊 admin-unlock.html 第 241 行（service / n / spreads / price / used）
                await db.collection('reading_codes').doc(unlockCode).set({
                  service:   draw.category,         // draw / pet / family / spa / nail
                  n:         draw.n,                // 3 / 5 / 7 / 9 等
                  spreads:   draw.n,                // 與既有欄位相容
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
                console.log(`✅ reading_codes 啟用：${unlockCode} (${draw.category}-${draw.n}張) userId=${userId} orderId=${MerTradeNo}`);
              } catch (drawErr) {
                console.error('PAYUNi notify: reading_codes 寫入失敗', drawErr.message);
              }
            } else {
              console.warn(`⚠️  draw 商品 ${productId} 但 pendingOrders 沒有 unlockCode，無法啟用`);
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
            } catch (planErr) {
              console.error('PAYUNi notify: 會員方案升級失敗', planErr.message);
              // 不阻斷主流程，付款仍視為成功
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
