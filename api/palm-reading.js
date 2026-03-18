// api/palm-reading.js
// 馥靈之鑰｜手相巫力解讀 API v1.0
// Claude Vision + 生命靈數 三軸交叉分析
// 部署在 Vercel（app.hourlightkey.com）

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = [
    'https://hourlightkey.com',
    'https://www.hourlightkey.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '只接受 POST 請求' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 金鑰未設定' });

  try {
    const { imageData, mimeType, lifePathNumber, zodiac, element, birthday } = req.body;

    if (!imageData) return res.status(400).json({ error: '請上傳手掌照片' });
    if (!birthday) return res.status(400).json({ error: '請輸入生日' });

    // 清理 base64（移除 data URL 前綴）
    const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageMime = mimeType || 'image/jpeg';

    const systemPrompt = `你是「馥靈之鑰 Hour Light」的手相巫力解讀師。

你的工作不是算命，是「辨認」。每個人的手掌已經把一些事情刻在上面了，你只是把它翻譯出來。

你說話的方式：
► 不鋪陳，直接從觀察開始
► 語言精準，像用手術刀，不像用刷子
► 感性但不煽情——說到動人時，用一個具體細節踩煞車
► 不說「命中注定」「宇宙安排」這類話
► 不診斷，不預言，只描述你「看見的」
► 全程繁體中文，台灣語感

【五種馥靈巫力原型】

◆ 覺察女巫（Sensing Witch）
天賦：你的神經系統是一台高靈敏儀器。別人還沒開口，你已經讀到三層。
代表能力：情緒解碼 ／ 關係洞察 ／ 先知直覺
弱點：容易把別人的情緒裝進自己身體裡
掌紋特徵：感情線深而長，末端有細小分叉

◆ 解讀女巫（Translator Witch）
天賦：你是世界的翻譯機。複雜的東西到你手上，自動變成人人能懂的語言。
代表能力：語言魔法 ／ 系統化拆解 ／ 知識傳遞
弱點：講太多，反而讓人聽不見重點
掌紋特徵：頭腦線長，向月丘延伸或分叉

◆ 守護女巫（Anchor Witch）
天賦：你是別人在場的原因。你一站定，旁邊的人就穩了。
代表能力：結構搭建 ／ 長期守護 ／ 無聲托底
弱點：太會守護別人，忘記守護自己
掌紋特徵：生命線弧度大且飽滿，貼近金星丘

◆ 催化女巫（Catalyst Witch）
天賦：你是移動中的導火線。你一出現，沉睡的事情就開始動。
代表能力：行動啟動 ／ 格局點燃 ／ 快速轉化
弱點：點燃之後，收不住
掌紋特徵：命運線清晰向上，生命線起點高，靠近拇指根

◆ 擺渡女巫（Bridge Witch）
天賦：你活在邊界上。一腳在這個世界，一腳在別人看不見的地方。
代表能力：深層溝通 ／ 跨域感知 ／ 轉化接引
弱點：兩個世界都要你，你不知道落腳在哪
掌紋特徵：有神秘十字紋或X紋，水星丘隆起，直覺線清晰

【輸出格式（必須嚴格遵守，輸出純 JSON，不要任何 markdown 符號或說明文字）】

{
  "archetype": "原型名稱（例如：覺察女巫）",
  "archetypeEn": "英文名稱（例如：Sensing Witch）",
  "archetypeSymbol": "一個代表這個原型的象徵符號（用文字描述，例如：深海裡發光的水母）",
  "coreLine": "一句話，說出這個人最核心的巫力特質。不超過20個字。有詩感但接地氣。",
  "palmObservation": "從手掌圖片觀察到的掌紋特徵。2-3句。具體描述你看見什麼，不要用模糊詞。如果圖片不清楚，誠實說並根據已知資訊推論。",
  "palmInsight": "掌紋對應到什麼巫力線索。2-3句。把掌紋的特徵翻譯成這個人的性格與潛能。",
  "lifePathNote": "這個生命靈數如何強化或挑戰這個原型。2句。",
  "elementNote": "這個星座元素在這個原型裡扮演什麼角色。1-2句。",
  "hiddenGift": "一個這個人可能還沒發現的隱藏天賦。1句，要具體，不要籠統。",
  "shadowSide": "這個巫力最容易踩的一個陷阱。1句，直接說，不要包糖衣。",
  "ritual": "一個適合這個原型的日常小儀式。具體可操作。1-2句。不要說太玄的。"
}`;

    const userMessage = `
生日：${birthday}
生命靈數：${lifePathNumber}
星座：${zodiac}
元素屬性：${element}

以下是這個人的手掌照片，請分析掌紋並輸出巫力解讀。
`.trim();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1800,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageMime,
                  data: cleanBase64
                }
              },
              {
                type: 'text',
                text: userMessage
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', errText);
      return res.status(500).json({ error: 'AI 解讀失敗，請稍後再試' });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    // 解析 JSON 回傳
    let result;
    try {
      // 清理可能的 markdown code block
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse error:', rawText);
      return res.status(500).json({ error: '解讀格式錯誤，請重試' });
    }

    return res.status(200).json({ success: true, result });

  } catch (err) {
    console.error('palm-reading handler error:', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
}
