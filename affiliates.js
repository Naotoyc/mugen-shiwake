'use strict';
// アフィリエイトリンク設定。
// - url が空の項目は表示されない（承認待ちの間は空のままでよい）
// - 変更したら `node build.js` を再実行する（論点ページに反映。アプリ側は読み込むだけ）
// - url: ASP の広告リンクの href（必須）
// - display: 'both'=バナー＋ボタン / 'button'=micro（ボタン上の一言）＋cta（ボタン文言） / 'banner'=img のみ / 省略=label/lead のテキスト
const AFFILIATES = [
  {
    id: 'book-sukkiri', kind: 'book',
    label: 'スッキリわかる 日商簿記3級',
    lead: '図解中心。仕訳の「なぜ」を紙で固めたい人向け',
    url: '',
  },
  {
    id: 'book-pablof', kind: 'book',
    label: 'パブロフ流でみんな合格 日商簿記3級',
    lead: 'イラストで取引の流れを追える定番テキスト',
    url: '',
  },
  {
    id: 'course-ohara', kind: 'course',
    label: '資格の大原（専門課程）',
    lead: '簿記・会計を学校で本格的に学ぶなら。資料請求はこちら',
    // アクセストレード。飛び先は専門課程（専門学校）ページ。簿記3級向けの講座プログラムが取れたら差し替える
    url: 'https://h.accesstrade.net/sp/cc?rk=01002q1c00p1lz',
    // display: 'both'（バナー＋マイクロコピー＋ボタン）/ 'button' / 'banner' / 省略でテキスト
    display: 'both',
    micro: '＼資料請求は無料／',
    cta: '資格の大原（専門課程）を見る →',
    img: 'https://h.accesstrade.net/sp/rr?rk=01002q1c00p1lz', imgWidth: 468, imgHeight: 60,
  },
  {
    id: 'course-crear', kind: 'course',
    label: 'クレアール 簿記3級講座',
    lead: '独学で止まった人向け。短期で一気に仕上げる',
    url: '',
  },
  {
    id: 'course-studying', kind: 'course',
    label: 'スタディング 簿記3級',
    lead: 'スマホ完結。通勤中に講義＋問題',
    url: '',
  },
];

if (typeof module !== 'undefined') module.exports = { AFFILIATES };
