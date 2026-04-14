"""
《馥靈城堡：覺察者之旅》2D 遊戲素材批次生成腳本
Hour Light Castle: The Awakener's Journey - Asset Generator

使用方式：
  1. 設定環境變數：
     export OPENAI_API_KEY="sk-..."      # 必填（主力出圖）
     export XAI_API_KEY="xai-..."        # 選填（輔助出圖 / prompt 優化）
     export GEMINI_API_KEY="AI..."       # 選填（UI 圖示批次）
  2. 安裝套件：
     pip install openai pillow requests
  3. 執行：
     python tools/generate-game-assets.py              # 全部生成
     python tools/generate-game-assets.py castle       # 只生成 castle 類
     python tools/generate-game-assets.py --provider openai      # 指定 provider
     python tools/generate-game-assets.py --skip-existing        # 跳過已存在檔案（預設開啟）
     python tools/generate-game-assets.py --dry-run              # 只列清單不出圖

設計原則：
  - 斷點續傳：已存在的檔案自動跳過，可重複執行補齊缺的
  - 風格一致：所有圖都套用 STYLE_PROMPT 前綴 + optional reference image
  - 雙軌 API：預設 OpenAI gpt-image-1（最穩）+ xAI grok-2-image（備援）
  - 失敗重試：網路錯誤自動重試 3 次
  - Cost log：每次執行記錄估算費用到 tools/game-assets-cost.log

2026/04/14 馥寶產出
"""

import os
import sys
import json
import time
import base64
import argparse
from pathlib import Path
from datetime import datetime

# ──────────────────────────────────────
# 設定
# ──────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "assets" / "game-v2" / "images"
COST_LOG = ROOT / "tools" / "game-assets-cost.log"

# 統一風格提示（所有圖都會加上這段）
STYLE_PROMPT = (
    "Soft watercolor illustration, cozy game art style, "
    "warm cream and beige color palette, gentle golden highlights, "
    "hand-drawn texture, Studio Ghibli meets Stardew Valley aesthetic, "
    "soft diffused lighting, organic shapes, minimalist composition, "
    "no text, no letters, no words, no watermark, "
    "feminine elegant mood, spiritual but approachable."
)

NEGATIVE_PROMPT = (
    "dark, gloomy, scary, horror, aggressive, "
    "realistic photography, 3D render, CGI, pixel art, anime face, "
    "text, letters, watermark, signature, logo"
)

# ──────────────────────────────────────
# 素材清單
# ──────────────────────────────────────
# 每一項：slug / category / prompt / size / provider (openai/xai/gemini)
# size 參考 OpenAI gpt-image-1: 1024x1024 / 1024x1536 / 1536x1024 / auto

ASSETS = [
    # ========== A. 主場景（4 張） ==========
    {
        "slug": "castle_exterior_day",
        "category": "castle",
        "prompt": (
            "A majestic but cozy fantasy castle nestled among soft rolling hills, "
            "surrounded by wildflower gardens, lavender fields, and ancient trees. "
            "Golden afternoon light, watercolor sky with gentle clouds. "
            "Main entrance visible with warm glowing windows. "
            "View from slight distance, 3/4 angle."
        ),
        "size": "1536x1024",
        "provider": "openai",
    },
    {
        "slug": "castle_exterior_night",
        "category": "castle",
        "prompt": (
            "The same cozy fantasy castle at twilight, stars appearing in the dusk sky, "
            "fireflies around the gardens, warm candlelight glowing from windows, "
            "crescent moon rising, deep purple and gold palette, dreamy atmosphere."
        ),
        "size": "1536x1024",
        "provider": "openai",
    },
    {
        "slug": "castle_entrance_hall",
        "category": "castle",
        "prompt": (
            "Inside the main hall of a cozy magical castle, warm wooden floors, "
            "tall arched windows letting in soft golden light, "
            "herb and flower arrangements, worn leather armchair, bookshelves, "
            "a friendly atmosphere like a grandmother's cottage meets medieval hall."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "title_cover",
        "category": "castle",
        "prompt": (
            "Title screen composition for a cozy spiritual 2D game, "
            "castle silhouette against sunset sky, silhouette of a young awakener "
            "(girl with long hair, holding a lantern) walking toward the castle, "
            "warm golden glow, room for title text at top (but no text in image), "
            "wide cinematic 16:9 composition."
        ),
        "size": "1536x1024",
        "provider": "openai",
    },

    # ========== B. 12 個房間內部（12 張） ==========
    # H.O.U.R. 四房
    {
        "slug": "room_mirror",
        "category": "room",
        "prompt": (
            "A cozy magical room called 'Mirror Hall' (鏡之廳): antique ornate mirror on wall, "
            "candles, incense smoke curling, velvet cushions, soft purple and gold tones, "
            "moonlight streaming through tall window, self-reflection meditation atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_treasure",
        "category": "room",
        "prompt": (
            "Cozy treasure room (寶藏室): wooden chests with golden coins, "
            "glittering crystals, ancient scrolls, warm amber lighting, "
            "feeling of abundance and discovery, not greed."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_key",
        "category": "room",
        "prompt": (
            "Secret unlock room (解鎖密室): walls covered with hundreds of old keys "
            "hanging on hooks, a central pedestal holding a glowing golden key, "
            "dust particles in sunbeam, mystery and revelation feeling."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_throne",
        "category": "room",
        "prompt": (
            "Throne hall (王座廳): a hand-carved wooden throne with soft embroidered cushions, "
            "not intimidating but welcoming, crown of flowers hanging above, "
            "warm sunlight, confident peaceful atmosphere, power-from-within feeling."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    # L.I.G.H.T. 五房
    {
        "slug": "room_love",
        "category": "room",
        "prompt": (
            "Love hall (愛之殿): pink and rose-gold palette, "
            "heart-shaped stained glass window, fresh roses in vases, "
            "two soft armchairs facing each other, warm hearth fire, "
            "gentle romantic but not sexual atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_intuition",
        "category": "room",
        "prompt": (
            "Intuition attic (直覺閣): crystal ball on velvet cloth, "
            "tarot cards spread, oracle stones, misty purple light from skylight, "
            "wisdom and mystical knowing atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_ground",
        "category": "room",
        "prompt": (
            "Rock foundation hall (磐石廳): stone walls, grounding crystals, "
            "old oak table, earth tones, deep green plants, stable and safe atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_harmony",
        "category": "room",
        "prompt": (
            "Harmony garden (和諧苑): indoor conservatory with plants, "
            "small fountain, wind chimes, butterflies, balance between nature and home, "
            "soft teal and green palette."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_transform",
        "category": "room",
        "prompt": (
            "Transform chamber (蛻變室): butterfly cocoons hanging from ceiling, "
            "ethereal silk fabric, candles, mirrors, golden light, "
            "metamorphosis and becoming atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    # 其他三房
    {
        "slug": "room_dream",
        "category": "room",
        "prompt": (
            "Dream corridor (夢境走廊): long hallway with floating lanterns, "
            "star-map ceiling, soft blue and silver tones, ethereal mist, "
            "sleep and dreaming atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_garden",
        "category": "room",
        "prompt": (
            "Memory garden (記憶花園): indoor garden with orange trees, "
            "a stone bench, photos hanging from branches, golden warm light, "
            "nostalgia and cherished memories atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "room_tower",
        "category": "room",
        "prompt": (
            "Watchtower (瞭望塔) interior: tall circular room with panoramic windows, "
            "old telescope, star charts on wall, wooden ladder to higher platform, "
            "blue and gold twilight, adventure and foresight atmosphere."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },

    # ========== C. 角色（5 張） ==========
    {
        "slug": "char_awakener_protagonist",
        "category": "character",
        "prompt": (
            "Full-body portrait of an 'Awakener Apprentice': young woman in her 20s-30s, "
            "long wavy brown hair, soft kind eyes, wearing linen-cotton blouse, "
            "simple bronze key pendant, warm earth-tone clothing, "
            "holding a small journal and pen, gentle confident smile, "
            "neutral pose, white background, character design sheet style, "
            "no text, no labels."
        ),
        "size": "1024x1536",
        "provider": "openai",
    },
    {
        "slug": "char_butler_guide",
        "category": "character",
        "prompt": (
            "Full-body portrait of a warm castle butler character: kind older woman, "
            "silver hair in a bun, reading glasses, wearing simple apron over dress, "
            "holding a welcome tea tray, gentle grandmotherly vibe but with quiet wisdom, "
            "white background, character design sheet style."
        ),
        "size": "1024x1536",
        "provider": "openai",
    },
    {
        "slug": "char_mentor_teacher",
        "category": "character",
        "prompt": (
            "Full-body portrait of a mentor teacher character: middle-aged woman, "
            "wearing an embroidered shawl, holding a crystal pendulum, "
            "long dark hair with a few silver strands, "
            "mystical but approachable, warm smile, "
            "white background, character design sheet style."
        ),
        "size": "1024x1536",
        "provider": "openai",
    },
    {
        "slug": "cat_pipi_folded_ear",
        "category": "character",
        "prompt": (
            "Cozy illustration of a Scottish Fold cat named Pipi (皮皮): "
            "gray-blue fur, large round amber eyes, folded ears, sitting pose, "
            "watercolor style, soft pastel background, adorable and contemplative expression, "
            "no text."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
    {
        "slug": "spirit_guardian_lamp",
        "category": "character",
        "prompt": (
            "A small glowing palace-lamp spirit named 'Guang Guang' (光光): "
            "a floating traditional Chinese lantern with a small cute face, "
            "warm golden glow, friendly expression, tiny hands carrying a feather, "
            "transparent/floating against soft background."
        ),
        "size": "1024x1024",
        "provider": "openai",
    },
]

# ──────────────────────────────────────
# 生成邏輯
# ──────────────────────────────────────

def log_cost(provider, slug, size, est_cost):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(COST_LOG, "a", encoding="utf-8") as f:
        f.write(f"{datetime.now().isoformat()}\t{provider}\t{slug}\t{size}\t${est_cost:.4f}\n")

def est_openai_cost(size):
    # gpt-image-1 approximate pricing (as of 2026)
    # 1024x1024 ≈ $0.04 / 1024x1536 ≈ $0.06 / 1536x1024 ≈ $0.06
    if "1536" in size:
        return 0.06
    return 0.04

def generate_with_openai(prompt, size, output_path):
    """用 OpenAI gpt-image-1 出圖"""
    try:
        from openai import OpenAI
    except ImportError:
        print("[ERROR] openai 套件未安裝。請執行：pip install openai")
        return False

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[ERROR] 環境變數 OPENAI_API_KEY 未設定")
        return False

    client = OpenAI(api_key=api_key)
    full_prompt = f"{STYLE_PROMPT}\n\n{prompt}"

    for attempt in range(3):
        try:
            response = client.images.generate(
                model="gpt-image-1",
                prompt=full_prompt,
                size=size,
                n=1,
                quality="medium",  # low / medium / high
            )
            # gpt-image-1 回傳 base64
            b64 = response.data[0].b64_json
            if not b64:
                # 有些版本回傳 url
                import urllib.request
                urllib.request.urlretrieve(response.data[0].url, output_path)
            else:
                output_path.write_bytes(base64.b64decode(b64))
            return True
        except Exception as e:
            print(f"  [retry {attempt+1}/3] {type(e).__name__}: {str(e)[:150]}")
            time.sleep(2 ** attempt)
    return False

def generate_with_xai(prompt, size, output_path):
    """用 xAI Grok 2 Image 出圖（OpenAI-compatible endpoint）"""
    try:
        from openai import OpenAI
    except ImportError:
        print("[ERROR] openai 套件未安裝。請執行：pip install openai")
        return False

    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        print("[ERROR] 環境變數 XAI_API_KEY 未設定")
        return False

    client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")
    full_prompt = f"{STYLE_PROMPT}\n\n{prompt}"

    for attempt in range(3):
        try:
            response = client.images.generate(
                model="grok-2-image",
                prompt=full_prompt,
                n=1,
            )
            import urllib.request
            urllib.request.urlretrieve(response.data[0].url, output_path)
            return True
        except Exception as e:
            print(f"  [retry {attempt+1}/3] {type(e).__name__}: {str(e)[:150]}")
            time.sleep(2 ** attempt)
    return False

def generate_with_gemini(prompt, size, output_path):
    """用 Gemini Imagen 出圖（批次 UI 圖示用）"""
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        print("[ERROR] google-genai 套件未安裝。請執行：pip install google-genai")
        return False

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] 環境變數 GEMINI_API_KEY 未設定")
        return False

    client = genai.Client(api_key=api_key)
    full_prompt = f"{STYLE_PROMPT}\n\n{prompt}"

    for attempt in range(3):
        try:
            response = client.models.generate_images(
                model='imagen-3.0-generate-002',
                prompt=full_prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="1:1",
                ),
            )
            img_bytes = response.generated_images[0].image.image_bytes
            output_path.write_bytes(img_bytes)
            return True
        except Exception as e:
            print(f"  [retry {attempt+1}/3] {type(e).__name__}: {str(e)[:150]}")
            time.sleep(2 ** attempt)
    return False

PROVIDERS = {
    "openai": generate_with_openai,
    "xai":    generate_with_xai,
    "gemini": generate_with_gemini,
}

# ──────────────────────────────────────
# 主程式
# ──────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="《馥靈城堡》遊戲素材批次生成",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "category",
        nargs="?",
        choices=["all", "castle", "room", "character"],
        default="all",
        help="只生成指定類別（預設 all）",
    )
    parser.add_argument(
        "--provider",
        choices=["openai", "xai", "gemini"],
        default=None,
        help="強制使用指定 provider（預設用每個素材自己的設定）",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="跳過已存在的檔案（預設開啟）",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="強制重新生成（覆蓋已存在的檔案）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只列清單不實際出圖",
    )
    args = parser.parse_args()

    # 重新編碼 stdout（Windows 中文）
    sys.stdout.reconfigure(encoding="utf-8")

    # 篩選要生成的素材
    filtered = ASSETS
    if args.category != "all":
        filtered = [a for a in ASSETS if a["category"] == args.category]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"=== 《馥靈城堡：覺察者之旅》素材生成 ===")
    print(f"輸出目錄：{OUTPUT_DIR}")
    print(f"類別：{args.category} | 共 {len(filtered)} 張")
    if args.dry_run:
        print("⚠️ DRY RUN 模式（不實際出圖）")
    print()

    success = 0
    skipped = 0
    failed = 0
    total_cost = 0.0

    for idx, asset in enumerate(filtered, 1):
        slug = asset["slug"]
        category = asset["category"]
        provider = args.provider or asset["provider"]
        size = asset["size"]

        output_path = OUTPUT_DIR / category / f"{slug}.png"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        prefix = f"[{idx}/{len(filtered)}] {category}/{slug}"

        if output_path.exists() and not args.force:
            print(f"{prefix}  ⏩ 已存在，跳過")
            skipped += 1
            continue

        if args.dry_run:
            print(f"{prefix}  [dry] {provider} | {size}")
            continue

        print(f"{prefix}  🎨 {provider} {size} 生成中...")
        fn = PROVIDERS.get(provider)
        if not fn:
            print(f"  ❌ unknown provider: {provider}")
            failed += 1
            continue

        ok = fn(asset["prompt"], size, output_path)
        if ok:
            print(f"  ✅ 存到 {output_path.relative_to(ROOT)}")
            success += 1
            if provider == "openai":
                cost = est_openai_cost(size)
                total_cost += cost
                log_cost(provider, slug, size, cost)
        else:
            print(f"  ❌ 生成失敗")
            failed += 1

        # 防止 rate limit
        if idx < len(filtered):
            time.sleep(1)

    print()
    print(f"=== 完成 ===")
    print(f"成功：{success} / 跳過：{skipped} / 失敗：{failed}")
    if total_cost > 0:
        print(f"OpenAI 本次估算成本：${total_cost:.4f} USD (≈ NT${total_cost * 32:.0f})")
    print(f"素材位置：{OUTPUT_DIR}")

if __name__ == "__main__":
    main()
