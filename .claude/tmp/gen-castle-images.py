import os, json, base64, urllib.request, urllib.error, time
from pathlib import Path

API_KEY = os.environ.get('OPENAI_API_KEY')
if not API_KEY:
    raise SystemExit('OPENAI_API_KEY not set')

OUT = Path('images/castle')
OUT.mkdir(parents=True, exist_ok=True)

STYLE = (
  "Isometric 3/4 top-down view, Animal Crossing style round cute Q-chibi fused with "
  "Studio Ghibli watercolor hand-drawn texture. Brand palette: deep purple (#2a1f4c), "
  "warm gold (#e9c27d), ivory (#faf9f7), soft lavender wash. Both adorable AND mystical. "
  "Fusion of Eastern philosophy and Western magic aesthetic. "
  "Cinematic lighting with dramatic chiaroscuro and golden rim light, "
  "embossed ornamental details catching light, velvety fabric textures, "
  "crystalline accents with subsurface scattering glow, particles of stardust, "
  "8k highly detailed, rule of thirds composition, luxe minimalist elegance. "
)

PROMPTS = {
  'castle-map': {
    'size': '1536x1024', 'quality': 'medium',
    'prompt': STYLE + (
      "Birds eye view of a magical floating castle garden island in the clouds. "
      "12 round Q-chibi buildings arrange around a central star-roof main tower, "
      "each building has unique roof color and divinatory symbols (tarot cards, moon phases, "
      "zodiac signs, crystals, bagua trigrams) in raised gold leaf. "
      "Surrounded by floating soft clouds with velvety textures, lavender fields with crystalline dewdrops, "
      "glowing mushrooms with inner radiance, cherry blossom trees, winding golden stone path. "
      "Warm magical dusk lighting. NO people, NO text."
    )
  },
  'room-treasure': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Small Q-chibi treasure chamber with piles of glowing gold coins, ancient open chest "
      "revealing soft lavender light within, crystal clusters catching golden rim light on walls, "
      "embossed star-map tapestry in raised gold leaf. Warm honey-gold palette. Transparent background."
    )
  },
  'room-key': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Mysterious Q-chibi unlock chamber with a giant floating golden key at center, "
      "7 lock-shaped reliefs carved deep into walls, cracks of golden light breaking through dark deep-purple walls. "
      "Dramatic chiaroscuro. Subsurface scattering glow. Transparent background."
    )
  },
  'room-throne': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Q-chibi tower top chamber with a golden throne facing a huge round window revealing "
      "a cloud sea at sunrise with dramatic rays of warm light. Crimson carpet with embossed "
      "mandala patterns, two flanking torches with flickering flame-shaped crystals. "
      "Warm golden hour light. Transparent background."
    )
  },
  'room-love': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Romantic Q-chibi rose chamber, pink-purple palette, central crystal rose sculpture "
      "with inner glow, heart-shaped ivy vines creeping up walls in velvety texture, "
      "floor scattered with softly glowing rose petals, warm candlelight. Transparent background."
    )
  },
  'room-intuition': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Q-chibi oracle attic, round central table with floating crystal ball glowing from within "
      "and spread of tarot cards with embossed gold edges, moon phases mural on walls, "
      "starlight filtering through skylight, drifting soft lavender mist. Transparent background."
    )
  },
  'room-ground': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Solid Q-chibi stone hall with a central large boulder glowing warm gold from within, "
      "walls displaying five-elements mandala (metal wood water fire earth) in deep relief, "
      "blue-green stone floor with crystalline veins. Grounded warm luxury. Transparent background."
    )
  },
  'room-harmony': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Verdant Q-chibi garden-style small cabin, indoor pond with lotus blooms, "
      "hanging banyan roots, lavender pots in small clay vessels, wooden table "
      "with glowing essential oil bottles, soft sun rays filtering through leaf gaps. Transparent background."
    )
  },
  'room-transform': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Mysterious Q-chibi transformation room, 3 luminous butterflies emerging from crystalline cocoon at center, "
      "walls with flowing light patterns shifting, floor reflecting rainbow prismatic light. "
      "Ethereal changing atmosphere. Transparent background."
    )
  },
  'room-dream': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Dreamy Q-chibi corridor, deep purple palette, ceiling is a full starry night sky, "
      "floor like a reflective water surface mirroring the moon, semi-transparent silk curtains "
      "floating along both sides with embossed crescent moon patterns. Transparent background."
    )
  },
  'room-garden': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Ancient Q-chibi cherry blossom garden, one giant fully-bloomed cherry tree at center, "
      "stone bench and old lantern beneath it, falling petals, small stone bridge crossing "
      "a distant stream. Nostalgic warm atmosphere. Transparent background."
    )
  },
  'room-tower': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Q-chibi observatory tower rooftop, brass telescope pointing at starry sky, "
      "star charts scattered on desk, walls with 12 zodiac relief carvings, "
      "deep blue vs gold contrast palette. Overlooking distant view. Transparent background."
    )
  },
  'pet-light': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Q-chibi small glowing spirit creature, round fluffy body palm-sized, translucent "
      "with inner golden radiance, tiny dandelion-seed wings floating, smiling face with big round eyes. "
      "Soft lavender aura, golden sparkle particles around. Transparent background, full body centered."
    )
  },
  'pet-zodiac-cat': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Q-chibi cute zodiac spirit cat, white fur with gold pattern markings, crescent moon sigil on forehead, "
      "gold-to-lavender gradient eyes, tail trailing soft lavender glow. Sitting serenely. Transparent background."
    )
  },
  'pet-cat': {
    'size': '1024x1024', 'quality': 'low',
    'prompt': STYLE + (
      "Q-chibi cute orange-white cat, round chubby body, small gold bell collar, "
      "sitting on a cushion looking up. Adorable warm fluffy texture. Transparent background."
    )
  },
}

def gen_image(name, cfg, retries=2):
    fpath = OUT / f'{name}.png'
    if fpath.exists() and fpath.stat().st_size > 100000:
        return 'SKIP (exists)'
    data = json.dumps({
        'model': 'gpt-image-1',
        'prompt': cfg['prompt'],
        'n': 1,
        'size': cfg['size'],
        'quality': cfg.get('quality', 'low'),
    }).encode()
    req = urllib.request.Request(
        'https://api.openai.com/v1/images/generations',
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}',
        },
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                result = json.loads(r.read())
            img_b64 = result['data'][0]['b64_json']
            img = base64.b64decode(img_b64)
            fpath.write_bytes(img)
            return f'OK ({len(img) // 1024}KB)'
        except Exception as e:
            if attempt == retries - 1:
                return f'ERR: {type(e).__name__}: {str(e)[:100]}'
            time.sleep(3)

total = len(PROMPTS)
print(f'[START] generating {total} images...')
done = 0
for name, cfg in PROMPTS.items():
    done += 1
    print(f'[{done}/{total}] {name} ... ', end='', flush=True)
    result = gen_image(name, cfg)
    print(result)
    time.sleep(1)
print('[DONE]')
