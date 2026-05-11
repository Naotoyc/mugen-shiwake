'use strict';

let currentQuestion = null;
let currentOptions   = [];
let questionCount    = 0;
let score = { correct: 0, total: 0 };

// ── 類似科目マップ（ランダム選択肢用） ──
const SIMILAR_ACCOUNTS = {
  '現金':                     ['普通預金', '仮払金', '売掛金', '小口現金', '未収入金'],
  '普通預金':                 ['現金', '売掛金', '借入金', '前払金', '未払金'],
  '売掛金':                   ['買掛金', '未収入金', 'クレジット売掛金', '受取手形', '前払金'],
  '買掛金':                   ['売掛金', '未払金', '支払手形', '前受金', '仕入'],
  '受取手形':                 ['支払手形', '売掛金', 'クレジット売掛金', '現金', '未収入金'],
  '支払手形':                 ['受取手形', '買掛金', '未払金', '普通預金', '売掛金'],
  '前払金':                   ['前受金', '仮払金', '売掛金', '買掛金', '未収入金'],
  '前受金':                   ['前払金', '仮受金', '売上', '売掛金', '未払金'],
  '未収入金':                 ['売掛金', '未払金', '前払金', '受取手形', '現金'],
  '未払金':                   ['買掛金', '未収入金', '支払手形', '前受金', '普通預金'],
  '仮払金':                   ['仮受金', '前払金', '旅費交通費', '現金', '立替金'],
  '仮受金':                   ['仮払金', '前受金', '売掛金', '売上', '現金'],
  '立替金':                   ['預り金', '仮払金', '未収入金', '現金', '未払金'],
  '預り金':                   ['立替金', '前受金', '未払金', '給料', '仮受金'],
  'クレジット売掛金':         ['売掛金', '支払手数料', '受取手形', '売上', '普通預金'],
  '備品':                     ['消耗品費', '未払金', '固定資産売却損', '減価償却費', '現金'],
  '消耗品費':                 ['備品', '旅費交通費', '発送費', '通信費', '租税公課'],
  '旅費交通費':               ['仮払金', '消耗品費', '通信費', '発送費', '現金'],
  '通信費':                   ['旅費交通費', '消耗品費', '発送費', '租税公課', '未払金'],
  '租税公課':                 ['通信費', '消耗品費', '未払金', '発送費', '現金'],
  '発送費':                   ['旅費交通費', '通信費', '消耗品費', '売上', '現金'],
  '支払手数料':               ['発送費', 'クレジット売掛金', '通信費', '売上', '売掛金'],
  '給料':                     ['預り金', '未払金', '立替金', '現金', '普通預金'],
  '貸倒引当金':               ['貸倒引当金繰入', '貸倒損失', '売掛金', '貸倒引当金戻入'],
  '貸倒引当金繰入':           ['貸倒引当金', '貸倒損失', '貸倒引当金戻入', '売掛金'],
  '貸倒引当金戻入':           ['貸倒引当金繰入', '貸倒引当金', '貸倒損失', '受取利息'],
  '貸倒損失':                 ['貸倒引当金', '売掛金', '未収入金', '受取手形'],
  '減価償却費':               ['備品減価償却累計額', '備品', '車両運搬具減価償却累計額', '消耗品費'],
  '備品減価償却累計額':       ['減価償却費', '備品', '車両運搬具減価償却累計額', '固定資産売却損'],
  '車両運搬具減価償却累計額': ['備品減価償却累計額', '減価償却費', '備品', '消耗品費'],
  '固定資産売却益':           ['固定資産売却損', '未収入金', '備品', '売上'],
  '固定資産売却損':           ['固定資産売却益', '備品', '減価償却費', '現金'],
  '売上':                     ['仕入', '前受金', '売掛金', '受取利息', '売上戻り'],
  '仕入':                     ['売上', '消耗品費', '買掛金', '発送費', '前払金'],
  '受取利息':                 ['売上', '普通預金', '貸倒引当金戻入', '受取手形'],
  '借入金':                   ['普通預金', '未払金', '支払手形', '前受金', '現金'],
  '損益':                     ['繰越利益剰余金', '売上', '仕入', '普通預金'],
  '繰越利益剰余金':           ['損益', '未払配当金', '普通預金', '売上'],
  '未払配当金':               ['繰越利益剰余金', '未払金', '普通預金', '損益'],
  '社会保険料':               ['預り金', '給料', '未払金', '現金', '普通預金'],
};

function generateOptions(correctAccounts) {
  const correct = [...new Set(correctAccounts)];
  const seen = new Set(correct);
  const pool = [];

  correct.forEach(acc => {
    const similar = SIMILAR_ACCOUNTS[acc] || [];
    similar.forEach(s => {
      if (!seen.has(s)) { pool.push(s); seen.add(s); }
    });
  });

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // correct accounts + distractors, aim for ~5 options
  const targetCount = Math.max(5, correct.length + 2);
  const options = [...correct, ...pool.slice(0, targetCount - correct.length)];

  // Shuffle final list
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

function getRandomAmount() {
  return Math.random() < 0.5
    ? (Math.floor(Math.random() * 99) + 1) * 1000
    : (Math.floor(Math.random() * 99) + 1) * 10000;
}

function fmt(n) { return n.toLocaleString('ja-JP'); }

// ── 金額入力のカンマフォーマット ──
function attachAmountFormat(inp) {
  inp.addEventListener('blur', () => {
    const raw = inp.value.replace(/[^0-9]/g, '');
    if (raw) inp.value = parseInt(raw, 10).toLocaleString('ja-JP');
    else inp.value = '';
  });
  inp.addEventListener('focus', () => {
    inp.value = inp.value.replace(/,/g, '');
  });
  // リアルタイム: 数字以外を除去（カンマ入力中は維持）
  inp.addEventListener('input', () => {
    const raw = inp.value.replace(/[^0-9]/g, '');
    if (raw === '') { inp.value = ''; return; }
    const num = parseInt(raw, 10);
    inp.value = num.toLocaleString('ja-JP');
    // カーソル位置を末尾に
    inp.setSelectionRange(inp.value.length, inp.value.length);
  });
}

// ── 入力行を生成（選択肢絞り込み済み） ──
function createEntryRow(side) {
  const div = document.createElement('div');
  div.className = 'entry-input-row';

  const sel = document.createElement('select');
  sel.className = 'account-select';
  sel.innerHTML = '<option value="">-- 科目 --</option>' +
    currentOptions.map(a => `<option value="${a}">${a}</option>`).join('');

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.inputMode = 'numeric';
  inp.className = 'amount-input';
  inp.placeholder = '金額';
  attachAmountFormat(inp);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-remove-row';
  btn.textContent = '×';
  btn.addEventListener('click', () => removeRow(btn, side));

  div.appendChild(sel);
  div.appendChild(inp);
  div.appendChild(btn);
  return div;
}

function removeRow(btn, side) {
  const container = document.getElementById(side + '-input-rows');
  if (container.children.length > 1) btn.closest('.entry-input-row').remove();
}

function addRow(side) {
  document.getElementById(side + '-input-rows').appendChild(createEntryRow(side));
}

function resetInputRows() {
  ['debit', 'credit'].forEach(side => {
    const c = document.getElementById(side + '-input-rows');
    c.innerHTML = '';
    for (let i = 0; i < 3; i++) c.appendChild(createEntryRow(side));
  });
}

// ── ユーザー入力を取得 ──
function getUserEntries(side) {
  return Array.from(document.querySelectorAll(`#${side}-input-rows .entry-input-row`))
    .map(row => ({
      account: row.querySelector('.account-select').value.trim(),
      amount: parseInt(row.querySelector('.amount-input').value.replace(/[^0-9]/g, ''), 10) || 0,
    }))
    .filter(e => e.account !== '' && e.amount > 0)
    .sort((a, b) => a.account.localeCompare(b.account, 'ja'));
}

// ── 仕訳テーブル描画 ──
function renderJournalTable(debit, credit) {
  const tbody = document.getElementById('journal-body');
  tbody.innerHTML = '';
  const n = Math.max(debit.length, credit.length);
  for (let i = 0; i < n; i++) {
    const tr = document.createElement('tr');
    [debit[i], credit[i]].forEach((entry, col) => {
      const tdA = document.createElement('td');
      const tdM = document.createElement('td');
      if (entry) {
        tdA.className = col === 0 ? 'debit-account' : 'credit-account';
        tdM.className = col === 0 ? 'debit-amount'  : 'credit-amount';
        tdA.textContent = entry.account;
        tdM.textContent = fmt(entry.amount);
      }
      tr.appendChild(tdA);
      tr.appendChild(tdM);
    });
    tbody.appendChild(tr);
  }
}

function entriesMatch(user, correct) {
  const sorted = [...correct].sort((a, b) => a.account.localeCompare(b.account, 'ja'));
  if (user.length !== sorted.length) return false;
  return user.every((e, i) => e.account === sorted[i].account && e.amount === sorted[i].amount);
}

// ── 答え合わせ ──
function checkAnswer() {
  const userDebit  = getUserEntries('debit');
  const userCredit = getUserEntries('credit');
  const ok = entriesMatch(userDebit, currentQuestion.debit) &&
             entriesMatch(userCredit, currentQuestion.credit);

  score.total++;
  if (ok) score.correct++;
  document.getElementById('score-display').textContent =
    `${score.correct} / ${score.total}`;

  const badge = document.getElementById('result-badge');
  badge.textContent = ok ? '○ 正解' : '✗ 不正解';
  badge.className   = 'result-badge ' + (ok ? 'badge-correct' : 'badge-incorrect');

  renderJournalTable(currentQuestion.debit, currentQuestion.credit);
  document.getElementById('explanation-text').textContent = currentQuestion.explanation;
  document.getElementById('answer-section').hidden = false;
  document.getElementById('check-answer-btn').disabled = true;
  document.getElementById('next-btn').hidden = false;
  document.getElementById('answer-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function skipAnswer() {
  document.getElementById('result-badge').textContent = '— スキップ';
  document.getElementById('result-badge').className = 'result-badge badge-skip';
  renderJournalTable(currentQuestion.debit, currentQuestion.credit);
  document.getElementById('explanation-text').textContent = currentQuestion.explanation;
  document.getElementById('answer-section').hidden = false;
  document.getElementById('check-answer-btn').disabled = true;
  document.getElementById('next-btn').hidden = false;
  document.getElementById('answer-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── 問題読み込み ──
function loadQuestion() {
  const tmpl = QUESTION_TEMPLATES[Math.floor(Math.random() * QUESTION_TEMPLATES.length)];
  const needsAmt = tmpl.generate.length > 0;
  const amt = needsAmt ? getRandomAmount() : null;
  currentQuestion = needsAmt ? tmpl.generate(amt) : tmpl.generate();

  if (tmpl.variants && tmpl.variants.length > 0) {
    const v = tmpl.variants[Math.floor(Math.random() * tmpl.variants.length)];
    currentQuestion.question = typeof v === 'function' ? v(amt || 0) : v;
  }
  currentQuestion.topic = tmpl.topic;

  // 正解科目から選択肢を生成
  const correctAccounts = [
    ...currentQuestion.debit.map(e => e.account),
    ...currentQuestion.credit.map(e => e.account),
  ];
  currentOptions = generateOptions(correctAccounts);

  document.getElementById('topic-tag').textContent = tmpl.topic;
  document.getElementById('question-text').textContent = currentQuestion.question;
  document.getElementById('answer-section').hidden = true;
  document.getElementById('next-btn').hidden = true;

  const checkBtn = document.getElementById('check-answer-btn');
  checkBtn.disabled = false;
  checkBtn.hidden = false;

  questionCount++;
  document.getElementById('question-count').textContent = `${questionCount}問目`;

  resetInputRows();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── イベントリスナー ──
document.getElementById('check-answer-btn').addEventListener('click', checkAnswer);
document.getElementById('skip-btn').addEventListener('click', skipAnswer);
document.getElementById('next-btn').addEventListener('click', loadQuestion);
document.getElementById('add-debit-row').addEventListener('click', () => addRow('debit'));
document.getElementById('add-credit-row').addEventListener('click', () => addRow('credit'));

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const checkBtn = document.getElementById('check-answer-btn');
    const nextBtn  = document.getElementById('next-btn');
    if (!checkBtn.disabled && !checkBtn.hidden) { e.preventDefault(); checkAnswer(); }
    else if (!nextBtn.hidden) { e.preventDefault(); loadQuestion(); }
  }
});

loadQuestion();
