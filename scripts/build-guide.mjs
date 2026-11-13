import {articleMap} from './article-map.mjs';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const source='https://picotto-secure-submissions.edamame2025.chatgpt.site';
const snapshot=path.join(root,'assets/public-games-guide.json');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(remote){
 if(!Array.isArray(remote)||!remote.length)throw Error('Public catalog missing; previous guide preserved');
 const ids=new Set();
 for(const g of remote){if(!/^U[A-Z0-9]+$/.test(g.id)||ids.has(g.id)||g.path!==source+'/play/'+g.id||['title','description','controls','genre','age'].some(k=>typeof g[k]!=='string'||!g[k].trim()))throw Error('Invalid public catalog; previous guide preserved');ids.add(g.id);}
}
if(process.argv.includes('--refresh')){
 const response=JSON.parse(execFileSync('curl',['--fail','--silent','--show-error','--max-time','30',source+'/api/public/games'],{encoding:'utf8',maxBuffer:5e6}));validate(response.games);
 const checkedAt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
 fs.writeFileSync(snapshot,JSON.stringify({checkedAt,games:response.games},null,2)+'\n');
}
const remote=JSON.parse(fs.readFileSync(snapshot,'utf8'));validate(remote.games);
if(!/^\d{4}-\d{2}-\d{2}$/.test(remote.checkedAt))throw Error('Invalid checked date');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'games.js'),'utf8')+'\nthis.games=GAMES;',ctx);
const local=ctx.games;
if(local.some(g=>!/^games\/[\w-]+\/index\.html$/.test(g.path)))throw Error('Invalid local path');
if(local.some(g=>['title','description','controls','genre','age'].some(k=>typeof g[k]!=='string'||!g[k].trim())))throw Error('Missing local description');
const games=[...local,...remote.games];
if(new Set(games.map(g=>g.id)).size!==games.length)throw Error('Duplicate game id');
const cards=games.map(g=>`<article class="info-card game-manual" id="game-${esc(g.id)}" data-search="${esc([g.title,g.genre,g.description,g.controls].join(' '))}" data-genre="${esc(g.genre)}" data-age="${esc(g.age)}"><h2>${esc(g.emoji)} ${esc(g.title)}</h2><p>ジャンル：${esc(g.genre)} ／ 年齢の目安：${esc(g.age)}</p><h3>どんなゲーム？</h3><p>${esc(g.description)}</p><h3>操作方法</h3><p>${esc(g.controls)}</p><p><a href="${esc(g.path)}">このゲームを遊ぶ →</a>${articleMap[g.id]?` ／ <a href="blog/${esc(articleMap[g.id])}">攻略ノートを読む →</a>`:""}</p></article>`).join('\n');
const file=path.join(root,'game-guide.html');let h=fs.readFileSync(file,'utf8');
if(h.split('<!-- MANUALS-START -->').length!==2||h.split('<!-- MANUALS-END -->').length!==2||h.indexOf('<!-- MANUALS-END -->')<h.indexOf('<!-- MANUALS-START -->'))throw Error('Guide boundary missing');
h=h.replace(/<!-- MANUALS-START -->[\s\S]*?<!-- MANUALS-END -->/,'<!-- MANUALS-START -->\n'+cards+'\n<!-- MANUALS-END -->');
h=h.replace(/掲載(?:中)?\d+作品/g,`掲載${games.length}作品`).replace(/(<p id="manual-count"[^>]*>).*?(<\/p>)/,`$1${games.length}作品$2`);
h=h.replace(/(<p[^>]*id="guide-updated"[^>]*>).*?(<\/p>)/,`$1掲載情報確認：${remote.checkedAt}$2`);
h=h.replace(/<p id="guide-coverage">[\s\S]*?<\/p>/,`<p id="guide-coverage">本体サイトの${local.length}作品と、${remote.checkedAt}に公開確認した投稿${remote.games.length}作品の紹介・操作を掲載しています。新しい作品や更新は<a href="index.html#games">ゲーム一覧</a>でもご確認ください。</p>`);
fs.writeFileSync(file,h);console.log(`Guide: ${local.length} local + ${remote.games.length} submissions = ${games.length}; snapshot ${remote.checkedAt}`);
