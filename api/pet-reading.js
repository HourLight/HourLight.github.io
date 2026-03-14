// api/pet-reading.js
// 馥靈之鑰 寵物溝通 AI 解讀 API 中介
// 部署在 Vercel（app.hourlightkey.com）
// 前端呼叫這個端點，這裡再轉發到 Anthropic API

export default async function handler(req, res) {
  // 只允許 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 請求' });
  }

  // CORS：只允許你的官網
  const origin = req.headers.origin || '';
  const allowed = ['https://hourlightkey.com', 'https://www.hourlightkey.com', 'http://localhost:3000'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理 preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 從環境變數取得 API 金鑰（安全！不會暴露在前端）
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API 金鑰未設定' });
  }

  try {
    const { prompt, spread } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt' });
    }

    // 呼叫 Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ 
        error: '解讀服務暫時不可用，請稍後再試',
        detail: data.error?.message || '未知錯誤'
      });
    }

    // 提取文字回應
    const text = data.content
      ? data.content.map(block => block.text || '').join('')
      : '';

    return res.status(200).json({
      reading: text,
      spread: spread || 0,
      usage: data.usage || {}
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
}
