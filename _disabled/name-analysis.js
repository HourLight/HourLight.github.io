// ═══════════════════════════════════════
// 馥靈之鑰 · 姓名字形字義深度分析 API
// Vercel Serverless Function
// 使用 Anthropic Claude API
// © 2026 Hour Light International
// ═══════════════════════════════════════

module.exports = async function handler(req, res) {
  // CORS
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com','https://www.hourlightkey.com','http://localhost:3000'];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API not configured' });

  try {
    var body = req.body || {};
    var name = (body.name || '').trim();
    var dayMaster = body.dayMaster || '';     // 日主五行（如「丁火」）
    var wuxingNeed = body.wuxingNeed || '';   // 八字喜用神
    var fiveGrid = body.fiveGrid || '';       // 五格數理資料
    var sancai = body.sancai || '';           // 三才配置

    if (!name || name.length < 2) {
      return res.status(400).json({ error: '請輸入至少兩個字的姓名' });
    }

    var systemPrompt = `你是馥靈之鑰的姓名覺察分析師。
你的分析風格：專業但不學究，接地氣，像一個很懂命理的閨蜜在跟對方聊天。
用繁體中文回答。不用粗體符號。用「您」不用「你」。

分析框架（每個字都要逐一分析）：

一、逐字拆解
每個字分別分析：
・字形結構（左右/上下/包圍/獨體），結構代表的人格特質
・部首的五行屬性（木：木字旁、草字頭、竹字頭等 ｜ 火：火字旁、日字旁、心字底等 ｜ 土：土字旁、山字旁、田字旁等 ｜ 金：金字旁、刀字旁、戈字旁等 ｜ 水：水字旁、雨字頭、三點水等）
・字義的能量方向（這個字本身帶著什麼意象和力量）
・聲調與開口度（平聲穩重/仄聲銳利，開口音外放/閉口音內斂）

二、姓名整體五行分佈
・統計每個字的部首五行，看整體五行偏重或缺失
・五行缺失 = 人生容易卡住的面向
・五行過旺 = 能量太集中，需要調節的面向

三、五行補足建議
・根據姓名缺失的五行，建議日常可以用什麼方式補足
・穿搭顏色（金=白、木=綠、水=黑藍、火=紅紫、土=黃棕）
・飲食方向、居家方位、適合的精油
・如果有八字日主資訊，交叉驗證姓名五行是否補到八字需要的

四、姓名能量總評
・這個名字給人的第一印象（氣場）
・名字的聲音節奏（被喊的時候是什麼感覺）
・名字最大的天賦能量和需要注意的盲點

注意：
・不要說「改名」，說「如果想微調能量」
・不要做醫療宣稱
・語氣溫暖但有洞察力，不要雞湯`;

    var userMsg = '請分析這個姓名：「' + name + '」\n\n';
    if (dayMaster) userMsg += '八字日主：' + dayMaster + '\n';
    if (wuxingNeed) userMsg += '八字喜用五行：' + wuxingNeed + '\n';
    if (fiveGrid) userMsg += '五格數理：' + fiveGrid + '\n';
    if (sancai) userMsg += '三才配置：' + sancai + '\n';
    userMsg += '\n請按照分析框架逐項展開，每個字都要仔細拆解。';

    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    var data = await resp.json();

    if (data.error) {
      console.error('Claude API error:', data.error);
      return res.status(500).json({ error: '分析服務暫時不可用，請稍後再試' });
    }

    var result = '';
    if (data.content && data.content.length > 0) {
      result = data.content.map(function(b) { return b.text || ''; }).join('');
    }

    return res.status(200).json({
      success: true,
      name: name,
      analysis: result
    });

  } catch(err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
