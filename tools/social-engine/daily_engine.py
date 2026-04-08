"""
馥靈之鑰 AI 自動社群發文引擎 - 每日主控腳本
整合所有模組，每天自動執行完整流程

使用方式：
  python daily_engine.py crawl        # 巡邏素材
  python daily_engine.py generate     # 生成文案 + 配圖
  python daily_engine.py post         # 發文（全部時段）
  python daily_engine.py post morning # 只發早上的
  python daily_engine.py post noon    # 只發中午的
  python daily_engine.py post evening # 只發晚上的
  python daily_engine.py all          # 巡邏 + 生成（不自動發文）
  python daily_engine.py auto         # 全自動（巡邏→生成→發文）
  python daily_engine.py test         # 測試模式（不真的發文）
"""
import sys
import json
import datetime
import os

# Fix Windows encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import *
from poster import post_to_fb, post_to_threads, reply_to_threads, post_all
from viral_crawler import crawl_all
from content_generator import generate_content
from image_finder import find_best_image

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)


def today_str():
    return datetime.datetime.now().strftime('%Y%m%d')


def step_crawl():
    """Step 1: 巡邏素材"""
    print("\n" + "="*50)
    print("📡 STEP 1: 爆文素材海巡")
    print("="*50)
    materials = crawl_all()

    filepath = os.path.join(DATA_DIR, f'materials_{today_str()}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(materials, f, ensure_ascii=False, indent=2)
    print(f"\n💾 素材已存到 {filepath}")
    return materials


def step_generate(materials=None):
    """Step 2: 生成文案 + 配圖"""
    print("\n" + "="*50)
    print("✍️ STEP 2: AI 文案生成 + 配圖")
    print("="*50)

    if not ANTHROPIC_API_KEY:
        print("❌ 缺少 ANTHROPIC_API_KEY，使用備用素材")
        # Use hardcoded topics from research notes
        materials = [
            {'title': '反芻思維超過10分鐘就會影響決策品質', 'source': 'research'},
            {'title': '2026年身心靈趨勢：身體優先的Somatic Experiencing', 'source': 'research'},
            {'title': '迷走神經控制80%的休息與消化反應', 'source': 'research'},
        ]

    if not materials:
        filepath = os.path.join(DATA_DIR, f'materials_{today_str()}.json')
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                materials = json.load(f)
        else:
            print("❌ 找不到今日素材，使用備用主題")
            materials = [
                {'title': '你的大腦每天花多少時間在「想太多」？', 'source': 'default'},
                {'title': '精油不只是聞香，是認知芳療的科學', 'source': 'default'},
                {'title': '為什麼你總是在關係裡重複同一個模式？', 'source': 'default'},
            ]

    topics = [m['title'] for m in materials[:3]]
    if len(topics) < 3:
        topics.extend(['今天花三分鐘，問自己一個真心的問題'] * (3 - len(topics)))

    slots = ['morning', 'noon', 'evening']
    results = []

    for slot, topic in zip(slots, topics):
        print(f"\n⏰ [{slot}] 主題：{topic[:40]}...")

        # Generate content
        if ANTHROPIC_API_KEY:
            content = generate_content(ANTHROPIC_API_KEY, topic, slot)
        else:
            # Fallback: use topic as-is
            content = {
                'success': True,
                'fb_post': f"{topic}\n\n馥靈之鑰｜讀懂自己，活對人生\nhourlightkey.com",
                'threads_post': f"{topic}\n\n你覺得呢？",
                'hashtags': ['馥靈之鑰', '自我覺察', '心理學']
            }

        if content['success']:
            print(f"  ✅ 文案：FB {len(content['fb_post'])}字 / Threads {len(content['threads_post'])}字")
        else:
            print(f"  ❌ 文案生成失敗：{content.get('error','')[:80]}")

        # Generate image with DALL-E (preferred) or fallback to Unsplash
        image_url = None
        image_photographer = None
        image_local = None
        openai_key = os.environ.get('OPENAI_API_KEY', '')
        if openai_key and content['success']:
            print(f"  🎨 DALL-E 生成配圖...")
            from content_generator import generate_image_prompt, generate_dalle_image
            img_prompt = generate_image_prompt(content['fb_post'], topic)
            img_path = os.path.join(DATA_DIR, 'images', f'dalle_{today_str()}_{slot}.png')
            result_path = generate_dalle_image(openai_key, img_prompt, img_path)
            if result_path:
                image_local = result_path
                print(f"  ✅ DALL-E 配圖已生成：{result_path}")
            else:
                print(f"  ⚠️ DALL-E 失敗，改用 Unsplash...")
                image = find_best_image(topic, save_dir=os.path.join(DATA_DIR, 'images'))
                image_url = image['url_medium'] if image else None
                image_photographer = image['photographer'] if image else None
        else:
            print(f"  🖼️ 搜尋配圖...")
            image = find_best_image(topic, save_dir=os.path.join(DATA_DIR, 'images'))
            image_url = image['url_medium'] if image else None
            image_photographer = image['photographer'] if image else None

        results.append({
            'slot': slot,
            'topic': topic,
            'image_url': image_url,
            'image_local': image_local,
            'image_photographer': image_photographer,
            **content
        })

    # Save
    filepath = os.path.join(DATA_DIR, f'content_{today_str()}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n💾 文案+配圖已存到 {filepath}")
    return results


def step_post(slot='all', dry_run=False):
    """Step 3: 發文"""
    print("\n" + "="*50)
    print(f"🚀 STEP 3: 發文 {'(測試模式)' if dry_run else ''}")
    print("="*50)

    if not dry_run and (not FB_PAGE_TOKEN or not THREADS_TOKEN):
        print("❌ 缺少 FB_PAGE_TOKEN 或 THREADS_TOKEN")
        print("   請設定環境變數後再執行")
        return

    filepath = os.path.join(DATA_DIR, f'content_{today_str()}.json')
    if not os.path.exists(filepath):
        print("❌ 找不到今日文案，請先執行 generate")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        contents = json.load(f)

    for content in contents:
        if slot != 'all' and content['slot'] != slot:
            continue
        if not content.get('success'):
            print(f"  ⏭️ 跳過 {content['slot']}（文案生成失敗）")
            continue

        print(f"\n⏰ [{content['slot']}] {content['topic'][:30]}...")

        # Prepare FB message with hashtags (避免重複：AI 文案已含 # 就不再加)
        fb_msg = content['fb_post']
        if content.get('hashtags') and '#' not in fb_msg:
            fb_msg += '\n\n' + ' '.join(f'#{h}' for h in content['hashtags'])

        # DALL-E 本地圖優先，否則用 URL
        image_url = content.get('image_url')
        image_local = content.get('image_local')

        if dry_run:
            print(f"  📘 FB（測試）: {fb_msg[:80]}...")
            print(f"  🧵 Threads（測試）: {content['threads_post'][:80]}...")
            print(f"  🖼️ 配圖: {image_url or '無'}")
            continue

        # Post to FB (with image if available)
        print(f"  📘 發文到 FB...")
        fb_result = post_to_fb(FB_PAGE_ID, FB_PAGE_TOKEN, fb_msg, image_url, image_local)
        if fb_result['success']:
            print(f"     ✅ Post ID: {fb_result['post_id']}")
        else:
            print(f"     ❌ {fb_result['error'][:100]}")

        # Post to Threads (text only, Threads image needs public URL)
        print(f"  🧵 發文到 Threads...")
        threads_result = post_to_threads(THREADS_USER_ID, THREADS_TOKEN, content['threads_post'])
        if threads_result['success']:
            print(f"     ✅ Post ID: {threads_result['post_id']}")
            # 自動回覆第一則（啟動對話，提升演算法推薦）
            self_reply = content.get('threads_self_reply', '')
            if self_reply and threads_result.get('post_id'):
                import time as _t; _t.sleep(5)
                print(f"  💬 自動回覆啟動對話...")
                reply_result = reply_to_threads(THREADS_USER_ID, THREADS_TOKEN, threads_result['post_id'], self_reply)
                if reply_result.get('success'):
                    print(f"     ✅ Reply ID: {reply_result['reply_id']}")
                else:
                    print(f"     ⚠️ 回覆失敗：{reply_result.get('error','')[:80]}")
        else:
            print(f"     ❌ {threads_result['error'][:100]}")

    print("\n✅ 發文完成！")


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else 'help'

    print(f"\n🔑 馥靈之鑰 AI 自動社群發文引擎 v1.0")
    print(f"📅 {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (UTC)")
    print(f"🎯 動作：{action}\n")

    if action == 'crawl':
        step_crawl()

    elif action == 'generate':
        step_generate()

    elif action == 'post':
        slot = sys.argv[2] if len(sys.argv) > 2 else 'all'
        step_post(slot)

    elif action == 'all':
        materials = step_crawl()
        step_generate(materials)
        print("\n" + "="*50)
        print("📋 文案已生成，請審閱後執行：")
        print("   python daily_engine.py post morning  # 發早上的")
        print("   python daily_engine.py post noon     # 發中午的")
        print("   python daily_engine.py post evening  # 發晚上的")
        print("   python daily_engine.py post          # 全部發")

    elif action == 'auto':
        materials = step_crawl()
        step_generate(materials)
        step_post('all')

    elif action == 'test':
        materials = step_crawl()
        contents = step_generate(materials)
        step_post('all', dry_run=True)

    elif action == 'help':
        print("使用方式：")
        print("  python daily_engine.py crawl        # 巡邏素材")
        print("  python daily_engine.py generate     # 生成文案+配圖")
        print("  python daily_engine.py post         # 發文（全部）")
        print("  python daily_engine.py post morning # 只發早上")
        print("  python daily_engine.py post noon    # 只發中午")
        print("  python daily_engine.py post evening # 只發晚上")
        print("  python daily_engine.py all          # 巡邏+生成（不發文）")
        print("  python daily_engine.py auto         # 全自動")
        print("  python daily_engine.py test         # 測試模式")
        print("\n環境變數：")
        print(f"  FB_PAGE_TOKEN:    {'✅ 已設定' if FB_PAGE_TOKEN else '❌ 未設定'}")
        print(f"  THREADS_TOKEN:    {'✅ 已設定' if THREADS_TOKEN else '❌ 未設定'}")
        print(f"  ANTHROPIC_API_KEY:{'✅ 已設定' if ANTHROPIC_API_KEY else '❌ 未設定（會用備用文案）'}")
        print(f"  PEXELS_API_KEY:   {'✅ 已設定' if os.environ.get('PEXELS_API_KEY') else '⚠️ 用內建Key'}")

    else:
        print(f"未知動作：{action}，輸入 help 看說明")


if __name__ == '__main__':
    main()
