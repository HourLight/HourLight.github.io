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

  // Route by time slot and platform to content pools
  let threadsPoolFile, fbPoolFile;
  let tierLabel;
  if (timeSlot === '07:30') {
    threadsPoolFile = 'docs/threads-angel.json';
    fbPoolFile = 'docs/auto-post-knowledge.json';  // FB 統一用深度知識
    tierLabel = 'A (Threads:天使故事 / FB:深度知識)';
  } else if (timeSlot === '12:15') {
    threadsPoolFile = 'docs/threads-knowledge.json';
    fbPoolFile = 'docs/auto-post-knowledge.json';  // FB 統一用深度知識
    tierLabel = 'B (Threads:知識學苑 / FB:深度知識)';
  } else {
    threadsPoolFile = 'docs/threads-tools.json';
    fbPoolFile = 'docs/auto-post-knowledge.json';  // FB 統一用深度知識
    tierLabel = 'C (Threads:工具導流 / FB:深度知識)';
  }

  console.log(`Tier: ${tierLabel}`);
  console.log(`Threads pool: ${threadsPoolFile}`);
  console.log(`Facebook pool: ${fbPoolFile}`);

  // Load platform-specific content
  const threadsPool = loadJson(threadsPoolFile);
  const fbPool = loadJson(fbPoolFile);

  if ((!threadsPool || threadsPool.length === 0) && (!fbPool || fbPool.length === 0)) {
    console.log(`Both pools are empty or missing, skipping.`);
    return;
  }

  // Pick content for each platform
  const threadsPost = threadsPool && threadsPool.length > 0 ? pickFromPool(threadsPool, dayIndex) : null;
  const fbPost = fbPool && fbPool.length > 0 ? pickFromPool(fbPool, dayIndex) : null;

  // ── 完全分離策略 ──
  // 每個平台使用完全不同的內容池和格式
  // Threads: 高互動漲粉內容 + 連結在回覆
  // Facebook: 深度知識內容 + 連結在主文

  let threadsFullText = '', threadsReplyText = '', fbText = '';

  // 處理 Threads 內容
  if (threadsPost) {
    const threadsHashtags = (threadsPost.hashtags || []).join(' ');

    // 從 Threads 內容中提取連結
    const urlRegex = /https:\/\/hourlightkey\.com\/[^\s]+/g;
    const threadsUrls = threadsPost.text.match(urlRegex) || [];
    const threadsPrimaryUrl = threadsUrls[0] || '';

    // Threads 主貼文：移除連結行
    const threadsMainText = threadsPost.text
      .split('\n')
      .filter(line => !urlRegex.test(line))
      .join('\n')
      .trim();

    threadsFullText = threadsHashtags
      ? `${threadsMainText}\n\n${threadsHashtags}`
      : threadsMainText;

    // Threads 回覆：放連結
    threadsReplyText = threadsPrimaryUrl
      ? `${threadsPost.reply || threadsPrimaryUrl}`
      : (threadsPost.reply || '');
  }

  // 處理 Facebook 內容
  if (fbPost) {
    const fbHashtags = (fbPost.hashtags || []).join(' ');
    fbText = fbHashtags ? `${fbPost.text}\n\n${fbHashtags}` : fbPost.text;
    if (fbPost.reply) {
      fbText = `${fbText}\n\n${fbPost.reply}`;
    }
  }

  console.log(`\n--- Threads content ---`);
  console.log(`Main: ${threadsFullText}`);
  console.log(`Reply: ${threadsReplyText}`);
  console.log(`\n--- Facebook content ---`);
  console.log(fbText);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Skipping actual posting.');
    return;
  }

  let results = { threads: null, facebook: null };

  // Post to Threads
  const threadsToken = process.env.THREADS_ACCESS_TOKEN;
  if (threadsToken && threadsPost && threadsFullText) {
    try {
      console.log('\n=== Posting to Threads ===');
      const threadId = await postToThreads(threadsFullText, threadsToken);
      results.threads = { ok: true, postId: threadId };

      if (threadsReplyText) {
        console.log(`Waiting 30 seconds before posting reply...`);
        await sleep(30000);
        const replyId = await replyToThread(threadId, threadsReplyText, threadsToken);
        results.threads.replyId = replyId;
      }
    } catch (err) {
      console.error(`Threads posting failed: ${err.message}`);
      results.threads = { ok: false, error: err.message };
    }
  } else {
    console.log('Skipping Threads: missing token or content');
  }

  // Post to Facebook
  const fbToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const fbPageId = process.env.FB_PAGE_ID;
  if (fbToken && fbPageId && fbPost && fbText) {
    try {
      console.log('\n=== Posting to Facebook ===');
      const fbPostId = await postToFacebook(fbText, fbToken, fbPageId);
      results.facebook = { ok: true, postId: fbPostId };
    } catch (err) {
      console.error(`Facebook posting failed: ${err.message}`);
      results.facebook = { ok: false, error: err.message };
    }
  } else {
    console.log('Skipping Facebook: missing token/pageId or content');
  }

  console.log('\n=== Results ===');
  console.log(JSON.stringify(results, null, 2));

  console.log('\n=== Done ===');
}

main().catch((err) => {
  console.error(`Script error: ${err.message}`);
  process.exit(1);
});
