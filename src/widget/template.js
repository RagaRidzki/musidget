import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync(path.resolve('src/widget/styles.css'), 'utf8');

export function renderWidgetHTML(manifest) {
    // manifest: { title, cover_url, tracks:[{url,title,artist,duration?}] }
    // NB: autoplay full sound dibatasi browser; default: ready + big play
    const safe = (s = '') => (s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

    // Pre-render first track meta
    const first = manifest.tracks?.[0] || {};
    const inlineManifest = JSON.stringify(manifest);

    const js = `
(function(){
  const $ = (sel,el=document)=>el.querySelector(sel);
  const root = document.getElementById('mw-root');
  const data = ${inlineManifest};

  const audio = new Audio();
  let idx = 0; let playing = false;
  audio.preload = 'metadata';

  function load(i){
    idx = i; const t = data.tracks[idx];
    audio.src = t.url; audio.load();
    $('.mw-title',root).textContent = t.title || data.title || 'Track';
    $('.mw-artist',root).textContent = t.artist || '';
    if(data.cover_url) $('.mw-cover',root).src = data.cover_url;
  }

  function play(){ audio.play().then(()=>{ playing=true; updateBtn(); }).catch(()=>{}); }
  function pause(){ audio.pause(); playing=false; updateBtn(); }
  function toggle(){ playing?pause():play(); }
  function next(){ load((idx+1)%data.tracks.length); play(); }
  function prev(){ load((idx-1+data.tracks.length)%data.tracks.length); play(); }

  function updateBtn(){
    $('.mw-play',root).textContent = playing ? 'Pause' : 'Play';
  }

  audio.addEventListener('ended', next);
  audio.addEventListener('timeupdate', ()=>{
    const p = audio.currentTime / (audio.duration||1);
    $('.mw-progress',root).value = isFinite(p)? p*100 : 0;
  });
  $('.mw-progress',root).addEventListener('input', (e)=>{
    if(audio.duration) audio.currentTime = (e.target.value/100)*audio.duration;
  });

  $('.mw-play',root).addEventListener('click', toggle);
  $('.mw-prev',root).addEventListener('click', prev);
  $('.mw-next',root).addEventListener('click', next);

  // init
  if(data.tracks && data.tracks.length){ load(0); }
  updateBtn();
})();
`;

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safe(manifest.title || 'Music Widget')}</title>
  <style>${css}</style>
</head>
<body>
  <div class="mw-wrap" id="mw-root">
    <img class="mw-cover" src="${safe(manifest.cover_url || '')}" alt="cover" onerror="this.style.display='none'"/>
    <div class="mw-meta">
      <div class="mw-title">${safe(first.title || manifest.title || 'Track')}</div>
      <div class="mw-artist">${safe(first.artist || '')}</div>
    </div>
    <div class="mw-ctrls">
      <button class="mw-btn mw-prev" aria-label="Prev">Prev</button>
      <button class="mw-btn mw-play" aria-label="Play">Play</button>
      <button class="mw-btn mw-next" aria-label="Next">Next</button>
      <input class="mw-progress" type="range" min="0" max="100" value="0" />
    </div>
  </div>
  <script>${js}</script>
</body>
</html>`;
}
