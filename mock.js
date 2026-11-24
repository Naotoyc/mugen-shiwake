'use strict';
// 第1問 模擬試験（mock/<n>/）の画面。問題データは build.js がページに埋め込む（#mock-data）。
// 1問3点の全部正解・不正解。仕訳の行の順番は問わない。
(function () {
  const main = document.getElementById('mock-main');
  if (!main) return;
  const EXAM = main.dataset.exam;
  const TARGET = parseInt(main.dataset.target, 10);
  const KEY = 'mugen_mock_' + EXAM;
  const $ = id => document.getElementById(id);
  const yen = n => n.toLocaleString('ja-JP');
  const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mmss = sec => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  function track(name, params) {
    try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch (e) { /* noop */ }
  }

  let startAt = 0, tick = null, finished = false;
  let QS = [];

  // ランダム: questions.js（QUESTION_TEMPLATES・ACCOUNT_LIST・randAmt）から15問を選ぶ。
  // 1回の中で同じ論点は出さない。「仕訳の基本」は本番に出ない総論なので除く。
  function randomQuestions(conf) {
    const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const byTopic = {};
    QUESTION_TEMPLATES.forEach(t => { if (t.topic !== '仕訳の基本') (byTopic[t.topic] = byTopic[t.topic] || []).push(t); });
    return shuffle(Object.keys(byTopic)).slice(0, conf.size).map((topic, i) => {
      const list = byTopic[topic];
      const tmpl = list[Math.floor(Math.random() * list.length)];
      const amt = tmpl.generate.length > 0 ? randAmt() : 0;
      const q = tmpl.generate.length > 0 ? tmpl.generate(amt) : tmpl.generate();
      if (tmpl.variants && tmpl.variants.length && tmpl.generate.length > 0) {
        const v = tmpl.variants[Math.floor(Math.random() * tmpl.variants.length)];
        q.question = typeof v === 'function' ? v(amt) : v;
      }
      const correct = [...new Set([...q.debit, ...q.credit].map(e => e.account))];
      const seen = new Set(correct), pool = [];
      correct.forEach(a => (conf.similar[a] || []).forEach(s => { if (!seen.has(s)) { pool.push(s); seen.add(s); } }));
      const need = Math.max(conf.options, correct.length + 2) - correct.length;
      let filler = shuffle(pool).slice(0, need);
      if (filler.length < need) filler = filler.concat(shuffle(ACCOUNT_LIST.filter(a => !seen.has(a))).slice(0, need - filler.length));
      return { no: i + 1, topic, slug: conf.slugs[topic] || '', question: q.question, debit: q.debit, credit: q.credit,
               explanation: q.explanation, options: shuffle([...correct, ...filler]) };
    });
  }
  function renderList(qs) {
    $('mock-list').innerHTML = qs.map(q => `<li class="mock-q" id="q${q.no}" data-no="${q.no}">
        <div class="mock-q-head"><span class="mock-q-no">第${q.no}問</span><span class="mock-q-mark" aria-live="polite"></span></div>
        <p class="mock-q-text">${escHtml(q.question)}</p>
        <p class="mock-q-options">選択肢：${q.options.map(escHtml).join('、')}</p>
        <fieldset class="mock-entry journal-input-wrap" disabled>
          <div class="journal-input-block"><div class="input-side-label debit-label">借方</div><div class="mock-rows" data-side="debit"></div><button class="btn-add-row" type="button" data-add="debit">＋ 行追加</button></div>
          <div class="input-divider"></div>
          <div class="journal-input-block"><div class="input-side-label credit-label">貸方</div><div class="mock-rows" data-side="credit"></div><button class="btn-add-row" type="button" data-add="credit">＋ 行追加</button></div>
        </fieldset>
        <div class="mock-answer" hidden></div>
      </li>`).join('');
  }

  const DATA = JSON.parse(document.getElementById('mock-data').textContent);
  const RANDOM = !Array.isArray(DATA) && DATA.random;
  QS = RANDOM ? randomQuestions(DATA) : DATA;
  if (RANDOM) renderList(QS);

  function amountInput() {
    const inp = document.createElement('input');
    inp.type = 'text'; inp.inputMode = 'numeric'; inp.className = 'amount-input'; inp.placeholder = '金額';
    inp.addEventListener('input', () => {
      const raw = inp.value.replace(/[^0-9]/g, '');
      inp.value = raw ? parseInt(raw, 10).toLocaleString('ja-JP') : '';
      updateProgress();
    });
    return inp;
  }
  function row(options) {
    const div = document.createElement('div');
    div.className = 'entry-input-row';
    const sel = document.createElement('select');
    sel.className = 'account-select';
    sel.innerHTML = '<option value="">-- 科目 --</option>' + options.map(a => `<option value="${escHtml(a)}">${escHtml(a)}</option>`).join('');
    sel.addEventListener('change', updateProgress);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn-remove-row'; btn.textContent = '×';
    btn.addEventListener('click', () => { if (div.parentNode.children.length > 1) div.remove(); updateProgress(); });
    div.append(sel, amountInput(), btn);
    return div;
  }
  function resetRows() {
    QS.forEach(q => {
      const li = $('q' + q.no);
      li.querySelectorAll('.mock-rows').forEach(c => { c.innerHTML = ''; c.append(row(q.options), row(q.options)); });
      li.querySelector('.mock-answer').hidden = true;
      li.querySelector('.mock-answer').innerHTML = '';
      li.querySelector('.mock-q-mark').textContent = '';
      li.classList.remove('is-correct', 'is-incorrect');
    });
  }
  function entries(li, side) {
    return Array.from(li.querySelectorAll(`.mock-rows[data-side="${side}"] .entry-input-row`)).map(r => ({
      account: r.querySelector('.account-select').value,
      amount: parseInt(r.querySelector('.amount-input').value.replace(/[^0-9]/g, ''), 10) || 0,
    })).filter(e => e.account && e.amount > 0);
  }
  // 同じ科目が複数行に分かれていても合算して比べる
  function same(user, correct) {
    const sum = list => list.reduce((m, e) => (m[e.account] = (m[e.account] || 0) + e.amount, m), {});
    const a = sum(user), b = sum(correct);
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && kb.every(k => a[k] === b[k]);
  }
  function answered(li) { return entries(li, 'debit').length > 0 || entries(li, 'credit').length > 0; }
  function updateProgress() {
    const n = QS.filter(q => answered($('q' + q.no))).length;
    $('mock-progress').textContent = `${n} / ${QS.length}問`;
  }
  function journal(debit, credit) {
    let body = '';
    for (let i = 0; i < Math.max(debit.length, credit.length, 1); i++) {
      const d = debit[i], c = credit[i];
      body += `<tr><td class="debit-account">${d ? escHtml(d.account) : ''}</td><td class="debit-amount">${d ? yen(d.amount) : ''}</td>` +
              `<td class="credit-account">${c ? escHtml(c.account) : ''}</td><td class="credit-amount">${c ? yen(c.amount) : ''}</td></tr>`;
    }
    return `<div class="journal-wrapper"><table class="journal-table"><thead><tr><th>借方 科目</th><th>借方 金額</th><th>貸方 科目</th><th>貸方 金額</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function start() {
    resetRows();
    finished = false;
    document.querySelectorAll('.mock-entry').forEach(f => { f.disabled = false; });
    $('mock-submit').disabled = false;
    $('mock-result').hidden = true;
    $('mock-bar').hidden = false;
    $('mock-start').hidden = true;
    startAt = Date.now();
    clearInterval(tick);
    tick = setInterval(() => {
      const sec = Math.floor((Date.now() - startAt) / 1000);
      $('mock-timer').textContent = mmss(sec);
      $('mock-timer').classList.toggle('is-over', sec > TARGET);
    }, 500);
    updateProgress();
    track('mock_start', { exam: EXAM });
    $('q1').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit() {
    if (finished) return;
    const left = QS.filter(q => !answered($('q' + q.no))).length;
    if (left && !confirm(`未解答が ${left}問あります。採点しますか。`)) return;
    finished = true;
    clearInterval(tick);
    const sec = Math.floor((Date.now() - startAt) / 1000);
    const wrong = [];
    let correct = 0;
    QS.forEach(q => {
      const li = $('q' + q.no);
      const ud = entries(li, 'debit'), uc = entries(li, 'credit');
      const ok = same(ud, q.debit) && same(uc, q.credit);
      if (ok) correct++; else wrong.push(q);
      li.classList.add(ok ? 'is-correct' : 'is-incorrect');
      li.querySelector('.mock-q-mark').textContent = ok ? '○ 3点' : '× 0点';
      const box = li.querySelector('.mock-answer');
      box.innerHTML =
        (ok ? '' : `<div class="mock-label">あなたの解答</div>${(ud.length || uc.length) ? journal(ud, uc) : '<p class="mock-none">未解答</p>'}`) +
        `<div class="mock-label">正解</div>${journal(q.debit, q.credit)}` +
        `<div class="explanation-box">${escHtml(q.explanation)}</div>` +
        `<p class="mock-links"><a href="../../topics/${q.slug}/">${escHtml(q.topic)}の解説を読む</a><a href="../../?topic=${encodeURIComponent(q.topic)}">${escHtml(q.topic)}を練習する</a></p>`;
      box.hidden = false;
    });
    document.querySelectorAll('.mock-entry').forEach(f => { f.disabled = true; });
    $('mock-submit').disabled = true;
    const score = correct * 3;
    const over = sec > TARGET;
    let best = null;
    try { best = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* noop */ }
    const isBest = !best || score > best.score || (score === best.score && sec < best.sec);
    if (isBest) { try { localStorage.setItem(KEY, JSON.stringify({ score, sec, at: Date.now() })); } catch (e) { /* noop */ } }
    const topicsWrong = [...new Set(wrong.map(q => q.topic))];
    $('mock-result').innerHTML =
      `<button class="mock-result-close" id="mock-result-close" type="button" aria-label="閉じる">×</button>` +
      `<div class="mock-score">${score}<span>/ 45点</span></div>` +
      `<p class="mock-score-sub">${correct}問正解（全${QS.length}問）・かかった時間 ${mmss(sec)}</p>` +
      `<p>${over ? `目標の${TARGET / 60}分を ${mmss(sec - TARGET)} 超えました。満点でも時間がかかっていれば、本番では第2問と第3問の時間が足りなくなります。` : `目標の${TARGET / 60}分以内に解き終えました。`}</p>` +
      (best && !isBest ? `<p>この回の最高は ${best.score}点（${mmss(best.sec)}）です。</p>` : (best ? '<p>この回の最高記録を更新しました。</p>' : '')) +
      (topicsWrong.length ? `<div class="mock-label">間違えた論点（解説ページへ）</div><ul class="mock-wrong">${topicsWrong.map(t => {
        const q = wrong.find(w => w.topic === t);
        return `<li><a href="../../topics/${q.slug}/">${escHtml(t)}</a></li>`;
      }).join('')}</ul>` : '<p>全問正解です。</p>') +
      (RANDOM ? `<button class="btn btn-next" id="mock-new" type="button">新しい15問で解く</button>` : '') +
      `<button class="btn ${RANDOM ? 'btn-check' : 'btn-next'}" id="mock-retry" type="button">同じ問題でもう一度解く</button>`;
    $('mock-result').hidden = false;
    $('mock-result-fab').textContent = `結果 ${score}/45点`;
    $('mock-result-fab').hidden = false;
    $('mock-result-close').addEventListener('click', () => { $('mock-result').hidden = true; });
    $('mock-result').querySelectorAll('a').forEach(a => a.addEventListener('click', () => { $('mock-result').hidden = true; }));
    $('mock-retry').addEventListener('click', () => { $('mock-result').hidden = true; $('mock-result-fab').hidden = true; window.scrollTo({ top: 0 }); start(); });
    if (RANDOM) $('mock-new').addEventListener('click', () => { window.scrollTo({ top: 0 }); location.reload(); });
    track('mock_finish', { exam: EXAM, score, seconds: sec, over_target: over ? 1 : 0 });
  }

  resetRows();
  main.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (!add) return;
    const q = QS.find(x => x.no === parseInt(add.closest('.mock-q').dataset.no, 10));
    add.parentNode.querySelector('.mock-rows').append(row(q.options));
  });
  $('mock-start').addEventListener('click', start);
  $('mock-result-fab').addEventListener('click', () => { $('mock-result').hidden = false; });
  $('mock-submit').addEventListener('click', submit);
})();
