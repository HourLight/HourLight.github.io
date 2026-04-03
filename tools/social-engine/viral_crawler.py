"""
馥靈之鑰 AI 自動社群發文引擎 - 爆文素材海巡器
每天自動巡邏熱門來源，收集潛力素材
"""
import urllib.request
import urllib.parse
import json
import sys
import datetime


def crawl_google_trends_tw():
    """抓 Google Trends 台灣今日熱搜"""
    try:
        url = 'https://trends.google.com.tw/trending/rss?geo=TW'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8')
            # Simple XML parsing for titles
            titles = []
            for line in content.split('<title>')[2:12]:  # Skip first two (feed title)
                title = line.split('</title>')[0].strip()
                if title:
                    titles.append(title)
            return titles
    except Exception as e:
        print(f"  Google Trends error: {e}")
        return []


def search_pubmed(keywords):
    """搜尋 PubMed 最新研究"""
    try:
        query = '+'.join(keywords)
        url = f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax=5&sort=date&retmode=json'
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            ids = data.get('esearchresult', {}).get('idlist', [])

        if not ids:
            return []

        # Get summaries
        id_str = ','.join(ids[:3])
        url2 = f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={id_str}&retmode=json'
        with urllib.request.urlopen(url2, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            results = []
            for uid in ids[:3]:
                info = data.get('result', {}).get(uid, {})
                if info:
                    results.append({
                        'title': info.get('title', ''),
                        'source': 'PubMed',
                        'url': f'https://pubmed.ncbi.nlm.nih.gov/{uid}/'
                    })
            return results
    except Exception as e:
        print(f"  PubMed error: {e}")
        return []


def score_material(title, source=''):
    """為素材打分（0-100）"""
    score = 0

    # 時效性（來自今日趨勢 +30）
    if source in ['Google Trends', 'YouTube']:
        score += 30

    # 與美業/身心靈相關性（+30）
    keywords_high = ['美容', '護膚', 'spa', '精油', '芳療', '心理', '情緒', '焦慮', '壓力',
                     '冥想', '瑜伽', '自我', '覺察', '關係', '依附', '命理', '塔羅', '星座']
    keywords_mid = ['健康', '睡眠', '飲食', '運動', '皮膚', '頭髮', '指甲', '身體',
                    '大腦', '神經', '研究', '科學', '發現']

    title_lower = title.lower()
    for kw in keywords_high:
        if kw in title_lower:
            score += 15
            break
    for kw in keywords_mid:
        if kw in title_lower:
            score += 10
            break

    # 冷知識/反常識角度（+20）
    surprise_words = ['其實', '真相', '沒想到', '原來', '打臉', '顛覆', '秘密',
                      '竟然', '研究發現', '科學證實', 'new', 'discovery', 'surprising']
    for sw in surprise_words:
        if sw in title_lower:
            score += 20
            break

    # 可從王逸君角度切入（+20）
    angle_words = ['女性', '美業', '創業', '轉型', '數位', '療法', '自然', '植物',
                   '香氣', '能量', '占卜', '命盤', '人格']
    for aw in angle_words:
        if aw in title_lower:
            score += 20
            break

    return min(score, 100)


def crawl_all():
    """執行全部巡邏，回傳排序後的素材列表"""
    all_materials = []

    # Google Trends
    print("🔍 巡邏 Google Trends 台灣...")
    trends = crawl_google_trends_tw()
    for t in trends:
        all_materials.append({
            'title': t,
            'source': 'Google Trends',
            'url': f'https://trends.google.com.tw/trending?geo=TW',
            'score': score_material(t, 'Google Trends')
        })
    print(f"   找到 {len(trends)} 個趨勢")

    # PubMed
    print("🔍 巡邏 PubMed 最新研究...")
    for keywords in [['aromatherapy', 'emotion'], ['skin', 'stress', 'cortisol'], ['meditation', 'brain']]:
        papers = search_pubmed(keywords)
        for p in papers:
            p['score'] = score_material(p['title'], 'PubMed')
            all_materials.append(p)
    print(f"   找到 {len([m for m in all_materials if m['source']=='PubMed'])} 篇論文")

    # Sort by score
    all_materials.sort(key=lambda x: x['score'], reverse=True)

    # Top 5
    top5 = all_materials[:5]
    print(f"\n📊 前 5 名素材：")
    for i, m in enumerate(top5):
        print(f"   {i+1}. [{m['score']}分] {m['title'][:60]} ({m['source']})")

    return top5


if __name__ == '__main__':
    results = crawl_all()
