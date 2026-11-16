(() => {
  'use strict';
  // Editorial collections: reviewed content, independent of minimum play age.
  const ADULT_IDS = ["112", "110", "098", "071", "060", "066", "062", "056", "051", "049", "046", "044", "034", "027", "025", "024", "023", "022", "018", "017", "013", "008", "006", "U79B0AD8", "U4945961", "UE838818", "U5930C27", "UC0C07B4", "UB3D519F", "U9AE3930", "UB0CA1A9", "U381503F", "U843040C", "U7E80EB4", "UE9D0689", "U7B2A34C", "U2BFD8E1", "U2EF28CD", "UFA3EB38", "U29B5A65", "UD97A47E", "U51EB0AD"];
  const KIDS_IDS = ["114", "111", "100", "095", "092", "085", "077", "074", "072", "070", "055", "052", "035", "UB3A569F", "UF4B89D9", "U361F2A2", "U97E92FE", "UA53D419", "UA15084E", "U6CD7227", "U5C9B790", "UBDE79CD", "U148343B", "U52E79D2", "U206124A", "U5854B6C", "U6086AF6", "UB732BAB", "U77A0720", "UCFB9B7C", "U943DE94", "UC202074", "UAC5C586", "U4E3BE26", "U77B199F", "U845A5DA", "U09D704F", "UBEE727A", "U24FCC73"];
  const ADULT_PRIORITY = ["U2BFD8E1", "U7B2A34C", "013", "U29B5A65", "U51EB0AD", "U7E80EB4", "UE9D0689", "017", "027", "025"];
  const REVIEWED_IDS = ["117", "116", "115", "114", "113", "112", "111", "110", "109", "108", "107", "105", "102", "101", "100", "099", "098", "097", "095", "094", "093", "092", "091", "090", "089", "088", "068", "087", "086", "085", "084", "083", "082", "081", "080", "079", "078", "077", "076", "075", "074", "073", "072", "071", "070", "069", "060", "059", "067", "066", "065", "064", "063", "062", "061", "058", "057", "056", "055", "054", "053", "052", "051", "050", "049", "048", "046", "045", "044", "042", "041", "040", "038", "037", "036", "035", "034", "032", "031", "030", "029", "028", "027", "026", "025", "024", "023", "022", "021", "020", "019", "018", "017", "016", "015", "014", "013", "011", "010", "009", "008", "007", "006", "005", "003", "002", "001", "U8D556E4", "U14BFA62", "U03A7637", "U79B0AD8", "U11161DE", "UF874A1B", "U15E8989", "UE16A7FE", "U4945961", "UE838818", "U66A26B2", "U5930C27", "UC0C07B4", "U46EC732", "UB3A569F", "U3777EEB", "UA8E06D9", "UF4B89D9", "UB3D519F", "U361F2A2", "U97E92FE", "UA7D361E", "U9AE3930", "UA53D419", "UF118E02", "UA15084E", "UB0CA1A9", "U381503F", "U843040C", "U7E80EB4", "U8FA5DEC", "UBC6437D", "U6CD7227", "U5C9B790", "UBDE79CD", "UE9D0689", "U148343B", "U52E79D2", "U206124A", "U5854B6C", "U7B2A34C", "U2BFD8E1", "U6086AF6", "UB732BAB", "U77A0720", "UCFB9B7C", "U943DE94", "UC202074", "UAC5C586", "U4E3BE26", "U77B199F", "U845A5DA", "U2EF28CD", "U09D704F", "U423E5BD", "UBEE727A", "U24FCC73", "UFA3EB38", "U29B5A65", "U416C768", "UD97A47E", "U51EB0AD", "U5135AEB", "U0C519F5"];
  const adult = new Set(ADULT_IDS), kids = new Set(KIDS_IDS), reviewed = new Set(REVIEWED_IDS);
  const categories = [['all','すべて'],['action','アクション'],['shooter','シューティング'],['puzzle','パズル'],['board','カード・ボード'],['brain','言葉・クイズ'],['sim','冒険・育成'],['creative','創作・音楽'],['versus','対戦'],['kids','知育'],['other','その他']];
  const categoryLabels = Object.fromEntries(categories);
  const categoryIds = new Set(categories.map(entry=>entry[0]));
  const alias = {
    U2BFD8E1:['アーセナル','アースナル','Arsenal'],
    U7B2A34C:['ヘレティック・オブ・ダークネス','ヘリテック・オブ・ダークネス','Heretic of Darkness','Lite'],
    U2EF28CD:['ヘレティック・オブ・ダークネス','ヘリテック・オブ・ダークネス','Heretic of Darkness'],
    U77A0720:['お買い物ぴったり','買い物','お金'],
    '013':['バカラ','Baccarat'], '027':['リバーシ','オセロ'], '025':['マインスイーパー'],
    '071':['数独','ナンプレ'], UE838818:['数独','ナンプレ'], '045':['お絵かきロジック','ノノグラム'],
    UE9D0689:['お絵かきロジック','ノノグラム'], '046':['倉庫番'], '008':['落ち物パズル'],
    U51EB0AD:['デッキデュエル','デッキ構築'], U0C519F5:['地球防衛','アースディフェンス'],
    '034':['脱出ゲーム'], '098':['フリーセル'], '044':['ソリティア']
  };
  const reading = {U2BFD8E1:'アーセナル', U7B2A34C:'ヘレティック・オブ・ダークネス／Lite版', U2EF28CD:'ヘレティック・オブ・ダークネス／通常版'};
  function normalize(value) {
    return String(value || '').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/[\s・･._〜~ー—–!！?？:：/()-]+/g,'');
  }
  function category(g) {
    const c = String(g.cat || '').toLowerCase();
    const merge = {arcade:'action',rhythm:'creative',sports:'action',word:'brain',card:'board',adventure:'sim'};
    if (merge[c]) return merge[c];
    if (categoryIds.has(c) && c !== 'all') return c;
    const t = String(g.genre || '').toUpperCase();
    if (/KIDS|知育/.test(t)) return 'kids';
    if (/SHOOT|BOSS RUSH|シューティング/.test(t)) return 'shooter';
    if (/BOARD|CARD|CASINO|SOLITAIRE|TABLE|ボード|カード/.test(t)) return 'board';
    if (/WORD|QUIZ|TYPING|BRAIN|クイズ|ことば/.test(t)) return 'brain';
    if (/PUZZLE|MERGE|LOGIC|SOKOBAN|NONOGRAM|ESCAPE|MEMORY|MATCH|パズル/.test(t)) return 'puzzle';
    if (/RPG|ADVENTURE|IDLE|MANAGEMENT|PET|FISHING|DEFENSE|SIM|ぼうけん/.test(t)) return 'sim';
    if (/CREATIVE|RHYTHM|創作|音楽/.test(t)) return 'creative';
    if (/2P|VERSUS|たいせん|対戦/.test(t)) return 'versus';
    if (/ACTION|ARCADE|SPORTS|TIMING|ONE BUTTON|アクション|スポーツ/.test(t)) return 'action';
    return 'other';
  }
  function target(g) {
    if (adult.has(g.id)) return 'adult';
    if (kids.has(g.id)) return 'kids';
    // A newly published game is never automatically added to the adult collection.
    if (!reviewed.has(g.id) && category(g)==='kids') return 'kids';
    return 'general';
  }
  function minAge(g) { const m=String(g.age||'').match(/(\d{1,2})\s*歳/);return m?Number(m[1]):(/全年齢/.test(g.age||'')?0:99); }
  function supportsTwo(g) { return /(?:2P|ふたり|2人|二人|P1.+P2)/i.test([g.genre,g.description,g.controls].join(' ')); }
  function supportsSolo(g) { return !supportsTwo(g) || /(?:CPU|対AI|AI戦|コンピュータ|ひとり|1人|一人)/i.test([g.genre,g.description,g.controls].join(' ')); }
  function searchText(g) {
    return [g.title,...(alias[g.id]||[]),g.description,g.genre,categoryLabels[category(g)],g.cat].map(normalize).join(' ');
  }
  function exactName(g,q) { const needle=normalize(q);return !!needle&&[g.title,...(alias[g.id]||[])].map(normalize).includes(needle); }
  function searchMatch(g,q,nameOnly=false) { const text=nameOnly?[g.title,...(alias[g.id]||[])].map(normalize).join(' '):searchText(g);return String(q||'').trim().split(/\s+/).filter(Boolean).every(term=>text.includes(normalize(term))); }
  function matches(g,s,ignore='') {
    return (ignore==='collection'||s.collection==='all'||target(g)===s.collection)
      && (ignore==='audience'||s.audience==='all'||(s.audience==='two'?supportsTwo(g):supportsSolo(g)))
      && (ignore==='age'||s.age===null||minAge(g)<=s.age)
      && (ignore==='cat'||s.cat==='all'||category(g)===s.cat)
      && (ignore==='query'||searchMatch(g,s.query,s.nameOnly));
  }
  function titleRank(g,q) {
    const needle=normalize(q);if(!needle)return 2;
    const names=[g.title,...(alias[g.id]||[])].map(normalize);
    return names.includes(needle)?0:names.some(name=>name.includes(needle))?1:2;
  }
  function compare(s) {
    return (a,b)=>{
      if (s.sort==='title') return String(a.title).localeCompare(String(b.title),'ja',{numeric:true}) || a.id.localeCompare(b.id);
      if (s.sort==='recommended') {
        const titleDifference=titleRank(a,s.query)-titleRank(b,s.query); if(titleDifference)return titleDifference;
        if(s.collection==='adult') {
          const rank=g=>{const i=ADULT_PRIORITY.indexOf(g.id);return i<0?999:i;};
          const d=rank(a)-rank(b);if(d)return d;
        }
      }
      return String(b.date||'').localeCompare(String(a.date||'')) || b.id.localeCompare(a.id);
    };
  }
  function readState(search) {
    const p=new URLSearchParams(search);const age=Number(p.get('age'));
    const s={collection:['adult','kids'].includes(p.get('target'))?p.get('target'):'all',audience:['solo','two'].includes(p.get('players'))?p.get('players'):'all',age:p.has('age')&&[3,6,8,10].includes(age)?age:null,cat:categoryIds.has(p.get('genre'))?p.get('genre'):'all',query:(p.get('q')||'').slice(0,100),sort:['title','newest'].includes(p.get('sort'))?p.get('sort'):'recommended'};
    if(s.age!==null)s.collection='kids';return s;
  }
  function writeState(url,s) {
    const u=new URL(url);const values={target:s.collection==='all'?'':s.collection,players:s.audience==='all'?'':s.audience,age:s.age===null?'':String(s.age),genre:s.cat==='all'?'':s.cat,q:s.query.trim(),sort:s.sort==='recommended'?'':s.sort};
    Object.entries(values).forEach(([key,value])=>value?u.searchParams.set(key,value):u.searchParams.delete(key));return u.href;
  }
  window.LudotDiscovery = {categories,categoryLabels,category,target,minAge,supportsTwo,supportsSolo,exactName,searchMatch,matches,compare,readState,writeState,reading,adultIds:ADULT_IDS.slice(),kidsIds:KIDS_IDS.slice()};
})();
