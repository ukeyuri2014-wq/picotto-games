// ============================================================
// ピコットゲームズ：ゲーム登録リスト
// ------------------------------------------------------------
// 新しいゲームを公開するときは、この配列の一番上に
// 下のような形で1ブロック追加するだけでOK！
//
// {
//   id: "007",                          // 3けたの通し番号
//   title: "ゲームのなまえ",
//   emoji: "🎮",                        // カードに大きく出る絵文字
//   color: "#3ff2e6",                   // カードのテーマカラー（省略可）
//   genre: "ACTION",                    // ジャンル表記（省略可）
//   age: "6歳〜",                       // 対象年齢の目安
//   author: "ニックネーム",              // 本名は書かない！
//   date: "2026-08-27",                 // 公開日
//   description: "どんなゲームか1〜2文で。",
//   controls: "そうさ方法をかんたんに",
//   path: "games/007-xxxx/index.html",  // ゲーム本体の場所
// },
// ============================================================

const GAMES = [
  {
    id: "010",
    genre: "MINI RPG",
    age: "8歳〜",
    color: "#8f7bff",
    title: "よふかしクエスト",
    emoji: "⚔️",
    author: "スタッフ",
    date: "2026-08-21",
    description:
      "草むらで戦ってレベルを上げ、洞窟にすむ「よるのおう」に挑む小さなRPG。宝箱・ポーション・セーブつき、クリアまで約15分の冒険。",
    controls: "矢印キー＋Zキー / スマホはDパッド＋Aボタン",
    path: "games/010-yofukashi-quest/index.html",
  },
  {
    id: "009",
    genre: "FIXED SHOOTER",
    age: "7歳〜",
    color: "#7dff6a",
    title: "よふかしインベーダー",
    emoji: "👾",
    author: "スタッフ",
    date: "2026-08-21",
    description:
      "夜の街に迫るUFO軍団を撃ち落とす固定画面シューティング。緑の盾に隠れつつ、金のUFOでボーナス。ウェーブは進むほど速く、激しく。",
    controls: "←→＋スペース / スマホは指でなぞって自動連射",
    path: "games/009-yofukashi-invader/index.html",
  },
  {
    id: "008",
    genre: "FALLING PUZZLE",
    age: "7歳〜",
    color: "#53e0d8",
    title: "ネオンフォール",
    emoji: "🧱",
    author: "スタッフ",
    date: "2026-08-21",
    description:
      "ネオンのブロックを積み、ヨコ1列そろえて消す落ちものパズル。落下地点のゴースト表示つきで初めてでも遊びやすい。10ラインごとに加速。",
    controls: "←→↓＋↑で回転、スペースで一気に落とす / スマホはボタン",
    path: "games/008-neon-fall/index.html",
  },
  {
    id: "007",
    color: "#4db56a",
    genre: "MERGE",
    age: "6歳〜",
    title: "よふかしスイカ",
    emoji: "🍉",
    author: "スタッフ",
    date: "2026-08-21",
    description:
      "落として、くっつけて、育てる。同じフルーツを合体させて、夜のスイカを目指すパズル。上のラインを超えたらゲームオーバー。",
    controls: "ねらって、はなすと落ちる（タップ / クリック）",
    path: "games/007-yofukashi-suika/index.html",
  },
  {
    id: "006",
    genre: "BOSS RUSH",
    age: "10歳〜",
    color: "#ffe14d",
    title: "コラムブレイカー",
    emoji: "⚡",
    author: "ゲスト",
    date: "2026-08-20",
    description:
      "縦レーザーで挑むボスラッシュ5連戦。ボスと同じ「列」に立てばダメージが入るが、真下は弾幕の的。ボス内部を回るコアを撃ち抜けば3倍ダメージ。",
    controls: "WASD/矢印＋スペース、Shiftで集中 / スマホはドラッグ＋FOCUS",
    path: "games/006-column-breaker/index.html",
  },
  {
    id: "005",
    genre: "PUZZLE SHOT",
    age: "8歳〜",
    color: "#ff4d6d",
    title: "リコシェ・ワン",
    emoji: "🎯",
    author: "スタッフ",
    date: "2026-08-20",
    description:
      "壁に跳ね返る弾で隠れた的を撃ち抜くパズルシューティング。ワープ・重力・動く壁——仕掛けだらけの全10ステージ。",
    controls: "マウスで狙ってクリック / 指でなぞって離す",
    path: "games/005-ricochet-one/index.html",
  },
  {
    id: "004",
    genre: "ARENA SHOOTER",
    age: "10歳〜",
    color: "#ff7a3d",
    title: "アーセナル10",
    emoji: "💥",
    author: "ゲスト",
    date: "2026-08-20",
    description:
      "10種の武器を切り替えて敵の波を迎え撃つアリーナシューティング。ウェーブを重ねて武器を解放し、ボスを撃破せよ。",
    controls: "WASD＋マウス / スマホは左右スティック",
    path: "games/004-arsenal-10/index.html",
  },
  {
    id: "003",
    genre: "SHOOTER",
    age: "7歳〜",
    color: "#3dd6ff",
    title: "マーライオンシューター",
    emoji: "🦁",
    author: "スタッフ",
    date: "2026-08-19",
    description:
      "シンガポールの夜景を守れ。マーライオンの水鉄砲で降り注ぐドリアンを撃ち落とす縦シューティング。流れ星を撃てばボーナス。",
    controls: "←→キー / マウス / スワイプ",
    path: "games/003-merlion-shooter/index.html",
  },
  {
    id: "002",
    genre: "MEMORY",
    age: "6歳〜",
    color: "#b06bff",
    title: "よふかしペアさがし",
    emoji: "👻",
    author: "スタッフ",
    date: "2026-08-19",
    description:
      "裏返ったカードをめくり、同じ絵柄のペアを揃える神経衰弱。全16枚をそろえるまでのタイムアタック。最速記録に挑め。",
    controls: "タップ / クリック",
    path: "games/002-pair-match/index.html",
  },
  {
    id: "001",
    genre: "ACTION",
    age: "6歳〜",
    color: "#ff6fa8",
    title: "はなびらキャッチ",
    emoji: "🌸",
    author: "スタッフ",
    date: "2026-08-19",
    description:
      "夜空から降る花をかごでキャッチする45秒のスコアアタック。星はボーナス、おばけに触れると減点。連続キャッチでハイスコアを狙え。",
    controls: "←→キー / マウス / スワイプ",
    path: "games/001-hanabira-catch/index.html",
  },
];
