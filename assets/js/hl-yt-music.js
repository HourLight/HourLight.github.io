/**
 * hl-yt-music.js · 馥靈 YouTube 音樂嵌入共用元件
 * ──────────────────────────────────────────────
 * 資料源：assets/data/judyanee-youtube-music.json
 *
 * 用法（在任何頁面）：
 *   <div id="mt-music"></div>
 *   <script src="assets/js/hl-yt-music.js"></script>
 *   <script>
 *     hlYTMusic.embed('#mt-music', { kind: 'mbti', key: 'INFP' });
 *     hlYTMusic.embed('#lifepath-music', { kind: 'lifepath', key: '3' });
 *     hlYTMusic.embed('#aroma-music', { kind: 'aroma', key: 'lavender' });
 *   </script>
 *
 * 如果該 key 對應的 yt_id 還沒上傳（null），顯示 coming soon 狀態。
 * 每個嵌入下方自動加「→ 看完整歌單」連結指向 judyanee 頻道（漲粉引流）。
 */
(function(){
  'use strict';

  var DATA_URL = 'assets/data/judyanee-youtube-music.json';
  var CHANNEL_URL = 'https://www.youtube.com/@judyanee';
  var _cache = null;
  var _loading = null;

  // ══════════════════════════════════════════
  // Inject CSS once
  // ══════════════════════════════════════════
  function injectStyle(){
    if(document.getElementById('hlytm-style')) return;
    var s = document.createElement('style');
    s.id = 'hlytm-style';
    s.textContent = ''
      + '.hlytm{margin:28px auto;max-width:720px;background:#fff;border:1px solid #e0d9cd;border-radius:14px;overflow:hidden;box-shadow:0 6px 22px rgba(60,42,20,.06)}'
      + '.hlytm-head{padding:18px 22px 14px;border-bottom:1px solid #f0ebe2}'
      + '.hlytm-eyebrow{font-family:Cormorant Garamond,serif;font-size:.78rem;letter-spacing:.24em;text-transform:uppercase;color:#a0917f;margin-bottom:5px}'
      + '.hlytm-title{font-family:"Noto Serif TC",serif;font-size:1.12rem;font-weight:500;color:#1a1714;letter-spacing:.04em;line-height:1.45}'
      + '.hlytm-meta{margin-top:6px;font-size:.82rem;color:#8b6f4e;letter-spacing:.02em}'
      + '.hlytm-tagline{margin-top:10px;font-size:.9rem;color:#5b5047;line-height:1.85;font-style:italic}'
      + '.hlytm-player{position:relative;padding-bottom:56.25%;height:0;background:#000}'
      + '.hlytm-player iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}'
      + '.hlytm-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;background:#faf6ee;flex-wrap:wrap}'
      + '.hlytm-credit{font-size:.82rem;color:#a0917f;letter-spacing:.04em}'
      + '.hlytm-cta{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;background:#8b6f4e;color:#fff;text-decoration:none;border-radius:8px;font-size:.82rem;letter-spacing:.06em;transition:background .2s}'
      + '.hlytm-cta:hover{background:#6f5639}'
      + '.hlytm-coming{padding:32px 22px;text-align:center;color:#8a7a6a;background:#faf6ee}'
      + '.hlytm-coming-em{display:block;font-family:Cormorant Garamond,serif;font-size:.82rem;letter-spacing:.22em;color:#a0917f;margin-bottom:8px}'
      + '.hlytm-coming-msg{font-size:.92rem;line-height:1.85}';
    document.head.appendChild(s);
  }

  // ══════════════════════════════════════════
  // Load data (cached)
  // ══════════════════════════════════════════
  function load(){
    if(_cache) return Promise.resolve(_cache);
    if(_loading) return _loading;
    _loading = fetch(DATA_URL)
      .then(function(r){ return r.json(); })
      .then(function(d){ _cache = d; return d; })
      .catch(function(){ return null; });
    return _loading;
  }

  // ══════════════════════════════════════════
  // Render one embed
  // ══════════════════════════════════════════
  function render(target, data, opts){
    injectStyle();
    var el = (typeof target === 'string') ? document.querySelector(target) : target;
    if(!el) return;
    var kind = opts.kind, key = opts.key;
    var bucket = (data && data[kind]) || {};
    var item = bucket[key];

    if(!item || !item.yt_id){
      // Coming soon
      el.innerHTML = ''
        + '<div class="hlytm">'
        +   '<div class="hlytm-coming">'
        +     '<span class="hlytm-coming-em">Coming Soon</span>'
        +     '<p class="hlytm-coming-msg">你的專屬音樂還在調音中。<br>' + escapeHtml(opts.fallbackMsg || '先到 judyanee 頻道聽其他作品，等這首上架。') + '</p>'
        +     '<div style="margin-top:14px"><a class="hlytm-cta" href="' + CHANNEL_URL + '" target="_blank" rel="noopener">→ 到 judyanee 頻道</a></div>'
        +   '</div>'
        + '</div>';
      return;
    }

    var title = item.title || '';
    var meta_parts = [];
    if(item.freq) meta_parts.push(item.freq);
    if(item.oil) meta_parts.push(item.oil);
    var meta = meta_parts.join(' × ');
    var tagline = item.tagline || '';
    var embedUrl = 'https://www.youtube.com/embed/' + item.yt_id;

    el.innerHTML = ''
      + '<div class="hlytm">'
      +   '<div class="hlytm-head">'
      +     '<div class="hlytm-eyebrow">' + (opts.eyebrow || 'Your Music') + '</div>'
      +     '<div class="hlytm-title">' + escapeHtml(title) + '</div>'
      +     (meta ? '<div class="hlytm-meta">' + escapeHtml(meta) + '</div>' : '')
      +     (tagline ? '<div class="hlytm-tagline">' + escapeHtml(tagline) + '</div>' : '')
      +   '</div>'
      +   '<div class="hlytm-player">'
      +     '<iframe src="' + embedUrl + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
      +   '</div>'
      +   '<div class="hlytm-foot">'
      +     '<div class="hlytm-credit">🎵 王逸君原創 · judyanee 頻道</div>'
      +     '<a class="hlytm-cta" href="' + CHANNEL_URL + '" target="_blank" rel="noopener">→ 看完整歌單</a>'
      +   '</div>'
      + '</div>';
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ══════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════
  window.hlYTMusic = {
    embed: function(target, opts){
      load().then(function(data){ render(target, data, opts); });
    },
    load: load
  };
})();
