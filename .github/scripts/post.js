/**
 * Auto-post script for Threads and Facebook (Three-Tier Strategy)
 *
 * Tier A (07:30) — 天使故事鉤子 → docs/auto-post-angel.json (52 posts)
 * Tier B (12:15) — 知識學苑導流 → docs/auto-post-knowledge.json (33 posts)
 * Tier C (20:00) — 工具導流     → docs/auto-post-tools.json (22 posts)
 *
 * Rotation: picks post by (daysSinceStart % pool.length) so every pool cycles
 * through all items without duplication. Days-since-start uses 2026-04-12 as
 * epoch so day 0 = the day the three-tier strategy went live.
 */

const fs = require('fs');
const path = require('path');

const EPOCH = '2026-04-12'; // three-tier go-live date
const DRY_RUN = process.env.DRY_RUN === 'true';

// --- Helpers ---

function getNowUTC8() {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}

function getDateStringUTC8(d) {
  return d.toISOString().slice(0, 10);
}

function getTimeSlot(utc8Hour) {
  // 07:30 cron → hour ~7-9
  // 12:15 cron → hour ~12-15
  // 20:00 cron → hour ~20-23
  if (utc8Hour >= 6 && utc8Hour < 10) return '07:30';
  if (utc8Hour >= 10 && utc8Hour < 16) return '12:15';
  if (utc8Hour >= 16 && utc8Hour <= 23) return '20:00';
  // Fallback for edge cases (UTC+8 hour 0-5 = late night cron)
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

function loadJson(relPath) {
  const p = path.join(__dirname, '..', '..', relPath);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
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
  console.log(`Threads container created: ${container.id}`);

  const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
  const published = await httpPost(publishUrl + `?access_token=${accessToken}`, {
    creation_id: container.id,
  });
  console.log(`Threads post published: ${published.id}`);
  return published.id;
}

async function replyToThread(parentId, text, accessToken) {
  const createUrl = `https://graph.threads.net/v1.0/me/threads`;
  const container = await httpPost(createUrl + `?access_token=${accessToken}`, {
    media_type: 'TEXT',
    text: text,
    reply_to_id: parentId,
  });
  console.log(`Threads reply container created: ${container.id}`);

  const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
  const published = await httpPost(publishUrl + `?access_token=${accessToken}`, {
    creation_id: container.id,
  });
  console.log(`Threads reply published: ${published.id}`);
  return published.id;
}

// --- Facebook API ---

async function postToFacebook(text, pageAccessToken, pageId) {
  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
  const result = await httpPost(url + `?access_token=${pageAccessToken}`, {
    message: text,
  });
  console.log(`Facebook post published: ${result.id}`);
  return result.id;
}

// --- Main ---

async function main() {
  const nowUTC8 = getNowUTC8();
  const dayIndex = daysSinceEpoch(nowUTC8);
  const utc8Hour = nowUTC8.getUTCHours();
  const timeSlot = getTimeSlot(utc8Hour);

  console.log(`=== Auto Post Script (Three-Tier) ===`);
  console.log(`UTC+8 time: ${nowUTC8.toISOString()}`);
  console.log(`Day index since ${EPOCH}: ${dayIndex}`);
  console.log(`Time slot: ${timeSlot}`);
  console.log(`Dry run: ${DRY_RUN}`);

  // Route by time slot to content pool
  let poolFile;
  let tierLabel;
  if (timeSlot === '07:30') {
    poolFile = 'docs/auto-post-angel.json';
    tierLabel = 'A (天使故事)';
  } else if (timeSlot === '12:15') {
    poolFile = 'docs/auto-post-knowledge.json';
    tierLabel = 'B (知識學苑)';
  } else {
    poolFile = 'docs/auto-post-tools.json';
    tierLabel = 'C (工具導流)';
  }

  console.log(`Tier: ${tierLabel}`);
  console.log(`Pool file: ${poolFile}`);

  const pool = loadJson(poolFile);
  if (!pool || pool.length === 0) {
    console.log(`Pool is empty or missing, skipping.`);
    return;
  }

  const post = pickFromPool(pool, dayIndex);
  if (!post) {
    console.log(`No post picked, skipping.`);
    return;
  }

  const hashtags = (post.hashtags || []).join(' ');

  // ── 分離策略 ──
  // Threads 對外部連結有隱性降觸及，所以：
  //   - 主貼文 = 純鉤子文字（無連結）
  //   - 連結放在 reply（第一則回覆）
  // Facebook 對 link preview 友善，所以：
  //   - 主貼文 = 鉤子 + 連結（FB 會自動渲染 og:image 預覽）
  //   - 不需要 reply

  // 從 post.text 裡把連結提取出來
  const urlRegex = /https:\/\/hourlightkey\.com\/[^\s]+/g;
  const urls = post.text.match(urlRegex) || [];
  const primaryUrl = urls[0] || '';

  // Threads 主貼文：移除連結那一行（通常是「完整閱讀 → URL」）
  const threadsMainText = post.text
    .split('\n')
    .filter(line => !urlRegex.test(line))
    .join('\n')
    .trim();
  const threadsFullText = hashtags
    ? `${threadsMainText}\n\n${hashtags}`
    : threadsMainText;

  // Threads reply：把連結放進去
  const threadsReplyText = primaryUrl
    ? `完整閱讀 → ${primaryUrl}${post.reply ? '\n\n' + post.reply : ''}`
    : (post.reply || '');

  // Facebook 主貼文：保持原本含連結的格式（FB 對 link preview 友善）
  const fbText = hashtags ? `${post.text}\n\n${hashtags}` : post.text;
  const fbReplyAppended = post.reply
    ? `${fbText}\n\n${post.reply}`
    : fbText;

  console.log(`\n--- Threads main post (no link) ---`);
  console.log(threadsFullText);
  console.log(`\n--- Threads reply (with link) ---`);
  console.log(threadsReplyText);
  console.log(`\n--- Facebook post (with link) ---`);
  console.log(fbReplyAppended);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Skipping actual posting.');
    return;
  }

  // Post to Threads (main without link, reply with link)
  const threadsToken = process.env.THREADS_ACCESS_TOKEN;
  if (threadsToken) {
    try {
      const threadId = await postToThreads(threadsFullText, threadsToken);
      if (threadsReplyText) {
        console.log(`\nWaiting 30 seconds before posting reply...`);
        await sleep(30000);
        await replyToThread(threadId, threadsReplyText, threadsToken);
      }
    } catch (err) {
      console.error(`Threads posting failed: ${err.message}`);
    }
  } else {
    console.log('THREADS_ACCESS_TOKEN not set, skipping Threads.');
  }

  // Post to Facebook (link in main body = FB renders nice preview card)
  const fbToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const fbPageId = process.env.FB_PAGE_ID;
  if (fbToken && fbPageId) {
    try {
      await postToFacebook(fbReplyAppended, fbToken, fbPageId);
    } catch (err) {
      console.error(`Facebook posting failed: ${err.message}`);
    }
  } else {
    console.log('FB_PAGE_ACCESS_TOKEN or FB_PAGE_ID not set, skipping Facebook.');
  }

  console.log('\n=== Done ===');
}

main().catch((err) => {
  console.error(`Script error: ${err.message}`);
  process.exit(1);
});
