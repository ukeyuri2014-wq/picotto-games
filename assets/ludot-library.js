(() => {
  'use strict';
  const KEY = 'ludot-library-v1';
  const COUNTS = 'picotto-home-plays-v1';
  const root = new URL('../', document.currentScript.src);
  const currentId = document.currentScript.dataset.currentGame;
  const remoteBase = 'https://picotto-secure-submissions.edamame2025.chatgpt.site/play/';
  let catalog = new Map();
  let persistent = true;
  const blank = () => ({favorites: [], recent: []});
  function validGame(g) {
    if (!g || typeof g.id !== 'string' || !/^(\d{3}|U[A-Z0-9]+)$/.test(g.id) || typeof g.title !== 'string' || typeof g.path !== 'string') return false;
    try {
      const u = new URL(g.path, root);
      return (u.origin === root.origin && u.pathname.startsWith(root.pathname + 'games/') && /\/index\.html$/.test(u.pathname) && !u.search && !u.hash) || u.href === remoteBase + g.id;
    } catch (_) { return false; }
  }
  function clean(list, limit) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    return list.filter(g => validGame(g) && !seen.has(g.id) && seen.add(g.id)).slice(0, limit).map(g => ({id:g.id, title:g.title.slice(0,150), path:new URL(g.path,root).href}));
  }
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      return {favorites:clean(data.favorites, 200), recent:clean(data.recent, 12)};
    } catch (_) { return blank(); }
  }
  let state = read();
  function status(text) {
    const el = document.getElementById('library-status');
    if (el) el.textContent = text;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); persistent = true; return true; }
    catch (_) { persistent = false; status('このブラウザでは保存できません。ページを閉じるとお気に入り・履歴が消える場合があります。'); return false; }
  }
  function button(g) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'favorite-button'; b.dataset.favoriteId = g.id;
    updateButton(b, g);
    return b;
  }
  function updateButton(b,g) {
    const saved = state.favorites.some(x => x.id === g.id);
    b.textContent = saved ? '★ 保存済み' : '☆ 保存';
    b.setAttribute('aria-pressed', String(saved));
    b.setAttribute('aria-label', g.title + (saved ? 'をお気に入りから外す' : 'をお気に入りに保存'));
  }
  function renderList(id, entries, empty) {
    const container = document.getElementById(id);
    if (!container) return;
    container.replaceChildren();
    if (!entries.length) { const p = document.createElement('p'); p.textContent = empty; container.append(p); return; }
    entries.forEach(old => {
      const g = catalog.get(old.id) || old;
      const row = document.createElement('div'); row.className = 'library-item';
      const a = document.createElement('a'); a.href = new URL(g.path, root).href; a.dataset.gameId = g.id; a.textContent = g.title + ' →';
      row.append(a,button(g)); container.append(row);
    });
  }
  function render() {
    renderList('favorite-games',state.favorites,'ゲームの「☆ 保存」を押すと、ここに並びます。');
    renderList('recent-games',state.recent,'遊んだゲームから、すぐに戻れます。');
    document.querySelectorAll('[data-favorite-id]').forEach(b => {
      const g = catalog.get(b.dataset.favoriteId) || [...state.favorites,...state.recent].find(x => x.id === b.dataset.favoriteId);
      if (g) updateButton(b,g);
    });
    const clear = document.getElementById('clear-recent');
    if (clear) clear.hidden = !state.recent.length;
  }
  function record(g) {
    state.recent = [g,...state.recent.filter(x => x.id !== g.id)].slice(0,12);
    save();
    try {
      let counts = JSON.parse(localStorage.getItem(COUNTS) || '{}');
      if (!counts || typeof counts !== 'object' || Array.isArray(counts)) counts = {};
      counts[g.id] = (Number(counts[g.id]) || 0) + 1;
      localStorage.setItem(COUNTS,JSON.stringify(counts));
    } catch (_) {}
  }
  function setGames(games) {
    // Renderer may supply HTML-escaped remote metadata. Decode once into text, never into markup.
    const decode = s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };
    catalog = new Map(games.filter(validGame).map(g => [g.id,{id:g.id,title:decode(g.title),path:new URL(g.path,root).href}]));
    document.querySelectorAll('#game-grid a[data-game-id]').forEach(a => {
      const g = catalog.get(a.dataset.gameId); if (!g || a.parentElement.classList.contains('game-tile')) return;
      const tile = document.createElement('div'); tile.className = 'game-tile';
      a.replaceWith(tile); tile.append(a,button(g));
    });
    const featured = document.querySelector('#featured .f-actions');
    if (featured) {
      const a = featured.querySelector('[data-game-id]'); const g = a && catalog.get(a.dataset.gameId);
      if (g && !featured.querySelector('[data-favorite-id]')) featured.append(button(g));
    }
    render();
  }
  function bookmarkHelp() {
    let dialog = document.getElementById('bookmark-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'bookmark-dialog'; dialog.className = 'bookmark-dialog';
      dialog.setAttribute('aria-labelledby','bookmark-title');
      dialog.innerHTML = '<h2 id="bookmark-title">次も、すぐにルドットへ。</h2><p>サイトの保存はブラウザのメニューからできます。</p><h3>iPhone・iPad（Safari）</h3><p>共有メニューから「ホーム画面に追加」→「追加」。機種や表示設定によっては「…」から共有を開きます。</p><h3>Android（Chrome）</h3><p>右上の「⋮」から「ホーム画面に追加」または「アプリをインストール」を選びます。表示されない場合はブックマークをご利用ください。</p><h3>パソコン</h3><p>Macは ⌘＋D、Windowsは Ctrl＋D でブックマークに追加できます。</p><p>ゲームごとの「☆ 保存」は、このサイト内のお気に入りです。</p><form method="dialog"><button type="submit">閉じる</button></form>';
      document.body.append(dialog);
    }
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
  }
  document.addEventListener('click', e => {
    if (!(e.target instanceof Element)) return;
    const fav = e.target.closest('[data-favorite-id]');
    if (fav) {
      const id = fav.dataset.favoriteId;
      const g = catalog.get(id) || [...state.favorites,...state.recent].find(x => x.id === id); if (!g) return;
      if (persistent) state = read();
      const exists = state.favorites.some(x => x.id === id);
      if (!exists && state.favorites.length >= 200) { status('お気に入りは200件まで保存できます。'); return; }
      state.favorites = exists ? state.favorites.filter(x => x.id !== id) : [g,...state.favorites];
      const saved = save(); render();
      // Restore keyboard focus if a list row was rebuilt or removed.
      const replacement = [...document.querySelectorAll('[data-favorite-id]')].find(b => b.dataset.favoriteId === id);
      if (replacement) replacement.focus({preventScroll:true});
      if (saved) status(exists ? 'お気に入りから外しました。' : 'お気に入りに保存しました。次回は「お気に入り」から遊べます。');
      return;
    }
    if (e.target.closest('[data-bookmark-help]')) { bookmarkHelp(); return; }
    if (e.target.closest('#clear-recent')) { state.recent = []; save(); render(); status('最近遊んだゲームの履歴を消しました。'); return; }
    const link = e.target.closest('a[data-game-id]');
    if (link) {
      const id = link.dataset.gameId;
      const g = catalog.get(id) || [...state.favorites,...state.recent].find(x => x.id === id);
      if (g) { if (persistent) state = read(); record(g); }
    }
  });
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) { state = read(); render(); } });
  window.addEventListener('pageshow', () => { if (persistent) state = read(); render(); });
  if (currentId) {
    const g = {id:currentId,title:document.title.split('｜')[0],path:location.href.split(/[?#]/)[0]};
    if (validGame(g)) {
      // Direct search/bookmark visits are included, while a home click is already recorded.
      if (state.recent[0]?.id !== currentId) record(g);
    }
  }
  window.LudotLibrary = {setGames};
})();
