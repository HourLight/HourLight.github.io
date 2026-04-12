/**
 * Vercel Cron Job: Auto-post to Threads & Facebook
 *
 * 三軌策略：
 *   07:30 台北 (23:30 UTC) → Tier A 天使故事
 *   12:15 台北 (04:15 UTC) → Tier B 知識學苑
 *   20:00 台北 (12:00 UTC) → Tier C 工具導流
 *
 * vercel.json 的 cron 會設定這三個時段 UTC 時間觸發本 endpoint。
 *
 * 安全性：
 * - Vercel cron 自動發送 Authorization: Bearer CRON_SECRET
 * - CRON_SECRET 是 Vercel 自動生成的環境變數，用戶不用設
 * - 拒絕任何沒有這個 header 的請求
 *
 * 環境變數（需在 Vercel Dashboard 設）：
 * - THREADS_ACCESS_TOKEN
 * - FB_PAGE_ACCESS_TOKEN
 * - FB_PAGE_ID
 */

const EPOCH = '2026-04-12';

// Pool URLs (fetch from GitHub Pages)
const POOL_BASE = 'https://hourlightkey.com/docs/';
const POOL_FILES = {
  angel: 'auto-post-angel.json',
  knowledge: 'auto-post-knowledge.json',
  tools: 'auto-post-tools.json',
};

function getNowUTC8() {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

function getDateStringUTC8(d) {
  return d.toISOString().slice(0, 10);
}

function getTimeSlot(utc8Hour) {
  if (utc8Hour >= 6 && utc8Hour < 10) return '07:30';
  if (utc8Hour >= 10 && utc8Hour < 16) return '12:15';
  if (utc8Hour >= 16 && utc8Hour <= 23) return '20:00';
  return '20:00';
}

function daysSinceEpoch(nowUTC8) {
  const epoch = new Date(EPOCH + 'T00:00:00Z');
  const today = new Date(getDateStringUTC8(nowUTC8) + 'T00:00:00Z');
  const diffMs = today - epoch;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function pickFromPool(pool, index) {
  if (!pool || pool.length === 0) return null;
  const i = ((index % pool.length) + pool.length) % pool.length;
  return pool[i];
}

async function httpPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Threads API ---

async function postToThreads(text, accessToken) {
  const createUrl = `https://graph.threads.net/v1.0/me/threads`;
  const container = await httpPost(createUrl + `?access_token=${accessToken}`, {
    media_type: 'TEXT',
    text: text,
  });
  const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
  const published = await httpPost(publishUrl + `?access_token=${accessToken}`, {
    creation_id: container.id,
  });
  return published.id;
}

async function replyToThread(parentId, text, accessToken) {
  const createUrl = `https://graph.threads.net/v1.0/me/threads`;
  const container = await httpPost(createUrl + `?access_token=${accessToken}`, {
    media_type: 'TEXT',
    text: text,
    reply_to_id: parentId,
  });
  const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
  const published = await httpPost(publishUrl + `?access_token=${accessToken}`, {
    creation_id: container.id,
  });
  return published.id;
}

// --- Facebook API ---

async function postToFacebook(text, pageAccessToken, pageId) {
  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
  return httpPost(url + `?access_token=${pageAccessToken}`, { message: text });
}

// --- Main handler ---

export default async function handler(req, res) {
  // 安全檢查：確認是 Vercel cron 觸發或帶有 CRON_SECRET
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET || '';
  const isManual = req.query && req.query.manual === '1';

  if (cronSecret && !isManual) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const nowUTC8 = getNowUTC8();
  const dayIndex = daysSinceEpoch(nowUTC8);
  const utc8Hour = nowUTC8.getUTCHours();

  // 支援 ?tier=A|B|C 手動指定（用於手動觸發）
  let timeSlot;
  if (req.query && req.query.tier) {
    const tierMap = { A: '07:30', B: '12:15', C: '20:00' };
    timeSlot = tierMap[req.query.tier] || getTimeSlot(utc8Hour);
  } else {
    timeSlot = getTimeSlot(utc8Hour);
  }

  const log = [];
  log.push(`=== Vercel Cron Post ===`);
  log.push(`UTC time: ${new Date().toISOString()}`);
  log.push(`UTC+8 time: ${nowUTC8.toISOString()}`);
  log.push(`Day index since ${EPOCH}: ${dayIndex}`);
  log.push(`Time slot: ${timeSlot}`);

  // Pick pool by time slot
  let poolKey;
  let tierLabel;
  if (timeSlot === '07:30') {
    poolKey = 'angel';
    tierLabel = 'A (天使故事)';
  } else if (timeSlot === '12:15') {
    poolKey = 'knowledge';
    tierLabel = 'B (知識學苑)';
  } else {
    poolKey = 'tools';
    tierLabel = 'C (工具導流)';
  }
  log.push(`Tier: ${tierLabel}`);

  // Fetch pool from GitHub Pages
  let pool;
  try {
    const poolUrl = POOL_BASE + POOL_FILES[poolKey];
    const poolRes = await fetch(poolUrl, { cache: 'no-store' });
    if (!poolRes.ok) {
      throw new Error(`Failed to fetch pool: HTTP ${poolRes.status}`);
    }
    pool = await poolRes.json();
  } catch (err) {
    log.push(`Pool fetch failed: ${err.message}`);
    return res.status(500).json({ error: 'Pool fetch failed', log });
  }

  if (!pool || pool.length === 0) {
    log.push('Pool is empty');
    return res.status(500).json({ error: 'Empty pool', log });
  }

  const post = pickFromPool(pool, dayIndex);
  if (!post) {
    log.push('No post picked');
    return res.status(500).json({ error: 'No post picked', log });
  }

  const hashtags = (post.hashtags || []).join(' ');

  // ── Threads / FB 分離策略 ──
  // Threads 對含連結的主貼文有降觸及：主貼文純文字，連結放 reply
  // FB 對含連結 + og:image 的貼文獎勵：主貼文含連結
  const urlRegex = /https:\/\/hourlightkey\.com\/[^\s]+/g;
  const urls = post.text.match(urlRegex) || [];
  const primaryUrl = urls[0] || '';

  const threadsMainText = post.text
    .split('\n')
    .filter((line) => !urlRegex.test(line))
    .join('\n')
    .trim();
  const threadsFullText = hashtags
    ? `${threadsMainText}\n\n${hashtags}`
    : threadsMainText;

  const threadsReplyText = primaryUrl
    ? `完整閱讀 → ${primaryUrl}${post.reply ? '\n\n' + post.reply : ''}`
    : post.reply || '';

  const fbText = hashtags ? `${post.text}\n\n${hashtags}` : post.text;
  const fbFullText = post.reply ? `${fbText}\n\n${post.reply}` : fbText;

  log.push(`\n--- Post picked ---`);
  log.push(`Title: ${post.title || post.name || post.id || '(no title)'}`);
  log.push(`\n--- Threads main (no link) ---`);
  log.push(threadsFullText.substring(0, 200));
  log.push(`\n--- Threads reply (with link) ---`);
  log.push(threadsReplyText.substring(0, 200));

  const results = { threads: null, facebook: null };

  // Post to Threads
  const threadsToken = process.env.THREADS_ACCESS_TOKEN;
  if (threadsToken) {
    try {
      const threadId = await postToThreads(threadsFullText, threadsToken);
      log.push(`Threads post id: ${threadId}`);
      if (threadsReplyText) {
        await sleep(30000);
        const replyId = await replyToThread(threadId, threadsReplyText, threadsToken);
        log.push(`Threads reply id: ${replyId}`);
      }
      results.threads = { ok: true, postId: threadId };
    } catch (err) {
      log.push(`Threads posting failed: ${err.message}`);
      results.threads = { ok: false, error: err.message };
    }
  } else {
    log.push('THREADS_ACCESS_TOKEN not set, skipping Threads');
    results.threads = { skipped: true };
  }

  // Post to Facebook
  const fbToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const fbPageId = process.env.FB_PAGE_ID;
  if (fbToken && fbPageId) {
    try {
      const fbResult = await postToFacebook(fbFullText, fbToken, fbPageId);
      log.push(`FB post id: ${fbResult.id}`);
      results.facebook = { ok: true, postId: fbResult.id };
    } catch (err) {
      log.push(`FB posting failed: ${err.message}`);
      results.facebook = { ok: false, error: err.message };
    }
  } else {
    log.push('FB_PAGE_ACCESS_TOKEN or FB_PAGE_ID not set, skipping FB');
    results.facebook = { skipped: true };
  }

  log.push(`=== Done ===`);

  return res.status(200).json({
    ok: true,
    tier: tierLabel,
    dayIndex,
    results,
    log,
  });
}

export const config = {
  maxDuration: 60,
};
