# 無限仕訳

簿記3級 第1問対策の仕訳反復練習Webアプリ。

## 使い方

`index.html` をブラウザで開くだけで動きます。サーバー・インストール不要。

1. 問題が自動表示される
2. 「答えを見る」をタップ → 借方・貸方・解説が表示される
3. 「次の問題 →」をタップ → 次の問題へ
4. スペース / Enter キーでも操作可能

## GitHub Pages 公開手順

```bash
# 1. GitHubに新しいリポジトリを作成（例: mugen-shiwake）

# 2. ローカルで初期化
cd mugen-shiwake
git init
git add .
git commit -m "initial commit"

# 3. リモートを設定してプッシュ
git remote add origin https://github.com/<username>/mugen-shiwake.git
git branch -M main
git push -u origin main

# 4. GitHubリポジトリの Settings → Pages → Source: main / (root) を選択して Save
# 5. https://<username>.github.io/mugen-shiwake/ でアクセス可能になる
```

## ファイル構成

```
mugen-shiwake/
├── index.html    # メインページ（SEO・OGP設定済み）
├── style.css     # スタイル（モバイルファースト・ダークモード対応）
├── script.js     # 問題表示ロジック
├── questions.js  # 100問テンプレート + ランダム金額生成
└── README.md
```

## 問題データについて

- `questions.js` の `QUESTION_TEMPLATES` 配列でテンプレートを管理
- 各テンプレートはランダム金額を受け取り問題・解答・解説を生成する関数を持つ
- 100テンプレート × 多数の金額パターンで 1万パターン以上を生成可能
- 問題テンプレートを追加するには、同配列に以下の形式で追加する

```javascript
{
  id: 101,                     // 一意なID
  topic: '勘定科目名',
  tags: ['タグ1', 'タグ2'],
  generate: (amt) => ({
    question: `問題文${fmt(amt)}円...`,
    debit:  [{ account: '借方科目', amount: amt }],
    credit: [{ account: '貸方科目', amount: amt }],
    explanation: '1〜3行の解説。'
  })
}
```

## カバー論点（29論点）

現金 / 普通預金 / 売掛金 / 買掛金 / 売上 / 仕入 / 前払金 / 前受金 / 未収入金 / 未払金 / 仮払金 / 仮受金 / 立替金 / 預り金 / クレジット売掛金 / 受取手形 / 支払手形 / 備品 / 消耗品費 / 旅費交通費 / 通信費 / 租税公課 / 発送費 / 貸倒引当金繰入 / 貸倒引当金戻入 / 貸倒損失 / 減価償却費 / 損益振替 / 繰越利益剰余金

## 今後の拡張案

- **PWA化** — manifest.json + Service Worker でオフライン対応・ホーム画面追加
- **学習履歴** — localStorage で正解・不正解を記録
- **苦手論点分析** — 間違いが多い論点を優先出題
- **問題追加** — 論点・金額パターンの追加
- **AI解説** — Claude API 連携でより詳しい解説を生成
- **ブログ導線** — 合格体験記・解説記事への誘導
- **アフィリエイト導線** — 参考書・問題集のアフィリリンク
- **App Store / Google Play 対応** — Capacitor 等でネイティブアプリ化

## 著作権について

本アプリの問題は学習用に作成したオリジナル問題であり、既存問題集・過去問・市販テキストの転載ではありません。なお、類似性についての完全な法的判定を保証するものではありません。

## ライセンス

MIT
