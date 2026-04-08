"""
馥靈之鑰 AI 自動社群發文引擎 - 配圖搜尋器 v2.0
根據文案主題動態搜尋，避免重複使用同一張圖
"""
import urllib.request
import urllib.parse
import json
import os
import sys
import random
import hashlib


PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "rzMBUQHb39qKQDSr8TsGce0prvFKCqdamqLUXNqbyQ20Stjbjd4d5c5H")
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "NifSpNFBnK7OlC4lac6ZXfddOothE6SjUU15YSN70Oc")

# 已使用過的圖片 ID（避免重複）
_used_ids = set()
_USED_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'used_images.json')

def _load_used():
    global _used_ids
    try:
        if os.path.exists(_USED_FILE):
            with open(_USED_FILE, 'r') as f:
                _used_ids = set(json.load(f))
    except: pass

def _save_used():
    try:
        os.makedirs(os.path.dirname(_USED_FILE), exist_ok=True)
        with open(_USED_FILE, 'w') as f:
            json.dump(list(_used_ids)[-200:], f)  # 只保留最近 200 張
    except: pass

_load_used()


def generate_search_keywords(topic):
    """根據主題自動產生英文搜尋關鍵字（更多樣化）"""
    keyword_map = {
        '精油': ['essential oil bottle', 'aromatherapy diffuser', 'natural herbs'],
        '芳療': ['aromatherapy spa candle', 'spa treatment relaxing'],
        '美容': ['beauty skincare routine', 'facial glow skin'],
        '護膚': ['skincare products natural', 'skin care routine'],
        '心理': ['mental health mind', 'psychology brain light'],
        '情緒': ['emotion feeling colorful', 'mood atmosphere light'],
        '焦慮': ['calm peaceful nature', 'stress relief quiet'],
        '壓力': ['relaxation breathing space', 'peaceful morning light'],
        '冥想': ['meditation zen garden', 'mindfulness candle quiet'],
        '瑜伽': ['yoga sunrise peaceful', 'yoga mat morning'],
        '自我': ['self care morning routine', 'journal coffee cozy'],
        '覺察': ['mindfulness nature awareness', 'morning light window'],
        '關係': ['connection hands warmth', 'relationship togetherness'],
        '依附': ['connection bond love', 'holding hands warmth'],
        '命理': ['astrology stars night sky', 'constellation galaxy'],
        '塔羅': ['tarot cards mystical', 'divination candle magic'],
        '星座': ['zodiac stars constellation', 'night sky stars'],
        '睡眠': ['sleep cozy bedroom', 'peaceful night rest'],
        '呼吸': ['breathing fresh air nature', 'deep breath morning'],
        '植物': ['botanical plants green', 'indoor plants cozy'],
        '花': ['flowers bouquet beautiful', 'floral garden spring'],
        '貓': ['cat cozy home', 'kitten sleeping cute'],
        '城堡': ['castle fantasy mystical', 'fairytale castle'],
        '內耗': ['peaceful mind calm water', 'quiet reflection lake'],
        '反芻': ['clear mind blue sky', 'fresh start morning'],
        '檸檬': ['lemon citrus fresh', 'lemon water bright'],
        '薰衣草': ['lavender field purple', 'lavender aromatherapy'],
        '薄荷': ['mint fresh green', 'peppermint cool'],
        '專注': ['focus concentration desk', 'productive workspace'],
        '大腦': ['brain creativity colorful', 'mind power neural'],
        '研究': ['science research lab', 'study books knowledge'],
        '運動': ['exercise morning run', 'fitness healthy active'],
        '飲食': ['healthy food nutrition', 'fresh ingredients cooking'],
        '咖啡': ['coffee morning cozy', 'cafe latte art'],
        '茶': ['tea ceremony peaceful', 'herbal tea calm'],
        '書': ['books reading cozy', 'library knowledge'],
        '音樂': ['music headphones peaceful', 'musical instruments'],
        '旅行': ['travel adventure landscape', 'journey road scenic'],
        '海': ['ocean waves peaceful', 'sea sunset calm'],
        '山': ['mountain sunrise hiking', 'mountain peak clouds'],
        '森林': ['forest nature green', 'woodland path light'],
        '日出': ['sunrise golden morning', 'dawn light beautiful'],
        '日落': ['sunset golden hour', 'evening sky orange'],
        '雨': ['rain window cozy', 'rainy day peaceful'],
    }

    keywords = []
    for zh, en_list in keyword_map.items():
        if zh in topic:
            keywords.append(random.choice(en_list))

    if not keywords:
        # 從主題生成一個 hash 來選不同的備用關鍵字
        fallbacks = [
            'warm golden light cozy', 'peaceful nature green',
            'abstract colorful art', 'minimal aesthetic design',
            'sunrise hope new day', 'ocean calm reflection',
            'mountain strength nature', 'candle warm atmosphere',
            'coffee book morning', 'flowers spring beautiful',
            'sky clouds dreamy', 'forest path mystical',
            'crystal clear water', 'stars night wonder',
            'cozy home interior', 'garden peaceful green',
        ]
        idx = int(hashlib.md5(topic.encode()).hexdigest()[:8], 16) % len(fallbacks)
        keywords = [fallbacks[idx]]

    return ' '.join(keywords[:2])


def search_pexels(query, per_page=10):
    """搜尋 Pexels 圖片"""
    page = random.randint(1, 3)  # 隨機頁數避免總是同一批
    url = f'https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&per_page={per_page}&page={page}&orientation=landscape'
    try:
        req = urllib.request.Request(url, headers={'Authorization': PEXELS_API_KEY})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get('photos', [])
    except Exception as e:
        print(f"  Pexels error: {e}")
        return []


def search_unsplash(query, per_page=10):
    """搜尋 Unsplash 圖片"""
    page = random.randint(1, 3)
    url = f'https://api.unsplash.com/search/photos?query={urllib.parse.quote(query)}&per_page={per_page}&page={page}&orientation=landscape'
    try:
        req = urllib.request.Request(url, headers={
            'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            results = data.get('results', [])
            photos = []
            for r in results:
                photos.append({
                    'id': r['id'],
                    'src': {
                        'large2x': r['urls']['full'],
                        'medium': r['urls']['regular'],
                        'small': r['urls']['small'],
                    },
                    'photographer': r['user']['name'],
                    'url': r['links']['html'],
                    'width': r['width'],
                    'height': r['height'],
                })
            return photos
    except Exception as e:
        print(f"  Unsplash error: {e}")
        return []


def find_best_image(topic, save_dir=None):
    """根據主題找最佳配圖（不重複）"""
    query = generate_search_keywords(topic)
    print(f"  搜尋關鍵字: {query}")

    # Try Unsplash first, fallback to Pexels
    photos = search_unsplash(query)
    if not photos:
        photos = search_pexels(query)

    if not photos:
        print("  沒找到，用備用關鍵字...")
        backup = random.choice(['nature aesthetic', 'minimal design', 'warm light cozy', 'peaceful morning'])
        photos = search_unsplash(backup)
        if not photos:
            photos = search_pexels(backup)

    if not photos:
        return None

    # 選一張沒用過的圖
    photo = None
    for p in photos:
        if p['id'] not in _used_ids:
            photo = p
            break
    if not photo:
        # 全部都用過了，隨機選一張
        photo = random.choice(photos)

    # 記錄已使用
    _used_ids.add(photo['id'])
    _save_used()

    result = {
        'url': photo['src']['large2x'],
        'url_medium': photo['src']['medium'],
        'url_small': photo['src']['small'],
        'photographer': photo['photographer'],
        'pexels_url': photo['url'],
        'width': photo['width'],
        'height': photo['height'],
    }

    # Download if save_dir specified
    if save_dir:
        os.makedirs(save_dir, exist_ok=True)
        filename = f"post_{photo['id']}.jpg"
        filepath = os.path.join(save_dir, filename)

        try:
            req = urllib.request.Request(result['url_medium'], headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                with open(filepath, 'wb') as f:
                    f.write(resp.read())
            result['local_path'] = filepath
            print(f"  已下載: {filepath}")
        except Exception as e:
            print(f"  下載失敗: {e}")
            result['local_path'] = None

    print(f"  找到圖片: {result['url_medium'][:60]}... (by {result['photographer']})")
    return result


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    topics = [
        "王柏傑在金馬獎的那段話讓我想了三天",
        "檸檬精油10分鐘降低打字錯誤率54%",
        "你有沒有那種一整天什麼都沒做但躺下來累到不行的時候"
    ]

    for topic in topics:
        print(f"\n=== {topic} ===")
        result = find_best_image(topic, save_dir='data/images')
        if result:
            print(f"  URL: {result['url_medium']}")
