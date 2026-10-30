'use strict';
// アフィリエイトリンク設定。
// - url が空の項目は表示されない（承認待ちの間は空のままでよい）
// - 変更したら `node build.js` を再実行する（論点ページに反映。アプリ側は読み込むだけ）
// - 書籍・講座とも、ASP で発行された広告リンクの href（URL）だけを貼る。画像バナーやビーコン img は不要
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
    label: '資格の大原 簿記3級講座',
    lead: '通学・Web両対応。合格実績重視で選ぶなら',
    url: '',
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
