module.exports = async function handler(req, res) {
  // CORS
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com', 'https://www.hourlightkey.com'];
  if (allowed.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    var body = req.body || {};
    var prompt = body.prompt;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    var data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'AI service temporarily unavailable',
        detail: data.error ? data.error.message : 'Unknown error'
      });
    }

    var text = '';
    if (data.content) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].text) text += data.content[i].text;
      }
    }

    return res.status(200).json({
      reading: text,
      spread: body.spread || 0,
      usage: data.usage || {}
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error, please try again later' });
  }
};
