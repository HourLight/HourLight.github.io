"""
馥靈之鑰 AI 自動社群發文引擎 - 文案生成模組
用 Claude API 根據素材生成 FB + Threads 文案
"""
import urllib.request
import urllib.parse
import json
import sys
import datetime


def generate_content(api_key, topic, time_slot="evening", extra_context=""):
    """
    用 Claude API 生成社群文案

    Args:
        api_key: Anthropic API Key
        topic: 主題/素材描述
        time_slot: morning/noon/evening（影響語氣深度）
        extra_context: 額外的爆文規則或上下文
    """

    slot_guide = {
        "morning": "這是早上 7:30 的「早安覺察」，語氣輕鬆、好入口、像朋友傳的早安訊息。150-250字。",
        "noon": "這是中午 12:15 的「午間冷知識」，有趣、有料、讓人想分享。200-350字。",
        "evening": "這是晚上 8:00 的「深夜洞察」黃金時段主力文，深度、戳心、讓人想截圖。300-500字。"
    }

    prompt = f"""請根據以下素材，生成兩個版本的社群貼文：

素材主題：{topic}

時段指引：{slot_guide.get(time_slot, slot_guide['evening'])}

{extra_context}

請輸出 JSON 格式：
{{
  "fb_post": "Facebook 版文案（繁體中文）",
  "threads_post": "Threads 版文案（繁體中文，150字以內，要像真人在寫，不能有AI感）",
  "threads_self_reply": "發文後自己回的第一則留言（延伸一個有趣的補充或自問自答，50字以內，啟動對話用）",
  "hashtags": ["標籤1", "標籤2", "標籤3"]
}}

Threads 版重要規則：
- 像真人在寫，不是AI生成的感覺。要有口語、有停頓、有個性。
- 結尾用具體問句（不要「妳覺得呢？」要「妳上次被精油救到是什麼時候？」這種）
- 最後自然帶一句「Bio 裡有...」導流，不放連結
- self_reply 是發文後自己回覆第一則，啟動對話讓演算法推文

只輸出 JSON，不要其他文字。"""

    from config import FB_SYSTEM_PROMPT

    request_body = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1500,
        "system": FB_SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": prompt}]
    }).encode('utf-8')

    try:
        req = urllib.request.Request(
            'https://api.anthropic.com/v1/messages',
            data=request_body,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
            text = result['content'][0]['text']

            # Parse JSON from response
            # Handle case where response has markdown code blocks
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1].split('```')[0]

            content = json.loads(text.strip())
            return {
                'success': True,
                'fb_post': content.get('fb_post', ''),
                'threads_post': content.get('threads_post', ''),
                'hashtags': content.get('hashtags', [])
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_image_prompt(fb_post, topic):
    """從文案內容自動產生 DALL-E 配圖 prompt"""
    # 取文案前 100 字作為主題參考
    snippet = fb_post[:100] if fb_post else topic
    return f"Professional social media banner, warm aesthetic photography style. Theme: {topic}. Abstract representation related to wellness, self-awareness, and personal growth. Warm golden light, soft bokeh background, minimal and elegant composition. NO text, NO letters, NO words, NO watermark. Cinematic quality, Instagram-worthy, 16:9 landscape ratio."


def generate_dalle_image(openai_key, prompt, save_path):
    """用 DALL-E 3 生成配圖"""
    try:
        request_body = json.dumps({
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": "1792x1024",
            "quality": "standard"
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.openai.com/v1/images/generations',
            data=request_body,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {openai_key}'
            },
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode())
            img_url = result['data'][0]['url']

            # Download image
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(img_req, timeout=60) as img_resp:
                import os
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                with open(save_path, 'wb') as f:
                    f.write(img_resp.read())
            return save_path
    except Exception as e:
        print(f"  DALL-E error: {e}")
        return None


def generate_daily_content(api_key, topics):
    """
    為一天三個時段生成文案

    Args:
        api_key: Anthropic API Key
        topics: [morning_topic, noon_topic, evening_topic]
    """
    slots = ['morning', 'noon', 'evening']
    results = []

    for i, (slot, topic) in enumerate(zip(slots, topics)):
        print(f"\n{'='*40}")
        print(f"生成 {slot} 文案：{topic[:50]}...")
        result = generate_content(api_key, topic, slot)
        if result['success']:
            print(f"  ✅ FB: {len(result['fb_post'])} 字")
            print(f"  ✅ Threads: {len(result['threads_post'])} 字")
        else:
            print(f"  ❌ 失敗：{result['error'][:100]}")
        results.append(result)

    return results


if __name__ == '__main__':
    from config import ANTHROPIC_API_KEY

    test_topics = [
        "薄荷精油的涼感其實是大腦的幻覺（TRPM8 冷感受體）",
        "600萬對情侶數據顯示，人傾向找依附型態相同的伴侶",
        "反芻思維超過10分鐘就會影響決策品質"
    ]

    if ANTHROPIC_API_KEY:
        results = generate_daily_content(ANTHROPIC_API_KEY, test_topics)
        for i, r in enumerate(results):
            if r['success']:
                print(f"\n=== {['早安','午間','深夜'][i]}文案 ===")
                print(r['fb_post'][:200] + '...')
    else:
        print("請設定 ANTHROPIC_API_KEY 環境變數")
