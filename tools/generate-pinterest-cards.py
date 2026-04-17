#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass
"""
Pinterest 圖卡批次產生器
──────────────────────────────
輸入：root 下 A00-A21.png + 001-108.png 共 130 張牌卡圖
輸出：pinterest-cards/{code}.jpg，1000x1500 Pinterest 標準尺寸

布局：
 上方 0-1100px：牌卡圖（等比 fit 置中）
 下方 1100-1500px：品牌區（金色底 + 粗襯線字 + code + 品牌 + 網址）

執行：
    python tools/generate-pinterest-cards.py            # 產 5 張樣本
    python tools/generate-pinterest-cards.py all        # 產全部 130 張
"""
import os, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / 'pinterest-cards'
OUT_DIR.mkdir(exist_ok=True)

PIN_W, PIN_H = 1000, 1500
CARD_AREA_H = 1100
BRAND_AREA_H = PIN_H - CARD_AREA_H  # 400

BG_COLOR = (250, 249, 247)   # 米白 #faf9f7
BRAND_COLOR = (139, 111, 78) # 棕金 #8b6f4e
ACCENT = (196, 168, 130)     # #c4a882
INK = (26, 23, 20)           # #1a1714

SAMPLE_CODES = ['A00', 'A05', '001', '050', '100']


def get_all_codes():
    codes = [f'A{i:02d}' for i in range(22)]  # A00-A21
    codes += [f'{i:03d}' for i in range(1, 109)]  # 001-108
    return codes


def load_font(size, serif=True):
    # 嘗試系統常見字體
    candidates = []
    if serif:
        candidates = [
            'C:/Windows/Fonts/MSYH.TTC',
            'C:/Windows/Fonts/msjh.ttc',
            'C:/Windows/Fonts/simsun.ttc',
            '/System/Library/Fonts/PingFang.ttc',
        ]
    else:
        candidates = [
            'C:/Windows/Fonts/Georgia.ttf',
            'C:/Windows/Fonts/Constantia.ttf',
            '/System/Library/Fonts/Georgia.ttf',
        ]
    for f in candidates:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                pass
    return ImageFont.load_default()


def make_pin(code: str, out_path: Path):
    card_path = ROOT / f'{code}.png'
    if not card_path.exists():
        print(f'⚠️  {code}.png 不存在，跳過')
        return False

    # 1. 建 Pin 畫布
    pin = Image.new('RGB', (PIN_W, PIN_H), BG_COLOR)
    draw = ImageDraw.Draw(pin)

    # 2. 貼牌卡圖片（等比 fit 在 CARD_AREA_H，置中）
    card = Image.open(card_path).convert('RGB')
    cw, ch = card.size
    # 目標區域 padding 80
    pad = 80
    area_w, area_h = PIN_W - pad * 2, CARD_AREA_H - pad * 2
    ratio = min(area_w / cw, area_h / ch)
    new_w, new_h = int(cw * ratio), int(ch * ratio)
    card_resized = card.resize((new_w, new_h), Image.LANCZOS)
    x = (PIN_W - new_w) // 2
    y = (CARD_AREA_H - new_h) // 2
    pin.paste(card_resized, (x, y))

    # 3. 品牌區分隔線
    divider_y = CARD_AREA_H
    draw.rectangle([0, divider_y, PIN_W, divider_y + 2], fill=ACCENT)

    # 4. 品牌區文字
    # 上行：牌卡 code（大字）
    font_code = load_font(82, serif=False)
    code_text = code
    bbox = draw.textbbox((0, 0), code_text, font=font_code)
    cw2 = bbox[2] - bbox[0]
    draw.text(((PIN_W - cw2) // 2, divider_y + 55), code_text, fill=BRAND_COLOR, font=font_code)

    # 中行：馥靈之鑰 Hour Light
    font_brand = load_font(40, serif=True)
    brand_text = '馥靈之鑰  ·  Hour Light'
    bbox = draw.textbbox((0, 0), brand_text, font=font_brand)
    cw3 = bbox[2] - bbox[0]
    draw.text(((PIN_W - cw3) // 2, divider_y + 175), brand_text, fill=INK, font=font_brand)

    # 下行：tagline + URL
    font_url = load_font(28, serif=False)
    tagline = '130 張原創智慧牌卡  ·  讀懂自己，活對人生'
    bbox = draw.textbbox((0, 0), tagline, font=font_url)
    cw4 = bbox[2] - bbox[0]
    draw.text(((PIN_W - cw4) // 2, divider_y + 245), tagline, fill=BRAND_COLOR, font=font_url)

    url_text = 'hourlightkey.com'
    bbox = draw.textbbox((0, 0), url_text, font=font_url)
    cw5 = bbox[2] - bbox[0]
    draw.text(((PIN_W - cw5) // 2, divider_y + 305), url_text, fill=ACCENT, font=font_url)

    # 5. 邊框
    draw.rectangle([30, 30, PIN_W - 30, PIN_H - 30], outline=ACCENT, width=2)

    # 6. 輸出
    pin.save(out_path, 'JPEG', quality=88, optimize=True)
    return True


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'sample'
    codes = get_all_codes() if mode == 'all' else SAMPLE_CODES

    ok = 0
    for code in codes:
        out_path = OUT_DIR / f'{code}.jpg'
        if make_pin(code, out_path):
            ok += 1
            if ok <= 5 or ok % 20 == 0:
                print(f'✓ {code}.jpg')
    print(f'\n完成：{ok} / {len(codes)} 張')
    print(f'輸出路徑：{OUT_DIR}')


if __name__ == '__main__':
    main()
