import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const base = 'https://ukeyuri2014-wq.github.io/picotto-games/';
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'games.js'), 'utf8') + '\nthis.games = GAMES;', context);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = v => JSON.stringify(v).replace(/</g, '\\u003c');
const games = context.games;
let home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cards = games.map(g => `<a class="card" data-game-id="${esc(g.id)}" href="${esc(g.path)}"><div class="art"><div class="fallback">${esc(g.emoji)}</div></div><div class="card-body"><div class="chips"><span class="chip">${esc(g.genre || 'GAME')}</span></div><h3>${esc(g.title)}</h3><p class="desc">${esc(g.description)}</p><div class="card-foot"><span class="play">あそぶ →</span><span class="free">FREE</span></div></div></a>`).join('\n');
home = home.replace(/<!-- STATIC-GAMES-START -->[\s\S]*?<!-- STATIC-GAMES-END -->/, `<!-- STATIC-GAMES-START -->\n${cards}\n<!-- STATIC-GAMES-END -->`);
fs.writeFileSync(path.join(root, 'index.html'), home);
for (const g of games) {
  if (!/^games\/[\w-]+\/index\.html$/.test(g.path)) throw Error('Unexpected game path');
  const file = path.join(root, g.path);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(g.title)}｜無料ブラウザゲーム｜ルドット</title>`);
  html = html.replace(/<!-- LUDOT-SEO-START -->[\s\S]*?<!-- LUDOT-SEO-END -->\n?/g, '');
  html = html.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '').replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  const data = {'@context':'https://schema.org','@type':'VideoGame',name:g.title,description:g.description,url:base + g.path,inLanguage:'ja',genre:g.genre,isAccessibleForFree:true,gamePlatform:'Web browser'};
  html = html.replace(/<\/head>/i, `<!-- LUDOT-SEO-START -->\n<meta name="description" content="${esc(g.description)} 無料・ダウンロード不要。ルドットで遊べます。">\n<link rel="canonical" href="${base + g.path}">\n<script type="application/ld+json">${json(data)}</script>\n<script defer src="../../assets/ludot-library.js" data-current-game="${esc(g.id)}"></script>\n<!-- LUDOT-SEO-END -->\n</head>`);
  fs.writeFileSync(file, html);
}
const urls = ['', 'about.html', 'privacy.html', 'submit.html', 'blog/', ...fs.readdirSync(path.join(root, 'blog')).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => 'blog/' + f), ...games.map(g => g.path)];
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(p => `  <url><loc>${base + p}</loc></url>`).join('\n') + '\n</urlset>\n');
console.log(`Generated static links and metadata for ${games.length} games; sitemap ${urls.length} URLs.`);
