#!/usr/bin/env python3
"""
Generate 48 castle room images using OpenAI DALL-E 3 API.
12 rooms x 4 levels = 48 images.
Style: Warm watercolor, Studio Ghibli inspired, cozy corner perspective.
"""

import requests
import time
import os
import sys
from io import BytesIO

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("WARNING: Pillow not installed. Will save as PNG instead of WebP.")

API_KEY = os.environ.get("OPENAI_API_KEY", "")
OUTPUT_DIR = "D:/OneDrive/桌面/HourLight.github.io/images/castle-web"
API_URL = "https://api.openai.com/v1/images/generations"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Base prompt template
BASE_STYLE = (
    "Warm watercolor illustration, cozy corner perspective (3/4 view), "
    "cream palette, soft brushstrokes, gentle atmosphere, "
    "no people, no text, no words, no letters, "
    "studio ghibli inspired warmth, wide 16:9 aspect ratio composition"
)

ROOMS = [
    {
        "num": "01", "code": "courage",
        "name": "Mirror Hall", "colors": "amber gold and soft white",
        "levels": [
            f"a stone-walled corner with a dusty oval antique mirror hanging on the wall, mirror surface foggy and unclear, a single beam of dim light from a window edge illuminating the mirror frame, old wooden floorboards, empty and quiet, {BASE_STYLE}, amber gold and soft white tones, dim mysterious lighting",
            f"a stone-walled corner with the same oval mirror now polished showing blurry reflections, a small warm oil lamp (diya) with yellow flame beside the mirror, an aromatherapy cushion in the corner, slightly brighter warm light, {BASE_STYLE}, amber gold and soft white tones, gentle warm lighting",
            f"a stone-walled corner with the same oval mirror now clear reflecting window light, wall sconces added, a small rug on the floor, the oil lamp glowing brighter, an open journal beside the aromatherapy cushion, warm cozy atmosphere, {BASE_STYLE}, amber gold and soft white tones, warm inviting lighting",
            f"a stone-walled corner with the same oval mirror now emanating soft golden light, the entire corner bathed in warm glow, ornate wall decorations, full carpet, the oil lamp transformed into an elegant lamp stand, beautiful light radiating from the mirror (not a reflection of a person but pure light), {BASE_STYLE}, amber gold and soft white tones, full warm golden glow",
        ]
    },
    {
        "num": "02", "code": "wealth",
        "name": "Treasure Vault", "colors": "deep gold and wine red",
        "levels": [
            f"a dim stone chamber corner with an old wooden chest half-open and empty inside, a rusty key hanging on the wall, only a sliver of light through a crack, {BASE_STYLE}, deep gold and wine red tones, very dim lighting with a crack of light",
            f"a dim stone chamber corner with the same wooden chest now containing glowing crystal fragments, the wall key polished and shiny, a small lamp stand beside it, slightly brighter light, {BASE_STYLE}, deep gold and wine red tones, slightly brighter warm light",
            f"a stone chamber corner with the same wooden chest now filled with more glowing gems casting soft light, small paintings on the wall, a low stool with cushion in the corner, warm lighting, {BASE_STYLE}, deep gold and wine red tones, warm comfortable lighting",
            f"a stone chamber corner bathed in golden light, the wooden chest transformed into an ornate treasure chest with gems overflowing, wall paintings replaced by an elaborate tapestry, a soft blanket on the floor, {BASE_STYLE}, deep gold and wine red tones, full warm golden glow",
        ]
    },
    {
        "num": "03", "code": "wisdom",
        "name": "Unlock Chamber", "colors": "indigo and silver white",
        "levels": [
            f"end of a corridor with a heavy wooden door, a large rusty lock on it, faint blue light seeping from under the door, cold stone walls, {BASE_STYLE}, indigo and silver white tones, dim with mysterious blue glow from door crack",
            f"end of a corridor with the same heavy door, lock loosening, brighter blue-white light from the wider crack, a lantern hung beside the door, scratch marks on the wall from previous attempts, {BASE_STYLE}, indigo and silver white tones, growing blue-white light",
            f"end of a corridor with the same door now half-open, blue-white light pouring out, vines growing on the door frame showing life returning, a small table with several keys beside the door, {BASE_STYLE}, indigo and silver white tones, bright blue-white light from door",
            f"end of a corridor with the same door fully open, brilliant light flooding from behind it, the entire corridor illuminated, flowers blooming all over the door frame, beautiful light beyond but the space behind is unclear, {BASE_STYLE}, indigo and silver white tones, brilliant warm light flooding through",
        ]
    },
    {
        "num": "04", "code": "foundation",
        "name": "Bedrock Hall", "colors": "earth brown and deep green",
        "levels": [
            f"a thick stone-walled room corner with a flat large stone on the floor like a meditation seat, a small potted plant by the window, steady non-glaring light, {BASE_STYLE}, earth brown and deep green tones, steady gentle natural light",
            f"the same thick stone-walled room corner with the flat stone now having a meditation cushion on top, the potted plant slightly bigger, a small bookshelf in the corner, {BASE_STYLE}, earth brown and deep green tones, steady warm natural light",
            f"the same thick stone-walled room corner with the potted plant grown into a small tree, books on the bookshelf, a woven rug on the floor, grounded peaceful feeling, {BASE_STYLE}, earth brown and deep green tones, warm comfortable natural light",
            f"the same stone-walled room corner with the small tree branches extending to the ceiling, the entire space feels like a cave within tree roots, safe and secure, wrapped by earth, {BASE_STYLE}, earth brown and deep green tones, warm enveloping glow",
        ]
    },
    {
        "num": "05", "code": "creation",
        "name": "Memory Garden", "colors": "light pink and light green",
        "levels": [
            f"a barren garden corner with bare soil, a tiny tree sapling just planted, an old shovel and an empty flower pot beside it, warm sunlight, {BASE_STYLE}, light pink and light green tones, gentle sunlight on bare earth",
            f"the same garden corner with the sapling slightly taller, a few small flowers blooming nearby, a small wooden bench added, {BASE_STYLE}, light pink and light green tones, warm dappled sunlight",
            f"the same garden corner with the tree now having branches and leaves, various flowers in bloom, a moonlight fountain in the corner, butterflies flying around, {BASE_STYLE}, light pink and light green tones, warm bright garden light",
            f"the same garden corner in full bloom, the tree now large with a swing hanging from it, the moonlight fountain glowing under soft light, every flower represents a memory, lush and beautiful, {BASE_STYLE}, light pink and light green tones, full warm golden garden light",
        ]
    },
    {
        "num": "06", "code": "discipline",
        "name": "Watchtower", "colors": "sky blue and gold",
        "levels": [
            f"a circular tower-top observation room with large dusty windows, an old telescope in the corner, old maps on the table, {BASE_STYLE}, sky blue and gold tones, dim dusty light through dirty windows",
            f"the same circular tower-top room with windows now cleaned showing sky, a star compass hung on the wall, the telescope polished, {BASE_STYLE}, sky blue and gold tones, clear sky blue light through clean windows",
            f"the same circular tower-top room with a wisdom desk covered in star charts and fate maps, a lamp by the window, stars visible through the window, {BASE_STYLE}, sky blue and gold tones, warm twilight with stars",
            f"the same circular tower-top room transformed into an observatory, the telescope pointing at a starry sky, walls covered in star charts, a large open yearbook on the desk, starlight pouring through windows, {BASE_STYLE}, sky blue and gold tones, full starlight and warm glow",
        ]
    },
    {
        "num": "07", "code": "heart",
        "name": "Love Sanctuary", "colors": "rose pink and warm white",
        "levels": [
            f"a soft room corner with a budding rose on the windowsill, sheer curtain letting in gentle light, light wooden floor, very quiet like waiting for someone, {BASE_STYLE}, rose pink and warm white tones, soft gentle filtered light",
            f"the same soft room corner with the rose half-bloomed, a small flower vase added to the windowsill, an aromatherapy cushion in the corner, warmer light, {BASE_STYLE}, rose pink and warm white tones, warmer filtered rosy light",
            f"the same soft room corner with the rose fully bloomed with more small flowers growing beside it, a rocking chair added, curtain gently swaying in breeze, {BASE_STYLE}, rose pink and warm white tones, warm rosy afternoon light",
            f"the same soft room corner overflowing with flowers everywhere, a soft blanket on the rocking chair, the light is rose gold colored, air seems to carry flower fragrance, {BASE_STYLE}, rose pink and warm white tones, full warm rose gold glow",
        ]
    },
    {
        "num": "08", "code": "rebirth",
        "name": "Metamorphosis Chamber", "colors": "iridescent rainbow and gold",
        "levels": [
            f"a small enclosed room corner with a large translucent silken cocoon hanging in the corner, faint light moving inside the cocoon, old walls, {BASE_STYLE}, iridescent and gold tones, dim with mysterious glow from cocoon",
            f"the same small room corner with the cocoon now showing cracks, brighter light inside, colorful iridescent patterns starting to appear on the walls, {BASE_STYLE}, iridescent and gold tones, growing iridescent light",
            f"the same small room corner with the cocoon half-broken, butterfly wings visible emerging, entire wall covered in rainbow iridescent patterns, flower petals on the floor, {BASE_STYLE}, iridescent and gold tones, bright colorful iridescent light",
            f"the same room corner with a butterfly emerged and flying, the entire room filled with wing-like rainbow light, walls seeming to dissolve revealing open sky beyond, {BASE_STYLE}, iridescent and gold tones, brilliant rainbow and golden light everywhere",
        ]
    },
    {
        "num": "09", "code": "journey",
        "name": "Dream Corridor", "colors": "moonlight blue and mist purple",
        "levels": [
            f"a long misty corridor, fog everywhere, a door barely visible at the far end, blurry shadows on the walls, only moonlight illuminating, {BASE_STYLE}, moonlight blue and mist purple tones, dim moonlit atmosphere with fog",
            f"the same long corridor with fog slightly clearing, patterns visible on the far door, small twinkling lights appearing on corridor walls like stars, {BASE_STYLE}, moonlight blue and mist purple tones, slightly brighter with twinkling wall lights",
            f"the same long corridor transformed into a starry tunnel, fog becoming clouds, the door now clearer and beautiful, {BASE_STYLE}, moonlight blue and mist purple tones, bright starry tunnel glow",
            f"the same corridor with the far door now open revealing a starlit garden beyond, crystal wind chimes hanging on both sides of the corridor, dream fragments glittering, {BASE_STYLE}, moonlight blue and mist purple tones, full magical moonlight and starlight",
        ]
    },
    {
        "num": "10", "code": "ambition",
        "name": "Departure Tower", "colors": "purple red and gold",
        "levels": [
            f"a circular tower-top room with a simple wooden chair in the center, large open windows showing distant landscape, wind blowing in, the chair is empty, {BASE_STYLE}, purple red and gold tones, dim natural light from windows",
            f"the same circular tower-top room with a cushion on the chair, a lamp on the windowsill, the distant landscape clearer, {BASE_STYLE}, purple red and gold tones, slightly warmer light",
            f"the same circular tower-top room with a more comfortable chair, a small table with teacup beside it, curtains gently flowing in the wind, sunrise in the distance, {BASE_STYLE}, purple red and gold tones, warm sunrise light",
            f"the same circular tower-top room with the chair transformed into a warm throne (comfortable not ostentatious), the entire tower filled with golden morning light, magnificent landscape in the distance, {BASE_STYLE}, purple red and gold tones, full warm golden morning glow",
        ]
    },
    {
        "num": "11", "code": "vision",
        "name": "Intuition Loft", "colors": "deep purple and starlight silver",
        "levels": [
            f"a dark circular attic room with a low table in the center holding a dim crystal ball, a skylight above letting moonlight in, very quiet and still, {BASE_STYLE}, deep purple and starlight silver tones, dim moonlight from skylight",
            f"the same dark circular attic with the crystal ball now faintly glowing, an oracle divination stand beside it, brighter moonlight from the skylight, {BASE_STYLE}, deep purple and starlight silver tones, faint purple crystal glow with moonlight",
            f"the same circular attic with the crystal ball light projecting constellation patterns on the walls, tarot cards on the table, wind chimes by the window, {BASE_STYLE}, deep purple and starlight silver tones, warm purple glow with constellation projections",
            f"the same circular attic transformed into a room like a starry sky, the crystal ball radiating soft purple light illuminating every corner, the milky way visible through the skylight, {BASE_STYLE}, deep purple and starlight silver tones, full magical purple starlight glow",
        ]
    },
    {
        "num": "12", "code": "balance",
        "name": "Harmony Garden", "colors": "jade green and cream white",
        "levels": [
            f"a semi-open courtyard corner with a shallow stone basin on the ground containing still water, a single fallen leaf floating on the water surface, moss growing around it, {BASE_STYLE}, jade green and cream white tones, gentle diffused natural light",
            f"the same semi-open courtyard corner with the water surface reflecting the sky, small flowers growing beside the stone basin, a stone bench added, {BASE_STYLE}, jade green and cream white tones, slightly brighter natural light",
            f"the same courtyard corner with lotus flowers blooming in the water, cushion on the stone bench, bamboo and ferns growing around it, resembling a small japanese garden, {BASE_STYLE}, jade green and cream white tones, warm peaceful garden light",
            f"the same courtyard corner now a complete miniature harmony garden, a small fountain with gently flowing water, lush thriving plants, a stone lantern glowing softly, {BASE_STYLE}, jade green and cream white tones, full warm serene golden glow",
        ]
    },
]


def generate_image(prompt, filename):
    """Generate one image via DALL-E 3 API and save as WebP."""
    filepath = os.path.join(OUTPUT_DIR, filename)

    # Check if file already exists and is > 50KB (likely a real image)
    # We regenerate ALL images since existing ones don't match the spec

    print(f"\n{'='*60}")
    print(f"Generating: {filename}")
    print(f"Prompt: {prompt[:120]}...")

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1792x1024",
        "quality": "standard",
        "response_format": "url"
    }

    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=120)

        if resp.status_code == 429:
            # Rate limited - wait and retry
            retry_after = int(resp.headers.get("Retry-After", 60))
            print(f"  Rate limited. Waiting {retry_after}s...")
            time.sleep(retry_after)
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=120)

        if resp.status_code != 200:
            print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
            return False

        data = resp.json()
        image_url = data["data"][0]["url"]
        revised_prompt = data["data"][0].get("revised_prompt", "")
        print(f"  Revised prompt: {revised_prompt[:100]}...")

        # Download image
        img_resp = requests.get(image_url, timeout=60)
        if img_resp.status_code != 200:
            print(f"  ERROR downloading image: {img_resp.status_code}")
            return False

        # Convert to WebP and resize to 1024x576
        if HAS_PIL:
            img = Image.open(BytesIO(img_resp.content))
            img = img.resize((1024, 576), Image.LANCZOS)
            img.save(filepath, "WEBP", quality=85)
            print(f"  Saved as WebP: {filepath} ({os.path.getsize(filepath)} bytes)")
        else:
            # Save as PNG if Pillow not available
            png_path = filepath.replace(".webp", ".png")
            with open(png_path, "wb") as f:
                f.write(img_resp.content)
            print(f"  Saved as PNG: {png_path} ({os.path.getsize(png_path)} bytes)")

        return True

    except Exception as e:
        print(f"  EXCEPTION: {e}")
        return False


def main():
    # Allow starting from a specific room via command line
    start_room = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    start_level = int(sys.argv[2]) if len(sys.argv) > 2 else 1

    total = 0
    success = 0
    failed = []
    skipped = 0

    for room in ROOMS:
        room_num = int(room["num"])
        if room_num < start_room:
            skipped += 4
            continue

        for lv_idx, prompt in enumerate(room["levels"], 1):
            if room_num == start_room and lv_idx < start_level:
                skipped += 1
                continue

            filename = f"room-{room['num']}-{room['code']}-lv{lv_idx}.webp"
            total += 1

            ok = generate_image(prompt, filename)
            if ok:
                success += 1
            else:
                failed.append(filename)

            # Delay between requests to avoid rate limiting
            # DALL-E 3 typically allows ~5 images/minute for pay-as-you-go
            if total < 48 - skipped:
                print("  Waiting 15s before next request...")
                time.sleep(15)

    print(f"\n{'='*60}")
    print(f"DONE! Generated {success}/{total} images.")
    if skipped:
        print(f"Skipped: {skipped}")
    if failed:
        print(f"Failed ({len(failed)}):")
        for f in failed:
            print(f"  - {f}")
    else:
        print("All images generated successfully!")


if __name__ == "__main__":
    main()
