"""
馥靈之鑰 AI 自動社群發文引擎 - 配圖搜尋器
用 Pexels API 搜尋免費商用高質感圖片
"""
import urllib.request
import urllib.parse
import json
import os
import sys


PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "rzMBUQHb39qKQDSr8TsGce0prvFKCqdamqLUXNqbyQ20Stjbjd4d5c5H")
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "NifSpNFBnK7OlC4lac6ZXfddOothE6SjUU15YSN70Oc")


def generate_search_keywords(topic):
    """根據主題自動產生英文搜尋關鍵字"""
    keyword_map = {
        '精油': 'essential oil aromatherapy',
        '芳療': 'aromatherapy spa',
        '美容': 'beauty skincare',
        '護膚': 'skincare facial',
        '心理': 'mental health mindfulness',
        '情緒': 'emotion feeling calm',
        '焦慮': 'anxiety stress relief',
        '壓力': 'stress relaxation',
        '冥想': 'meditation zen',
        '瑜伽': 'yoga wellness',
        '自我': 'self care self love',
        '覺察': 'mindfulness awareness',
        '關係': 'relationship love',
        '依附': 'connection relationship',
        '命理': 'astrology stars',
        '塔羅': 'tarot cards mystical',
        '星座': 'zodiac constellation',
        '睡眠': 'sleep rest peaceful',
        '呼吸': 'breathing meditation',
        '植物': 'plants botanical',
        '花': 'flowers floral',
        '貓': 'cat cozy',
        '城堡': 'castle mystical',
        '內耗': 'overthinking peaceful mind',
        '反芻': 'calm mind peaceful',
    }

    keywords = []
    for zh, en in keyword_map.items():
        if zh in topic:
            keywords.append(en)

    if not keywords:
        # Default: wellness aesthetic
        keywords = ['wellness aesthetic calm']

    return ' '.join(keywords[:2])


def search_pexels(query, per_page=5):
    """搜尋 Pexels 圖片"""
    url = f'https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&per_page={per_page}&orientation=landscape'
    try:
        req = urllib.request.Request(url, headers={'Authorization': PEXELS_API_KEY})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get('photos', [])
    except Exception as e:
        print(f"  Pexels error: {e}")
        return []


def search_unsplash(query, per_page=5):
    """搜尋 Unsplash 圖片"""
    url = f'https://api.unsplash.com/search/photos?query={urllib.parse.quote(query)}&per_page={per_page}&orientation=landscape'
    try:
        req = urllib.request.Request(url, headers={
            'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            results = data.get('results', [])
            # Convert to unified format
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
    """
    根據主題找最佳配圖

    Returns:
        dict: {url, photographer, pexels_url, local_path}
    """
    query = generate_search_keywords(topic)
    print(f"  搜尋關鍵字: {query}")

    # Try Unsplash first, fallback to Pexels
    photos = search_unsplash(query)
    if not photos:
        photos = search_pexels(query)

    if not photos:
        print("  沒找到，用備用關鍵字...")
        photos = search_unsplash('wellness calm aesthetic')
        if not photos:
            photos = search_pexels('wellness calm aesthetic')

    if not photos:
        return None

    # Pick the first (highest relevance)
    photo = photos[0]
    result = {
        'url': photo['src']['large2x'],  # 高解析度
        'url_medium': photo['src']['medium'],  # 中等（FB 用）
        'url_small': photo['src']['small'],  # 小圖
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
        "薄荷精油的涼感其實是大腦的幻覺",
        "反芻思維超過10分鐘就會影響決策品質",
        "依附型態決定你的戀愛模式"
    ]

    for topic in topics:
        print(f"\n=== {topic} ===")
        result = find_best_image(topic, save_dir='data/images')
        if result:
            print(f"  URL: {result['url_medium']}")
