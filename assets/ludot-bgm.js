/* LUDOT original background arrangements. Vocal recordings: existing original 087 songs. */
(() => {
  'use strict';
  if (window.LudotBGM) return;
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const id = script.dataset.currentGame;
  const groups = {
    quiet: '018 023 024 025 027 044 046 051 053 056 060 066 071 081 083 086 098 101 110 112 115',
    garden: '035 040 041 054 059 074 084 108 113 114',
    cafe: '036 037 089 100 111 117',
    journey: '004 010 014 016 021 022 038 042 045 049 058 064 075 080 088 093 107 116',
    arcade: '019 020 026 050 063 065 068 073 076 078 079 090 091 095 099 105 109'
  };
  const defaults = Object.fromEntries(Object.entries(groups).flatMap(([track, ids]) => ids.split(' ').map(n => [n, track])));
  Object.assign(defaults, { '019': 'song2', '020': 'song3', '063': 'song1', '078': 'song2', '099': 'song1', '113': 'song1' });
  if (!defaults[id]) return; // Keep existing music and listening/rhythm games independent.
  const arrangements = {
    quiet: { name:'月あかりのパズル', bpm:76, type:'sine', chords:[48,53,57,55], melody:[72,76,79,76,74,77,81,77,76,79,84,79,74,79,83,79], rhythm:[0,2,3] },
    garden: { name:'こもれびさんぽ', bpm:88, type:'sine', chords:[48,55,57,53], melody:[72,76,79,81,79,76,74,71,72,76,81,79,77,76,74,72], rhythm:[0,1.5,3] },
    cafe: { name:'小さなカフェ', bpm:96, type:'triangle', chords:[48,57,50,55], melody:[76,79,83,79,81,84,79,76,77,81,84,81,79,77,74,71], rhythm:[0,1.5,2.5] },
    journey: { name:'ほしの旅じたく', bpm:104, type:'triangle', chords:[45,53,48,55], melody:[69,72,76,79,77,76,72,69,72,76,79,84,83,79,74,71], rhythm:[0,1,2,3] },
    arcade: { name:'きらきらステップ', bpm:120, type:'triangle', chords:[48,55,57,53], melody:[72,79,76,79,74,79,83,79,81,84,81,76,77,81,79,77], rhythm:[0,.75,1.5,2.5,3] }
  };
  const vocals = {song1:'ほしぞらさんぽ', song2:'ネオンドライブ', song3:'はやてロケット'};
  const key = 'ludot-bgm-v1';
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) {}
  let selected = [...Object.keys(arrangements), ...Object.keys(vocals)].includes(preferences['track'+id]) ? preferences['track'+id] : defaults[id];
  let enabled = preferences.enabled !== false;
  let volume = Number.isFinite(preferences.volume) ? Math.min(.5, Math.max(0, preferences.volume)) : .18;
  let activated = false, live = false, context = null, master = null, media = null, timer = null;
  let next = 0, bar = 0, generation = 0, hiddenPause = false, disposed = false;
  const voices = new Set();
  function save() {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}') || {};
      Object.assign(data, {enabled, volume, ['track'+id]:selected});
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_) {} // Music works when browser storage is unavailable.
  }
  function gameMuted() { return !!document.querySelector('#mute-btn')?.textContent.includes('🔇'); }
  const overlays = '#overlay, #ov, #titleOv, #pauseOv, #overOv, #titleov, #app .intro';
  function blocked() {
    return [...document.querySelectorAll(overlays)].some(el=>!el.hidden && getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden');
  }
  const panel = document.createElement('details');
  panel.id = 'ludot-bgm';
  panel.innerHTML = '<summary>♫ BGM <span></span></summary><div class="lbgm-options"><label>きょく <select aria-label="BGMの曲"></select></label><button type="button" aria-pressed="false">BGMを止める</button><label>音量 <input aria-label="BGMの音量" type="range" min="0" max="50" step="1"></label><small role="status" aria-live="polite">あそびはじめると、小さな音で流れます。</small></div>';
  const style = document.createElement('style');
  style.textContent = '#ludot-bgm{box-sizing:border-box;flex:none;width:min(480px,calc(100% - 24px));max-width:100%;margin:2px auto 10px;padding:0;color:#eeeafa;font:13px/1.6 system-ui,sans-serif;text-align:left}#ludot-bgm summary{cursor:pointer;min-height:36px;display:flex;align-items:center;gap:8px;color:#c8c3de;list-style:none}#ludot-bgm summary::-webkit-details-marker{display:none}#ludot-bgm summary:after{content:"⌄";margin-left:auto}#ludot-bgm[open] summary:after{content:"⌃"}#ludot-bgm summary span{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#ludot-bgm .lbgm-options{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px;background:#1c2137;border:1px solid #55566d;border-radius:12px}#ludot-bgm label{display:flex;align-items:center;gap:8px;min-width:0;white-space:nowrap}#ludot-bgm select{font:inherit;color:#fff;background:#272c45;border:1px solid #77758e;border-radius:7px;width:100%;min-width:0;max-width:100%;padding:6px;min-height:40px}#ludot-bgm button{font:inherit;color:#fff;background:#34334c;border:1px solid #77758e;border-radius:7px;min-height:40px;padding:6px 10px;white-space:nowrap;box-shadow:none}#ludot-bgm input{width:100%;min-width:0;min-height:32px;accent-color:#cab4ff;padding:0}#ludot-bgm label:last-of-type,#ludot-bgm small{grid-column:1/-1}#ludot-bgm small{font-size:11px;color:#c8c3de}#ludot-bgm :focus-visible{outline:3px solid #ffd166;outline-offset:3px}';
  document.head.append(style);
  const anchor = document.querySelector('.backbar') || document.querySelector('body > header');
  if (anchor) anchor.after(panel); else document.body.prepend(panel);
  const select = panel.querySelector('select'), toggle = panel.querySelector('button'), slider = panel.querySelector('input'), status = panel.querySelector('small');
  for (const [value, item] of Object.entries(arrangements)) select.add(new Option('歌詞なし・'+item.name, value));
  for (const [value, name] of Object.entries(vocals)) select.add(new Option('うた・'+name, value));
  select.value = selected; slider.value = String(Math.round(volume * 100));
  function render() {
    panel.querySelector('summary span').textContent = enabled ? (vocals[selected] ? 'うた・' : '') + (vocals[selected] || arrangements[selected].name) : 'OFF';
    toggle.textContent = enabled ? 'BGMを止める' : 'BGMを流す';
    toggle.setAttribute('aria-pressed', String(enabled));
    panel.dataset.playing = String(live);
  }
  function note(midi, when, duration, amplitude, type='sine') {
    if (!context || !master) return;
    const o=context.createOscillator(), g=context.createGain();
    o.type=type; o.frequency.value=440 * Math.pow(2,(midi-69)/12);
    g.gain.setValueAtTime(0,when); g.gain.linearRampToValueAtTime(amplitude,when+.025);
    g.gain.exponentialRampToValueAtTime(.0001,when+duration);
    o.connect(g); g.connect(master); voices.add(o);
    o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};
    o.start(when); o.stop(when+duration+.04);
  }
  function schedule() {
    if (!live || !context || context.state !== 'running') return;
    const a=arrangements[selected]; if (!a) return;
    const beat=60/a.bpm;
    while (next < context.currentTime+.16) {
      const rootNote=a.chords[bar%4], major=![45,50,57].includes(rootNote);
      note(rootNote, next, beat*3.7, .11, 'sine');
      [0,major?4:3,7].forEach((offset,i)=>note(rootNote+12+offset,next+.015*i,beat*3.3,.045));
      a.rhythm.forEach((at,i)=> {
        const idx=(bar*4+i)%a.melody.length;
        note(a.melody[idx]+(Math.floor(bar/8)%2? -12:0),next+at*beat,beat*.65,.13,a.type);
      });
      next+=beat*4; bar=(bar+1)%16;
    }
  }
  function stop() {
    generation++; live=false;
    if (timer !== null) { clearInterval(timer);timer=null; }
    for (const voice of voices) { try {voice.stop();} catch (_) {} }
    voices.clear();
    if (media) media.pause();
    status.textContent = !enabled ? 'BGMはOFFです。' : volume===0 ? '音量は0です。' : 'ひとやすみ中。ゲームにもどると再開します。';
    if (context && context.state === 'running') context.suspend().catch(()=>{});
    render();
  }
  async function start() {
    if (disposed || !activated || !enabled || volume===0 || document.hidden || hiddenPause || gameMuted() || blocked() || live) return;
    const attempt=++generation;
    live=true;render();
    try {
      if (vocals[selected]) {
        if (!media) {
          media=new Audio();media.preload='none';media.loop=true;
          media.addEventListener('error',()=>{
            if(!vocals[selected]) return;
            stop();selected=defaults[id] in arrangements?defaults[id]:'garden';select.value=selected;
            status.textContent='うたを読み込めなかったので、歌詞なしに切りかえました。';render();
            start();
          });
        }
        const url=new URL('games/087-beat-jump/'+selected+'.mp3',root).href;
        if (media.src!==url) media.src=url;
        media.volume=volume;await media.play();
        if(attempt!==generation) return;
      } else {
        const AudioCtx=window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) throw new Error('Audio unavailable');
        if (!context) {
          context=new AudioCtx();master=context.createGain();
          const limiter=context.createDynamicsCompressor();
          limiter.threshold.value=-18;limiter.ratio.value=4;
          master.connect(limiter);limiter.connect(context.destination);
        }
        await context.resume();if(attempt!==generation) return;
        master.gain.setValueAtTime(volume,context.currentTime);
        next=context.currentTime+.035;bar=0;schedule();timer=setInterval(schedule,80);
      }
      status.textContent='ゲームの音といっしょに、小さめの音量で再生中。';
    } catch (_) {
      if(attempt!==generation) return;
      stop();status.textContent='BGMを流すには、もう一度ゲームかBGMボタンを押してください。';
    }
  }
  function reconcile() {
    if(disposed) return;
    if(document.hidden || hiddenPause || gameMuted() || blocked() || !enabled || volume===0) { if(live)stop(); }
    else start();
  }
  toggle.addEventListener('click',()=>{enabled=!enabled;activated=true;save();if(!enabled)stop();else reconcile();render();});
  select.addEventListener('change',()=>{stop();selected=select.value;activated=true;save();render();reconcile();});
  slider.addEventListener('input',()=>{
    volume=Number(slider.value)/100;activated=true;save();
    if(media)media.volume=volume;
    if(master && context) master.gain.setTargetAtTime(volume,context.currentTime,.03);
    reconcile();
  });
  // Capture only gameplay gestures. Never consume keys, clicks, touches or default actions.
  function gesture(e) {
    if(disposed || panel.contains(e.target) || e.target.closest?.('a, #mute-btn, [data-favorite-id], [data-rating-game]')) return;
    if(e.type==='keydown' && (e.repeat || !['Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key) || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))) return;
    activated=true;
    // Unlock in the gesture itself for mobile browsers; overlay reconciliation follows game handlers.
    if(!blocked()) start();
    setTimeout(reconcile,0);
  }
  document.addEventListener('click',gesture);
  document.addEventListener('pointerdown',gesture,true);
  document.addEventListener('keydown',gesture);
  // Controls must not trigger gameplay shortcuts on the surrounding page.
  ['click','pointerdown','keydown'].forEach(name=>panel.addEventListener(name,e=>e.stopPropagation()));
  const observer=new MutationObserver(reconcile);
  for (const element of [...document.querySelectorAll(overlays),document.querySelector('#mute-btn')]) {
    if(element) observer.observe(element,{attributes:true,attributeFilter:['class','style','hidden'],childList:true,subtree:true,characterData:true});
  }
  document.addEventListener('visibilitychange',()=>{hiddenPause=document.hidden;reconcile();});
  window.addEventListener('pagehide',()=>{hiddenPause=true;stop();});
  window.addEventListener('pageshow',()=>{hiddenPause=false;reconcile();});
  render();
  window.LudotBGM={version:'20261023',state:()=>({id,selected,enabled,volume,activated,playing:live,voices:voices.size,context:context?.state||null,mediaTime:media?.currentTime||0,mediaPaused:media?.paused??true}),dispose:()=>{disposed=true;observer.disconnect();stop();if(context)context.close().catch(()=>{});}};
})();
