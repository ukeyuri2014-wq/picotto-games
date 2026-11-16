(() => {
  'use strict';
  let pendingPrompt = null;
  let busy = false;
  const standalone = window.matchMedia('(display-mode: standalone)');
  const status = document.getElementById('ludot-install-status');
  const dialog = document.getElementById('ludot-install-dialog');
  const dock = document.getElementById('ludot-install-dock');
  const showGuide = () => {
    if (!dialog || typeof dialog.showModal !== 'function') return false;
    try { if (!dialog.open) dialog.showModal(); return true; } catch (_) { return false; }
  };
  const say = text => { if (status) status.textContent = text; };
  const isStandalone = () => standalone.matches || navigator.standalone === true;
  function installed() {
    pendingPrompt = null;
    const card = document.getElementById('add-to-home');
    if (card) card.hidden = true;
    if (dock) dock.hidden = true;
    document.body.classList.remove('ludot-install-page');
    document.querySelectorAll('[data-ludot-install]').forEach(link => { link.hidden = true; });
    say('ルドットをアプリとして開いています。そのままゲームを楽しめます。');
  }
  if (isStandalone()) installed();
  standalone.addEventListener('change', () => { if (isStandalone()) installed(); });
  window.addEventListener('beforeinstallprompt', event => {
    if (isStandalone()) return;
    event.preventDefault();
    pendingPrompt = event;
  });
  window.addEventListener('appinstalled', () => {
    installed();
    say('ホーム画面への追加が完了しました。次はルドットのアイコンから開けます。');
  });
  document.querySelectorAll('[data-ludot-install]').forEach(link => {
    if (dialog && typeof dialog.showModal === 'function') {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', dialog.id);
    }
    link.addEventListener('click', async event => {
      // Keep instructions on this page; the ordinary link remains a no-JS fallback.
      if (!pendingPrompt || busy) {
        if (busy || showGuide()) event.preventDefault();
        return;
      }
      event.preventDefault();
      busy = true;
      const prompt = pendingPrompt;
      pendingPrompt = null;
      link.setAttribute('aria-disabled', 'true');
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') {
          say('追加を受け付けました。完了したらホーム画面のルドットを確認してください。');
        } else {
          say('追加は見送りました。いつでもこのページから追加できます。');
        }
      } catch (_) {
        if (!showGuide()) window.location.href = link.href;
      } finally {
        busy = false;
        link.removeAttribute('aria-disabled');
      }
    });
  });
  if (dialog) dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }
  });
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(navigator.userAgent);
  // Keep every guide available; only collapse the instructions for other devices.
  for (const [id, open] of [['ios', ios], ['android', android], ['desktop', !ios && !android]]) {
    const details = document.getElementById('ludot-install-' + id);
    if (details) details.open = open;
  }
})();
