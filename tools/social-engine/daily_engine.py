"""
馥靈之鑰 AI 自動社群發文引擎 - 每日主控腳本
整合所有模組，每天自動執行完整流程

使用方式：
  python daily_engine.py crawl      # 只巡邏素材
  python daily_engine.py generate   # 只生成文案
  python daily_engine.py post       # 只發文（已審閱的）
  python daily_engine.py all        # 全部執行
"""
import sys
import json
import datetime
import os

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import *
from poster import post_to_fb, post_to_threads
from viral_crawler import crawl_all
from content_generator import generate_content


def step_crawl():
    """Step 1: 巡邏素材"""
    print("\n" + "="*50)
    print("📡 STEP 1: 爆文素材海巡")
    print("="*50)
    materials = crawl_all()

    # Save to local JSON (backup)
    today = datetime.datetime.now().strftime('%Y%m%d')
    filepath = os.path.join(os.path.dirname(__file__), f'data/materials_{today}.json')
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(materials, f, ensure_ascii=False, indent=2)
    print(f"\n💾 素材已存到 {filepath}")

    return materials


def step_generate(materials=None):
    """Step 2: 生成文案"""
    print("\n" + "="*50)
    print("✍️ STEP 2: AI 文案生成")
    print("="*50)

    if not ANTHROPIC_API_KEY:
        print("❌ 缺少 ANTHROPIC_API_KEY")
        return None

    if not materials:
        # Load today's materials
        today = datetime.datetime.now().strftime('%Y%m%d')
        filepath = os.path.join(os.path.dirname(__file__), f'data/materials_{today}.json')
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                materials = json.load(f)
        else:
            print("❌ 找不到今日素材，請先執行 crawl")
            return None

    # Pick top 3 for morning/noon/evening
    topics = [m['title'] for m in materials[:3]]
    if len(topics) < 3:
        topics.extend(['今天的自我覺察練習'] * (3 - len(topics)))

    slots = ['morning', 'noon', 'evening']
    results = []

    for slot, topic in zip(slots, topics):
        print(f"\n⏰ 生成 {slot} 文案：{topic[:40]}...")
        result = generate_content(ANTHROPIC_API_KEY, topic, slot)
        if result['success']:
            print(f"   ✅ FB: {len(result['fb_post'])} 字 / Threads: {len(result['threads_post'])} 字")
        else:
            print(f"   ❌ {result.get('error','')[:100]}")
        results.append({
            'slot': slot,
            'topic': topic,
            **result
        })

    # Save generated content
    today = datetime.datetime.now().strftime('%Y%m%d')
    filepath = os.path.join(os.path.dirname(__file__), f'data/content_{today}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n💾 文案已存到 {filepath}")
    print("📋 請到 Notion 審閱文案，確認後再發文")

    return results


def step_post(slot='all'):
    """Step 3: 發文"""
    print("\n" + "="*50)
    print("🚀 STEP 3: 發文")
    print("="*50)

    if not FB_PAGE_TOKEN or not THREADS_TOKEN:
        print("❌ 缺少 FB_PAGE_TOKEN 或 THREADS_TOKEN")
        return

    # Load today's content
    today = datetime.datetime.now().strftime('%Y%m%d')
    filepath = os.path.join(os.path.dirname(__file__), f'data/content_{today}.json')
    if not os.path.exists(filepath):
        print("❌ 找不到今日文案，請先執行 generate")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        contents = json.load(f)

    for content in contents:
        if slot != 'all' and content['slot'] != slot:
            continue
        if not content.get('success'):
            continue

        print(f"\n⏰ 發文 [{content['slot']}]...")

        # FB
        fb_msg = content['fb_post']
        if content.get('hashtags'):
            fb_msg += '\n\n' + ' '.join(f'#{h}' for h in content['hashtags'])

        fb_result = post_to_fb(FB_PAGE_ID, FB_PAGE_TOKEN, fb_msg)
        if fb_result['success']:
            print(f"   📘 FB ✅ Post ID: {fb_result['post_id']}")
        else:
            print(f"   📘 FB ❌ {fb_result['error'][:100]}")

        # Threads
        threads_result = post_to_threads(THREADS_USER_ID, THREADS_TOKEN, content['threads_post'])
        if threads_result['success']:
            print(f"   🧵 Threads ✅ Post ID: {threads_result['post_id']}")
        else:
            print(f"   🧵 Threads ❌ {threads_result['error'][:100]}")


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else 'all'

    print(f"🔑 馥靈之鑰 AI 自動社群發文引擎")
    print(f"📅 {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"🎯 動作：{action}")

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
        print("\n⚠️ 文案已生成，請審閱後執行 'python daily_engine.py post' 發文")
    else:
        print(f"未知動作：{action}")
        print("可用動作：crawl / generate / post / all")


if __name__ == '__main__':
    main()
