(() => {
 'use strict';
 const search=document.getElementById('manual-search'),genre=document.getElementById('manual-genre'),age=document.getElementById('manual-age'),reset=document.getElementById('manual-reset'),count=document.getElementById('manual-count');
 if(!search||!genre||!age||!reset||!count)return;
 const cards=[...document.querySelectorAll('.game-manual')];
 const norm=s=>String(s??'').normalize('NFKC').toLowerCase();
 // The catalog is static for this page. Normalize once, not once per search word
 // on every keystroke, and only write visibility when it actually changes.
 const entries=cards.map(card=>{const label=card.dataset.age;return{card,text:norm(card.dataset.search),genre:card.dataset.genre,years:label==='全年齢'?0:(/^\d+歳/.test(label)?Number(label.match(/^\d+/)[0]):Infinity)};});
 for(const value of [...new Set(cards.map(c=>c.dataset.genre))].sort()){const option=document.createElement('option');option.value=value;option.textContent=value;genre.append(option);}
 function apply(){
 const words=norm(search.value.trim()).split(/\s+/).filter(Boolean);let n=0;
 for(const {card,text,genre:category,years} of entries){const hidden=!(words.every(w=>text.includes(w))&&(!genre.value||category===genre.value)&&(!age.value||years<=Number(age.value)));if(card.hidden!==hidden)card.hidden=hidden;if(!hidden)n++;}
 count.textContent=n+'作品'+(n?'':'。条件をクリアするか、別の言葉で探してみてください。');
 }
 let composing=false;
 search.addEventListener('compositionstart',()=>{composing=true;});
 search.addEventListener('compositionend',()=>{composing=false;apply();});
 search.addEventListener('input',e=>{if(!composing&&!e.isComposing)apply();});genre.addEventListener('change',apply);age.addEventListener('change',apply);
 reset.addEventListener('click',()=>{search.value='';genre.value='';age.value='';apply();search.focus();});
 function reveal(){if(!location.hash.startsWith('#game-'))return;const target=document.getElementById(location.hash.slice(1));if(target){search.value='';genre.value='';age.value='';apply();target.scrollIntoView();}}
 window.addEventListener('hashchange',reveal);apply();reveal();
})();
