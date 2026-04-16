import os, json, base64, urllib.request, time
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
  'room-star': STYLE + (
    "Q-chibi observatory chamber at night, celestial sphere armillary at center glowing soft gold, "
    "walls with 28 constellations carved in raised gold leaf, deep midnight blue dome ceiling "
    "with twinkling stars, golden orrery of planets rotating slowly. Deep cosmic atmosphere. Transparent background."
  ),
  'room-library': STYLE + (
    "Q-chibi library tower interior, ancient spiral bookshelf reaching upward, floating candles, "
    "scattered open scrolls glowing with soft golden light, wooden reading desk with crystal inkwell, "
    "stained glass window casting warm rainbow light. Scholarly warm atmosphere. Transparent background."
  ),
  'room-secret': STYLE + (
    "Q-chibi hidden divination chamber, central pedestal with glowing rune stones and tarot spread, "
    "walls etched with mystical sigils in deep gold, purple velvet drapes, swirling lavender incense smoke, "
    "dim crystal lamps. Mysterious occult atmosphere. Transparent background."
  ),
  'room-music': STYLE + (
    "Q-chibi music hall chamber, golden harp at center emitting visible soft sound waves as light ripples, "
    "walls decorated with musical notes and vinyl records in relief, small floating music boxes, "
    "warm spotlight from above, velvet floor. Resonant magical atmosphere. Transparent background."
  ),
  'room-kitchen': STYLE + (
    "Q-chibi aromatic herbal kitchen, hanging lavender and rosemary bundles from ceiling, "
    "copper distillation still glowing warm gold, small apothecary jars with colorful essences on shelves, "
    "wooden table with mortar and fresh herbs, soft sunlight streaming in. Cozy healing atmosphere. Transparent background."
  ),
  'room-alchemy': STYLE + (
    "Q-chibi alchemy laboratory, central cauldron bubbling with iridescent rainbow light, "
    "floating geometric sigils spinning in air, shelves with glass flasks containing glowing materials, "
    "golden formula scrolls scattered on wooden workbench, flickering emerald flames. "
    "Transformative magical atmosphere. Transparent background."
  ),
}

for name, prompt in PROMPTS.items():
    fpath = OUT / f'{name}.png'
    if fpath.exists() and fpath.stat().st_size > 100000:
        print(f'[SKIP] {name} (exists)')
        continue
    print(f'[GEN] {name} ...', end=' ', flush=True)
    data = json.dumps({
        'model': 'gpt-image-1',
        'prompt': prompt,
        'n': 1,
        'size': '1024x1024',
        'quality': 'low',
    }).encode()
    req = urllib.request.Request(
        'https://api.openai.com/v1/images/generations',
        data=data,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {API_KEY}'},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            result = json.loads(r.read())
        img = base64.b64decode(result['data'][0]['b64_json'])
        fpath.write_bytes(img)
        print(f'OK ({len(img)//1024}KB)')
    except Exception as e:
        print(f'ERR: {type(e).__name__}: {str(e)[:80]}')
    time.sleep(1)
print('[DONE]')
