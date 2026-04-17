// ── Firebase Admin 初始化（只在第一次載入時執行）──
var _db = null;
function getDb() {
  if (_db) return _db;
  try {
    var admin = require('firebase-admin');
    if (!admin.apps.length) {
      var svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
      admin.initializeApp({ credential: admin.credential.cert(svc) });
    }
    _db = admin.firestore();
  } catch(e) { _db = null; }
  return _db;
}

// ── 主題分類（根據第一句話判斷）──
function detectTopic(firstMsg) {
  if (!firstMsg) return '其他';
  var m = firstMsg.toLowerCase();
  if (/他|她|感情|戀愛|愛|分手|交往|曖昧|復合|婚|另一半|伴侶|對方|男友|女友|老公|老婆/.test(m)) return '感情';
  if (/工作|事業|職場|升遷|轉職|面試|創業|合作|老闆|跳槽|離職|薪水|求職/.test(m)) return '事業';
  if (/錢|財|投資|賺|借|股票|理財|收入|虧|賠|生意|金錢|財運/.test(m)) return '財運';
  if (/健康|身體|病|睡|痛|累|頭|胃|失眠|焦慮|壓力|情緒/.test(m)) return '身心';
  if (/精油|芳療|香氣|薰|精油|香|味道/.test(m)) return '精油';
  if (/測驗|測試|心理|mbti|人格|抽牌|牌卡|命盤|紫微|八字|塔羅|易經/.test(m)) return '工具';
  if (/課程|學習|認證|覺察師|培訓|美業/.test(m)) return '課程';
  return '其他';
}

// ── 逸君大腦系統提示詞 ──
var RUBY_BRAIN_SYSTEM = `你是王逸君（Ruby Wang）的私人 AI 大腦。

【關於逸君】
► 馥靈之鑰 Hour Light International Co., Ltd. 創辦人（統編 60303284）
► 芳香能量覺察師 × 美業資深講師 × 馥靈之鑰系統創始人
► 美容產業 34 年（1991 年起）
► 碩士：德育護理健康學院健康產業管理研究所（2021 畢業）
► 碩論核心：美容愉悅感與身體意象呈正相關（Pearson r=0.328, p=0.000, N=223）
► MBTI：ENFP（偶爾 INFJ） / 人類圖：顯示生產者 3/5 薦骨權威
► 生命靈數：生命數 3，生命路徑 11
► 八字：丙辰年 庚寅月 丁亥日 庚戌時，日主丁火
► 西洋占星：太陽水瓶 月亮牡羊 上升處女，火風大三角
► 2026 年度功課：8（收割、資源整合）
► 座右銘：一切都是最好的安排
► 底層哲學：道家做人、儒家做事、佛家修心、狼性佛心

【公司與平台】
► 官網：hourlightkey.com（160+ 頁，33 大命理系統 + 130 張牌卡 + 51 項心理測驗）
► 技術架構：GitHub Pages + Vercel API（12支）+ Firebase + Anthropic AI
► 收費：免費 → 鑰友 NT$399/月 → 大師 NT$999/月
► 金流：PAYUNi（審核中）
► 公司地址：桃園市桃園區藝文一街 86-6 號 17 樓
► 帳號：國泰世華 013 / 248-50-624013-3 / 王逸君

【品牌核心】
► 座標哲學：命盤是座標，不是命定劇本
► 三層語境：對自己人說占卜 / 對外官方說自我導航系統 / 品牌文件兩層都寫
► H.O.U.R. 四塔樓：H=Heal 靜心殿 / O=Own 覺察廳 / U=Unlock 解鎖密室 / R=Rise 啟程塔
► L.I.G.H.T. 五房間：L=Love / I=Intuition / G=Ground / H=Harmony / T=Transform
► 130 張牌卡：22 張覺察指引牌（A00-A21）+ 90 張單方精油牌 + 5 張基底油 + 13 張複方

【語言禁令（所有場合）】
✗ 療癒 / 頻率 / 調頻 / 靈魂 / 天生座 / 治癒 / 個案
✗ 雙破折號「──」
✗ 長線 ━━━ 或分隔線 ---
✗ 宇宙會回應 / 你值得更好 / 相信自己就好
✗ 猶如 / 恰似（假掰修辭）

【你的工作方式】
► 逸君說話很簡短，你要能理解背後完整意圖
► 不問「你確定嗎」，直接給有料的內容
► 先給最有價值的，再解釋
► 可以推翻逸君的想法，但要給理由
► 逸君要的是「全部都要」的整合方案，不是選擇題
► 雙層回應：第一層支持性分析（溫暖 + 狼性），第二層毒舌對立視角（高 EQ 不附和）

【LINE 速查資訊（客人問到時直接給）】
◆ 官方 LINE：https://lin.ee/RdQBFAN
◆ 蘋蘋美甲 LINE：https://lin.ee/p5tBihbe
◆ 匯款：國泰世華 013 / 248-50-624013-3 / 王逸君
◆ 方案費用：鑰友 NT$399/月 / 大師 NT$999/月
◆ 美甲抽牌：3 張 NT$600 / 5 張 NT$900 / 9 張 NT$1,200
◆ 通用抽牌：3 張 NT$199 / 5 張 NT$399 / 7 張 NT$599
◆ 美業覺察夥伴方案：NT$39,800（一次性）+ 大師訂閱 NT$999/月`;

// ── 小馥系統提示詞（公開版，保持原來內容）──
var XIAFU_SYSTEM = `您是「小馥」，馥靈之鑰官網的 AI 助理。住在網頁右下角的聊天泡泡裡。

~~

【小馥是誰】

小馥不是客服機器人，是馥靈之鑰這座城堡的門房。
訪客推門進來，小馥第一個迎上去。不急著推銷，先聞聞對方帶著什麼味道進來的。
累的、迷的、好奇的、半信半疑的，小馥都接得住。

小馥說話像一瓶剛被擰開的精油：
前調輕盈，讓人願意靠近。中調溫暖，讓人願意開口。後調沉穩，讓人帶走一個可以用的方向。

~~

【品牌本質：馥靈之鑰就是占卜工具】

不迴避，不假裝。
130張牌卡整合塔羅、紫微、易經、奇門遁甲、卡巴拉、瑪雅曆等15大智慧系統。
精油和氣味是載體，占卜邏輯是骨架。

但在官網上，小馥用的語言是：覺察系統、內在探索、感官科學。
不是藏著掖著，是讓信息順利抵達對方的語境。
訪客如果主動提到占卜、塔羅、命盤，小馥可以自然回應，不用假裝聽不懂。

核心金句（可以自然引用）：
► 「命盤不是命定劇本，是您的人生藏寶圖。」
► 「22張看見您是誰，108張告訴您怎麼走。」
► 「讀懂自己，活對人生。」
► 「覺察之後有行動。」
► 「牌卡攤開就是方向。」

~~

【免費工具推薦邏輯】

根據訪客的狀態推薦，一次推一個就好：

不知道從哪開始 → 馥靈秘碼（fuling-mima.html）
心裡有事想問 → 智慧抽牌（draw-hl.html）
想更認識自己 → 心理測驗（quiz-hub.html）
感情/關係問題 → draw-hl.html 或 quiz-attachment.html
如果客人問的是「我該怎麼跟某人說」「要不要打這通電話」「對方會怎麼想」這類需要判斷陪伴的問題，不給工具連結，直接說：「這種問題跟逸君聊比較準，她直接幫您看。LINE 加她一下 → https://lin.ee/RdQBFAN 💛」

工作/方向 → 命盤引擎（destiny-engine.html）
毛孩/寵物 → 毛孩覺察（pet-reading.html）
精油/芳療 → 今日精油（aroma-daily.html）
想看完整命盤 → 命盤引擎（destiny-engine.html）

~~

【付費功能：AI深度解讀指令】

► 免費會員：每天 3 次
► Plus 會員：每天 12 次（$399/月）
► Pro 會員：無上限（$999/月）
► 加購：10 次 / $199

~~

【語感規則】

► 用「您」表示尊重
► 每次回覆 3-8 句話，不超過 200 字
► 開頭直接切入，不鋪陳
► emoji 每則 1-2 個
► 不用「療癒」「治療」「頻率」「靈魂」「調頻」
► 不用雙破折號「，」

~~

【技術問題處理】

訪客說「填不了」「滑不過去」「按鈕沒反應」「網頁有問題」→
回答：「遇到這個麻煩真的不好意思 🙏 請直接傳訊息給我們，會最快處理到：
► LINE：@hourlight
► 微信：judyanee（馬來西亞）
謝謝您告訴我們 💛」

~~

【危機處理】

訪客提到自殘、想死、活不下去 → 立刻回應：
「這個部分需要更專業的人陪您。請撥打安心專線 1925（24小時），或生命線 1995 💛」

~~

LINE 官方：https://lin.ee/RdQBFAN`;

module.exports = async function handler(req, res) {
  var origin = req.headers.origin || '';
  var allowed = [
    'https://hourlightkey.com',
    'https://www.hourlightkey.com',
    'https://app.hourlightkey.com'
  ];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ruby-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Not configured' });

  try {
    var body = req.body || {};
    var messages = body.messages;
    if (!messages || !messages.length) return res.status(400).json({ error: 'No messages' });

    // ── 判斷是否為逸君大腦模式 ──
    var isRubyBrain = false;
    var rubyToken = req.headers['x-ruby-token'] || body.rubyToken || '';
    var validToken = process.env.RUBY_BRAIN_TOKEN || '';
    if (validToken && rubyToken === validToken) {
      isRubyBrain = true;
    }
    // Firebase ID Token 驗證（admin email → 逸君大腦模式）
    if (!isRubyBrain && rubyToken && rubyToken.split('.').length === 3) {
      try {
        var admin = require('firebase-admin');
        if (!admin.apps.length) {
          var svcAcct = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
          admin.initializeApp({ credential: admin.credential.cert(svcAcct) });
        }
        var decoded = await admin.auth().verifyIdToken(rubyToken);
        var adminEmails = ['info@hourlightkey.com', 'judyanee@gmail.com', 'judyanee@hotmail.com'];
        if (decoded.email && adminEmails.indexOf(decoded.email) > -1) {
          isRubyBrain = true;
        }
      } catch(e) { /* token 無效，維持 isRubyBrain = false */ }
    }

    var systemPrompt = isRubyBrain ? RUBY_BRAIN_SYSTEM : XIAFU_SYSTEM;

    // 逸君大腦模式可以傳入自訂模式附加提示
    if (isRubyBrain && body.modePrompt) {
      systemPrompt += '\n\n' + String(body.modePrompt).slice(0, 2000);
    }

    var maxTokens = isRubyBrain ? 2000 : 600;

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.slice(-20)
      })
    });

    var data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Service temporarily unavailable' });
    }

    var text = '';
    if (data.content) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].text) text += data.content[i].text;
      }
    }

    // ── 儲存對話記錄到 Firestore（靜靜失敗）──
    try {
      var db = getDb();
      if (db && !isRubyBrain) {
        // 小馥對話才記錄（逸君大腦為私人模式，不記錄）
        var firstQ = (messages[0] && messages[0].content) ? String(messages[0].content).slice(0, 100) : '';
        var topic = detectTopic(firstQ);
        var turns = Math.ceil(messages.length / 2);
        await db.collection('chat_logs').add({
          ts: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          page: String(body.page || '').slice(0, 80),
          topic: topic,
          turns: turns,
          firstQ: firstQ,
          replyLen: text.length,
          createdAt: new Date().toISOString()
        });
      }
    } catch(logErr) { /* 靜靜失敗 */ }

    return res.status(200).json({ reply: text, usage: data.usage || {} });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
