'use strict';
// 論点別の静的解説ページ・sitemap.xml・robots.txt を questions.js から生成する。
//   node build.js
// 出力: topics/index.html, topics/<slug>/index.html, sitemap.xml, robots.txt
// 生成物はコミットする（GitHub Pages はビルドを走らせないため）。

const fs   = require('fs');
const path = require('path');
const { QUESTION_TEMPLATES } = require('./questions.js');
const { AFFILIATES } = require('./affiliates.js');

const SITE_URL   = 'https://naotoyc.github.io/mugen-shiwake/';
const SITE_NAME  = '無限仕訳';
const GA_ID      = 'G-Y078QDMH2J';
const OGP_IMAGE  = SITE_URL + 'mugen-shiwake-ogp.png';
const OUT_DIR    = path.join(__dirname, 'topics');
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// 論点名 → URLスラッグ。新しい論点を questions.js に足したらここにも足す（無いとビルドが止まる）。
const SLUGS = {
  '仕訳の基本': 'shiwake-kihon',
  '現金': 'genkin',
  '普通預金': 'futsu-yokin',
  '当座預金': 'toza-yokin',
  '小口現金': 'koguchi-genkin',
  '現金過不足': 'genkin-kafusoku',
  '売掛金': 'urikakekin',
  '買掛金': 'kaikakekin',
  '売上': 'uriage',
  '仕入': 'shiire',
  'クレジット売掛金': 'credit-urikakekin',
  '受取手形': 'uketori-tegata',
  '支払手形': 'shiharai-tegata',
  '電子記録債権': 'denshi-kiroku-saiken',
  '電子記録債務': 'denshi-kiroku-saimu',
  '前払金': 'maebaraikin',
  '前受金': 'maeukekin',
  '未収入金': 'mishunyukin',
  '未払金': 'miharaikin',
  '仮払金': 'karibaraikin',
  '仮受金': 'kariukekin',
  '立替金': 'tatekaekin',
  '預り金': 'azukarikin',
  '借入金': 'kariirekin',
  '備品': 'bihin',
  '消耗品費': 'shomohinhi',
  '消耗品': 'shomohin',
  '旅費交通費': 'ryohi-kotsuhi',
  '通信費': 'tsushinhi',
  '租税公課': 'sozei-koka',
  '発送費': 'hassohi',
  '給料': 'kyuryo',
  '修繕費': 'shuzenhi',
  '保険料': 'hokenryo',
  '支払家賃': 'shiharai-yachin',
  '受取家賃': 'uketori-yachin',
  '貸倒引当金繰入': 'kashidaore-hikiatekin-kuriire',
  '貸倒引当金戻入': 'kashidaore-hikiatekin-modoshiire',
  '貸倒損失': 'kashidaore-sonshitsu',
  '償却債権取立益': 'shokyaku-saiken-toritateeki',
  '減価償却費': 'genka-shokyakuhi',
  '固定資産売却益': 'kotei-shisan-baikyakueki',
  '損益振替': 'soneki-furikae',
  '繰越利益剰余金': 'kurikoshi-rieki-joyokin',
  '資本金': 'shihonkin',
  '消費税': 'shohizei',
  '法人税等': 'hojinzei-to',
  '貯蔵品': 'chozohin',
  '前払費用': 'maebarai-hiyo',
  '未払費用': 'miharai-hiyo',
  '未収収益': 'mishu-shueki',
  '前受収益': 'maeuke-shueki',
  '差入保証金': 'sashiire-hoshokin',
  '受取商品券': 'uketori-shohinken',
  '訂正仕訳': 'teisei-shiwake',
};

// script.js の classifyDifficulty と同じ基準
const HARD_TOPICS = new Set([
  '減価償却費', '貸倒引当金繰入', '貸倒引当金戻入', '貸倒損失', '消費税',
  'クレジット売掛金', '固定資産売却益', '固定資産売却損', '損益振替', '訂正仕訳',
  '法人税等', '貯蔵品', '差入保証金', '受取商品券', '償却債権取立益', '現金過不足',
]);
const DIFF_LABEL = { basic: '基礎', standard: '標準', hard: '試験' };

// 例題は毎回同じ内容にする（差分ノイズを出さない）。
// 金額は 2・3・4・5・6・12 で割り切れる 60,000 の倍数から id で選ぶ。
const AMOUNTS = [60000, 120000, 180000, 240000, 300000];
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function sample(tmpl) {
  const origRandom = Math.random;
  Math.random = seededRandom(tmpl.id * 7919 + 1);
  try {
    const amt = AMOUNTS[tmpl.id % AMOUNTS.length];
    return tmpl.generate.length > 0 ? tmpl.generate(amt) : tmpl.generate();
  } finally {
    Math.random = origRandom;
  }
}
function difficultyOf(tmpl, s) {
  if (tmpl.topic === '仕訳の基本') return 'basic';
  const compound = s.debit.length >= 2 || s.credit.length >= 2;
  return (HARD_TOPICS.has(tmpl.topic) || compound || tmpl.generate.length === 0) ? 'hard' : 'standard';
}

const esc = str => String(str)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const yen = n => n.toLocaleString('ja-JP');

// 「AIに質問」: 問題・正解・解説を載せたプロンプトを外部AIに渡す（API費用ゼロ）。
// script.js の buildAiPrompt / AI_LINKS と同じ形式にしておく。
const AI_LINKS = {
  chatgpt: { label: 'ChatGPT', base: 'https://chatgpt.com/?q=' },
  claude:  { label: 'Claude',  base: 'https://claude.ai/new?q=' },
};
function buildAiPrompt(q) {
  const line = e => `${e.account} ${yen(e.amount)}`;
  return [
    '簿記3級の仕訳問題について質問です。借方・貸方の増減の考え方から、初心者にも分かるように説明してください。',
    '', '【問題】', q.question,
    '', '【正解の仕訳】',
    '借方: ' + q.debit.map(line).join(' ／ '),
    '貸方: ' + q.credit.map(line).join(' ／ '),
    '', '【解説】', q.explanation,
    '', '【質問】', '（ここに聞きたいことを書いてください。例: なぜこの科目が借方になるのか？）',
  ].join('\n');
}
// 教材・講座（アフィリエイト）。url が入っている項目だけ出す。無ければブロックごと出さない。
function affiliateBlock(heading, place) {
  const items = AFFILIATES.filter(a => a.url);
  if (items.length === 0) return '';
  return `
    <section class="promo" aria-label="教材・講座（PR）">
      <div class="promo-head">
        <h2 class="section-title">${esc(heading)}</h2>
        <span class="pr-tag">PR</span>
      </div>
      <ul class="promo-list">
        ${items.map(a => `<li><a href="${esc(a.url)}" target="_blank" rel="sponsored noopener" data-aff="${a.id}" data-kind="${a.kind}" data-place="${place}">
          <span class="promo-label">${esc(a.label)}</span>
          <span class="promo-lead">${esc(a.lead)}</span>
        </a></li>`).join('\n        ')}
      </ul>
      <p class="promo-note">※アフィリエイトリンクを含みます。購入・申込があった場合、当サイトに報酬が入ることがあります。</p>
    </section>`;
}

function askAiBlock(q, topic) {
  const prompt = buildAiPrompt(q);
  const enc = encodeURIComponent(prompt);
  return `<div class="ask-ai">
        <div class="ask-ai-label">この問題をAIに質問する（問題文つきで開きます）</div>
        <div class="ask-ai-row">
          ${Object.entries(AI_LINKS).map(([k, v]) =>
            `<a class="ask-ai-btn" data-provider="${k}" data-topic="${esc(topic)}" target="_blank" rel="noopener" href="${v.base}${enc}">${v.label}</a>`).join('\n          ')}
          <button class="ask-ai-btn" type="button" data-copy="${esc(prompt)}" data-topic="${esc(topic)}">質問文をコピー</button>
        </div>
      </div>`;
}

// ── データ集計 ──
const topics = new Map(); // topic → { templates: [], examples: [] }
for (const t of QUESTION_TEMPLATES) {
  if (!SLUGS[t.topic]) throw new Error(`SLUGS に未登録の論点: ${t.topic}`);
  if (!topics.has(t.topic)) topics.set(t.topic, { templates: [], examples: [] });
  const s = sample(t);
  topics.get(t.topic).templates.push(t);
  topics.get(t.topic).examples.push({ ...s, id: t.id, difficulty: difficultyOf(t, s) });
}
const topicNames = [...topics.keys()].sort((a, b) => a.localeCompare(b, 'ja'));

function relatedTopics(name) {
  const count = new Map();
  for (const t of topics.get(name).templates) {
    for (const tag of t.tags || []) {
      if (tag !== name && topics.has(tag)) count.set(tag, (count.get(tag) || 0) + 1);
    }
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n]) => n);
}
function overallDifficulty(examples) {
  const n = examples.filter(e => e.difficulty === 'hard').length;
  if (n === examples.length) return '試験レベル';
  if (n === 0) return examples[0].difficulty === 'basic' ? '基礎レベル' : '標準レベル';
  return '標準〜試験レベル';
}

// ── HTML 部品 ──
function head({ title, description, canonical, jsonLd, cssPrefix }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${OGP_IMAGE}">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${OGP_IMAGE}">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#1e293b" media="(prefers-color-scheme: dark)">
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  </script>
  <link rel="stylesheet" href="${cssPrefix}style.css">
  <link rel="stylesheet" href="${cssPrefix}topics.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<!-- このファイルは build.js が生成します。直接編集しないでください。 -->
<header>
  <a class="site-title" href="${cssPrefix}">${SITE_NAME}</a>
  <div class="site-subtitle">簿記3級 第1問対策 — 論点別の例題と解説</div>
</header>
<div class="container">
`;
}
function foot(cssPrefix) {
  return `
  <footer>
    <p><a href="${cssPrefix}">${SITE_NAME}</a> ｜ <a href="${cssPrefix}topics/">論点一覧</a></p>
    <p style="margin-top:4px">問題は学習用に作成したオリジナルです</p>
  </footer>
</div>
<script>
(function () {
  function track(name, params) {
    try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch (e) { /* noop */ }
  }
  document.querySelectorAll('.ask-ai-btn[data-provider]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('ask_ai', { provider: a.dataset.provider, topic: a.dataset.topic, source: 'topic_page' });
    });
  });
  document.querySelectorAll('.ask-ai-btn[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var label = b.textContent;
      navigator.clipboard.writeText(b.dataset.copy).then(function () {
        b.textContent = 'コピーしました';
        setTimeout(function () { b.textContent = label; }, 1500);
      });
      track('ask_ai', { provider: 'copy', topic: b.dataset.topic, source: 'topic_page' });
    });
  });
  document.querySelectorAll('a.cta').forEach(function (a) {
    a.addEventListener('click', function () { track('topic_page_to_app', { href: a.getAttribute('href') }); });
  });
  document.querySelectorAll('.promo a[data-aff]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('affiliate_click', { id: a.dataset.aff, kind: a.dataset.kind, place: a.dataset.place });
    });
  });
})();
</script>
</body>
</html>
`;
}
function breadcrumbs(items) {
  return `<nav class="crumbs" aria-label="パンくず">${
    items.map((it, i) => it.href
      ? `<a href="${it.href}">${esc(it.name)}</a>`
      : `<span aria-current="page">${esc(it.name)}</span>`
    ).join('<span class="crumb-sep">›</span>')
  }</nav>`;
}
function breadcrumbJsonLd(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, ...(it.url ? { item: it.url } : {}),
    })),
  };
}
function journalTable(ex) {
  const rows = Math.max(ex.debit.length, ex.credit.length);
  let body = '';
  for (let i = 0; i < rows; i++) {
    const d = ex.debit[i], c = ex.credit[i];
    body += `<tr>
      <td class="debit-account">${d ? esc(d.account) : ''}</td>
      <td class="debit-amount">${d ? yen(d.amount) : ''}</td>
      <td class="credit-account">${c ? esc(c.account) : ''}</td>
      <td class="credit-amount">${c ? yen(c.amount) : ''}</td>
    </tr>`;
  }
  return `<div class="journal-wrapper">
    <table class="journal-table" aria-label="仕訳">
      <thead><tr><th scope="col">借方 科目</th><th scope="col">借方 金額</th><th scope="col">貸方 科目</th><th scope="col">貸方 金額</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

// ── 論点ページ ──
function topicPage(name) {
  const { examples } = topics.get(name);
  const slug  = SLUGS[name];
  const url   = `${SITE_URL}topics/${slug}/`;
  const n     = examples.length;
  const level = overallDifficulty(examples);
  const title = `${name}の仕訳｜簿記3級 例題${n}問と解説【${SITE_NAME}】`;
  const description = `簿記3級「${name}」の仕訳を例題${n}問で解説。借方・貸方の考え方を1問ずつ確認できます（${level}）。無料アプリで同じ論点を無限に反復練習できます。`;
  const crumbs = [
    { name: SITE_NAME, href: '../../', url: SITE_URL },
    { name: '論点一覧', href: '../', url: `${SITE_URL}topics/` },
    { name, url },
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: title,
        description,
        inLanguage: 'ja',
        isAccessibleForFree: true,
        dateModified: BUILD_DATE,
        mainEntityOfPage: url,
        about: { '@type': 'Thing', name: `簿記3級 ${name} 仕訳` },
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      },
      breadcrumbJsonLd(crumbs),
    ],
  };
  const appHref = `../../?topic=${encodeURIComponent(name)}`;

  const examplesHtml = examples.map((ex, i) => `
    <article class="question-card example" id="q${ex.id}">
      <div class="card-header">
        <span class="topic-tag">例題${i + 1}</span>
        <span class="diff-pill diff-${ex.difficulty}">${DIFF_LABEL[ex.difficulty]}</span>
      </div>
      <h2 class="question-text">${esc(ex.question)}</h2>
      <div class="answer-label">仕訳</div>
      ${journalTable(ex)}
      <div class="explanation-box">${esc(ex.explanation)}</div>
      ${askAiBlock(ex, name)}
    </article>`).join('\n');

  const related = relatedTopics(name);
  const relatedHtml = related.length ? `
    <section class="related" aria-label="関連論点">
      <h2 class="section-title">関連する論点</h2>
      <ul class="topic-list">
        ${related.map(r => `<li><a href="../${SLUGS[r]}/">${esc(r)}<span class="topic-count">${topics.get(r).examples.length}問</span></a></li>`).join('')}
      </ul>
    </section>` : '';

  return head({ title, description, canonical: url, jsonLd, cssPrefix: '../../' }) +
    breadcrumbs(crumbs) + `
  <section class="intro">
    <h1>${esc(name)}の仕訳<span class="h1-sub">簿記3級 例題${n}問と解説</span></h1>
    <p>簿記3級 第1問で出る「${esc(name)}」の仕訳を、例題${n}問で確認します。各問に借方・貸方と解説を付けています。</p>
    <div class="badges">
      <span class="badge">例題${n}問</span>
      <span class="badge">${level}</span>
      <span class="badge">解説付き</span>
    </div>
    <a class="btn btn-check cta" href="${appHref}">「${esc(name)}」をアプリで反復練習 →</a>
  </section>
  <main>
    ${examplesHtml}
    <a class="btn btn-next cta" href="${appHref}">「${esc(name)}」の問題を無限に解く →</a>
    <p class="cta-note">金額がランダムに変わる同じ論点の問題を、答え合わせ・解説付きで何問でも解けます。無料・登録不要。</p>
    ${relatedHtml}
    ${affiliateBlock(`「${name}」を紙や講座で固めるなら`, 'topic_page')}
  </main>` + foot('../../');
}

// ── 論点一覧ページ ──
function indexPage() {
  const url = `${SITE_URL}topics/`;
  const total = QUESTION_TEMPLATES.length;
  const title = `簿記3級 仕訳の論点一覧（${topicNames.length}論点・例題${total}問）【${SITE_NAME}】`;
  const description = `簿記3級 第1問の仕訳を${topicNames.length}論点に分けて例題と解説で確認できます。現金・売掛金・貸倒引当金・減価償却・訂正仕訳など全${total}問。無料アプリで反復練習にそのまま進めます。`;
  const crumbs = [{ name: SITE_NAME, href: '../', url: SITE_URL }, { name: '論点一覧', url }];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: title, description, url, inLanguage: 'ja', dateModified: BUILD_DATE,
        hasPart: topicNames.map(n => ({ '@type': 'Article', name: `${n}の仕訳`, url: `${SITE_URL}topics/${SLUGS[n]}/` })),
      },
      breadcrumbJsonLd(crumbs),
    ],
  };

  const groups = { basic: [], standard: [], hard: [] };
  for (const n of topicNames) {
    const exs = topics.get(n).examples;
    const key = exs.every(e => e.difficulty === 'hard') ? 'hard'
              : exs.every(e => e.difficulty === 'basic') ? 'basic' : 'standard';
    groups[key].push(n);
  }
  const list = names => `<ul class="topic-list">${
    names.map(n => `<li><a href="${SLUGS[n]}/">${esc(n)}<span class="topic-count">${topics.get(n).examples.length}問</span></a></li>`).join('')
  }</ul>`;

  return head({ title, description, canonical: url, jsonLd, cssPrefix: '../' }) +
    breadcrumbs(crumbs) + `
  <section class="intro">
    <h1>簿記3級 仕訳の論点一覧<span class="h1-sub">${topicNames.length}論点・例題${total}問</span></h1>
    <p>第1問で問われる仕訳を論点ごとに分けています。各ページで例題と解説を確認し、そのままアプリで同じ論点を反復できます。</p>
  </section>
  <main>
    <h2 class="section-title">まず押さえる（基礎）</h2>${list(groups.basic)}
    <h2 class="section-title">頻出の基本論点（標準）</h2>${list(groups.standard)}
    <h2 class="section-title">差がつく論点（試験レベル）</h2>${list(groups.hard)}
    <a class="btn btn-next cta" href="../">全論点をアプリで反復練習 →</a>
    ${affiliateBlock('仕訳以外も含めて仕上げるなら', 'topics_index')}
  </main>` + foot('../');
}

// ── 出力 ──
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexPage());
for (const name of topicNames) {
  const dir = path.join(OUT_DIR, SLUGS[name]);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), topicPage(name));
}

const urls = [
  { loc: SITE_URL, priority: '1.0' },
  { loc: `${SITE_URL}topics/`, priority: '0.8' },
  ...topicNames.map(n => ({ loc: `${SITE_URL}topics/${SLUGS[n]}/`, priority: '0.7' })),
];
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${BUILD_DATE}</lastmod><priority>${u.priority}</priority></url>`).join('\n') +
  `\n</urlset>\n`);
fs.writeFileSync(path.join(__dirname, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);

console.log(`topics: ${topicNames.length} pages, examples: ${QUESTION_TEMPLATES.length}, sitemap: ${urls.length} urls`);
