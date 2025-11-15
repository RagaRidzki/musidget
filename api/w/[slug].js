// api/w/[slug].js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m]))
}

function renderWidgetPage(widget) {
  const { title, cover_url, tracks = [] } = widget || {}
  const first = tracks[0] || {}
  const manifestJson = JSON.stringify({ title, cover_url, tracks }).replace(/</g, '\\u003c')

  const css = `
.mw-wrap{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;align-items:center;gap:.75rem;padding:.75rem;border-radius:.75rem;box-shadow:0 2px 8px rgba(15,23,42,.12);background:#0f172a;color:#e5e7eb;max-width:420px;margin:0 auto;}
.mw-cover{width:56px;height:56px;border-radius:.5rem;object-fit:cover;flex-shrink:0;background:#1e293b;}
.mw-meta{display:flex;flex-direction:column;min-width:0;}
.mw-title{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.95rem;}
.mw-artist{opacity:.7;font-size:.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mw-ctrls{margin-left:auto;display:flex;align-items:center;gap:.4rem;}
.mw-btn{cursor:pointer;border:0;border-radius:999px;padding:.3rem .7rem;font-size:.75rem;background:#e5e7eb;color:#0f172a;font-weight:500;white-space:nowrap;}
.mw-btn:hover{background:#f9fafb;}
.mw-progress{appearance:none;width:120px;height:4px;border-radius:999px;background:#1f2937;overflow:hidden;}
.mw-progress::-webkit-slider-thumb{appearance:none;width:10px;height:10px;border-radius:999px;background:#e5e7eb;box-shadow:-200px 0 0 200px #3b82f6;}
.mw-progress::-moz-range-thumb{width:10px;height:10px;border-radius:999px;background:#e5e7eb;border:0;box-shadow:-200px 0 0 200px #3b82f6;}
.mw-time{font-size:.7rem;opacity:.7;min-width:40px;text-align:right;}
@media (max-width:480px){
  .mw-wrap{max-width:100%;padding:.6rem;}
  .mw-cover{width:48px;height:48px;}
  .mw-progress{width:90px;}
  .mw-title{font-size:.9rem;}
}`

  const js = `
(function(){
  const data = ${manifestJson};
  const root = document.getElementById('mw-root');
  if(!root || !data || !data.tracks || !data.tracks.length){
    if(root){ root.innerHTML = '<div style="font-family:system-ui,sans-serif;font-size:.85rem;opacity:.7">No tracks configured for this widget.</div>'; }
    return;
  }

  const $ = (sel, el=root) => el.querySelector(sel);
  const audio = new Audio();
  audio.preload = 'metadata';

  let idx = 0;
  let playing = false;
  let seeking = false;

  const titleEl = $('.mw-title');
  const artistEl = $('.mw-artist');
  const coverEl = $('.mw-cover');
  const playBtn = $('.mw-play');
  const prevBtn = $('.mw-prev');
  const nextBtn = $('.mw-next');
  const progressEl = $('.mw-progress');
  const timeEl = $('.mw-time');

  function formatTime(sec){
    if(!isFinite(sec) || sec < 0) return '0:00';
    sec = Math.floor(sec);
    const m = Math.floor(sec/60);
    const s = sec%60;
    return m + ':' + String(s).padStart(2,'0');
  }

  function load(i){
    idx = i;
    const t = data.tracks[idx];
    audio.src = t.url;
    audio.load();
    if(titleEl) titleEl.textContent = t.title || data.title || 'Track';
    if(artistEl) artistEl.textContent = t.artist || '';
    if(coverEl && data.cover_url) coverEl.src = data.cover_url;
    if(timeEl) timeEl.textContent = '0:00';
    if(progressEl) progressEl.value = 0;
  }

  function updatePlayButton(){
    if(!playBtn) return;
    playBtn.textContent = playing ? 'Pause' : 'Play';
  }

  function play(){
    audio.play().then(function(){
      playing = true;
      updatePlayButton();
    }).catch(function(){});
  }

  function pause(){
    audio.pause();
    playing = false;
    updatePlayButton();
  }

  function toggle(){
    playing ? pause() : play();
  }

  function next(){
    load((idx+1) % data.tracks.length);
    play();
  }

  function prev(){
    load((idx-1+data.tracks.length) % data.tracks.length);
    play();
  }

  audio.addEventListener('ended', next);

  audio.addEventListener('timeupdate', function(){
    if(!progressEl || seeking) return;
    const dur = audio.duration || 0;
    const cur = audio.currentTime || 0;
    if(dur > 0){
      const p = (cur/dur)*100;
      if(isFinite(p)) progressEl.value = p;
    }
    if(timeEl) timeEl.textContent = formatTime(cur);
  });

  if(progressEl){
    progressEl.addEventListener('input', function(e){
      const dur = audio.duration || 0;
      if(dur <= 0) return;
      seeking = true;
      const val = Number(e.target.value) || 0;
      const pos = (val/100)*dur;
      audio.currentTime = pos;
      if(timeEl) timeEl.textContent = formatTime(pos);
      seeking = false;
    });
  }

  if(playBtn) playBtn.addEventListener('click', toggle);
  if(prevBtn) prevBtn.addEventListener('click', prev);
  if(nextBtn) nextBtn.addEventListener('click', next);

  // init
  load(0);
  updatePlayButton();
})();`

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title || 'Music Widget')}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${css}</style>
  </head>
  <body style="margin:0;padding:8px;background:transparent;">
    <div class="mw-wrap" id="mw-root">
      <img class="mw-cover" src="${escapeHtml(cover_url || '')}" alt="cover" onerror="this.style.visibility='hidden'" />
      <div class="mw-meta">
        <div class="mw-title">${escapeHtml(first.title || title || 'Track')}</div>
        <div class="mw-artist">${escapeHtml(first.artist || '')}</div>
      </div>
      <div class="mw-ctrls">
        <button class="mw-btn mw-prev" type="button">Prev</button>
        <button class="mw-btn mw-play" type="button">Play</button>
        <button class="mw-btn mw-next" type="button">Next</button>
        <input class="mw-progress" type="range" min="0" max="100" value="0" />
        <div class="mw-time">0:00</div>
      </div>
    </div>
    <script>${js}</script>
  </body>
</html>`;
}

export default async function handler(req, res) {
  const { slug } = req.query

  if (!slug) {
    res.status(400).send('Missing slug')
    return
  }

  const { data, error } = await supabase
    .from('widgets')
    .select('slug,title,cover_url,tracks')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    res.status(404).send('Widget not found')
    return
  }

  const html = renderWidgetPage(data)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400')
  // jangan blok iframe, pakai CSP frame-ancestors saja
  res.setHeader('X-Frame-Options', '')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; img-src * data:; media-src *; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src *; frame-ancestors https://canva.com https://*.canva.com https://*.canva.site 'self'; base-uri 'none'; form-action 'none';"
  )

  res.status(200).send(html)
}
