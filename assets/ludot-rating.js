// LUDOT 星評価（5段階・星のみ）
// ゲーム画面: 上部の「一覧へ」リンクの横に「☆評価」ボタン → タップで星を選ぶ
// トップ: カードに平均★と件数、さっき遊んだゲームの評価バナー
(() => {
  'use strict';
  const API = 'https://picotto-secure-submissions.edamame2025.chatgpt.site/api/public/ratings';
  const VOTER = 'ludot-voter-v1';
  const MINE = 'ludot-my-ratings-v1';
  const CACHE = 'ludot-ratings-cache-v1';
  const DISMISS = 'ludot-rating-dismissed-v1';
  const LIBRARY = 'ludot-library-v1';
  const ID = /^(\d{3}|U[A-Z0-9]{4,16})$/;
  const script = document.currentScript;
  const gameId = script && script.dataset.currentGame;
  const LABELS = ['', 'いまいち', 'まあまあ', 'ふつうに楽しい', 'とても楽しい', 'さいこう！'];

  const store = {
    get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : fallback; } catch (_) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } },
  };
  function voterId() {
    let id = null;
    try { id = localStorage.getItem(VOTER); } catch (_) {}
    if (id && /^[A-Za-z0-9_-]{22,64}$/.test(id)) return id;
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    id = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try { localStorage.setItem(VOTER, id); } catch (_) {}
    return id;
  }
  const myVote = id => { const v = Number(store.get(MINE, {})[id]); return v >= 1 && v <= 5 ? v : 0; };

  let summaries = {};
  // 評価の受付サービスに つながった時だけ true。つながらない間は評価ボタンを出さない
  // （押しても「送れませんでした」になるだけの飾りを見せないため）
  let apiOk = false;
  async function loadSummaries() {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE) || 'null');
      if (c && Date.now() - c.at < 60000 && c.ratings) { summaries = c.ratings; apiOk = true; return summaries; }
    } catch (_) {}
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(API, { mode: 'cors', credentials: 'omit', signal: ctrl.signal });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ratings && typeof data.ratings === 'object') {
          summaries = data.ratings; apiOk = true;
          try { sessionStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), ratings: summaries })); } catch (_) {}
        }
      }
    } catch (_) { /* 評価が読めなくてもゲームはそのまま遊べる */ }
    finally { clearTimeout(t); }
    return summaries;
  }
  async function sendVote(id, stars) {
    const res = await fetch(API, {
      method: 'POST', mode: 'cors', credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: id, stars, voter: voterId() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '送れませんでした');
    const mine = store.get(MINE, {}); mine[id] = stars; store.set(MINE, mine);
    if (data.summary) {
      summaries[id] = data.summary;
      // 全件を読み込み済みのキャッシュがあるときだけ、その1件を差し替える
      try {
        const c = JSON.parse(sessionStorage.getItem(CACHE) || 'null');
        if (c && c.ratings) { c.ratings[id] = data.summary; sessionStorage.setItem(CACHE, JSON.stringify(c)); }
      } catch (_) {}
    }
    decorate();
    return data.summary;
  }

  function injectStyle() {
    if (document.getElementById('ludot-rating-style')) return;
    const s = document.createElement('style'); s.id = 'ludot-rating-style';
    s.textContent = `
.lr-wrap{display:inline-flex;align-items:center;gap:8px;flex-wrap:nowrap}
.lr-inline{display:inline-flex!important;align-items:center;gap:3px;min-height:28px;padding:2px 10px!important;border-radius:999px!important;font:700 12px/1 system-ui,-apple-system,"Hiragino Sans",sans-serif!important;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent}
.lr-wrap .lr-inline,.lr-float{border:1px solid #ffc93c88;background:#ffc93c1a;color:inherit}.lr-inline .lr-star{color:#ffc93c;font-size:14px}
.lr-wrap .lr-inline:hover{background:#ffc93c33}
.lr-float{position:fixed;z-index:2147483000;left:max(10px,env(safe-area-inset-left));bottom:max(10px,env(safe-area-inset-bottom));background:#221f38e6!important;color:#fff!important}
.lr-dialog{border:0;border-radius:22px;padding:24px 22px 18px;width:min(360px,calc(100% - 32px));background:#fff;color:#221f38;text-align:center;font-family:system-ui,-apple-system,"Hiragino Sans",sans-serif;box-shadow:0 20px 60px #0006}
.lr-dialog::backdrop{background:#120f25aa}
.lr-dialog h2{margin:0 0 4px;font-size:18px;line-height:1.5}.lr-dialog p{margin:0;font-size:13px;color:#6b6883;line-height:1.6}
.lr-stars{display:flex;justify-content:center;gap:4px;margin:16px 0 6px}
.lr-stars button{appearance:none;border:0;background:none;padding:2px;font-size:40px;line-height:1;color:#d9d6e6;cursor:pointer;min-width:48px;min-height:48px;transition:transform .12s,color .12s;-webkit-tap-highlight-color:transparent}
.lr-stars button.on{color:#ffb800}.lr-stars button:hover{transform:scale(1.12)}.lr-stars button:focus-visible{outline:3px solid #7547d8;outline-offset:2px;border-radius:8px}
.lr-stars.lr-small button{font-size:26px;min-width:40px;min-height:40px}
.lr-label{min-height:22px;font-size:14px;font-weight:700;color:#b57a00}
.lr-status{min-height:20px;font-size:12px;color:#6b6883;margin-top:4px}
.lr-close{margin-top:12px;border:1px solid #dcd8ea;background:#f6f5fb;color:#4b4866;border-radius:999px;padding:9px 20px;font:700 13px system-ui,sans-serif;cursor:pointer;min-height:40px}
.lr-badge{display:inline-flex;align-items:center;gap:3px;font-size:.78rem;font-weight:800;color:#a36a00;white-space:nowrap}.lr-badge small{font-weight:600;color:#8a8aa0;font-size:.7rem}
.lr-banner{width:calc(100% - 48px);max-width:1072px;margin:18px auto 0;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 18px;border-radius:18px;background:linear-gradient(135deg,#fff8e6,#fff);border:1px solid #f3dfae;color:#3b3322;box-shadow:0 6px 20px #a36a0010}
.lr-banner .lr-q{flex:1;min-width:200px;font-weight:800;font-size:.95rem;line-height:1.6}.lr-banner .lr-q small{display:block;font-weight:600;font-size:.75rem;color:#8a7a55}
.lr-banner .lr-act{display:flex;align-items:flex-start;gap:6px}.lr-banner .lr-stars{margin:0}.lr-banner .lr-label,.lr-banner .lr-status{text-align:center;font-size:12px}.lr-banner .lr-x{border:0;background:none;color:#8a7a55;font-size:.78rem;cursor:pointer;min-height:40px;padding:0 6px}
.topbar .lr-wrap{gap:6px;flex:none}.topbar .lr-inline{padding:6px 9px!important}.topbar .lr-inline .lr-txt{display:none}.topbar>a{flex:none}.topbar h1{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:580px){.lr-banner{width:calc(100% - 32px);padding:12px 14px}}
@media(prefers-reduced-motion:reduce){.lr-stars button{transition:none}}`;
    document.head.append(s);
  }

  function starPicker(id, onDone, small) {
    const wrap = document.createElement('div');
    const row = document.createElement('div'); row.className = 'lr-stars' + (small ? ' lr-small' : '');
    row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', '星で評価');
    const label = document.createElement('div'); label.className = 'lr-label'; label.setAttribute('aria-hidden', 'true');
    const status = document.createElement('div'); status.className = 'lr-status'; status.setAttribute('role', 'status');
    let current = myVote(id); let busy = false;
    const paint = n => { [...row.children].forEach((b, i) => { b.classList.toggle('on', i < n); b.textContent = i < n ? '★' : '☆'; }); label.textContent = LABELS[n] || ''; };
    for (let n = 1; n <= 5; n++) {
      const b = document.createElement('button'); b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-label', `星${n}つ（${LABELS[n]}）`);
      b.setAttribute('aria-checked', String(n === current));
      b.addEventListener('mouseenter', () => paint(n)); b.addEventListener('focus', () => { if (b.matches(':focus-visible')) paint(n); });
      b.addEventListener('click', async () => {
        if (busy) return; busy = true; paint(n); status.textContent = '送信中…';
        try {
          await sendVote(id, n); current = n;
          [...row.children].forEach((x, i) => x.setAttribute('aria-checked', String(i + 1 === n)));
          status.textContent = 'ありがとう！評価を受けつけました。';
          if (onDone) onDone(n);
        } catch (e) { paint(current); status.textContent = (e && e.message) || '送れませんでした。時間をおいてもう一度どうぞ。'; }
        finally { busy = false; }
      });
      row.append(b);
    }
    row.addEventListener('mouseleave', () => paint(current));
    paint(current);
    wrap.append(row, label, status);
    return wrap;
  }

  // ---------- ゲーム画面 ----------
  // 画面上部の「一覧へ」リンクの横に小さな評価ボタンを置く（ゲーム操作とは重ならない）
  function gameWidget(id) {
    injectStyle();
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'lr-inline';
    const setBtn = () => { const v = myVote(id); btn.innerHTML = `<span class="lr-star" aria-hidden="true">${v ? '★' : '☆'}</span><span class="lr-txt">${v ? v : '評価'}</span>`; btn.setAttribute('aria-label', v ? `このゲームの評価：星${v}つ（変更する）` : 'このゲームを星で評価する'); };
    setBtn();
    const dialog = document.createElement('dialog'); dialog.className = 'lr-dialog';
    dialog.setAttribute('aria-labelledby', 'lr-title');
    const title = document.createElement('h2'); title.id = 'lr-title'; title.textContent = 'このゲーム、どうだった？';
    const note = document.createElement('p'); note.textContent = '星をタップするだけ。名前やコメントは送られません。';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'lr-close'; close.textContent = 'ゲームにもどる'; close.autofocus = true;
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    // 評価の操作がゲーム側のタップ・キー操作として拾われないようにする
    ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'keydown', 'keyup'].forEach(t => {
      dialog.addEventListener(t, e => e.stopPropagation());
      btn.addEventListener(t, e => e.stopPropagation());
    });
    dialog.addEventListener('close', () => btn.blur());
    dialog.append(title, note, starPicker(id, () => { setBtn(); setTimeout(() => dialog.open && dialog.close(), 1100); }), close);
    btn.addEventListener('click', () => { if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', ''); });
    document.body.append(dialog);
    const back = [...document.querySelectorAll('a[href$="index.html"]')].find(a => !a.classList.contains('brand') && /一覧|いちらん/.test(a.textContent) && a.getBoundingClientRect().top < 160);
    const bar = back && back.closest('.topbar');
    if (bar) {
      // 3列の上部バー（一覧へ｜タイトル｜音）では、右側の音ボタンの隣に☆だけを置く
      const right = bar.lastElementChild;
      const wrap = document.createElement('span'); wrap.className = 'lr-wrap lr-right';
      if (right && right !== back && right.tagName !== 'H1') { right.replaceWith(wrap); wrap.append(btn, right); }
      else { bar.append(wrap); wrap.append(btn); }
    } else if (back) {
      const wrap = document.createElement('span'); wrap.className = 'lr-wrap';
      back.replaceWith(wrap); wrap.append(back, btn);
    } else {
      btn.classList.add('lr-float'); document.body.append(btn);
    }
  }

  // ---------- トップ ----------
  function decorate() {
    if (gameId) return;
    injectStyle();
    document.querySelectorAll('a.card[data-game-id]').forEach(card => {
      const id = card.dataset.gameId; const s = summaries[id];
      let badge = card.querySelector('.lr-badge');
      if (!s || !s.count) { if (badge) badge.remove(); return; }
      if (!badge) {
        badge = document.createElement('span'); badge.className = 'lr-badge';
        const foot = card.querySelector('.card-foot .play') || card.querySelector('.card-body h3');
        if (!foot) return;
        foot.after(badge);
      }
      badge.innerHTML = `★ ${s.avg.toFixed(1)} <small>(${s.count})</small>`;
      badge.setAttribute('aria-label', `平均 星${s.avg.toFixed(1)}、${s.count}件の評価`);
    });
    banner();
  }
  function banner() {
    const anchor = document.getElementById('my-games');
    if (!apiOk || !anchor || document.querySelector('.lr-banner')) return;
    const recent = (store.get(LIBRARY, {}).recent || [])[0];
    if (!recent || !ID.test(recent.id) || typeof recent.title !== 'string' || myVote(recent.id)) return;
    // 一覧に載っている（公開中の）ゲームだけを聞く
    if (!document.querySelector(`a.card[data-game-id="${recent.id}"]`)) return;
    const dismissed = store.get(DISMISS, {});
    if (dismissed[recent.id]) return;
    const box = document.createElement('section'); box.className = 'lr-banner'; box.setAttribute('aria-label', 'さっき遊んだゲームの評価');
    const q = document.createElement('div'); q.className = 'lr-q';
    q.textContent = `「${recent.title.slice(0, 40)}」はどうだった？`;
    const sm = document.createElement('small'); sm.textContent = '星をタップするだけで評価できます（コメント不要）'; q.append(sm);
    const x = document.createElement('button'); x.type = 'button'; x.className = 'lr-x'; x.textContent = 'あとで';
    x.addEventListener('click', () => { const d = store.get(DISMISS, {}); d[recent.id] = Date.now(); store.set(DISMISS, d); box.remove(); });
    const act = document.createElement('div'); act.className = 'lr-act';
    act.append(starPicker(recent.id, () => setTimeout(() => box.remove(), 1600), true), x);
    box.append(q, act);
    anchor.before(box);
  }

  if (gameId && ID.test(gameId)) {
    const start = () => loadSummaries().then(() => { if (apiOk) gameWidget(gameId); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  } else {
    loadSummaries().then(decorate);
  }
  window.LudotRating = { decorate, loadSummaries };
})();
