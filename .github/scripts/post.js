/**
 * Auto-post script for Threads and Facebook
 * Reads threads-content.json and posts based on current date/time (UTC+8)
 *
 * Start date: 2026-04-07
 * Schedule: 07:30 / 12:15 / 20:00 daily (UTC+8)
 */

const fs = require('fs');
const path = require('path');

const START_DATE = '2026-04-07';
const TOTAL_DAYS = 30;
const DRY_RUN = process.env.DRY_RUN === 'true';

// --- Helpers ---

function getNowUTC8() {
  const now = new Date();
  // Shift to UTC+8
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return utc8;
}

function getDateStringUTC8(d) {
  return d.toISOString().slice(0, 10);
}

function getTimeSlot(utc8Hour) {
  // Map cron triggers to time slots:
  // 07:30 trigger -> hour ~7-8
  // 12:15 trigger -> hour ~12-13
  // 20:00 trigger -> hour ~20-21
  if (utc8Hour >= 6 && utc8Hour < 10) return '07:30';
  if (utc8Hour >= 10 && utc8Hour < 16) return '12:15';
  if (utc8Hour >= 16 && utc8Hour <= 23) return '20:00';
  // Fallback for edge cases (UTC+8 hour 0-5 means late night)
  return '20:00';
}

function calculateDay(nowUTC8) {
  const start = new Date(START_DATE + 'T00:00:00Z');
  const nowDate = new Date(getDateStringUTC8(nowUTC8) + 'T00:00:00Z');
  const diffMs = nowDate - start;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  // Day 1 = start date, cycle after 30 days
  const day = (diffDays % TOTAL_DAYS) + 1;
  return day > 0 ? day : day + TOTAL_DAYS;
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
  // Step 1: Create media container
  const createUrl = `https://graph.threads.net/v1.0/me/threads`;
  const container = await httpPost(createUrl + `?access_token=${accessToken}`, {
    media_type: 'TEXT',
    text: text,
  });
  const containerId = container.id;
  console.log(`Threads container created: ${containerId}`);

  // Step 2: Publish
  const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
  const published = await httpPost(publishUrl + `?access_token=${accessToken}`, {
    creation_id: containerId,
  });
  console.log(`Threads post published: ${published.id}`);
  return published.id;
}

async function replyToThread(parentId, text, accessToken) {
  // Step 1: Create reply container
  const createUrl = `https://graph.threads.net/v1.0/me/threads`;
  const container = await httpPost(createUrl + `?access_token=${accessToken}`, {
    media_type: 'TEXT',
    text: text,
    reply_to_id: parentId,
  });
  const containerId = container.id;
  console.log(`Threads reply container created: ${containerId}`);

  // Step 2: Publish reply
  const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
  const published = await httpPost(publishUrl + `?access_token=${accessToken}`, {
    creation_id: containerId,
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
  // Load content
  const contentPath = path.join(__dirname, '..', '..', 'threads-content.json');
  const allPosts = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));

  // Determine current day and time slot
  const nowUTC8 = getNowUTC8();
  const day = calculateDay(nowUTC8);
  const utc8Hour = nowUTC8.getUTCHours(); // Already shifted, so getUTCHours is correct
  const timeSlot = getTimeSlot(utc8Hour);

  console.log(`=== Auto Post Script ===`);
  console.log(`UTC+8 time: ${nowUTC8.toISOString()}`);
  console.log(`Day: ${day}, Time slot: ${timeSlot}`);
  console.log(`Dry run: ${DRY_RUN}`);

  // Find the matching post
  const post = allPosts.find((p) => p.day === day && p.time === timeSlot);
  if (!post) {
    console.log(`No post found for day ${day}, time ${timeSlot}. Skipping.`);
    return;
  }

  // Build full text with hashtags
  const hashtags = post.hashtags.join(' ');
  const fullText = `${post.text}\n${hashtags}`;
  const replyText = post.reply;

  console.log(`\n--- Post content ---`);
  console.log(fullText);
  console.log(`\n--- Reply content ---`);
  console.log(replyText);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Skipping actual posting.');
    return;
  }

  // Post to Threads
  const threadsToken = process.env.THREADS_ACCESS_TOKEN;
  if (threadsToken) {
    try {
      const threadId = await postToThreads(fullText, threadsToken);
      console.log(`\nWaiting 30 seconds before posting reply...`);
      await sleep(30000);
      await replyToThread(threadId, replyText, threadsToken);
    } catch (err) {
      console.error(`Threads posting failed: ${err.message}`);
      // Don't fail the whole workflow
    }
  } else {
    console.log('THREADS_ACCESS_TOKEN not set, skipping Threads.');
  }

  // Post to Facebook
  const fbToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const fbPageId = process.env.FB_PAGE_ID;
  if (fbToken && fbPageId) {
    try {
      await postToFacebook(fullText, fbToken, fbPageId);
    } catch (err) {
      console.error(`Facebook posting failed: ${err.message}`);
      // Don't fail the whole workflow
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
