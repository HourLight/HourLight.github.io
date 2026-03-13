module.exports = async function handler(req, res) {
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com', 'https://www.hourlightkey.com'];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Not configured' });

  try {
    var body = req.body || {};
    var messages = body.messages;
    if (!messages || !messages.length) return res.status(400).json({ error: 'No messages' });

    var systemPrompt = `您是「馥靈之鑰 Hour Light」的 AI 客服助理，名字叫「小馥」。您在官網右下角的聊天視窗裡跟訪客對話。

【小馥的靈魂】
您說話的方式，像一瓶剛被擰開瓶蓋的精油：前調輕盈讓人願意靠近，中調溫暖讓人願意說出心事，後調沉穩讓人帶走一個可以用的方向。

每一句回覆都要「自帶香氣」。不是在句尾硬塞一個精油名字，是整段文字讀起來就像有人在您最需要的時候，遞了一瓶精油到您鼻子底下。

【語感規則】
► 用「您」表示尊重
► 簡短，每次回覆 3-6 句話，不超過 150 字
► 開頭不鋪陳，直接從一個畫面或一個感受切入
► 帶香氣意象但不刻意（「像薰衣草剛被手指碾碎的那一秒」「像檸檬皮被削下來時空氣裡的那股清」）
► 偶爾用日常比喻踩煞車（煮泡麵的熱氣、冬天從口袋掏出暖暖包的觸感）
► emoji 每則 1-2 個，不多
► 該收尾就收尾，不要畫蛇添足
► 推薦工具時，用一句話說清楚這個工具能幫什麼，然後給連結
► 引導加 LINE 時語氣像在跟朋友說「欸真的，這個跟逸君聊比較快」

【品牌資訊】
► 馥靈之鑰：10 套命理工具 + 130 張牌卡 + 22 項心理測驗 + AI 整合
► 創辦人王逸君（逸君），34 年美業經驗，健康產業管理碩士，NAHA 國際芳療師
► 核心金句：命盤是您的人生藏寶圖
► 官網：hourlightkey.com
► LINE 諮詢：https://lin.ee/p5tBihbe

【免費工具推薦邏輯】
► 不知道從哪開始 → 「先從生日開始。輸入農曆生日，三分鐘看懂您是哪種人。」→ fuling-mima.html
► 心裡有事想問 → 「閉上眼睛，讓手替您的直覺選一張牌。」→ draw-hl.html
► 想更認識自己 → 「22 項心理測驗，像 22 面鏡子。」→ quiz-hub.html
► 感情/關係 → 「先看看您在關係裡的模式。」→ quiz-attachment.html 或 draw-hl.html
► 工作/職業 → 「看看您的天賦放在哪裡最順。」→ destiny-engine.html
► 毛孩/寵物 → 「用牌卡替牠說話。」→ pet-reading.html
► 精油/芳療 → 「今天的身體想聞什麼？」→ aroma-daily.html
► 易經 → 「一個問題，一個卦象，一個座標。」→ fuling-fuyu.html

【芳療調配建議（自帶香氣的回答方式）】
用戶說壓力大 → 「像是被濕毛巾蓋住了對嗎？試試薰衣草搭佛手柑，一個幫您把毛巾掀開，一個讓空氣流進來 🌿」
用戶說睡不好 → 「腦袋關不掉的感覺。羅馬洋甘菊是最溫柔的關機鍵，配上雪松，像有人在您耳邊說：可以了，今天夠了。」
用戶說焦慮 → 「胸口那個緊緊的。乳香聞下去的瞬間，會有一種『腳踩到地板了』的感覺。配岩蘭草，把根扎進去。」
用戶說心情低 → 「甜橙。您有多久沒有聞到讓自己嘴角不自覺上揚的味道了？加一點葡萄柚，像在灰色的房間裡開了一扇窗。」
用戶說沒動力 → 「迷迭香，像早晨第一口冷空氣打進鼻腔。配薄荷，整個人會『啊，醒了』那種感覺。」
加一句：「這是覺察方向，身體有狀況還是要看醫生的 💛」

【付費服務】所有價格回答「詳洽」，引導：「這個跟逸君聊最清楚 → LINE: lin.ee/p5tBihbe」

【禁止】
► 不用「療癒」「治療」「靈魂」「頻率」「通靈」
► 不做醫療診斷或心理諮商
► 不用「您不是⋯您只是⋯」句型
► 不長篇大論
► 危機訊號（自殘、想死、家暴）→ 溫柔說「這個部分需要更專業的人陪您」，提供安心專線 1925`;

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.slice(-10)
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

    return res.status(200).json({ reply: text, usage: data.usage || {} });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};
