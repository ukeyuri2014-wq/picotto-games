(() => {
 'use strict';
 const search=document.getElementById('manual-search'),genre=document.getElementById('manual-genre'),age=document.getElementById('manual-age'),reset=document.getElementById('manual-reset'),count=document.getElementById('manual-count');
 const cards=[...document.querySelectorAll('.game-manual')];
 const norm=s=>s.normalize('NFKC').toLowerCase();
 for(const value of [...new Set(cards.map(c=>c.dataset.genre))].sort()){const option=document.createElement('option');option.value=value;option.textContent=value;genre.append(option);}
 function apply(){
 const words=norm(search.value.trim()).split(/\s+/).filter(Boolean);let n=0;
 for(const card of cards){const label=card.dataset.age;const years=label==='全年齢'?0:(/^\d+歳/.test(label)?Number(label.match(/^\d+/)[0]):Infinity);card.hidden=!(words.every(w=>norm(card.dataset.search).includes(w))&&(!genre.value||card.dataset.genre===genre.value)&&(!age.value||years<=Number(age.value)));if(!card.hidden)n++;}
 count.textContent=n+'作品'+(n?'':'。条件をクリアするか、別の言葉で探してみてください。');
 }
 search.addEventListener('input',apply);genre.addEventListener('change',apply);age.addEventListener('change',apply);
 reset.addEventListener('click',()=>{search.value='';genre.value='';age.value='';apply();search.focus();});
 function reveal(){if(!location.hash.startsWith('#game-'))return;const target=document.getElementById(location.hash.slice(1));if(target){search.value='';genre.value='';age.value='';apply();target.scrollIntoView();}}
 window.addEventListener('hashchange',reveal);apply();reveal();
})();
