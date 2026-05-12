'use strict';

const ACCOUNT_LIST = [
  '現金','普通預金','売掛金','受取手形','前払金','未収入金','立替金',
  'クレジット売掛金','備品','仮払金','買掛金','支払手形','借入金',
  '未払金','前受金','仮受金','預り金','未払配当金','繰越利益剰余金',
  '売上','受取利息','貸倒引当金戻入','固定資産売却益','仕入',
  '支払手数料','発送費','消耗品費','旅費交通費','通信費','租税公課',
  '給料','貸倒引当金繰入','貸倒損失','固定資産売却損','減価償却費',
  '貸倒引当金','備品減価償却累計額','車両運搬具減価償却累計額','損益',
  '社会保険料','仮払消費税','仮受消費税','未払消費税',
  '当座預金','当座借越','現金過不足','雑益','雑損','支払利息',
  '前払費用','未払費用','未収収益','前受収益',
  '消耗品','修繕費','資本金','小口現金',
  '電子記録債権','電子記録債務',
  '支払家賃','受取家賃','保険料','受取手数料',
].sort();

function fmt(n) { return n.toLocaleString('ja-JP'); }

function randAmt() {
  if (Math.random() < 0.5) {
    return (Math.floor(Math.random() * 99) + 1) * 1000;
  } else {
    return (Math.floor(Math.random() * 99) + 1) * 10000;
  }
}

const QUESTION_TEMPLATES = [

  // ===== 現金 (5) =====
  {
    id: 1, topic: '現金', tags: ['現金', '普通預金'],
    generate: (a) => ({
      question: `現金${fmt(a)}円を普通預金に預け入れた。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '現金',     amount: a }],
      explanation: '現金を銀行へ預けたので、普通預金（資産↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 2, topic: '現金', tags: ['現金', '売上'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を現金で販売した。`,
      debit:  [{ account: '現金', amount: a }],
      credit: [{ account: '売上', amount: a }],
      explanation: '現金受取で現金（資産↑）借方、売上（収益↑）貸方。'
    })
  },
  {
    id: 3, topic: '現金', tags: ['現金', '仕入'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を現金で仕入れた。`,
      debit:  [{ account: '仕入', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: '仕入（費用↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 4, topic: '現金', tags: ['現金', '普通預金'],
    generate: (a) => ({
      question: `普通預金から現金${fmt(a)}円を引き出した。`,
      debit:  [{ account: '現金',     amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '現金（資産↑）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 5, topic: '現金', tags: ['現金', '受取利息'],
    generate: (a) => ({
      question: `普通預金の利息${fmt(a)}円が入金された。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '受取利息', amount: a }],
      explanation: '利息入金で普通預金（資産↑）借方、受取利息（収益↑）貸方。'
    })
  },

  // ===== 普通預金 (3) =====
  {
    id: 6, topic: '普通預金', tags: ['普通預金', '売掛金'],
    generate: (a) => ({
      question: `売掛金${fmt(a)}円が普通預金に振り込まれた。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '売掛金',   amount: a }],
      explanation: '売掛金回収で普通預金（資産↑）借方、売掛金（資産↓）貸方。'
    })
  },
  {
    id: 7, topic: '普通預金', tags: ['普通預金', '買掛金'],
    generate: (a) => ({
      question: `買掛金${fmt(a)}円を普通預金から振り込んで支払った。`,
      debit:  [{ account: '買掛金',   amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '買掛金支払で買掛金（負債↓）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 8, topic: '普通預金', tags: ['普通預金', '借入金'],
    generate: (a) => ({
      question: `銀行から${fmt(a)}円を借り入れ、普通預金に入金された。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '借入金',   amount: a }],
      explanation: '借入で普通預金（資産↑）借方、借入金（負債↑）貸方。'
    })
  },

  // ===== 売掛金 (5) =====
  {
    id: 9, topic: '売掛金', tags: ['売掛金', '売上'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を掛けで販売した。`,
      debit:  [{ account: '売掛金', amount: a }],
      credit: [{ account: '売上',   amount: a }],
      explanation: '代金後払いのため売掛金（資産↑）借方、売上（収益↑）貸方。'
    })
  },
  {
    id: 10, topic: '売掛金', tags: ['売掛金', '現金'],
    generate: (a) => ({
      question: `売掛金${fmt(a)}円を現金で回収した。`,
      debit:  [{ account: '現金',   amount: a }],
      credit: [{ account: '売掛金', amount: a }],
      explanation: '現金回収で現金（資産↑）借方、売掛金（資産↓）貸方。'
    })
  },
  {
    id: 11, topic: '売掛金', tags: ['売掛金', '受取手形'],
    generate: (a) => ({
      question: `売掛金${fmt(a)}円を同額の受取手形で回収した。`,
      debit:  [{ account: '受取手形', amount: a }],
      credit: [{ account: '売掛金',   amount: a }],
      explanation: '手形受取で受取手形（資産↑）借方、売掛金（資産↓）貸方。'
    })
  },
  {
    id: 12, topic: '売掛金', tags: ['売掛金', '売上', '発送費'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を掛けで販売し、発送費${fmt(Math.round(a * 0.01))}円を現金で支払った。`,
      debit:  [
        { account: '売掛金',  amount: a },
        { account: '発送費',  amount: Math.round(a * 0.01) }
      ],
      credit: [
        { account: '売上', amount: a },
        { account: '現金', amount: Math.round(a * 0.01) }
      ],
      explanation: '掛け売上は売掛金借方・売上貸方。発送費は費用（借方）、現金支払いは貸方。'
    })
  },
  {
    id: 13, topic: '売掛金', tags: ['売掛金', '前受金', '売上'],
    generate: (a) => ({
      question: `前受金${fmt(a)}円を受け取っていた商品を引き渡し、残額${fmt(a)}円は掛けとした。`,
      debit:  [
        { account: '前受金', amount: a },
        { account: '売掛金', amount: a }
      ],
      credit: [{ account: '売上', amount: a * 2 }],
      explanation: '前受金（負債↓）と売掛金（資産↑）を借方。売上全額を貸方。'
    })
  },

  // ===== 買掛金 (3) =====
  {
    id: 14, topic: '買掛金', tags: ['買掛金', '仕入'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を掛けで仕入れた。`,
      debit:  [{ account: '仕入',   amount: a }],
      credit: [{ account: '買掛金', amount: a }],
      explanation: '掛け仕入で仕入（費用↑）借方、買掛金（負債↑）貸方。'
    })
  },
  {
    id: 15, topic: '買掛金', tags: ['買掛金', '現金'],
    generate: (a) => ({
      question: `買掛金${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '買掛金', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '買掛金（負債↓）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 16, topic: '買掛金', tags: ['買掛金', '支払手形'],
    generate: (a) => ({
      question: `買掛金${fmt(a)}円を約束手形を振り出して支払った。`,
      debit:  [{ account: '買掛金',   amount: a }],
      credit: [{ account: '支払手形', amount: a }],
      explanation: '買掛金（負債↓）借方、支払手形（負債↑）貸方。'
    })
  },

  // ===== 売上 (3) =====
  {
    id: 17, topic: '売上', tags: ['売上', '現金'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を現金で販売した。`,
      debit:  [{ account: '現金', amount: a }],
      credit: [{ account: '売上', amount: a }],
      explanation: '現金売上：現金（資産↑）借方、売上（収益↑）貸方。'
    })
  },
  {
    id: 18, topic: '売上', tags: ['売上', '売掛金'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を掛けで販売した。`,
      debit:  [{ account: '売掛金', amount: a }],
      credit: [{ account: '売上',   amount: a }],
      explanation: '掛け売上：売掛金（資産↑）借方、売上（収益↑）貸方。'
    })
  },
  {
    id: 19, topic: '売上', tags: ['売上', 'クレジット売掛金'],
    generate: (a) => {
      const fee = Math.round(a * 0.03);
      const net = a - fee;
      return {
        question: `クレジットカードで商品${fmt(a)}円を販売した。信販会社手数料は3%とする。`,
        debit:  [
          { account: 'クレジット売掛金', amount: net },
          { account: '支払手数料',       amount: fee }
        ],
        credit: [{ account: '売上', amount: a }],
        explanation: `売上全額を貸方。手数料3%（${fmt(fee)}円）を費用（借方）、差引クレジット売掛金（借方）。`
      };
    }
  },

  // ===== 仕入 (4) =====
  {
    id: 20, topic: '仕入', tags: ['仕入', '現金'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を現金で仕入れた。`,
      debit:  [{ account: '仕入', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: '仕入（費用↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 21, topic: '仕入', tags: ['仕入', '買掛金'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を掛けで仕入れた。`,
      debit:  [{ account: '仕入',   amount: a }],
      credit: [{ account: '買掛金', amount: a }],
      explanation: '掛け仕入：仕入（費用↑）借方、買掛金（負債↑）貸方。'
    })
  },
  {
    id: 22, topic: '仕入', tags: ['仕入', '現金', '発送費'],
    generate: (a) => {
      const freight = Math.round(a * 0.02);
      return {
        question: `商品${fmt(a)}円を掛けで仕入れ、引取運賃${fmt(freight)}円を現金で支払った。`,
        debit:  [{ account: '仕入', amount: a + freight }],
        credit: [
          { account: '買掛金', amount: a },
          { account: '現金',   amount: freight }
        ],
        explanation: `引取運賃は仕入原価に含めるため、仕入合計（${fmt(a + freight)}円）借方。`
      };
    }
  },
  {
    id: 23, topic: '仕入', tags: ['仕入', '買掛金', '返品'],
    generate: (a) => ({
      question: `掛けで仕入れた商品のうち${fmt(a)}円分を品質不良のため返品した。`,
      debit:  [{ account: '買掛金', amount: a }],
      credit: [{ account: '仕入',   amount: a }],
      explanation: '返品で買掛金（負債↓）借方、仕入（費用↓）貸方。'
    })
  },

  // ===== 前払金 (3) =====
  {
    id: 24, topic: '前払金', tags: ['前払金', '現金'],
    generate: (a) => ({
      question: `商品${fmt(a * 2)}円を注文し、手付金として${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '前払金', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '手付金は将来の仕入に充当する権利→前払金（資産↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 25, topic: '前払金', tags: ['前払金', '仕入', '買掛金'],
    generate: (a) => ({
      question: `前払金${fmt(a)}円を支払っていた商品${fmt(a * 3)}円が納品された。残額は掛けとした。`,
      debit:  [{ account: '仕入', amount: a * 3 }],
      credit: [
        { account: '前払金', amount: a },
        { account: '買掛金', amount: a * 2 }
      ],
      explanation: '仕入全額借方。前払金（資産↓）と残額買掛金（負債↑）を貸方に充当。'
    })
  },
  {
    id: 26, topic: '前払金', tags: ['前払金', '現金'],
    generate: (a) => ({
      question: `注文をキャンセルし、前払金${fmt(a)}円が現金で返金された。`,
      debit:  [{ account: '現金',   amount: a }],
      credit: [{ account: '前払金', amount: a }],
      explanation: '前払金返金：現金（資産↑）借方、前払金（資産↓）貸方。'
    })
  },

  // ===== 前受金 (3) =====
  {
    id: 27, topic: '前受金', tags: ['前受金', '現金'],
    generate: (a) => ({
      question: `商品の注文を受け、手付金${fmt(a)}円を現金で受け取った。`,
      debit:  [{ account: '現金',   amount: a }],
      credit: [{ account: '前受金', amount: a }],
      explanation: '手付金受取：現金（資産↑）借方、前受金（負債↑）貸方。まだ売上でない点に注意。'
    })
  },
  {
    id: 28, topic: '前受金', tags: ['前受金', '売上', '売掛金'],
    generate: (a) => ({
      question: `前受金${fmt(a)}円を受け取っていた商品${fmt(a * 2)}円を引き渡した。残額は掛けとした。`,
      debit:  [
        { account: '前受金', amount: a },
        { account: '売掛金', amount: a }
      ],
      credit: [{ account: '売上', amount: a * 2 }],
      explanation: '前受金（負債↓）借方、残額売掛金（資産↑）借方、売上全額貸方。'
    })
  },
  {
    id: 29, topic: '前受金', tags: ['前受金', '普通預金'],
    generate: (a) => ({
      question: `商品${fmt(a)}円の注文を受け、手付金${fmt(Math.round(a * 0.3))}円が普通預金に振り込まれた。`,
      debit:  [{ account: '普通預金', amount: Math.round(a * 0.3) }],
      credit: [{ account: '前受金',   amount: Math.round(a * 0.3) }],
      explanation: '振込受取：普通預金（資産↑）借方、前受金（負債↑）貸方。'
    })
  },

  // ===== 未収入金 (4) =====
  {
    id: 30, topic: '未収入金', tags: ['未収入金', '備品'],
    generate: (a) => ({
      question: `不用になった備品（帳簿価額${fmt(a)}円）を${fmt(Math.round(a * 1.2))}円で売却し、代金は月末に受け取る予定。`,
      debit:  [{ account: '未収入金', amount: Math.round(a * 1.2) }],
      credit: [
        { account: '備品',          amount: a },
        { account: '固定資産売却益', amount: Math.round(a * 0.2) }
      ],
      explanation: '売却代金は後日受取→未収入金（資産↑）借方。備品（資産↓）と売却益（収益↑）を貸方。'
    })
  },
  {
    id: 31, topic: '未収入金', tags: ['未収入金', '現金'],
    generate: (a) => ({
      question: `未収入金${fmt(a)}円を現金で受け取った。`,
      debit:  [{ account: '現金',     amount: a }],
      credit: [{ account: '未収入金', amount: a }],
      explanation: '未収入金回収：現金（資産↑）借方、未収入金（資産↓）貸方。'
    })
  },
  {
    id: 32, topic: '未収入金', tags: ['未収入金', '備品'],
    generate: (a) => ({
      question: `備品（帳簿価額${fmt(a)}円）を帳簿価額と同額で売却し、代金は後日受け取る。`,
      debit:  [{ account: '未収入金', amount: a }],
      credit: [{ account: '備品',     amount: a }],
      explanation: '帳簿価額で売却→損益なし。未収入金（資産↑）借方、備品（資産↓）貸方。'
    })
  },
  {
    id: 33, topic: '未収入金', tags: ['未収入金', '普通預金'],
    generate: (a) => ({
      question: `未収入金${fmt(a)}円が普通預金に振り込まれた。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '未収入金', amount: a }],
      explanation: '振込回収：普通預金（資産↑）借方、未収入金（資産↓）貸方。'
    })
  },

  // ===== 未払金 (3) =====
  {
    id: 34, topic: '未払金', tags: ['未払金', '備品'],
    generate: (a) => ({
      question: `備品${fmt(a)}円を購入し、代金は月末払いとした。`,
      debit:  [{ account: '備品',   amount: a }],
      credit: [{ account: '未払金', amount: a }],
      explanation: '備品（資産↑）借方、代金後払いで未払金（負債↑）貸方。'
    })
  },
  {
    id: 35, topic: '未払金', tags: ['未払金', '現金'],
    generate: (a) => ({
      question: `未払金${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '未払金', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '未払金（負債↓）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 36, topic: '未払金', tags: ['未払金', '通信費'],
    generate: (a) => ({
      question: `当月分の電話料金${fmt(a)}円が未払いである。`,
      debit:  [{ account: '通信費', amount: a }],
      credit: [{ account: '未払金', amount: a }],
      explanation: '費用発生：通信費（費用↑）借方、まだ払っていないので未払金（負債↑）貸方。'
    })
  },

  // ===== 仮払金 (4) =====
  {
    id: 37, topic: '仮払金', tags: ['仮払金', '現金'],
    generate: (a) => ({
      question: `出張のため、概算額${fmt(a)}円を現金で渡した。`,
      debit:  [{ account: '仮払金', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '金額未確定の支払い→仮払金（資産↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 38, topic: '仮払金', tags: ['仮払金', '旅費交通費'],
    generate: (a) => {
      const actual = Math.round(a * 0.9);
      const refund = a - actual;
      return {
        question: `出張から戻り、仮払金${fmt(a)}円の精算をした。旅費交通費は${fmt(actual)}円で、残金${fmt(refund)}円は現金で返金された。`,
        debit:  [
          { account: '旅費交通費', amount: actual },
          { account: '現金',       amount: refund }
        ],
        credit: [{ account: '仮払金', amount: a }],
        explanation: `実費（${fmt(actual)}円）を費用計上。余剰（${fmt(refund)}円）は現金返金。仮払金（資産↓）貸方。`
      };
    }
  },
  {
    id: 39, topic: '仮払金', tags: ['仮払金', '旅費交通費', '現金'],
    generate: (a) => {
      const extra = Math.round(a * 0.1);
      return {
        question: `出張旅費の精算をした。仮払金${fmt(a)}円に対し実費は${fmt(a + extra)}円だったため、不足分${fmt(extra)}円を現金で追加支払いした。`,
        debit:  [{ account: '旅費交通費', amount: a + extra }],
        credit: [
          { account: '仮払金', amount: a },
          { account: '現金',   amount: extra }
        ],
        explanation: `旅費全額（${fmt(a + extra)}円）を費用計上。仮払金（資産↓）と不足分現金（資産↓）を貸方。`
      };
    }
  },
  {
    id: 40, topic: '仮払金', tags: ['仮払金', '消耗品費'],
    generate: (a) => ({
      question: `仮払金${fmt(a)}円で消耗品を購入し、全額消耗した。`,
      debit:  [{ account: '消耗品費', amount: a }],
      credit: [{ account: '仮払金',   amount: a }],
      explanation: '消耗品費（費用↑）借方、仮払金（資産↓）貸方。'
    })
  },

  // ===== 仮受金 (3) =====
  {
    id: 41, topic: '仮受金', tags: ['仮受金', '現金'],
    generate: (a) => ({
      question: `内容不明の入金${fmt(a)}円があった。`,
      debit:  [{ account: '現金',   amount: a }],
      credit: [{ account: '仮受金', amount: a }],
      explanation: '内容不明のため仮受金（負債↑）を貸方に計上。現金（資産↑）借方。'
    })
  },
  {
    id: 42, topic: '仮受金', tags: ['仮受金', '売掛金'],
    generate: (a) => ({
      question: `仮受金${fmt(a)}円は、得意先からの売掛金の回収であることが判明した。`,
      debit:  [{ account: '仮受金', amount: a }],
      credit: [{ account: '売掛金', amount: a }],
      explanation: '仮受金（負債↓）借方、売掛金（資産↓）貸方に振り替え。'
    })
  },
  {
    id: 43, topic: '仮受金', tags: ['仮受金', '前受金'],
    generate: (a) => ({
      question: `仮受金${fmt(a)}円は、商品注文の手付金であることが判明した。`,
      debit:  [{ account: '仮受金', amount: a }],
      credit: [{ account: '前受金', amount: a }],
      explanation: '仮受金（負債↓）借方、前受金（負債↑）貸方に振り替え。'
    })
  },

  // ===== 立替金 (4) =====
  {
    id: 44, topic: '立替金', tags: ['立替金', '現金'],
    generate: (a) => ({
      question: `従業員に代わって社会保険料${fmt(a)}円を現金で立て替えて支払った。`,
      debit:  [{ account: '立替金', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '他者に代わって支払い→立替金（資産↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 45, topic: '立替金', tags: ['立替金', '現金'],
    generate: (a) => ({
      question: `立替金${fmt(a)}円を現金で回収した。`,
      debit:  [{ account: '現金',   amount: a }],
      credit: [{ account: '立替金', amount: a }],
      explanation: '立替金回収：現金（資産↑）借方、立替金（資産↓）貸方。'
    })
  },
  {
    id: 46, topic: '立替金', tags: ['立替金', '普通預金'],
    generate: (a) => ({
      question: `取引先の経費${fmt(a)}円を普通預金から立て替えて支払った。`,
      debit:  [{ account: '立替金',   amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '立替金（資産↑）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 47, topic: '立替金', tags: ['立替金', '給料'],
    generate: (a) => ({
      question: `給料支払時に、従業員の立替金${fmt(a)}円を差し引き、残額を現金で支払った。給料総額は${fmt(a * 5)}円。`,
      debit:  [{ account: '給料', amount: a * 5 }],
      credit: [
        { account: '立替金', amount: a },
        { account: '現金',   amount: a * 4 }
      ],
      explanation: `給料全額（${fmt(a * 5)}円）を費用計上。立替金（資産↓）と差引現金（資産↓）を貸方。`
    })
  },

  // ===== 預り金 (4) =====
  {
    id: 48, topic: '預り金', tags: ['預り金', '給料', '現金'],
    generate: (a) => {
      const tax = Math.round(a * 0.1);
      const net = a - tax;
      return {
        question: `給料${fmt(a)}円から所得税${fmt(tax)}円を差し引き、残額${fmt(net)}円を現金で支払った。`,
        debit:  [{ account: '給料', amount: a }],
        credit: [
          { account: '預り金', amount: tax },
          { account: '現金',   amount: net }
        ],
        explanation: `差引いた所得税（${fmt(tax)}円）は預り金（負債↑）貸方。現金支払分（${fmt(net)}円）を貸方。`
      };
    }
  },
  {
    id: 49, topic: '預り金', tags: ['預り金', '現金'],
    generate: (a) => ({
      question: `源泉徴収した所得税${fmt(a)}円を税務署に現金で納付した。`,
      debit:  [{ account: '預り金', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '預り金（負債↓）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 50, topic: '預り金', tags: ['預り金', '給料', '社会保険料'],
    generate: (a) => {
      const ins = Math.round(a * 0.05);
      const net = a - ins;
      return {
        question: `給料${fmt(a)}円から社会保険料（従業員負担分）${fmt(ins)}円を差し引き、残額を普通預金で支払った。`,
        debit:  [{ account: '給料', amount: a }],
        credit: [
          { account: '預り金',   amount: ins },
          { account: '普通預金', amount: net }
        ],
        explanation: `社会保険料（${fmt(ins)}円）は預り金（負債↑）貸方。差引後を普通預金（資産↓）貸方。`
      };
    }
  },
  {
    id: 51, topic: '預り金', tags: ['預り金', '普通預金'],
    generate: (a) => ({
      question: `預り金${fmt(a)}円を普通預金から納付した。`,
      debit:  [{ account: '預り金',   amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '預り金（負債↓）借方、普通預金（資産↓）貸方。'
    })
  },

  // ===== クレジット売掛金 (3) =====
  {
    id: 52, topic: 'クレジット売掛金', tags: ['クレジット売掛金', '売上'],
    generate: (a) => {
      const fee = Math.round(a * 0.03);
      const net = a - fee;
      return {
        question: `クレジットカードで商品${fmt(a)}円を販売した。手数料3%が差し引かれる。`,
        debit:  [
          { account: 'クレジット売掛金', amount: net },
          { account: '支払手数料',       amount: fee }
        ],
        credit: [{ account: '売上', amount: a }],
        explanation: `売上（${fmt(a)}円）貸方。手数料（${fmt(fee)}円）費用借方、差引クレジット売掛金（${fmt(net)}円）借方。`
      };
    }
  },
  {
    id: 53, topic: 'クレジット売掛金', tags: ['クレジット売掛金', '普通預金'],
    generate: (a) => ({
      question: `クレジット売掛金${fmt(a)}円が普通預金に入金された。`,
      debit:  [{ account: '普通預金',       amount: a }],
      credit: [{ account: 'クレジット売掛金', amount: a }],
      explanation: '普通預金（資産↑）借方、クレジット売掛金（資産↓）貸方。'
    })
  },
  {
    id: 54, topic: 'クレジット売掛金', tags: ['クレジット売掛金', '売上', '支払手数料'],
    generate: (a) => {
      const fee = Math.round(a * 0.02);
      const net = a - fee;
      return {
        question: `クレジットカードで商品${fmt(a)}円を販売した。信販会社手数料は2%とする。`,
        debit:  [
          { account: 'クレジット売掛金', amount: net },
          { account: '支払手数料',       amount: fee }
        ],
        credit: [{ account: '売上', amount: a }],
        explanation: `手数料（${fmt(fee)}円）借方費用計上。クレジット売掛金（${fmt(net)}円）借方、売上全額（${fmt(a)}円）貸方。`
      };
    }
  },

  // ===== 受取手形 (4) =====
  {
    id: 55, topic: '受取手形', tags: ['受取手形', '売上'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を販売し、代金として約束手形を受け取った。`,
      debit:  [{ account: '受取手形', amount: a }],
      credit: [{ account: '売上',     amount: a }],
      explanation: '手形受取：受取手形（資産↑）借方、売上（収益↑）貸方。'
    })
  },
  {
    id: 56, topic: '受取手形', tags: ['受取手形', '普通預金'],
    generate: (a) => ({
      question: `満期日が到来した受取手形${fmt(a)}円が普通預金に入金された。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '受取手形', amount: a }],
      explanation: '満期入金：普通預金（資産↑）借方、受取手形（資産↓）貸方。'
    })
  },
  {
    id: 57, topic: '受取手形', tags: ['受取手形', '売掛金'],
    generate: (a) => ({
      question: `売掛金${fmt(a)}円を回収するために、得意先から約束手形を受け取った。`,
      debit:  [{ account: '受取手形', amount: a }],
      credit: [{ account: '売掛金',   amount: a }],
      explanation: '受取手形（資産↑）借方、売掛金（資産↓）貸方。'
    })
  },
  {
    id: 58, topic: '受取手形', tags: ['受取手形', '売上', '現金'],
    generate: (a) => {
      const cash = Math.round(a * 0.3);
      const bill = a - cash;
      return {
        question: `商品${fmt(a)}円を販売し、${fmt(cash)}円は現金で受け取り、残額は約束手形で受け取った。`,
        debit:  [
          { account: '現金',     amount: cash },
          { account: '受取手形', amount: bill }
        ],
        credit: [{ account: '売上', amount: a }],
        explanation: '現金と受取手形で売上代金を回収。売上全額を貸方。'
      };
    }
  },

  // ===== 支払手形 (4) =====
  {
    id: 59, topic: '支払手形', tags: ['支払手形', '仕入'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を仕入れ、約束手形を振り出した。`,
      debit:  [{ account: '仕入',     amount: a }],
      credit: [{ account: '支払手形', amount: a }],
      explanation: '仕入（費用↑）借方、支払手形（負債↑）貸方。'
    })
  },
  {
    id: 60, topic: '支払手形', tags: ['支払手形', '普通預金'],
    generate: (a) => ({
      question: `支払手形${fmt(a)}円の満期日が到来し、普通預金から引き落とされた。`,
      debit:  [{ account: '支払手形', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '支払手形（負債↓）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 61, topic: '支払手形', tags: ['支払手形', '買掛金'],
    generate: (a) => ({
      question: `買掛金${fmt(a)}円の支払いとして、約束手形を振り出した。`,
      debit:  [{ account: '買掛金',   amount: a }],
      credit: [{ account: '支払手形', amount: a }],
      explanation: '買掛金（負債↓）借方、支払手形（負債↑）貸方。'
    })
  },
  {
    id: 62, topic: '支払手形', tags: ['支払手形', '仕入', '現金'],
    generate: (a) => {
      const cash = Math.round(a * 0.4);
      const bill = a - cash;
      return {
        question: `商品${fmt(a)}円を仕入れ、${fmt(cash)}円を現金で支払い、残額は約束手形を振り出した。`,
        debit:  [{ account: '仕入', amount: a }],
        credit: [
          { account: '現金',     amount: cash },
          { account: '支払手形', amount: bill }
        ],
        explanation: '仕入全額借方。現金と支払手形で支払い→それぞれ貸方。'
      };
    }
  },

  // ===== 備品 (4) =====
  {
    id: 63, topic: '備品', tags: ['備品', '現金'],
    generate: (a) => ({
      question: `パソコン${fmt(a)}円を現金で購入した。`,
      debit:  [{ account: '備品', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: '備品（資産↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 64, topic: '備品', tags: ['備品', '未払金'],
    generate: (a) => ({
      question: `コピー機${fmt(a)}円を購入し、代金は翌月払いとした。`,
      debit:  [{ account: '備品',   amount: a }],
      credit: [{ account: '未払金', amount: a }],
      explanation: '備品（資産↑）借方、後払いなので未払金（負債↑）貸方。'
    })
  },
  {
    id: 65, topic: '備品', tags: ['備品', '普通預金'],
    generate: (a) => ({
      question: `オフィス用家具${fmt(a)}円を購入し、普通預金から支払った。`,
      debit:  [{ account: '備品',     amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '備品（資産↑）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 66, topic: '備品', tags: ['備品', '固定資産売却損'],
    generate: (a) => {
      const sell = Math.round(a * 0.7);
      const loss = a - sell;
      return {
        question: `帳簿価額${fmt(a)}円の備品を${fmt(sell)}円で売却し、代金は現金で受け取った。`,
        debit:  [
          { account: '現金',       amount: sell },
          { account: '固定資産売却損', amount: loss }
        ],
        credit: [{ account: '備品', amount: a }],
        explanation: `帳簿価額（${fmt(a)}円）＞売価（${fmt(sell)}円）→売却損（${fmt(loss)}円）が費用。`
      };
    }
  },

  // ===== 消耗品費 (3) =====
  {
    id: 67, topic: '消耗品費', tags: ['消耗品費', '現金'],
    generate: (a) => ({
      question: `文房具${fmt(a)}円を現金で購入し、当期中に全て使用した。`,
      debit:  [{ account: '消耗品費', amount: a }],
      credit: [{ account: '現金',     amount: a }],
      explanation: '使用済みなので消耗品費（費用↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 68, topic: '消耗品費', tags: ['消耗品費', '普通預金'],
    generate: (a) => ({
      question: `コピー用紙${fmt(a)}円を購入し、普通預金から支払った。全量使用済。`,
      debit:  [{ account: '消耗品費', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '消耗品費（費用↑）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 69, topic: '消耗品費', tags: ['消耗品費', '現金'],
    generate: (a) => ({
      question: `プリンターのインクカートリッジ${fmt(a)}円を現金で購入し、全て使用した。`,
      debit:  [{ account: '消耗品費', amount: a }],
      credit: [{ account: '現金',     amount: a }],
      explanation: '消耗品費（費用↑）借方、現金（資産↓）貸方。'
    })
  },

  // ===== 旅費交通費 (3) =====
  {
    id: 70, topic: '旅費交通費', tags: ['旅費交通費', '現金'],
    generate: (a) => ({
      question: `得意先への訪問のため、電車賃${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '旅費交通費', amount: a }],
      credit: [{ account: '現金',       amount: a }],
      explanation: '旅費交通費（費用↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 71, topic: '旅費交通費', tags: ['旅費交通費', '仮払金'],
    generate: (a) => ({
      question: `出張精算の結果、仮払金${fmt(a)}円は全て旅費交通費であった。`,
      debit:  [{ account: '旅費交通費', amount: a }],
      credit: [{ account: '仮払金',     amount: a }],
      explanation: '旅費交通費（費用↑）借方、仮払金（資産↓）貸方。'
    })
  },
  {
    id: 72, topic: '旅費交通費', tags: ['旅費交通費', '普通預金'],
    generate: (a) => ({
      question: `新幹線代${fmt(a)}円を普通預金から支払った。`,
      debit:  [{ account: '旅費交通費', amount: a }],
      credit: [{ account: '普通預金',   amount: a }],
      explanation: '旅費交通費（費用↑）借方、普通預金（資産↓）貸方。'
    })
  },

  // ===== 通信費 (3) =====
  {
    id: 73, topic: '通信費', tags: ['通信費', '現金'],
    generate: (a) => ({
      question: `切手${fmt(a)}円分を現金で購入し、全て使用した。`,
      debit:  [{ account: '通信費', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '切手（通信費：費用↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 74, topic: '通信費', tags: ['通信費', '普通預金'],
    generate: (a) => ({
      question: `当月の電話・インターネット料金${fmt(a)}円が普通預金から引き落とされた。`,
      debit:  [{ account: '通信費', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '通信費（費用↑）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 75, topic: '通信費', tags: ['通信費', '現金'],
    generate: (a) => ({
      question: `取引先への書類送付のため、宅配便料金${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '通信費', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '書類・資料の郵送料は通信費（費用↑）借方、現金（資産↓）貸方。商品発送なら発送費になる点に注意。'
    })
  },

  // ===== 租税公課 (3) =====
  {
    id: 76, topic: '租税公課', tags: ['租税公課', '現金'],
    generate: (a) => ({
      question: `収入印紙${fmt(a)}円を現金で購入し、契約書に貼付した。`,
      debit:  [{ account: '租税公課', amount: a }],
      credit: [{ account: '現金',     amount: a }],
      explanation: '収入印紙は租税公課（費用↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 77, topic: '租税公課', tags: ['租税公課', '普通預金'],
    generate: (a) => ({
      question: `固定資産税${fmt(a)}円を普通預金から納付した。`,
      debit:  [{ account: '租税公課', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '租税公課（費用↑）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 78, topic: '租税公課', tags: ['租税公課', '現金'],
    generate: (a) => ({
      question: `自動車税${fmt(a)}円を現金で納付した。`,
      debit:  [{ account: '租税公課', amount: a }],
      credit: [{ account: '現金',     amount: a }],
      explanation: '自動車税も租税公課（費用↑）借方、現金（資産↓）貸方。'
    })
  },

  // ===== 発送費 (3) =====
  {
    id: 79, topic: '発送費', tags: ['発送費', '現金'],
    generate: (a) => ({
      question: `商品発送のための運賃${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '発送費', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '発送費（費用↑）借方、現金（資産↓）貸方。'
    })
  },
  {
    id: 80, topic: '発送費', tags: ['発送費', '普通預金'],
    generate: (a) => ({
      question: `得意先への商品発送費${fmt(a)}円を普通預金から支払った。`,
      debit:  [{ account: '発送費',   amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: '発送費（費用↑）借方、普通預金（資産↓）貸方。'
    })
  },
  {
    id: 81, topic: '発送費', tags: ['発送費', '現金'],
    generate: (a) => ({
      question: `商品発送を依頼し、宅配業者に${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '発送費', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '発送費（費用↑）借方、現金（資産↓）貸方。'
    })
  },

  // ===== 貸倒引当金繰入 (4) =====
  {
    id: 82, topic: '貸倒引当金繰入', tags: ['貸倒引当金繰入', '貸倒引当金'],
    generate: () => {
      const ar = (Math.floor(Math.random() * 9) + 1) * 100000;
      const rate = 2;
      const allowance = Math.round(ar * rate / 100);
      return {
        question: `期末の売掛金残高${fmt(ar)}円に対し、${rate}%の貸倒引当金を設定する（差額補充法・前期繰越額ゼロ）。`,
        debit:  [{ account: '貸倒引当金繰入', amount: allowance }],
        credit: [{ account: '貸倒引当金',     amount: allowance }],
        explanation: `貸倒引当金繰入（費用↑）${fmt(allowance)}円を借方。貸倒引当金（評価勘定↑）を貸方。`
      };
    }
  },
  {
    id: 83, topic: '貸倒引当金繰入', tags: ['貸倒引当金繰入', '貸倒引当金'],
    generate: () => {
      const ar = (Math.floor(Math.random() * 9) + 1) * 100000;
      const prev = Math.round(ar * 0.01);
      const target = Math.round(ar * 0.02);
      const add = target - prev;
      return {
        question: `売掛金残高${fmt(ar)}円に対し2%の貸倒引当金を差額補充法で設定する。前期繰越額${fmt(prev)}円。`,
        debit:  [{ account: '貸倒引当金繰入', amount: add }],
        credit: [{ account: '貸倒引当金',     amount: add }],
        explanation: `目標額（${fmt(target)}円）－前期繰越（${fmt(prev)}円）＝追加繰入（${fmt(add)}円）。`
      };
    }
  },
  {
    id: 84, topic: '貸倒損失', tags: ['貸倒引当金', '貸倒損失', '売掛金'],
    generate: () => {
      const bad = (Math.floor(Math.random() * 9) + 1) * 10000;
      const allow = Math.round(bad * 0.6);
      const loss = bad - allow;
      return {
        question: `売掛金${fmt(bad)}円が貸し倒れた。貸倒引当金の残高は${fmt(allow)}円である。`,
        debit:  [
          { account: '貸倒引当金', amount: allow },
          { account: '貸倒損失',   amount: loss }
        ],
        credit: [{ account: '売掛金', amount: bad }],
        explanation: `引当金（${fmt(allow)}円）で充当後、超過分（${fmt(loss)}円）は貸倒損失（費用↑）を借方。`
      };
    }
  },
  {
    id: 85, topic: '貸倒引当金繰入', tags: ['貸倒引当金繰入', '貸倒引当金'],
    generate: () => {
      const ar = (Math.floor(Math.random() * 5) + 2) * 100000;
      const rate = 3;
      const allowance = Math.round(ar * rate / 100);
      return {
        question: `売掛金${fmt(ar)}円に対し${rate}%の貸倒引当金を設定する（洗替法・前期設定額は全額取り崩し済み）。`,
        debit:  [{ account: '貸倒引当金繰入', amount: allowance }],
        credit: [{ account: '貸倒引当金',     amount: allowance }],
        explanation: `洗替法では期首に前期分を取り崩し、期末に新たに${fmt(allowance)}円設定。`
      };
    }
  },

  // ===== 貸倒引当金戻入 (2) =====
  {
    id: 86, topic: '貸倒引当金戻入', tags: ['貸倒引当金戻入', '貸倒引当金'],
    generate: () => {
      const prev = (Math.floor(Math.random() * 9) + 1) * 10000;
      const target = Math.round(prev * 0.6);
      const reverse = prev - target;
      return {
        question: `貸倒引当金残高${fmt(prev)}円を差額補充法で${fmt(target)}円に減額する。`,
        debit:  [{ account: '貸倒引当金',   amount: reverse }],
        credit: [{ account: '貸倒引当金戻入', amount: reverse }],
        explanation: `残高が目標額より多い→超過分（${fmt(reverse)}円）を戻入（収益↑）貸方、引当金（評価勘定↓）借方。`
      };
    }
  },
  {
    id: 87, topic: '貸倒引当金戻入', tags: ['貸倒引当金戻入', '貸倒引当金', '現金'],
    generate: () => {
      const recovered = (Math.floor(Math.random() * 5) + 1) * 10000;
      return {
        question: `前期に貸倒処理した売掛金${fmt(recovered)}円が現金で回収された。`,
        debit:  [{ account: '現金',           amount: recovered }],
        credit: [{ account: '貸倒引当金戻入', amount: recovered }],
        explanation: '前期貸倒済み→回収は収益（貸倒引当金戻入）貸方に計上、現金（資産↑）借方。'
      };
    }
  },

  // ===== 貸倒損失 (2) =====
  {
    id: 88, topic: '貸倒損失', tags: ['貸倒損失', '売掛金'],
    generate: () => {
      const bad = (Math.floor(Math.random() * 9) + 1) * 10000;
      return {
        question: `売掛金${fmt(bad)}円が貸し倒れた。貸倒引当金の残高はゼロである。`,
        debit:  [{ account: '貸倒損失', amount: bad }],
        credit: [{ account: '売掛金',   amount: bad }],
        explanation: '引当金ゼロのため全額を貸倒損失（費用↑）借方、売掛金（資産↓）貸方。'
      };
    }
  },
  {
    id: 89, topic: '貸倒損失', tags: ['貸倒損失', '受取手形'],
    generate: () => {
      const bad = (Math.floor(Math.random() * 9) + 1) * 10000;
      return {
        question: `受取手形${fmt(bad)}円が不渡りとなり、回収不能と判断した。貸倒引当金残高はゼロ。`,
        debit:  [{ account: '貸倒損失', amount: bad }],
        credit: [{ account: '受取手形', amount: bad }],
        explanation: '受取手形の貸倒れ：貸倒損失（費用↑）借方、受取手形（資産↓）貸方。'
      };
    }
  },

  // ===== 減価償却費 (4) =====
  {
    id: 90, topic: '減価償却費', tags: ['減価償却費', '備品減価償却累計額'],
    generate: () => {
      const costs = [200000, 300000, 400000, 500000, 600000, 800000, 1000000];
      const years = [3, 4, 5, 6, 8, 10];
      const cost = costs[Math.floor(Math.random() * costs.length)];
      const yr   = years[Math.floor(Math.random() * years.length)];
      const dep  = Math.floor(cost / yr);
      return {
        question: `取得原価${fmt(cost)}円、耐用年数${yr}年の備品について定額法（残存価額ゼロ）で減価償却を行った。`,
        debit:  [{ account: '減価償却費',       amount: dep }],
        credit: [{ account: '備品減価償却累計額', amount: dep }],
        explanation: `定額法：${fmt(cost)}÷${yr}年＝${fmt(dep)}円。減価償却費（費用↑）借方、累計額（資産控除↑）貸方。`
      };
    }
  },
  {
    id: 91, topic: '減価償却費', tags: ['減価償却費', '車両運搬具減価償却累計額'],
    generate: () => {
      const costs = [500000, 800000, 1000000, 1500000, 2000000];
      const years = [4, 5, 6, 8];
      const cost = costs[Math.floor(Math.random() * costs.length)];
      const yr   = years[Math.floor(Math.random() * years.length)];
      const dep  = Math.floor(cost / yr);
      return {
        question: `取得原価${fmt(cost)}円、耐用年数${yr}年の車両について定額法（残存価額ゼロ）で減価償却を行った。`,
        debit:  [{ account: '減価償却費',           amount: dep }],
        credit: [{ account: '車両運搬具減価償却累計額', amount: dep }],
        explanation: `${fmt(cost)}÷${yr}年＝${fmt(dep)}円。費用（借方）、累計額（貸方）。`
      };
    }
  },
  {
    id: 92, topic: '減価償却費', tags: ['減価償却費', '備品'],
    generate: () => {
      const costs = [300000, 600000, 900000, 1200000];
      const years = [3, 5, 6];
      const cost = costs[Math.floor(Math.random() * costs.length)];
      const yr   = years[Math.floor(Math.random() * years.length)];
      const dep  = Math.floor(cost / yr);
      return {
        question: `取得原価${fmt(cost)}円、耐用年数${yr}年の備品について直接法で減価償却を行った（残存価額ゼロ）。`,
        debit:  [{ account: '減価償却費', amount: dep }],
        credit: [{ account: '備品',       amount: dep }],
        explanation: `直接法では備品（資産↓）を直接減額。${fmt(cost)}÷${yr}年＝${fmt(dep)}円。`
      };
    }
  },
  {
    id: 93, topic: '減価償却費', tags: ['減価償却費', '備品減価償却累計額'],
    generate: () => {
      const costs = [240000, 360000, 480000, 600000, 720000];
      const yr = 3;
      const cost = costs[Math.floor(Math.random() * costs.length)];
      const monthly = Math.floor(cost / yr / 12);
      return {
        question: `月次決算。取得原価${fmt(cost)}円・耐用年数${yr}年の備品の当月分減価償却費を計上する（定額法・残存価額ゼロ）。`,
        debit:  [{ account: '減価償却費',       amount: monthly }],
        credit: [{ account: '備品減価償却累計額', amount: monthly }],
        explanation: `月次：${fmt(cost)}÷${yr}年÷12か月＝${fmt(monthly)}円/月。`
      };
    }
  },

  // ===== 損益振替 (4) =====
  {
    id: 94, topic: '損益振替', tags: ['損益振替', '売上', '損益'],
    generate: () => {
      const sales = (Math.floor(Math.random() * 90) + 10) * 10000;
      return {
        question: `決算において、売上${fmt(sales)}円を損益勘定に振り替えた。`,
        debit:  [{ account: '売上', amount: sales }],
        credit: [{ account: '損益', amount: sales }],
        explanation: '収益（売上）の損益振替：売上（収益↓）借方、損益（貸方）。'
      };
    }
  },
  {
    id: 95, topic: '損益振替', tags: ['損益振替', '仕入', '損益'],
    generate: () => {
      const cost = (Math.floor(Math.random() * 90) + 10) * 10000;
      return {
        question: `決算において、仕入${fmt(cost)}円を損益勘定に振り替えた。`,
        debit:  [{ account: '損益', amount: cost }],
        credit: [{ account: '仕入', amount: cost }],
        explanation: '費用（仕入）の損益振替：損益（借方）、仕入（費用↓）貸方。'
      };
    }
  },
  {
    id: 96, topic: '損益振替', tags: ['損益振替', '繰越利益剰余金'],
    generate: () => {
      const profit = (Math.floor(Math.random() * 90) + 10) * 10000;
      return {
        question: `決算において、当期純利益${fmt(profit)}円を繰越利益剰余金に振り替えた。`,
        debit:  [{ account: '損益',           amount: profit }],
        credit: [{ account: '繰越利益剰余金', amount: profit }],
        explanation: '当期純利益→繰越利益剰余金へ。損益（借方）、繰越利益剰余金（純資産↑）貸方。'
      };
    }
  },
  {
    id: 97, topic: '損益振替', tags: ['損益振替', '繰越利益剰余金', '当期純損失'],
    generate: () => {
      const loss = (Math.floor(Math.random() * 50) + 5) * 10000;
      return {
        question: `決算において、当期純損失${fmt(loss)}円を繰越利益剰余金に振り替えた。`,
        debit:  [{ account: '繰越利益剰余金', amount: loss }],
        credit: [{ account: '損益',           amount: loss }],
        explanation: '純損失の場合：繰越利益剰余金（純資産↓）借方、損益（貸方）。純利益とは逆になる点に注意。'
      };
    }
  },

  // ===== 繰越利益剰余金 (3) =====
  {
    id: 98, topic: '繰越利益剰余金', tags: ['繰越利益剰余金', '未払配当金'],
    generate: () => {
      const div = (Math.floor(Math.random() * 9) + 1) * 100000;
      return {
        question: `株主総会で配当金${fmt(div)}円の支払いが決議された。`,
        debit:  [{ account: '繰越利益剰余金', amount: div }],
        credit: [{ account: '未払配当金',     amount: div }],
        explanation: '配当決議：繰越利益剰余金（純資産↓）借方、未払配当金（負債↑）貸方。'
      };
    }
  },
  {
    id: 99, topic: '繰越利益剰余金', tags: ['繰越利益剰余金', '損益'],
    generate: () => {
      const profit = (Math.floor(Math.random() * 90) + 10) * 10000;
      return {
        question: `当期純利益${fmt(profit)}円を損益勘定から繰越利益剰余金へ振り替えた。`,
        debit:  [{ account: '損益',           amount: profit }],
        credit: [{ account: '繰越利益剰余金', amount: profit }],
        explanation: '利益確定：損益勘定（借方）、繰越利益剰余金（純資産↑）貸方。'
      };
    }
  },
  {
    id: 100, topic: '繰越利益剰余金', tags: ['繰越利益剰余金', '未払配当金', '現金'],
    generate: () => {
      const div = (Math.floor(Math.random() * 9) + 1) * 100000;
      return {
        question: `配当金${fmt(div)}円を現金で支払った（配当支払）。`,
        debit:  [{ account: '未払配当金', amount: div }],
        credit: [{ account: '現金',       amount: div }],
        explanation: '配当支払：未払配当金（負債↓）借方、現金（資産↓）貸方。'
      };
    }
  },

  // ===== 消費税（税抜処理） (6) =====
  {
    id: 101, topic: '消費税', tags: ['消費税', '仮払消費税', '仕入', '現金'],
    generate: (a) => {
      const tax = a * 0.1;
      const total = a + tax;
      return {
        question: `商品${fmt(a)}円（税抜）を現金で仕入れた。消費税（税率10%）は税抜処理とする。`,
        debit:  [{ account: '仕入', amount: a }, { account: '仮払消費税', amount: tax }],
        credit: [{ account: '現金', amount: total }],
        explanation: `税抜処理：仕入${fmt(a)}円・仮払消費税${fmt(tax)}円（借方）、現金${fmt(total)}円（貸方）。仮払消費税は後で仮受消費税と相殺する。`
      };
    }
  },
  {
    id: 102, topic: '消費税', tags: ['消費税', '仮払消費税', '仕入', '買掛金'],
    generate: (a) => {
      const tax = a * 0.1;
      const total = a + tax;
      return {
        question: `商品${fmt(a)}円（税抜）を掛けで仕入れた。消費税（税率10%）は税抜処理とする。`,
        debit:  [{ account: '仕入', amount: a }, { account: '仮払消費税', amount: tax }],
        credit: [{ account: '買掛金', amount: total }],
        explanation: `税抜処理：仕入${fmt(a)}円・仮払消費税${fmt(tax)}円（借方）、買掛金${fmt(total)}円（貸方）。`
      };
    }
  },
  {
    id: 103, topic: '消費税', tags: ['消費税', '仮受消費税', '売上', '現金'],
    generate: (a) => {
      const tax = a * 0.1;
      const total = a + tax;
      return {
        question: `商品${fmt(a)}円（税抜）を現金で販売した。消費税（税率10%）は税抜処理とする。`,
        debit:  [{ account: '現金', amount: total }],
        credit: [{ account: '売上', amount: a }, { account: '仮受消費税', amount: tax }],
        explanation: `税抜処理：現金${fmt(total)}円（借方）、売上${fmt(a)}円・仮受消費税${fmt(tax)}円（貸方）。仮受消費税は預かった消費税（負債）。`
      };
    }
  },
  {
    id: 104, topic: '消費税', tags: ['消費税', '仮受消費税', '売上', '売掛金'],
    generate: (a) => {
      const tax = a * 0.1;
      const total = a + tax;
      return {
        question: `商品${fmt(a)}円（税抜）を掛けで販売した。消費税（税率10%）は税抜処理とする。`,
        debit:  [{ account: '売掛金', amount: total }],
        credit: [{ account: '売上', amount: a }, { account: '仮受消費税', amount: tax }],
        explanation: `税抜処理：売掛金${fmt(total)}円（借方）、売上${fmt(a)}円・仮受消費税${fmt(tax)}円（貸方）。`
      };
    }
  },
  {
    id: 105, topic: '消費税', tags: ['消費税', '仮受消費税', '仮払消費税', '未払消費税'],
    generate: () => {
      const kariukeList = [50000, 60000, 80000, 100000, 120000, 150000, 200000];
      const kariukeAmt = kariukeList[Math.floor(Math.random() * kariukeList.length)];
      const ratios = [0.5, 0.6, 0.7, 0.75, 0.8];
      const ratio = ratios[Math.floor(Math.random() * ratios.length)];
      const karibaraiAmt = Math.round(kariukeAmt * ratio / 1000) * 1000;
      const mibaraiAmt = kariukeAmt - karibaraiAmt;
      return {
        question: `決算において、仮受消費税${fmt(kariukeAmt)}円と仮払消費税${fmt(karibaraiAmt)}円を相殺し、差額を未払消費税として計上した。`,
        debit:  [{ account: '仮受消費税', amount: kariukeAmt }],
        credit: [{ account: '仮払消費税', amount: karibaraiAmt }, { account: '未払消費税', amount: mibaraiAmt }],
        explanation: `仮受消費税（負債↓）${fmt(kariukeAmt)}円を借方、仮払消費税（資産↓）${fmt(karibaraiAmt)}円・未払消費税（負債↑）${fmt(mibaraiAmt)}円を貸方。差額が納税義務額。`
      };
    }
  },
  {
    id: 106, topic: '消費税', tags: ['消費税', '未払消費税', '普通預金'],
    generate: (a) => ({
      question: `確定申告により確定した消費税${fmt(a)}円を普通預金から納付した。`,
      debit:  [{ account: '未払消費税', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `未払消費税（負債↓）借方、普通預金（資産↓）貸方。申告後の消費税納付処理。`
    })
  },

  // ===== 小口現金 (3) =====
  {
    id: 124, topic: '小口現金', tags: ['小口現金', '普通預金'],
    generate: (a) => ({
      question: `小口現金係に小口現金${fmt(a)}円を普通預金から補給した。`,
      debit:  [{ account: '小口現金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `小口現金（資産↑）借方、普通預金（資産↓）貸方。インプレスト制での定期補給。`
    })
  },
  {
    id: 125, topic: '小口現金', tags: ['小口現金', '旅費交通費', '通信費', '消耗品費'],
    generate: () => {
      const travel = (Math.floor(Math.random() * 5) + 1) * 2000;
      const comm   = (Math.floor(Math.random() * 3) + 1) * 1000;
      const supply = (Math.floor(Math.random() * 3) + 1) * 1000;
      const total  = travel + comm + supply;
      return {
        question: `小口現金係から報告を受けた。旅費交通費${fmt(travel)}円、通信費${fmt(comm)}円、消耗品費${fmt(supply)}円の支払いがあった。`,
        debit:  [
          { account: '旅費交通費', amount: travel },
          { account: '通信費', amount: comm },
          { account: '消耗品費', amount: supply },
        ],
        credit: [{ account: '小口現金', amount: total }],
        explanation: `各費用を借方計上、小口現金（資産↓）貸方で支出記録。合計${fmt(total)}円。`
      };
    }
  },
  {
    id: 126, topic: '小口現金', tags: ['小口現金', '普通預金', '旅費交通費', '消耗品費'],
    generate: () => {
      const travel = (Math.floor(Math.random() * 5) + 1) * 2000;
      const supply = (Math.floor(Math.random() * 3) + 1) * 1000;
      const total  = travel + supply;
      return {
        question: `小口現金係より旅費交通費${fmt(travel)}円・消耗品費${fmt(supply)}円の報告を受け、直ちに普通預金から補給した。`,
        debit:  [
          { account: '旅費交通費', amount: travel },
          { account: '消耗品費', amount: supply },
        ],
        credit: [{ account: '普通預金', amount: total }],
        explanation: `費用計上と同時に補給する場合：費用（借方）、普通預金（貸方）。小口現金残高は変わらない。`
      };
    }
  },

  // ===== 給料 (4) =====
  {
    id: 107, topic: '給料', tags: ['給料', '預り金', '現金'],
    generate: () => {
      const gross = (Math.floor(Math.random() * 8) + 2) * 50000;
      const tax   = Math.round(gross * 0.08 / 1000) * 1000;
      const net   = gross - tax;
      return {
        question: `給料${fmt(gross)}円を支払った。源泉所得税${fmt(tax)}円を控除し、残額を現金で支払った。`,
        debit:  [{ account: '給料', amount: gross }],
        credit: [{ account: '預り金', amount: tax }, { account: '現金', amount: net }],
        explanation: `給料（費用↑）借方${fmt(gross)}円。源泉所得税は預り金（負債↑）${fmt(tax)}円、差引支給額${fmt(net)}円を現金で支払う。`
      };
    }
  },
  {
    id: 108, topic: '給料', tags: ['給料', '預り金', '社会保険料', '普通預金'],
    generate: () => {
      const gross   = (Math.floor(Math.random() * 8) + 2) * 50000;
      const tax     = Math.round(gross * 0.08 / 1000) * 1000;
      const shakai  = Math.round(gross * 0.05 / 1000) * 1000;
      const net     = gross - tax - shakai;
      return {
        question: `給料${fmt(gross)}円を支払った。源泉所得税${fmt(tax)}円・社会保険料（従業員負担）${fmt(shakai)}円を控除し、残額を普通預金から振り込んだ。`,
        debit:  [{ account: '給料', amount: gross }],
        credit: [{ account: '預り金', amount: tax + shakai }, { account: '普通預金', amount: net }],
        explanation: `給料（費用↑）借方${fmt(gross)}円。控除合計${fmt(tax + shakai)}円は預り金（負債↑）、差引${fmt(net)}円を普通預金で支払う。`
      };
    }
  },
  {
    id: 109, topic: '給料', tags: ['給料', '預り金', '現金', '社会保険料'],
    generate: () => {
      const hensoku = (Math.floor(Math.random() * 9) + 1) * 10000;
      return {
        question: `源泉徴収していた所得税${fmt(hensoku)}円を現金で税務署に納付した。`,
        debit:  [{ account: '預り金', amount: hensoku }],
        credit: [{ account: '現金', amount: hensoku }],
        explanation: `預り金（負債↓）借方、現金（資産↓）貸方。源泉所得税の納付処理。`
      };
    }
  },
  {
    id: 110, topic: '給料', tags: ['給料', '預り金', '社会保険料', '普通預金'],
    generate: () => {
      const employee = (Math.floor(Math.random() * 9) + 1) * 10000;
      const company  = employee;
      const total    = employee + company;
      return {
        question: `社会保険料${fmt(total)}円を普通預金から納付した。このうち従業員負担分${fmt(employee)}円は預り金から、会社負担分${fmt(company)}円は社会保険料勘定から充当する。`,
        debit:  [{ account: '預り金', amount: employee }, { account: '社会保険料', amount: company }],
        credit: [{ account: '普通預金', amount: total }],
        explanation: `従業員負担分：預り金（負債↓）借方${fmt(employee)}円。会社負担分：社会保険料（費用↓）借方${fmt(company)}円。合計${fmt(total)}円を普通預金で納付。`
      };
    }
  },

  // ===== 前払費用 (3) =====
  {
    id: 127, topic: '前払費用', tags: ['前払費用', '保険料'],
    generate: () => {
      const total = (Math.floor(Math.random() * 5) + 1) * 12000;
      const prepaid = Math.round(total / 12 * (Math.floor(Math.random() * 5) + 2));
      return {
        question: `決算において、支払済みの保険料${fmt(total)}円のうち次期分${fmt(prepaid)}円を前払費用に計上した。`,
        debit:  [{ account: '前払費用', amount: prepaid }],
        credit: [{ account: '保険料', amount: prepaid }],
        explanation: `次期分は費用でなく資産：前払費用（資産↑）借方、保険料（費用↓）貸方。`
      };
    }
  },
  {
    id: 128, topic: '前払費用', tags: ['前払費用', '支払家賃'],
    generate: () => {
      const monthly = (Math.floor(Math.random() * 5) + 1) * 10000;
      const months  = Math.floor(Math.random() * 3) + 2;
      const prepaid = monthly * months;
      return {
        question: `決算において、支払家賃のうち次期分${fmt(prepaid)}円（${months}か月分）を前払費用に振り替えた。`,
        debit:  [{ account: '前払費用', amount: prepaid }],
        credit: [{ account: '支払家賃', amount: prepaid }],
        explanation: `次期分の家賃は資産計上：前払費用（資産↑）借方、支払家賃（費用↓）貸方。`
      };
    }
  },
  {
    id: 129, topic: '前払費用', tags: ['前払費用', '保険料'],
    generate: (a) => ({
      question: `期首において、前期末に計上した前払費用${fmt(a)}円を保険料に再振替した。`,
      debit:  [{ account: '保険料', amount: a }],
      credit: [{ account: '前払費用', amount: a }],
      explanation: `再振替：期首に前払費用（資産↓）貸方、保険料（費用↑）借方に戻す。`
    })
  },

  // ===== 未払費用 (3) =====
  {
    id: 130, topic: '未払費用', tags: ['未払費用', '給料'],
    generate: () => {
      const monthly = (Math.floor(Math.random() * 8) + 2) * 50000;
      return {
        question: `決算において、当月分給料${fmt(monthly)}円が未払いであるため、未払費用として計上した。`,
        debit:  [{ account: '給料', amount: monthly }],
        credit: [{ account: '未払費用', amount: monthly }],
        explanation: `未払いの費用も当期費用：給料（費用↑）借方、未払費用（負債↑）貸方。`
      };
    }
  },
  {
    id: 131, topic: '未払費用', tags: ['未払費用', '支払利息'],
    generate: () => {
      const interest = (Math.floor(Math.random() * 9) + 1) * 3000;
      return {
        question: `決算において、借入金に対する利息${fmt(interest)}円が未払いであるため、未払費用として計上した。`,
        debit:  [{ account: '支払利息', amount: interest }],
        credit: [{ account: '未払費用', amount: interest }],
        explanation: `未払利息も当期費用：支払利息（費用↑）借方、未払費用（負債↑）貸方。`
      };
    }
  },
  {
    id: 132, topic: '未払費用', tags: ['未払費用', '給料'],
    generate: (a) => ({
      question: `期首において、前期末に計上した未払費用${fmt(a)}円（給料）を再振替した。`,
      debit:  [{ account: '未払費用', amount: a }],
      credit: [{ account: '給料', amount: a }],
      explanation: `再振替：期首に未払費用（負債↓）借方、給料（費用↓）貸方で取り消す。`
    })
  },

  // ===== 未収収益 (2) =====
  {
    id: 133, topic: '未収収益', tags: ['未収収益', '受取利息'],
    generate: () => {
      const interest = (Math.floor(Math.random() * 9) + 1) * 2000;
      return {
        question: `決算において、貸付金に対する未収利息${fmt(interest)}円を未収収益として計上した。`,
        debit:  [{ account: '未収収益', amount: interest }],
        credit: [{ account: '受取利息', amount: interest }],
        explanation: `当期分の未収利息を収益計上：未収収益（資産↑）借方、受取利息（収益↑）貸方。`
      };
    }
  },
  {
    id: 134, topic: '未収収益', tags: ['未収収益', '受取家賃'],
    generate: () => {
      const rent = (Math.floor(Math.random() * 5) + 1) * 20000;
      return {
        question: `決算において、当月分の受取家賃${fmt(rent)}円がいまだ入金されていないため、未収収益として計上した。`,
        debit:  [{ account: '未収収益', amount: rent }],
        credit: [{ account: '受取家賃', amount: rent }],
        explanation: `未収の収益も当期収益：未収収益（資産↑）借方、受取家賃（収益↑）貸方。`
      };
    }
  },

  // ===== 前受収益 (2) =====
  {
    id: 135, topic: '前受収益', tags: ['前受収益', '受取家賃'],
    generate: () => {
      const monthly = (Math.floor(Math.random() * 5) + 1) * 20000;
      const months  = Math.floor(Math.random() * 3) + 2;
      const deferred = monthly * months;
      return {
        question: `決算において、受取家賃のうち次期分${fmt(deferred)}円（${months}か月分）を前受収益に振り替えた。`,
        debit:  [{ account: '受取家賃', amount: deferred }],
        credit: [{ account: '前受収益', amount: deferred }],
        explanation: `次期分の収益は当期に認識しない：受取家賃（収益↓）借方、前受収益（負債↑）貸方。`
      };
    }
  },
  {
    id: 136, topic: '前受収益', tags: ['前受収益', '受取利息'],
    generate: () => {
      const interest = (Math.floor(Math.random() * 9) + 1) * 2000;
      return {
        question: `決算において、受取利息のうち次期分${fmt(interest)}円を前受収益に振り替えた。`,
        debit:  [{ account: '受取利息', amount: interest }],
        credit: [{ account: '前受収益', amount: interest }],
        explanation: `次期分利息は収益繰延：受取利息（収益↓）借方、前受収益（負債↑）貸方。`
      };
    }
  },

  // ===== 消耗品（資産） (2) =====
  {
    id: 137, topic: '消耗品', tags: ['消耗品', '消耗品費'],
    generate: () => {
      const total   = (Math.floor(Math.random() * 9) + 1) * 10000;
      const remain  = (Math.floor(Math.random() * 4) + 1) * 2000;
      const used    = total - remain;
      return {
        question: `期中に消耗品${fmt(total)}円を購入し消耗品費として処理した。決算において未使用分${fmt(remain)}円が残っていたため消耗品（資産）に振り替えた。`,
        debit:  [{ account: '消耗品', amount: remain }],
        credit: [{ account: '消耗品費', amount: remain }],
        explanation: `未使用の消耗品は資産：消耗品（資産↑）借方、消耗品費（費用↓）貸方。当期費用は${fmt(used)}円。`
      };
    }
  },
  {
    id: 138, topic: '消耗品', tags: ['消耗品', '消耗品費'],
    generate: (a) => ({
      question: `期首において、前期末に資産計上した消耗品${fmt(a)}円を消耗品費に振り替えた（期首再振替）。`,
      debit:  [{ account: '消耗品費', amount: a }],
      credit: [{ account: '消耗品', amount: a }],
      explanation: `期首再振替：消耗品（資産↓）貸方、消耗品費（費用↑）借方。当期使用前提で費用化。`
    })
  },

  // ===== 修繕費 (3) =====
  {
    id: 139, topic: '修繕費', tags: ['修繕費', '現金'],
    generate: (a) => ({
      question: `備品の修理費用${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '修繕費', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: `原状回復のための修繕は費用：修繕費（費用↑）借方、現金（資産↓）貸方。`
    })
  },
  {
    id: 140, topic: '修繕費', tags: ['修繕費', '普通預金'],
    generate: (a) => ({
      question: `建物の修繕費${fmt(a)}円を普通預金から支払った。`,
      debit:  [{ account: '修繕費', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `原状回復の修繕費（費用↑）借方、普通預金（資産↓）貸方。`
    })
  },
  {
    id: 141, topic: '修繕費', tags: ['修繕費', '備品', '現金'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 2) * 10000;
      const capex = Math.round(total * 0.6 / 10000) * 10000;
      const repair = total - capex;
      return {
        question: `備品の改修工事代金${fmt(total)}円を現金で支払った。このうち${fmt(capex)}円は資本的支出、残額${fmt(repair)}円は収益的支出である。`,
        debit:  [{ account: '備品', amount: capex }, { account: '修繕費', amount: repair }],
        credit: [{ account: '現金', amount: total }],
        explanation: `資本的支出${fmt(capex)}円は備品（資産↑）、収益的支出${fmt(repair)}円は修繕費（費用↑）。`
      };
    }
  },

  // ===== 支払家賃/受取家賃 (4) =====
  {
    id: 142, topic: '支払家賃', tags: ['支払家賃', '普通預金'],
    generate: (a) => ({
      question: `当月分の事務所家賃${fmt(a)}円を普通預金から支払った。`,
      debit:  [{ account: '支払家賃', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `支払家賃（費用↑）借方、普通預金（資産↓）貸方。`
    })
  },
  {
    id: 143, topic: '支払家賃', tags: ['支払家賃', '現金'],
    generate: (a) => ({
      question: `当月分の店舗家賃${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '支払家賃', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: `支払家賃（費用↑）借方、現金（資産↓）貸方。`
    })
  },
  {
    id: 144, topic: '受取家賃', tags: ['受取家賃', '普通預金'],
    generate: (a) => ({
      question: `所有する建物の賃料${fmt(a)}円が普通預金に振り込まれた。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '受取家賃', amount: a }],
      explanation: `受取家賃（収益↑）貸方、普通預金（資産↑）借方。`
    })
  },
  {
    id: 145, topic: '受取家賃', tags: ['受取家賃', '現金'],
    generate: (a) => ({
      question: `テナントから当月分の家賃${fmt(a)}円を現金で受け取った。`,
      debit:  [{ account: '現金', amount: a }],
      credit: [{ account: '受取家賃', amount: a }],
      explanation: `受取家賃（収益↑）貸方、現金（資産↑）借方。`
    })
  },

  // ===== 保険料 (3) =====
  {
    id: 146, topic: '保険料', tags: ['保険料', '普通預金'],
    generate: (a) => ({
      question: `火災保険料${fmt(a)}円を普通預金から支払った。`,
      debit:  [{ account: '保険料', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `保険料（費用↑）借方、普通預金（資産↓）貸方。`
    })
  },
  {
    id: 147, topic: '保険料', tags: ['保険料', '現金'],
    generate: (a) => ({
      question: `車両の自動車保険料${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '保険料', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: `保険料（費用↑）借方、現金（資産↓）貸方。`
    })
  },
  {
    id: 148, topic: '保険料', tags: ['保険料', '前払費用'],
    generate: () => {
      const annual = (Math.floor(Math.random() * 5) + 1) * 12000;
      const prepaid = Math.round(annual / 12 * 3);
      return {
        question: `決算において、保険料${fmt(annual)}円のうち次期分${fmt(prepaid)}円（3か月分）を前払費用に振り替えた。`,
        debit:  [{ account: '前払費用', amount: prepaid }],
        credit: [{ account: '保険料', amount: prepaid }],
        explanation: `次期分は資産計上：前払費用（資産↑）借方、保険料（費用↓）貸方。`
      };
    }
  },

  // ===== 資本金 (3) =====
  {
    id: 149, topic: '資本金', tags: ['資本金', '現金'],
    generate: () => {
      const capital = (Math.floor(Math.random() * 9) + 1) * 1000000;
      return {
        question: `会社を設立し、株主から出資金${fmt(capital)}円を現金で受け取った。`,
        debit:  [{ account: '現金', amount: capital }],
        credit: [{ account: '資本金', amount: capital }],
        explanation: `会社設立時：現金（資産↑）借方、資本金（純資産↑）貸方。`
      };
    }
  },
  {
    id: 150, topic: '資本金', tags: ['資本金', '普通預金'],
    generate: () => {
      const capital = (Math.floor(Math.random() * 9) + 1) * 1000000;
      return {
        question: `増資により株式を発行し、払込金${fmt(capital)}円が普通預金に振り込まれた。`,
        debit:  [{ account: '普通預金', amount: capital }],
        credit: [{ account: '資本金', amount: capital }],
        explanation: `増資：普通預金（資産↑）借方、資本金（純資産↑）貸方。`
      };
    }
  },
  {
    id: 151, topic: '資本金', tags: ['資本金', '現金', '普通預金'],
    generate: () => {
      const cash = (Math.floor(Math.random() * 5) + 1) * 500000;
      const bank = (Math.floor(Math.random() * 5) + 1) * 500000;
      const total = cash + bank;
      return {
        question: `会社設立にあたり、株主から出資を受けた。現金${fmt(cash)}円と普通預金${fmt(bank)}円の合計${fmt(total)}円を資本金とする。`,
        debit:  [{ account: '現金', amount: cash }, { account: '普通預金', amount: bank }],
        credit: [{ account: '資本金', amount: total }],
        explanation: `現金・普通預金（資産↑）借方、資本金（純資産↑）貸方。合計${fmt(total)}円。`
      };
    }
  },

  // ===== 電子記録債権/債務 (4) =====
  {
    id: 152, topic: '電子記録債権', tags: ['電子記録債権', '売掛金'],
    generate: (a) => ({
      question: `売掛金${fmt(a)}円について、電子記録債権の発生記録を行った。`,
      debit:  [{ account: '電子記録債権', amount: a }],
      credit: [{ account: '売掛金', amount: a }],
      explanation: `売掛金→電子記録債権へ振替：電子記録債権（資産↑）借方、売掛金（資産↓）貸方。`
    })
  },
  {
    id: 153, topic: '電子記録債権', tags: ['電子記録債権', '普通預金'],
    generate: (a) => ({
      question: `電子記録債権${fmt(a)}円が期日に決済され、普通預金に入金された。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '電子記録債権', amount: a }],
      explanation: `電子記録債権の決済：電子記録債権（資産↓）貸方、普通預金（資産↑）借方。`
    })
  },
  {
    id: 154, topic: '電子記録債務', tags: ['電子記録債務', '買掛金'],
    generate: (a) => ({
      question: `買掛金${fmt(a)}円について、電子記録債務の発生記録を行った。`,
      debit:  [{ account: '買掛金', amount: a }],
      credit: [{ account: '電子記録債務', amount: a }],
      explanation: `買掛金→電子記録債務へ振替：買掛金（負債↓）借方、電子記録債務（負債↑）貸方。`
    })
  },
  {
    id: 155, topic: '電子記録債務', tags: ['電子記録債務', '普通預金'],
    generate: (a) => ({
      question: `電子記録債務${fmt(a)}円の支払期日が到来し、普通預金から引き落とされた。`,
      debit:  [{ account: '電子記録債務', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `電子記録債務の決済：電子記録債務（負債↓）借方、普通預金（資産↓）貸方。`
    })
  },

  // ===== 現金 追加 (5) =====
  {
    id: 156, topic: '現金', tags: ['現金', '売掛金'],
    generate: (a) => ({
      question: `得意先から売掛金${fmt(a)}円を他社振出小切手で回収した。`,
      debit:  [{ account: '現金', amount: a }],
      credit: [{ account: '売掛金', amount: a }],
      explanation: `他社振出小切手は通貨代用証券のため現金（資産↑）として処理。売掛金（資産↓）貸方。`
    })
  },
  {
    id: 157, topic: '現金', tags: ['現金', '売上'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を販売し、得意先振出の小切手を受け取った。`,
      debit:  [{ account: '現金', amount: a }],
      credit: [{ account: '売上', amount: a }],
      explanation: `他社振出小切手は現金扱い：現金（資産↑）借方、売上（収益↑）貸方。`
    })
  },
  {
    id: 158, topic: '現金', tags: ['現金過不足', '現金', '通信費'],
    generate: () => {
      const diff = (Math.floor(Math.random() * 5) + 1) * 1000;
      return {
        question: `現金過不足勘定の借方残高${fmt(diff)}円の原因を調査したところ、通信費の記入漏れと判明した。`,
        debit:  [{ account: '通信費', amount: diff }],
        credit: [{ account: '現金過不足', amount: diff }],
        explanation: `原因判明→通信費（費用↑）借方、現金過不足（貸方）で相殺。`
      };
    }
  },
  {
    id: 159, topic: '現金', tags: ['現金過不足', '現金', '旅費交通費'],
    generate: () => {
      const diff = (Math.floor(Math.random() * 5) + 1) * 1000;
      return {
        question: `現金過不足勘定の借方残高${fmt(diff)}円の原因が旅費交通費の記入漏れと判明した。`,
        debit:  [{ account: '旅費交通費', amount: diff }],
        credit: [{ account: '現金過不足', amount: diff }],
        explanation: `原因判明→旅費交通費（費用↑）借方、現金過不足（貸方）で相殺。`
      };
    }
  },
  {
    id: 160, topic: '現金', tags: ['現金', '未収入金'],
    generate: (a) => ({
      question: `未収入金${fmt(a)}円を現金で回収した。`,
      debit:  [{ account: '現金', amount: a }],
      credit: [{ account: '未収入金', amount: a }],
      explanation: `未収入金の回収：現金（資産↑）借方、未収入金（資産↓）貸方。`
    })
  },

  // ===== 普通預金 追加 (4) =====
  {
    id: 161, topic: '普通預金', tags: ['普通預金', '支払家賃'],
    generate: (a) => ({
      question: `家賃${fmt(a)}円が普通預金から自動引き落としされた。`,
      debit:  [{ account: '支払家賃', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `支払家賃（費用↑）借方、普通預金（資産↓）貸方。自動引落処理。`
    })
  },
  {
    id: 162, topic: '普通預金', tags: ['普通預金', '支払手数料'],
    generate: () => {
      const fee = (Math.floor(Math.random() * 5) + 1) * 500;
      return {
        question: `振込に際して生じた振込手数料${fmt(fee)}円が普通預金から引き落とされた。`,
        debit:  [{ account: '支払手数料', amount: fee }],
        credit: [{ account: '普通預金', amount: fee }],
        explanation: `支払手数料（費用↑）借方、普通預金（資産↓）貸方。`
      };
    }
  },
  {
    id: 163, topic: '普通預金', tags: ['普通預金', '受取利息'],
    generate: () => {
      const gross  = (Math.floor(Math.random() * 9) + 1) * 1000;
      const tax    = Math.round(gross * 0.2 / 100) * 100;
      const net    = gross - tax;
      return {
        question: `普通預金の利息${fmt(net)}円（税引後）が入金された。なお源泉所得税${fmt(tax)}円が差し引かれている。`,
        debit:  [{ account: '普通預金', amount: net }, { account: '租税公課', amount: tax }],
        credit: [{ account: '受取利息', amount: gross }],
        explanation: `利息${fmt(gross)}円（収益）から税${fmt(tax)}円控除済み。差引入金額${fmt(net)}円が普通預金。税額は租税公課（費用）借方。`
      };
    }
  },
  {
    id: 164, topic: '普通預金', tags: ['普通預金', '売掛金', '支払手数料'],
    generate: () => {
      const recv = (Math.floor(Math.random() * 9) + 1) * 10000;
      const fee  = 500;
      const net  = recv - fee;
      return {
        question: `売掛金${fmt(recv)}円が普通預金に振り込まれた。振込手数料${fmt(fee)}円は先方負担のため差し引かれている。`,
        debit:  [{ account: '普通預金', amount: net }, { account: '支払手数料', amount: fee }],
        credit: [{ account: '売掛金', amount: recv }],
        explanation: `売掛金${fmt(recv)}円回収。手数料${fmt(fee)}円は先方負担でも当社が費用計上。入金額${fmt(net)}円。`
      };
    }
  },

  // ===== 売掛金 追加 (5) =====
  {
    id: 165, topic: '売掛金', tags: ['売掛金', '売上', '現金'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 1) * 10000;
      const cash  = Math.round(total * 0.4 / 1000) * 1000;
      const cred  = total - cash;
      return {
        question: `商品${fmt(total)}円を販売し、${fmt(cash)}円を現金で受け取り、残額${fmt(cred)}円を掛けとした。`,
        debit:  [{ account: '現金', amount: cash }, { account: '売掛金', amount: cred }],
        credit: [{ account: '売上', amount: total }],
        explanation: `売上${fmt(total)}円（収益）。一部現金受取・残額掛け：現金${fmt(cash)}円・売掛金${fmt(cred)}円借方。`
      };
    }
  },
  {
    id: 166, topic: '売掛金', tags: ['売掛金', '売上'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 1) * 10000;
      const disc  = Math.round(total * 0.05 / 1000) * 1000;
      const net   = total - disc;
      return {
        question: `売掛金${fmt(total)}円に対し、値引き${fmt(disc)}円を認めた。`,
        debit:  [{ account: '売上', amount: disc }],
        credit: [{ account: '売掛金', amount: disc }],
        explanation: `売上値引き：売上（収益↓）借方、売掛金（資産↓）貸方。残高${fmt(net)}円。`
      };
    }
  },
  {
    id: 167, topic: '売掛金', tags: ['売掛金', '売上'],
    generate: () => {
      const unit = (Math.floor(Math.random() * 5) + 1) * 10000;
      const qty  = Math.floor(Math.random() * 3) + 1;
      const total = unit * qty;
      return {
        question: `得意先より商品${qty}個（@${fmt(unit)}円）の返品があり、売掛金と相殺した。`,
        debit:  [{ account: '売上', amount: total }],
        credit: [{ account: '売掛金', amount: total }],
        explanation: `返品は売上の取消：売上（収益↓）借方、売掛金（資産↓）貸方。${qty}個×${fmt(unit)}円＝${fmt(total)}円。`
      };
    }
  },
  {
    id: 168, topic: '売掛金', tags: ['売掛金', '当座預金'],
    generate: (a) => ({
      question: `売掛金${fmt(a)}円を得意先振出の小切手で回収し、当座預金に預け入れた。`,
      debit:  [{ account: '当座預金', amount: a }],
      credit: [{ account: '売掛金', amount: a }],
      explanation: `当座預金（資産↑）借方、売掛金（資産↓）貸方。小切手を当座預金として処理。`
    })
  },
  {
    id: 169, topic: '売掛金', tags: ['売掛金', '現金', '受取手形'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 1) * 10000;
      const hand  = Math.round(total * 0.5 / 1000) * 1000;
      const note  = total - hand;
      return {
        question: `売掛金${fmt(total)}円を回収した。現金${fmt(hand)}円と約束手形${fmt(note)}円で受け取った。`,
        debit:  [{ account: '現金', amount: hand }, { account: '受取手形', amount: note }],
        credit: [{ account: '売掛金', amount: total }],
        explanation: `売掛金回収：現金${fmt(hand)}円・受取手形${fmt(note)}円（各資産↑）借方、売掛金（資産↓）貸方。`
      };
    }
  },

  // ===== 買掛金 追加 (4) =====
  {
    id: 170, topic: '買掛金', tags: ['買掛金', '当座預金'],
    generate: (a) => ({
      question: `買掛金${fmt(a)}円の支払いとして小切手を振り出した。`,
      debit:  [{ account: '買掛金', amount: a }],
      credit: [{ account: '当座預金', amount: a }],
      explanation: `買掛金（負債↓）借方、当座預金（資産↓）貸方。小切手振出による決済。`
    })
  },
  {
    id: 171, topic: '買掛金', tags: ['買掛金', '仕入'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 1) * 10000;
      const ret   = Math.round(total * 0.2 / 1000) * 1000;
      return {
        question: `仕入先に商品${fmt(ret)}円を返品し、買掛金から差し引いた。`,
        debit:  [{ account: '買掛金', amount: ret }],
        credit: [{ account: '仕入', amount: ret }],
        explanation: `返品は仕入の取消：買掛金（負債↓）借方、仕入（費用↓）貸方。`
      };
    }
  },
  {
    id: 172, topic: '買掛金', tags: ['買掛金', '仕入'],
    generate: () => {
      const disc = (Math.floor(Math.random() * 5) + 1) * 2000;
      return {
        question: `仕入先より仕入値引き${fmt(disc)}円の通知を受け、買掛金から差し引いた。`,
        debit:  [{ account: '買掛金', amount: disc }],
        credit: [{ account: '仕入', amount: disc }],
        explanation: `仕入値引き：買掛金（負債↓）借方、仕入（費用↓）貸方。`
      };
    }
  },
  {
    id: 173, topic: '買掛金', tags: ['買掛金', '支払手形', '現金'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 2) * 10000;
      const note  = Math.round(total * 0.6 / 10000) * 10000;
      const cash  = total - note;
      return {
        question: `買掛金${fmt(total)}円を支払った。約束手形${fmt(note)}円を振り出し、残額${fmt(cash)}円は現金で支払った。`,
        debit:  [{ account: '買掛金', amount: total }],
        credit: [{ account: '支払手形', amount: note }, { account: '現金', amount: cash }],
        explanation: `買掛金（負債↓）借方、支払手形${fmt(note)}円・現金${fmt(cash)}円（各貸方）で決済。`
      };
    }
  },

  // ===== 売上 追加 (4) =====
  {
    id: 174, topic: '売上', tags: ['売上', '前受金', '売掛金'],
    generate: () => {
      const total  = (Math.floor(Math.random() * 9) + 2) * 10000;
      const deposit = Math.round(total * 0.3 / 1000) * 1000;
      const remain  = total - deposit;
      return {
        question: `商品${fmt(total)}円を販売した。前受金${fmt(deposit)}円を充当し、残額${fmt(remain)}円は掛けとした。`,
        debit:  [{ account: '前受金', amount: deposit }, { account: '売掛金', amount: remain }],
        credit: [{ account: '売上', amount: total }],
        explanation: `前受金（負債↓）借方、売掛金（資産↑）借方、売上（収益↑）${fmt(total)}円貸方。`
      };
    }
  },
  {
    id: 175, topic: '売上', tags: ['売上', '売掛金'],
    generate: () => {
      const unit = (Math.floor(Math.random() * 5) + 1) * 5000;
      const qty  = Math.floor(Math.random() * 4) + 2;
      const total = unit * qty;
      return {
        question: `得意先から注文のあった商品${qty}個（@${fmt(unit)}円）の返品${qty}個を受け入れた。`,
        debit:  [{ account: '売上', amount: total }],
        credit: [{ account: '売掛金', amount: total }],
        explanation: `売上返品：売上（収益↓）借方、売掛金（資産↓）貸方。${qty}個×${fmt(unit)}円＝${fmt(total)}円。`
      };
    }
  },
  {
    id: 176, topic: '売上', tags: ['売上', '受取手形'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を販売し、代金として約束手形を受け取った。`,
      debit:  [{ account: '受取手形', amount: a }],
      credit: [{ account: '売上', amount: a }],
      explanation: `受取手形（資産↑）借方、売上（収益↑）貸方。`
    })
  },
  {
    id: 177, topic: '売上', tags: ['売上', '現金', '売掛金'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 2) * 10000;
      const cash  = Math.round(total * 0.5 / 1000) * 1000;
      const cred  = total - cash;
      return {
        question: `商品${fmt(total)}円を販売した。代金の半額${fmt(cash)}円は現金で受け取り、残額${fmt(cred)}円は掛けとした。`,
        debit:  [{ account: '現金', amount: cash }, { account: '売掛金', amount: cred }],
        credit: [{ account: '売上', amount: total }],
        explanation: `現金${fmt(cash)}円・売掛金${fmt(cred)}円（借方）、売上${fmt(total)}円（貸方）。`
      };
    }
  },

  // ===== 仕入 追加 (4) =====
  {
    id: 178, topic: '仕入', tags: ['仕入', '前払金', '買掛金'],
    generate: () => {
      const total   = (Math.floor(Math.random() * 9) + 2) * 10000;
      const deposit = Math.round(total * 0.3 / 1000) * 1000;
      const remain  = total - deposit;
      return {
        question: `商品${fmt(total)}円を仕入れた。前払金${fmt(deposit)}円を充当し、残額${fmt(remain)}円は掛けとした。`,
        debit:  [{ account: '仕入', amount: total }],
        credit: [{ account: '前払金', amount: deposit }, { account: '買掛金', amount: remain }],
        explanation: `前払金（資産↓）貸方、買掛金（負債↑）貸方、仕入（費用↑）${fmt(total)}円借方。`
      };
    }
  },
  {
    id: 179, topic: '仕入', tags: ['仕入', '買掛金'],
    generate: () => {
      const disc = (Math.floor(Math.random() * 5) + 1) * 2000;
      return {
        question: `仕入先から仕入値引き${fmt(disc)}円の通知を受け、買掛金から差し引いた。`,
        debit:  [{ account: '買掛金', amount: disc }],
        credit: [{ account: '仕入', amount: disc }],
        explanation: `仕入値引き：買掛金（負債↓）借方、仕入（費用↓）貸方。`
      };
    }
  },
  {
    id: 180, topic: '仕入', tags: ['仕入', '支払手形', '現金'],
    generate: () => {
      const total = (Math.floor(Math.random() * 9) + 2) * 10000;
      const note  = Math.round(total * 0.7 / 10000) * 10000;
      const cash  = total - note;
      return {
        question: `商品${fmt(total)}円を仕入れ、${fmt(note)}円は約束手形を振り出し、残額${fmt(cash)}円は現金で支払った。`,
        debit:  [{ account: '仕入', amount: total }],
        credit: [{ account: '支払手形', amount: note }, { account: '現金', amount: cash }],
        explanation: `仕入（費用↑）借方${fmt(total)}円。支払手形${fmt(note)}円・現金${fmt(cash)}円（各貸方）。`
      };
    }
  },
  {
    id: 181, topic: '仕入', tags: ['仕入', '買掛金', '立替金'],
    generate: () => {
      const goods = (Math.floor(Math.random() * 9) + 1) * 10000;
      const ship  = (Math.floor(Math.random() * 5) + 1) * 1000;
      const total = goods + ship;
      return {
        question: `商品${fmt(goods)}円を掛けで仕入れた。先方負担の運賃${fmt(ship)}円を当社が立替払いし、買掛金に含めた。`,
        debit:  [{ account: '仕入', amount: goods }, { account: '立替金', amount: ship }],
        credit: [{ account: '買掛金', amount: total }],
        explanation: `仕入${fmt(goods)}円（費用）・立替金${fmt(ship)}円（資産）借方、買掛金${fmt(total)}円（負債）貸方。`
      };
    }
  },

  // ===== 受取手形 追加 (3) =====
  {
    id: 182, topic: '受取手形', tags: ['受取手形', '普通預金', '支払手数料'],
    generate: () => {
      const face = (Math.floor(Math.random() * 9) + 1) * 10000;
      const disc = Math.round(face * 0.02 / 100) * 100;
      const proc = face - disc;
      return {
        question: `所持する約束手形${fmt(face)}円を銀行で割り引き、割引料${fmt(disc)}円を差し引いた手取金${fmt(proc)}円が普通預金に入金された。`,
        debit:  [{ account: '普通預金', amount: proc }, { account: '支払手数料', amount: disc }],
        credit: [{ account: '受取手形', amount: face }],
        explanation: `手形割引：受取手形（資産↓）貸方、普通預金${fmt(proc)}円（資産↑）・支払手数料${fmt(disc)}円（費用）借方。`
      };
    }
  },
  {
    id: 183, topic: '受取手形', tags: ['受取手形', '仕入', '買掛金'],
    generate: () => {
      const goods = (Math.floor(Math.random() * 9) + 1) * 10000;
      return {
        question: `商品${fmt(goods)}円を仕入れ、所持していた約束手形を裏書きして支払った。`,
        debit:  [{ account: '仕入', amount: goods }],
        credit: [{ account: '受取手形', amount: goods }],
        explanation: `手形の裏書き譲渡：仕入（費用↑）借方、受取手形（資産↓）貸方。`
      };
    }
  },
  {
    id: 184, topic: '受取手形', tags: ['受取手形', '普通預金'],
    generate: (a) => ({
      question: `所持する約束手形${fmt(a)}円が満期日を迎え、普通預金に入金された。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '受取手形', amount: a }],
      explanation: `手形の満期回収：受取手形（資産↓）貸方、普通預金（資産↑）借方。`
    })
  },

  // ===== 支払手形 追加 (3) =====
  {
    id: 185, topic: '支払手形', tags: ['支払手形', '買掛金'],
    generate: (a) => ({
      question: `買掛金${fmt(a)}円の決済として、約束手形を振り出した。`,
      debit:  [{ account: '買掛金', amount: a }],
      credit: [{ account: '支払手形', amount: a }],
      explanation: `買掛金（負債↓）借方、支払手形（負債↑）貸方。債務の振替処理。`
    })
  },
  {
    id: 186, topic: '支払手形', tags: ['支払手形', '普通預金', '現金'],
    generate: () => {
      const face = (Math.floor(Math.random() * 9) + 1) * 10000;
      const new_face = face + (Math.floor(Math.random() * 3) + 1) * 1000;
      const interest = new_face - face;
      return {
        question: `支払手形${fmt(face)}円の期日が到来したが、資金不足のため利息${fmt(interest)}円を加えた新手形${fmt(new_face)}円に更改した。`,
        debit:  [{ account: '支払手形', amount: face }, { account: '支払利息', amount: interest }],
        credit: [{ account: '支払手形', amount: new_face }],
        explanation: `手形更改：旧手形${fmt(face)}円消去（借方）、利息${fmt(interest)}円（費用）、新手形${fmt(new_face)}円計上（貸方）。`
      };
    }
  },
  {
    id: 187, topic: '支払手形', tags: ['支払手形', '仕入', '現金'],
    generate: () => {
      const goods = (Math.floor(Math.random() * 9) + 2) * 10000;
      const cash  = Math.round(goods * 0.3 / 1000) * 1000;
      const note  = goods - cash;
      return {
        question: `商品${fmt(goods)}円を仕入れ、${fmt(cash)}円を現金で支払い、残額${fmt(note)}円は約束手形を振り出した。`,
        debit:  [{ account: '仕入', amount: goods }],
        credit: [{ account: '現金', amount: cash }, { account: '支払手形', amount: note }],
        explanation: `仕入${fmt(goods)}円借方。現金${fmt(cash)}円・支払手形${fmt(note)}円貸方。`
      };
    }
  },

  // ===== 備品 追加 (3) =====
  {
    id: 188, topic: '備品', tags: ['備品', '現金', '支払手数料'],
    generate: () => {
      const price = (Math.floor(Math.random() * 9) + 1) * 50000;
      const fee   = (Math.floor(Math.random() * 3) + 1) * 2000;
      const total = price + fee;
      return {
        question: `備品${fmt(price)}円を購入し、設置費用${fmt(fee)}円と合わせて現金で支払った。`,
        debit:  [{ account: '備品', amount: total }],
        credit: [{ account: '現金', amount: total }],
        explanation: `付随費用は取得原価に含める：備品${fmt(price)}円＋設置費${fmt(fee)}円＝取得原価${fmt(total)}円。現金（資産↓）貸方。`
      };
    }
  },
  {
    id: 189, topic: '備品', tags: ['備品', '現金', '修繕費'],
    generate: () => {
      const capex  = (Math.floor(Math.random() * 5) + 2) * 50000;
      const repair = (Math.floor(Math.random() * 3) + 1) * 10000;
      const total  = capex + repair;
      return {
        question: `備品の改良工事${fmt(capex)}円と修繕${fmt(repair)}円を行い、合計${fmt(total)}円を現金で支払った。`,
        debit:  [{ account: '備品', amount: capex }, { account: '修繕費', amount: repair }],
        credit: [{ account: '現金', amount: total }],
        explanation: `改良（資本的支出）${fmt(capex)}円は備品（資産↑）、修繕（収益的支出）${fmt(repair)}円は修繕費（費用↑）。`
      };
    }
  },
  {
    id: 190, topic: '備品', tags: ['備品', '雑損'],
    generate: () => {
      const book = (Math.floor(Math.random() * 5) + 1) * 20000;
      return {
        question: `帳簿価額${fmt(book)}円の備品を除却した。`,
        debit:  [{ account: '雑損', amount: book }],
        credit: [{ account: '備品', amount: book }],
        explanation: `除却損：雑損（費用↑）借方、備品（資産↓）貸方。帳簿価額を全額損失計上。`
      };
    }
  },

  // ===== 減価償却費 追加 (4) =====
  {
    id: 191, topic: '減価償却費', tags: ['減価償却費', '備品減価償却累計額'],
    generate: () => {
      const cost  = (Math.floor(Math.random() * 5) + 2) * 100000;
      const yr    = [3, 4, 5, 6][Math.floor(Math.random() * 4)];
      const month = Math.floor(Math.random() * 11) + 1;
      const annual = Math.floor(cost / yr);
      const dep   = Math.floor(annual * month / 12);
      return {
        question: `当期の${month}月に取得した備品（取得原価${fmt(cost)}円、耐用年数${yr}年、定額法）について、当期分（${month}か月分）の減価償却費を計上した。`,
        debit:  [{ account: '減価償却費', amount: dep }],
        credit: [{ account: '備品減価償却累計額', amount: dep }],
        explanation: `月割計算：${fmt(cost)}÷${yr}年×${month}/12＝${fmt(dep)}円。`
      };
    }
  },
  {
    id: 192, topic: '減価償却費', tags: ['減価償却費', '車両運搬具減価償却累計額'],
    generate: () => {
      const costs = [600000, 800000, 1000000, 1200000, 1500000];
      const years = [4, 5, 6];
      const cost  = costs[Math.floor(Math.random() * costs.length)];
      const yr    = years[Math.floor(Math.random() * years.length)];
      const dep   = Math.floor(cost / yr);
      return {
        question: `取得原価${fmt(cost)}円の営業車両について、定額法（耐用年数${yr}年・残存価額ゼロ）で減価償却を行った。`,
        debit:  [{ account: '減価償却費', amount: dep }],
        credit: [{ account: '車両運搬具減価償却累計額', amount: dep }],
        explanation: `${fmt(cost)}÷${yr}年＝${fmt(dep)}円。費用（借方）、累計額（貸方）。`
      };
    }
  },
  {
    id: 193, topic: '減価償却費', tags: ['減価償却費', '備品減価償却累計額', '備品', '固定資産売却損'],
    generate: () => {
      const cost    = (Math.floor(Math.random() * 5) + 2) * 100000;
      const yr      = [3, 4, 5][Math.floor(Math.random() * 3)];
      const prevDep = Math.floor(cost / yr) * (Math.floor(Math.random() * (yr - 1)) + 1);
      const curMon  = Math.floor(Math.random() * 11) + 1;
      const curDep  = Math.floor(cost / yr * curMon / 12);
      const book    = cost - prevDep - curDep;
      const proc    = Math.max(book - (Math.floor(Math.random() * 3) + 1) * 10000, 0);
      const loss    = book - proc;
      return {
        question: `帳簿価額${fmt(book)}円（取得原価${fmt(cost)}円・減価償却累計額${fmt(prevDep)}円）の備品を期中に${fmt(proc)}円で売却した。なお売却時までの減価償却費${fmt(curDep)}円を月割で計上する。`,
        debit:  [
          { account: '現金', amount: proc },
          { account: '備品減価償却累計額', amount: prevDep + curDep },
          { account: '減価償却費', amount: curDep },
          { account: '固定資産売却損', amount: loss },
        ],
        credit: [{ account: '備品', amount: cost }],
        explanation: `売却時に当期分減価償却費${fmt(curDep)}円を計上後、帳簿価額${fmt(book - curDep)}円＞売却額${fmt(proc)}円→損失${fmt(loss)}円。`
      };
    }
  },
  {
    id: 194, topic: '減価償却費', tags: ['減価償却費', '備品減価償却累計額'],
    generate: () => {
      const costs = [120000, 180000, 240000, 300000, 360000, 480000];
      const cost  = costs[Math.floor(Math.random() * costs.length)];
      const yr    = 3;
      const dep   = Math.floor(cost / yr / 12);
      return {
        question: `月次決算。取得原価${fmt(cost)}円・耐用年数${yr}年の備品について当月分の減価償却費を定額法で計上した（残存価額ゼロ）。`,
        debit:  [{ account: '減価償却費', amount: dep }],
        credit: [{ account: '備品減価償却累計額', amount: dep }],
        explanation: `月次：${fmt(cost)}÷${yr}年÷12か月＝${fmt(dep)}円/月。`
      };
    }
  },

  // ===== 租税公課 追加 (2) =====
  {
    id: 195, topic: '租税公課', tags: ['租税公課', '普通預金'],
    generate: (a) => ({
      question: `法人住民税${fmt(a)}円を普通預金から納付した。`,
      debit:  [{ account: '租税公課', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `租税公課（費用↑）借方、普通預金（資産↓）貸方。住民税の納付処理。`
    })
  },
  {
    id: 196, topic: '租税公課', tags: ['租税公課', '現金', '普通預金'],
    generate: () => {
      const stamp = (Math.floor(Math.random() * 5) + 1) * 200;
      return {
        question: `郵便局で収入印紙${fmt(stamp)}円分を現金で購入し、直ちに契約書に貼付した。`,
        debit:  [{ account: '租税公課', amount: stamp }],
        credit: [{ account: '現金', amount: stamp }],
        explanation: `使用済みの収入印紙は租税公課（費用↑）借方、現金（資産↓）貸方。`
      };
    }
  },

  // ===== 旅費交通費 追加 (2) =====
  {
    id: 197, topic: '旅費交通費', tags: ['旅費交通費', '仮払金'],
    generate: () => {
      const advance = (Math.floor(Math.random() * 5) + 1) * 10000;
      const actual  = advance + (Math.floor(Math.random() * 5) + 1) * 1000;
      const more    = actual - advance;
      return {
        question: `出張から戻り、実際の旅費${fmt(actual)}円が判明した。出張前に仮払いしていた${fmt(advance)}円との差額${fmt(more)}円を現金で精算した。`,
        debit:  [{ account: '旅費交通費', amount: actual }],
        credit: [{ account: '仮払金', amount: advance }, { account: '現金', amount: more }],
        explanation: `旅費確定（費用↑）借方、仮払金（資産↓）・現金（資産↓）で精算。差額${fmt(more)}円追加払い。`
      };
    }
  },
  {
    id: 198, topic: '旅費交通費', tags: ['旅費交通費', '仮払金'],
    generate: () => {
      const advance = (Math.floor(Math.random() * 5) + 1) * 10000;
      const actual  = advance - (Math.floor(Math.random() * 4) + 1) * 1000;
      const change  = advance - actual;
      return {
        question: `出張から戻り、実際の旅費${fmt(actual)}円が確定した。前払いした仮払金${fmt(advance)}円との差額${fmt(change)}円を現金で返金した。`,
        debit:  [{ account: '旅費交通費', amount: actual }, { account: '現金', amount: change }],
        credit: [{ account: '仮払金', amount: advance }],
        explanation: `旅費確定（費用↑）、差額${fmt(change)}円が返金分（現金資産↑）、仮払金（資産↓）消去。`
      };
    }
  },

  // ===== 立替金 追加 (2) =====
  {
    id: 199, topic: '立替金', tags: ['立替金', '現金', '普通預金'],
    generate: (a) => ({
      question: `従業員が立て替えた交通費${fmt(a)}円を普通預金から本人に支払った。`,
      debit:  [{ account: '立替金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `立替金（資産↑）借方、普通預金（資産↓）貸方。後で従業員から回収する権利を計上。`
    })
  },
  {
    id: 200, topic: '立替金', tags: ['立替金', '現金'],
    generate: (a) => ({
      question: `得意先が負担すべき送料${fmt(a)}円を当社が立替払いした。`,
      debit:  [{ account: '立替金', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: `第三者負担費用の立替：立替金（資産↑）借方、現金（資産↓）貸方。`
    })
  },

  // ===== 仮払金 追加 (2) =====
  {
    id: 201, topic: '仮払金', tags: ['仮払金', '普通預金'],
    generate: (a) => ({
      question: `従業員の出張に際し、旅費の概算額${fmt(a)}円を普通預金から振り込んだ。`,
      debit:  [{ account: '仮払金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `仮払金（資産↑）借方、普通預金（資産↓）貸方。精算後に旅費交通費等に振替。`
    })
  },
  {
    id: 202, topic: '仮払金', tags: ['仮払金', '旅費交通費', '現金'],
    generate: () => {
      const paid   = (Math.floor(Math.random() * 5) + 1) * 10000;
      const actual = Math.round(paid * 0.9 / 1000) * 1000;
      const change = paid - actual;
      return {
        question: `仮払金${fmt(paid)}円について精算した。旅費交通費${fmt(actual)}円が確定し、残額${fmt(change)}円を現金で返却した。`,
        debit:  [{ account: '旅費交通費', amount: actual }, { account: '現金', amount: change }],
        credit: [{ account: '仮払金', amount: paid }],
        explanation: `仮払金（資産↓）貸方${fmt(paid)}円。旅費交通費${fmt(actual)}円（費用）・現金${fmt(change)}円（資産↑）借方。`
      };
    }
  },

  // ===== 仮受金 追加 (2) =====
  {
    id: 203, topic: '仮受金', tags: ['仮受金', '普通預金'],
    generate: (a) => ({
      question: `普通預金に${fmt(a)}円の入金があったが、内容が不明のため仮受金として処理した。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '仮受金', amount: a }],
      explanation: `内容不明の入金は仮受金（負債↑）として一時計上。内容判明次第振替。`
    })
  },
  {
    id: 204, topic: '仮受金', tags: ['仮受金', '売掛金'],
    generate: (a) => ({
      question: `仮受金${fmt(a)}円の内容が判明し、得意先からの売掛金の回収であることが分かった。`,
      debit:  [{ account: '仮受金', amount: a }],
      credit: [{ account: '売掛金', amount: a }],
      explanation: `仮受金（負債↓）借方、売掛金（資産↓）貸方に振替。`
    })
  },

  // ===== 預り金 追加 (2) =====
  {
    id: 205, topic: '預り金', tags: ['預り金', '普通預金'],
    generate: (a) => ({
      question: `従業員から預かっていた所得税${fmt(a)}円を税務署に普通預金から納付した。`,
      debit:  [{ account: '預り金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `預り金（負債↓）借方、普通預金（資産↓）貸方。源泉所得税の納付。`
    })
  },
  {
    id: 206, topic: '預り金', tags: ['預り金', '現金'],
    generate: (a) => ({
      question: `従業員に代わって住民税${fmt(a)}円を現金で納付した。`,
      debit:  [{ account: '預り金', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: `預り金（負債↓）借方、現金（資産↓）貸方。特別徴収住民税の納付。`
    })
  },

  // ===== 貸倒引当金繰入 追加 (2) =====
  {
    id: 207, topic: '貸倒引当金繰入', tags: ['貸倒引当金繰入', '貸倒引当金', '売掛金'],
    generate: () => {
      const recv    = (Math.floor(Math.random() * 9) + 1) * 100000;
      const note    = (Math.floor(Math.random() * 5) + 1) * 50000;
      const total   = recv + note;
      const rate    = 0.02;
      const reserve = Math.round(total * rate / 100) * 100;
      return {
        question: `決算において、売掛金${fmt(recv)}円・受取手形${fmt(note)}円の合計${fmt(total)}円に対し、2%の貸倒引当金を差額補充法で設定した。現在の残高はゼロである。`,
        debit:  [{ account: '貸倒引当金繰入', amount: reserve }],
        credit: [{ account: '貸倒引当金', amount: reserve }],
        explanation: `${fmt(total)}円×2%＝${fmt(reserve)}円。残高ゼロのため全額繰入。`
      };
    }
  },
  {
    id: 208, topic: '貸倒引当金繰入', tags: ['貸倒引当金繰入', '貸倒引当金'],
    generate: () => {
      const target   = (Math.floor(Math.random() * 9) + 1) * 100000;
      const required = Math.round(target * 0.03 / 100) * 100;
      const existing = Math.round(required * 0.4 / 100) * 100;
      const add      = required - existing;
      return {
        question: `売掛金${fmt(target)}円に対し3%の貸倒引当金を設定する（差額補充法）。現在の残高は${fmt(existing)}円である。`,
        debit:  [{ account: '貸倒引当金繰入', amount: add }],
        credit: [{ account: '貸倒引当金', amount: add }],
        explanation: `必要額${fmt(required)}円−残高${fmt(existing)}円＝追加繰入${fmt(add)}円。差額補充法。`
      };
    }
  },

  // ===== 損益振替 追加 (2) =====
  {
    id: 209, topic: '損益振替', tags: ['損益振替', '受取家賃', '損益'],
    generate: (a) => ({
      question: `決算において、受取家賃${fmt(a)}円を損益勘定に振り替えた。`,
      debit:  [{ account: '受取家賃', amount: a }],
      credit: [{ account: '損益', amount: a }],
      explanation: `収益（受取家賃）の損益振替：受取家賃（収益↓）借方、損益（貸方）。`
    })
  },
  {
    id: 210, topic: '損益振替', tags: ['損益振替', '支払家賃', '損益'],
    generate: (a) => ({
      question: `決算において、支払家賃${fmt(a)}円を損益勘定に振り替えた。`,
      debit:  [{ account: '損益', amount: a }],
      credit: [{ account: '支払家賃', amount: a }],
      explanation: `費用（支払家賃）の損益振替：損益（借方）、支払家賃（費用↓）貸方。`
    })
  },

  // ===== 繰越利益剰余金 追加 (2) =====
  {
    id: 211, topic: '繰越利益剰余金', tags: ['繰越利益剰余金', '損益'],
    generate: () => {
      const loss = (Math.floor(Math.random() * 5) + 1) * 100000;
      return {
        question: `決算において、当期純損失${fmt(loss)}円を繰越利益剰余金勘定に振り替えた。`,
        debit:  [{ account: '繰越利益剰余金', amount: loss }],
        credit: [{ account: '損益', amount: loss }],
        explanation: `純損失は繰越利益剰余金（純資産↓）借方で処理。損益（貸方）で相殺。`
      };
    }
  },
  {
    id: 212, topic: '繰越利益剰余金', tags: ['繰越利益剰余金', '未払配当金', '普通預金'],
    generate: () => {
      const div = (Math.floor(Math.random() * 9) + 1) * 100000;
      return {
        question: `配当金${fmt(div)}円を普通預金から支払った。`,
        debit:  [{ account: '未払配当金', amount: div }],
        credit: [{ account: '普通預金', amount: div }],
        explanation: `配当支払：未払配当金（負債↓）借方、普通預金（資産↓）貸方。`
      };
    }
  },

  // ===== 未払金 追加 (3) =====
  {
    id: 213, topic: '未払金', tags: ['未払金', '備品'],
    generate: (a) => ({
      question: `先月購入した備品の代金${fmt(a)}円を普通預金から支払った。`,
      debit:  [{ account: '未払金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `未払金（負債↓）借方、普通預金（資産↓）貸方。備品代金の支払完了。`
    })
  },
  {
    id: 214, topic: '未払金', tags: ['未払金', '消耗品費'],
    generate: (a) => ({
      question: `消耗品${fmt(a)}円を購入し、代金は翌月払いとした。`,
      debit:  [{ account: '消耗品費', amount: a }],
      credit: [{ account: '未払金', amount: a }],
      explanation: `消耗品費（費用↑）借方、未払金（負債↑）貸方。後払い処理。`
    })
  },
  {
    id: 215, topic: '未払金', tags: ['未払金', '現金'],
    generate: (a) => ({
      question: `未払金${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '未払金', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: `未払金（負債↓）借方、現金（資産↓）貸方。`
    })
  },

  // ===== 未収入金 追加 (2) =====
  {
    id: 216, topic: '未収入金', tags: ['未収入金', '固定資産売却益', '備品'],
    generate: () => {
      const book = (Math.floor(Math.random() * 5) + 1) * 30000;
      const gain = (Math.floor(Math.random() * 3) + 1) * 10000;
      const proc = book + gain;
      return {
        question: `帳簿価額${fmt(book)}円の備品を${fmt(proc)}円で売却した。代金は翌月受け取り予定。`,
        debit:  [{ account: '未収入金', amount: proc }],
        credit: [{ account: '備品', amount: book }, { account: '固定資産売却益', amount: gain }],
        explanation: `売却代金未収：未収入金（資産↑）借方。備品${fmt(book)}円消去・売却益${fmt(gain)}円（収益↑）貸方。`
      };
    }
  },
  {
    id: 217, topic: '未収入金', tags: ['未収入金', '現金'],
    generate: (a) => ({
      question: `未収入金${fmt(a)}円を現金で回収した。`,
      debit:  [{ account: '現金', amount: a }],
      credit: [{ account: '未収入金', amount: a }],
      explanation: `現金（資産↑）借方、未収入金（資産↓）貸方。未収分の現金回収。`
    })
  },

  // ===== 前払金 追加 (2) =====
  {
    id: 218, topic: '前払金', tags: ['前払金', '普通預金'],
    generate: (a) => ({
      question: `商品の注文に際し、手付金${fmt(a)}円を普通預金から支払った。`,
      debit:  [{ account: '前払金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `前払金（資産↑）借方、普通預金（資産↓）貸方。商品受取前の前払い。`
    })
  },
  {
    id: 219, topic: '前払金', tags: ['前払金', '仕入', '現金'],
    generate: () => {
      const total   = (Math.floor(Math.random() * 9) + 2) * 10000;
      const deposit = Math.round(total * 0.4 / 1000) * 1000;
      const remain  = total - deposit;
      return {
        question: `前払金${fmt(deposit)}円を支払っていた商品が到着した。残額${fmt(remain)}円は現金で支払った。`,
        debit:  [{ account: '仕入', amount: total }],
        credit: [{ account: '前払金', amount: deposit }, { account: '現金', amount: remain }],
        explanation: `仕入${fmt(total)}円（費用↑）借方。前払金（資産↓）・現金（資産↓）貸方。`
      };
    }
  },

  // ===== 前受金 追加 (2) =====
  {
    id: 220, topic: '前受金', tags: ['前受金', '普通預金'],
    generate: (a) => ({
      question: `商品の注文を受け、手付金${fmt(a)}円が普通預金に振り込まれた。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '前受金', amount: a }],
      explanation: `前受金（負債↑）貸方、普通預金（資産↑）借方。商品引渡し前の前受け。`
    })
  },
  {
    id: 221, topic: '前受金', tags: ['前受金', '売上', '売掛金'],
    generate: () => {
      const total   = (Math.floor(Math.random() * 9) + 2) * 10000;
      const deposit = Math.round(total * 0.4 / 1000) * 1000;
      const remain  = total - deposit;
      return {
        question: `前受金${fmt(deposit)}円を受け取っていた商品を引き渡した。残額${fmt(remain)}円は売掛金とした。`,
        debit:  [{ account: '前受金', amount: deposit }, { account: '売掛金', amount: remain }],
        credit: [{ account: '売上', amount: total }],
        explanation: `前受金（負債↓）・売掛金（資産↑）借方、売上${fmt(total)}円（収益↑）貸方。`
      };
    }
  },

  // ===== クレジット売掛金 追加 (2) =====
  {
    id: 222, topic: 'クレジット売掛金', tags: ['クレジット売掛金', '普通預金'],
    generate: (a) => ({
      question: `クレジット売掛金${fmt(a)}円がカード会社から普通預金に入金された。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: 'クレジット売掛金', amount: a }],
      explanation: `クレジット売掛金（資産↓）貸方、普通預金（資産↑）借方。カード会社からの入金。`
    })
  },
  {
    id: 223, topic: 'クレジット売掛金', tags: ['クレジット売掛金', '売上', '支払手数料'],
    generate: () => {
      const sales = (Math.floor(Math.random() * 9) + 1) * 10000;
      const fee   = Math.round(sales * 0.03 / 100) * 100;
      const recv  = sales - fee;
      return {
        question: `商品${fmt(sales)}円をクレジット販売した。信販会社への手数料${fmt(fee)}円（3%）を差し引いた${fmt(recv)}円がクレジット売掛金となる。`,
        debit:  [{ account: 'クレジット売掛金', amount: recv }, { account: '支払手数料', amount: fee }],
        credit: [{ account: '売上', amount: sales }],
        explanation: `売上${fmt(sales)}円、手数料${fmt(fee)}円を費用計上、クレジット売掛金${fmt(recv)}円（資産）。`
      };
    }
  },

  // ===== 当座預金 追加 (2) =====
  {
    id: 224, topic: '当座預金', tags: ['当座預金', '現金'],
    generate: (a) => ({
      question: `現金${fmt(a)}円を当座預金に預け入れた。`,
      debit:  [{ account: '当座預金', amount: a }],
      credit: [{ account: '現金', amount: a }],
      explanation: `当座預金（資産↑）借方、現金（資産↓）貸方。`
    })
  },
  {
    id: 225, topic: '当座預金', tags: ['当座預金', '普通預金'],
    generate: (a) => ({
      question: `普通預金${fmt(a)}円を当座預金に振り替えた。`,
      debit:  [{ account: '当座預金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `当座預金（資産↑）借方、普通預金（資産↓）貸方。`
    })
  },

  // ===== 借入金 追加 (2) =====
  {
    id: 226, topic: '借入金', tags: ['借入金', '受取手形', '普通預金'],
    generate: () => {
      const amt      = (Math.floor(Math.random() * 9) + 1) * 100000;
      const interest = Math.round(amt * 0.04 / 1000) * 1000;
      const total    = amt + interest;
      return {
        question: `約束手形を振り出し、銀行から${fmt(amt)}円を借り入れた（手形借入金）。借入金は普通預金に入金された。`,
        debit:  [{ account: '普通預金', amount: amt }],
        credit: [{ account: '借入金', amount: amt }],
        explanation: `手形借入金も借入金として処理：普通預金（資産↑）借方、借入金（負債↑）貸方。`
      };
    }
  },
  {
    id: 227, topic: '借入金', tags: ['借入金', '支払利息', '現金'],
    generate: () => {
      const interest = (Math.floor(Math.random() * 9) + 1) * 5000;
      return {
        question: `借入金の利息${fmt(interest)}円を現金で支払った。`,
        debit:  [{ account: '支払利息', amount: interest }],
        credit: [{ account: '現金', amount: interest }],
        explanation: `支払利息（費用↑）借方、現金（資産↓）貸方。利息のみの支払い処理。`
      };
    }
  },

  // ===== 現金過不足 追加 (2) =====
  {
    id: 228, topic: '現金過不足', tags: ['現金過不足', '売掛金'],
    generate: () => {
      const diff = (Math.floor(Math.random() * 5) + 1) * 1000;
      return {
        question: `現金過不足（貸方残高）${fmt(diff)}円の原因を調査したところ、売掛金回収時の記入漏れと判明した。`,
        debit:  [{ account: '現金過不足', amount: diff }],
        credit: [{ account: '売掛金', amount: diff }],
        explanation: `現金過剰の原因判明→現金過不足（借方）、売掛金（資産↓）貸方に振替。`
      };
    }
  },
  {
    id: 229, topic: '現金過不足', tags: ['現金過不足', '受取利息'],
    generate: () => {
      const diff = (Math.floor(Math.random() * 5) + 1) * 1000;
      return {
        question: `現金過不足（貸方残高）${fmt(diff)}円の原因が受取利息の記入漏れと判明した。`,
        debit:  [{ account: '現金過不足', amount: diff }],
        credit: [{ account: '受取利息', amount: diff }],
        explanation: `現金過剰→受取利息の記入漏れ：現金過不足（借方）、受取利息（収益↑）貸方。`
      };
    }
  },

  // ===== 固定資産売却益 追加 (1) =====
  {
    id: 230, topic: '固定資産売却益', tags: ['固定資産売却益', '備品減価償却累計額', '備品', '普通預金'],
    generate: () => {
      const cost  = (Math.floor(Math.random() * 5) + 2) * 100000;
      const accum = Math.round(cost * 0.5 / 10000) * 10000;
      const book  = cost - accum;
      const gain  = (Math.floor(Math.random() * 3) + 1) * 10000;
      const proc  = book + gain;
      return {
        question: `取得原価${fmt(cost)}円・減価償却累計額${fmt(accum)}円の備品を${fmt(proc)}円で売却し、代金は普通預金に入金された。`,
        debit:  [{ account: '普通預金', amount: proc }, { account: '備品減価償却累計額', amount: accum }],
        credit: [{ account: '備品', amount: cost }, { account: '固定資産売却益', amount: gain }],
        explanation: `帳簿価額${fmt(book)}円（取得原価−累計額）＜売却額${fmt(proc)}円→売却益${fmt(gain)}円。`
      };
    }
  },

  // ===== 消費税 追加 (2) =====
  {
    id: 231, topic: '消費税', tags: ['消費税', '仮払消費税', '仕入', '普通預金'],
    generate: (a) => {
      const tax   = a * 0.1;
      const total = a + tax;
      return {
        question: `商品${fmt(a)}円（税抜）を仕入れ、消費税込みの代金${fmt(total)}円を普通預金から支払った（税抜処理）。`,
        debit:  [{ account: '仕入', amount: a }, { account: '仮払消費税', amount: tax }],
        credit: [{ account: '普通預金', amount: total }],
        explanation: `仕入${fmt(a)}円・仮払消費税${fmt(tax)}円（借方）、普通預金${fmt(total)}円（貸方）。`
      };
    }
  },
  {
    id: 232, topic: '消費税', tags: ['消費税', '仮受消費税', '売上', '普通預金'],
    generate: (a) => {
      const tax   = a * 0.1;
      const total = a + tax;
      return {
        question: `商品${fmt(a)}円（税抜）を販売し、消費税込みの代金${fmt(total)}円が普通預金に振り込まれた（税抜処理）。`,
        debit:  [{ account: '普通預金', amount: total }],
        credit: [{ account: '売上', amount: a }, { account: '仮受消費税', amount: tax }],
        explanation: `普通預金${fmt(total)}円（借方）、売上${fmt(a)}円・仮受消費税${fmt(tax)}円（貸方）。`
      };
    }
  },

  // ===== 通信費 追加 (2) =====
  {
    id: 233, topic: '通信費', tags: ['通信費', '未払金'],
    generate: (a) => ({
      question: `当月分の電話代${fmt(a)}円が未払いとなっており、未払金として計上した。`,
      debit:  [{ account: '通信費', amount: a }],
      credit: [{ account: '未払金', amount: a }],
      explanation: `通信費（費用↑）借方、未払金（負債↑）貸方。当月費用の未払計上。`
    })
  },
  {
    id: 234, topic: '通信費', tags: ['通信費', '普通預金'],
    generate: (a) => ({
      question: `インターネット回線の月額料金${fmt(a)}円が普通預金から引き落とされた。`,
      debit:  [{ account: '通信費', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `通信費（費用↑）借方、普通預金（資産↓）貸方。`
    })
  },

  // ===== 発送費 追加 (2) =====
  {
    id: 235, topic: '発送費', tags: ['発送費', '未払金'],
    generate: (a) => ({
      question: `商品の発送費${fmt(a)}円が月末払いのため、未払金として計上した。`,
      debit:  [{ account: '発送費', amount: a }],
      credit: [{ account: '未払金', amount: a }],
      explanation: `発送費（費用↑）借方、未払金（負債↑）貸方。`
    })
  },
  {
    id: 236, topic: '発送費', tags: ['発送費', '売掛金', '売上'],
    generate: () => {
      const sales = (Math.floor(Math.random() * 9) + 1) * 10000;
      const ship  = (Math.floor(Math.random() * 5) + 1) * 500;
      const total = sales + ship;
      return {
        question: `商品${fmt(sales)}円を掛けで販売し、発送費${fmt(ship)}円は売掛金に含めて請求した。`,
        debit:  [{ account: '売掛金', amount: total }],
        credit: [{ account: '売上', amount: sales }, { account: '発送費', amount: ship }],
        explanation: `売掛金${fmt(total)}円（借方）、売上${fmt(sales)}円・発送費${fmt(ship)}円（先方負担→貸方）。`
      };
    }
  },

  // ===== 消耗品費 追加 (2) =====
  {
    id: 237, topic: '消耗品費', tags: ['消耗品費', '未払金'],
    generate: (a) => ({
      question: `消耗品${fmt(a)}円を購入し、代金は後払いとした。全量を当期に使用した。`,
      debit:  [{ account: '消耗品費', amount: a }],
      credit: [{ account: '未払金', amount: a }],
      explanation: `消耗品費（費用↑）借方、未払金（負債↑）貸方。全量使用のため費用計上。`
    })
  },
  {
    id: 238, topic: '消耗品費', tags: ['消耗品費', '消耗品'],
    generate: () => {
      const total  = (Math.floor(Math.random() * 9) + 2) * 5000;
      const used   = Math.round(total * 0.7 / 1000) * 1000;
      const remain = total - used;
      return {
        question: `消耗品${fmt(total)}円を購入し、当期使用分${fmt(used)}円を消耗品費、未使用分${fmt(remain)}円を消耗品（資産）として計上した。`,
        debit:  [{ account: '消耗品費', amount: used }, { account: '消耗品', amount: remain }],
        credit: [{ account: '現金', amount: total }],
        explanation: `使用分${fmt(used)}円は費用計上、未使用分${fmt(remain)}円は資産計上（消耗品）。`
      };
    }
  },

  // ===== 給料 追加 (2) =====
  {
    id: 239, topic: '給料', tags: ['給料', '未払費用'],
    generate: () => {
      const salary = (Math.floor(Math.random() * 8) + 2) * 50000;
      return {
        question: `決算において、当月分給料${fmt(salary)}円が未払いであるため計上した。`,
        debit:  [{ account: '給料', amount: salary }],
        credit: [{ account: '未払費用', amount: salary }],
        explanation: `未払給料も当期費用：給料（費用↑）借方、未払費用（負債↑）貸方。`
      };
    }
  },
  {
    id: 240, topic: '給料', tags: ['給料', '未払費用', '現金'],
    generate: () => {
      const salary = (Math.floor(Math.random() * 8) + 2) * 50000;
      return {
        question: `前期末に計上した未払給料${fmt(salary)}円を現金で支払った。`,
        debit:  [{ account: '未払費用', amount: salary }],
        credit: [{ account: '現金', amount: salary }],
        explanation: `未払費用（負債↓）借方、現金（資産↓）貸方。前期計上分の支払い。`
      };
    }
  },

  // ===== 当座預金 追加 (2) =====
  {
    id: 111, topic: '当座預金', tags: ['当座預金', '仕入'],
    generate: (a) => ({
      question: `商品${fmt(a)}円を仕入れ、小切手を振り出して支払った。`,
      debit:  [{ account: '仕入', amount: a }],
      credit: [{ account: '当座預金', amount: a }],
      explanation: `小切手振出は当座預金（資産↓）の減少。仕入（費用↑）借方、当座預金貸方。`
    })
  },
  {
    id: 112, topic: '当座預金', tags: ['当座預金', '売掛金'],
    generate: (a) => ({
      question: `売掛金${fmt(a)}円を得意先振出の小切手で回収した。ただちに当座預金に預け入れた。`,
      debit:  [{ account: '当座預金', amount: a }],
      credit: [{ account: '売掛金', amount: a }],
      explanation: `小切手を当座預金に預け入れ：当座預金（資産↑）借方、売掛金（資産↓）貸方。`
    })
  },
  {
    id: 113, topic: '当座預金', tags: ['当座預金', '当座借越', '買掛金'],
    generate: () => {
      const balance = (Math.floor(Math.random() * 9) + 1) * 10000;
      const payment = balance + (Math.floor(Math.random() * 9) + 1) * 10000;
      const overdraft = payment - balance;
      return {
        question: `買掛金${fmt(payment)}円の支払いとして小切手を振り出した。当座預金残高は${fmt(balance)}円であり、取引銀行と当座借越契約を結んでいる。`,
        debit:  [{ account: '買掛金', amount: payment }],
        credit: [{ account: '当座預金', amount: balance }, { account: '当座借越', amount: overdraft }],
        explanation: `残高${fmt(balance)}円を超えた${fmt(overdraft)}円は当座借越（負債↑）貸方に計上。当座預金${fmt(balance)}円と当座借越${fmt(overdraft)}円の合計${fmt(payment)}円。`
      };
    }
  },
  {
    id: 114, topic: '当座預金', tags: ['当座預金', '当座借越'],
    generate: (a) => ({
      question: `当座借越${fmt(a)}円を普通預金から返済した。`,
      debit:  [{ account: '当座借越', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `当座借越（負債↓）借方、普通預金（資産↓）貸方。当座借越の返済処理。`
    })
  },

  // ===== 現金過不足 (3) =====
  {
    id: 115, topic: '現金過不足', tags: ['現金過不足', '現金'],
    generate: () => {
      const diff = (Math.floor(Math.random() * 9) + 1) * 1000;
      return {
        question: `現金の実際有高が帳簿残高より${fmt(diff)}円多かった。原因は不明である。`,
        debit:  [{ account: '現金', amount: diff }],
        credit: [{ account: '現金過不足', amount: diff }],
        explanation: `実際残高が帳簿より多い（現金過剰）：現金（資産↑）借方、現金過不足（貸方）。原因判明まで現金過不足で保留。`
      };
    }
  },
  {
    id: 116, topic: '現金過不足', tags: ['現金過不足', '現金'],
    generate: () => {
      const diff = (Math.floor(Math.random() * 9) + 1) * 1000;
      return {
        question: `現金の実際有高が帳簿残高より${fmt(diff)}円少なかった。原因は不明である。`,
        debit:  [{ account: '現金過不足', amount: diff }],
        credit: [{ account: '現金', amount: diff }],
        explanation: `実際残高が帳簿より少ない（現金不足）：現金過不足（借方）、現金（資産↓）貸方。原因判明まで現金過不足で保留。`
      };
    }
  },
  {
    id: 117, topic: '現金過不足', tags: ['現金過不足', '雑益', '雑損'],
    generate: () => {
      const diff  = (Math.floor(Math.random() * 9) + 1) * 1000;
      const isOver = Math.random() < 0.5;
      if (isOver) {
        return {
          question: `決算において、現金過不足（貸方残高）${fmt(diff)}円の原因が不明なため、雑益に振り替えた。`,
          debit:  [{ account: '現金過不足', amount: diff }],
          credit: [{ account: '雑益', amount: diff }],
          explanation: `現金過剰で原因不明→雑益（収益↑）貸方に振替。現金過不足（借方）で相殺。`
        };
      } else {
        return {
          question: `決算において、現金過不足（借方残高）${fmt(diff)}円の原因が不明なため、雑損に振り替えた。`,
          debit:  [{ account: '雑損', amount: diff }],
          credit: [{ account: '現金過不足', amount: diff }],
          explanation: `現金不足で原因不明→雑損（費用↑）借方に振替。現金過不足（貸方）で相殺。`
        };
      }
    }
  },

  // ===== 固定資産売却益 (3) =====
  {
    id: 118, topic: '固定資産売却益', tags: ['固定資産売却益', '備品', '現金'],
    generate: () => {
      const bookVals = [20000, 30000, 40000, 50000, 80000, 100000];
      const book = bookVals[Math.floor(Math.random() * bookVals.length)];
      const gain = (Math.floor(Math.random() * 5) + 1) * 10000;
      const proceeds = book + gain;
      return {
        question: `帳簿価額${fmt(book)}円の備品を${fmt(proceeds)}円で売却し、代金を現金で受け取った。`,
        debit:  [{ account: '現金', amount: proceeds }],
        credit: [{ account: '備品', amount: book }, { account: '固定資産売却益', amount: gain }],
        explanation: `売却額${fmt(proceeds)}円＞帳簿価額${fmt(book)}円→差額${fmt(gain)}円が固定資産売却益（収益↑）。現金（資産↑）借方、備品（資産↓）・固定資産売却益貸方。`
      };
    }
  },
  {
    id: 119, topic: '固定資産売却益', tags: ['固定資産売却益', '備品', '普通預金'],
    generate: () => {
      const bookVals = [20000, 30000, 40000, 50000, 80000, 100000];
      const book = bookVals[Math.floor(Math.random() * bookVals.length)];
      const gain = (Math.floor(Math.random() * 5) + 1) * 10000;
      const proceeds = book + gain;
      return {
        question: `帳簿価額${fmt(book)}円の備品を${fmt(proceeds)}円で売却し、代金が普通預金に振り込まれた。`,
        debit:  [{ account: '普通預金', amount: proceeds }],
        credit: [{ account: '備品', amount: book }, { account: '固定資産売却益', amount: gain }],
        explanation: `売却額${fmt(proceeds)}円＞帳簿価額${fmt(book)}円→差額${fmt(gain)}円が固定資産売却益（収益↑）。普通預金（資産↑）借方、備品・固定資産売却益貸方。`
      };
    }
  },
  {
    id: 120, topic: '固定資産売却益', tags: ['固定資産売却益', '備品減価償却累計額', '備品', '現金'],
    generate: () => {
      const cost  = (Math.floor(Math.random() * 5) + 2) * 100000;
      const accum = Math.round(cost * 0.6 / 10000) * 10000;
      const book  = cost - accum;
      const gain  = (Math.floor(Math.random() * 3) + 1) * 10000;
      const proceeds = book + gain;
      return {
        question: `取得原価${fmt(cost)}円、減価償却累計額${fmt(accum)}円の備品を${fmt(proceeds)}円で売却し、現金を受け取った。`,
        debit:  [{ account: '現金', amount: proceeds }, { account: '備品減価償却累計額', amount: accum }],
        credit: [{ account: '備品', amount: cost }, { account: '固定資産売却益', amount: gain }],
        explanation: `帳簿価額${fmt(book)}円（＝${fmt(cost)}−${fmt(accum)}）に対し売却額${fmt(proceeds)}円→売却益${fmt(gain)}円。累計額を借方に計上し備品を取得原価で消去。`
      };
    }
  },

  // ===== 借入金 (3) =====
  {
    id: 121, topic: '借入金', tags: ['借入金', '普通預金'],
    generate: (a) => ({
      question: `銀行から${fmt(a)}円を借り入れ、普通預金に入金された。`,
      debit:  [{ account: '普通預金', amount: a }],
      credit: [{ account: '借入金', amount: a }],
      explanation: `借入れ：普通預金（資産↑）借方、借入金（負債↑）貸方。`
    })
  },
  {
    id: 122, topic: '借入金', tags: ['借入金', '普通預金'],
    generate: (a) => ({
      question: `借入金${fmt(a)}円の返済期日が到来し、普通預金から返済した。`,
      debit:  [{ account: '借入金', amount: a }],
      credit: [{ account: '普通預金', amount: a }],
      explanation: `返済：借入金（負債↓）借方、普通預金（資産↓）貸方。`
    })
  },
  {
    id: 123, topic: '借入金', tags: ['借入金', '支払利息', '普通預金'],
    generate: () => {
      const principal = (Math.floor(Math.random() * 9) + 1) * 100000;
      const interest  = Math.round(principal * 0.03 / 1000) * 1000;
      const total     = principal + interest;
      return {
        question: `借入金${fmt(principal)}円の返済期日が到来し、利息${fmt(interest)}円とともに普通預金から支払った。`,
        debit:  [{ account: '借入金', amount: principal }, { account: '支払利息', amount: interest }],
        credit: [{ account: '普通預金', amount: total }],
        explanation: `借入金（負債↓）${fmt(principal)}円・支払利息（費用↑）${fmt(interest)}円を借方、普通預金（資産↓）${fmt(total)}円を貸方。`
      };
    }
  },

  // ===== 当座預金 追加2 (2) =====
  {
    id: 241, topic: '当座預金', tags: ['当座預金', '受取手形'],
    generate: (a) => ({
      question: `得意先から受け取った約束手形${fmt(a)}円を銀行に取立依頼し、当座預金に入金された。`,
      debit:  [{ account: '当座預金', amount: a }],
      credit: [{ account: '受取手形', amount: a }],
      explanation: `手形の取立入金：受取手形（資産↓）貸方、当座預金（資産↑）借方。`
    })
  },
  {
    id: 242, topic: '当座預金', tags: ['当座預金', '売掛金', '支払手数料'],
    generate: () => {
      const recv = (Math.floor(Math.random() * 9) + 1) * 10000;
      const fee  = 330;
      const net  = recv - fee;
      return {
        question: `売掛金${fmt(recv)}円が当座預金に振り込まれた。振込手数料${fmt(fee)}円（当社負担）が差し引かれた。`,
        debit:  [{ account: '当座預金', amount: net }, { account: '支払手数料', amount: fee }],
        credit: [{ account: '売掛金', amount: recv }],
        explanation: `当座預金${fmt(net)}円・支払手数料${fmt(fee)}円借方、売掛金${fmt(recv)}円貸方。`
      };
    }
  },
];

// ── バリアント（問題文のパターン違い）──
// variants: [(a) => string, ...] を各テンプレートに注入する
const TEMPLATE_VARIANTS = {
  // 現金 → 普通預金
  1: [
    (a) => `現金${fmt(a)}円を普通預金に預け入れた。`,
    (a) => `手元の現金${fmt(a)}円を銀行の普通預金口座へ入金した。`,
    (a) => `売上代金として受け取った現金${fmt(a)}円を普通預金に預け入れた。`,
    (a) => `集金した現金${fmt(a)}円を普通預金口座へ入金した。`,
    (a) => `本日の売上金${fmt(a)}円を普通預金に預け入れた。`,
    (a) => `現金${fmt(a)}円を銀行へ持参し、普通預金に預け入れた。`,
    (a) => `当日回収した現金${fmt(a)}円を普通預金に入金した。`,
    (a) => `月末に現金${fmt(a)}円を普通預金へ入金した。`,
  ],
  // 現金売上
  2: [
    (a) => `商品${fmt(a)}円を現金で販売した。`,
    (a) => `得意先に商品${fmt(a)}円を現金で売り上げた。`,
    (a) => `本日の現金売上は${fmt(a)}円であった。`,
    (a) => `商品Aを${fmt(a)}円で現金にて販売した。`,
    (a) => `顧客から商品代金${fmt(a)}円を現金で受け取った。`,
    (a) => `食料品${fmt(a)}円を現金で販売した。`,
    (a) => `小売店頭で商品${fmt(a)}円を現金で販売した。`,
    (a) => `当日の現金売上${fmt(a)}円を計上した。`,
    (a) => `商品を${fmt(a)}円で販売し、現金を受け取った。`,
  ],
  // 現金仕入
  3: [
    (a) => `商品${fmt(a)}円を現金で仕入れた。`,
    (a) => `仕入先から商品${fmt(a)}円を現金で購入した。`,
    (a) => `食料品${fmt(a)}円を現金で仕入れた。`,
    (a) => `商品Bを${fmt(a)}円で現金仕入した。`,
    (a) => `新商品${fmt(a)}円を現金で仕入れた。`,
    (a) => `仕入先に現金${fmt(a)}円を支払い、商品を受け取った。`,
    (a) => `商品の仕入れとして${fmt(a)}円を現金で支払った。`,
    (a) => `当日、商品${fmt(a)}円分を現金で仕入れた。`,
  ],
  // 普通預金 → 現金
  4: [
    (a) => `普通預金から現金${fmt(a)}円を引き出した。`,
    (a) => `銀行の普通預金から${fmt(a)}円を現金で出金した。`,
    (a) => `ATMで普通預金から${fmt(a)}円を引き出した。`,
    (a) => `給料支払用に普通預金から現金${fmt(a)}円を引き出した。`,
    (a) => `小口現金として使用するため、普通預金から${fmt(a)}円を引き出した。`,
    (a) => `経費支払いのため、普通預金から現金${fmt(a)}円を用意した。`,
    (a) => `普通預金口座から現金${fmt(a)}円を引き出した。`,
  ],
  // 受取利息
  5: [
    (a) => `普通預金の利息${fmt(a)}円が入金された。`,
    (a) => `銀行から利息${fmt(a)}円が普通預金口座に振り込まれた。`,
    (a) => `普通預金の利子${fmt(a)}円が通帳に記帳された。`,
    (a) => `期中に普通預金利息${fmt(a)}円が入金された。`,
    (a) => `銀行利息として${fmt(a)}円が普通預金に加算された。`,
    (a) => `利息収入${fmt(a)}円が普通預金に振り込まれた。`,
    (a) => `普通預金残高に利息${fmt(a)}円が計上された。`,
  ],
  // 売掛金回収→普通預金
  6: [
    (a) => `売掛金${fmt(a)}円が普通預金に振り込まれた。`,
    (a) => `得意先から売掛金${fmt(a)}円が普通預金口座に振り込まれた。`,
    (a) => `前月の売掛金${fmt(a)}円が本日普通預金に入金された。`,
    (a) => `A社から売掛金${fmt(a)}円が普通預金に送金されてきた。`,
    (a) => `売掛金の回収として${fmt(a)}円が普通預金に入金された。`,
    (a) => `得意先より売掛金${fmt(a)}円の振り込みがあった。`,
    (a) => `普通預金口座に売掛金${fmt(a)}円が着金した。`,
    (a) => `A商店からの売掛金${fmt(a)}円が普通預金に入金された。`,
  ],
  // 買掛金→普通預金
  7: [
    (a) => `買掛金${fmt(a)}円を普通預金から振り込んで支払った。`,
    (a) => `仕入先への買掛金${fmt(a)}円を普通預金から振り込んだ。`,
    (a) => `前月の買掛金${fmt(a)}円を普通預金から送金した。`,
    (a) => `B社の買掛金${fmt(a)}円を普通預金口座から振り込み決済した。`,
    (a) => `仕入代金${fmt(a)}円を普通預金から振り込んだ。`,
    (a) => `仕入先に普通預金から${fmt(a)}円を送金した。`,
    (a) => `買掛金${fmt(a)}円の支払期日が到来し、普通預金から支払った。`,
  ],
  // 借入金
  8: [
    (a) => `銀行から${fmt(a)}円を借り入れ、普通預金に入金された。`,
    (a) => `銀行融資${fmt(a)}円が普通預金口座に入金された。`,
    (a) => `短期借入金として${fmt(a)}円を借り入れ、普通預金に受け取った。`,
    (a) => `資金調達のため銀行から${fmt(a)}円を借り入れ、普通預金に入金された。`,
    (a) => `長期借入金${fmt(a)}円の融資を受け、普通預金に入金された。`,
    (a) => `金融機関から${fmt(a)}円を借り入れ、普通預金へ振り込まれた。`,
    (a) => `事業資金として銀行から${fmt(a)}円を借り、普通預金に受け入れた。`,
  ],
  // 掛け売上
  9: [
    (a) => `商品${fmt(a)}円を掛けで販売した。`,
    (a) => `得意先に商品${fmt(a)}円を掛けで売り上げた。`,
    (a) => `A商店に商品${fmt(a)}円を信用販売した。`,
    (a) => `月末払いの条件で商品${fmt(a)}円を販売した。`,
    (a) => `掛け売上として商品${fmt(a)}円を計上した。`,
    (a) => `商品${fmt(a)}円を後払い条件で得意先に販売した。`,
    (a) => `当月の掛け販売${fmt(a)}円を計上した。`,
    (a) => `B社に商品${fmt(a)}円を売り上げ、代金は翌月回収予定。`,
  ],
  // 売掛金→現金回収
  10: [
    (a) => `売掛金${fmt(a)}円を現金で回収した。`,
    (a) => `得意先から売掛金${fmt(a)}円が現金で支払われた。`,
    (a) => `前月の売掛金${fmt(a)}円を現金で受け取った。`,
    (a) => `A社の売掛金${fmt(a)}円が現金で決済された。`,
    (a) => `売掛金${fmt(a)}円の回収として現金を受領した。`,
    (a) => `得意先が来社し、売掛金${fmt(a)}円を現金で持参した。`,
    (a) => `当月回収の売掛金${fmt(a)}円を現金で受け取った。`,
  ],
  // 売掛金→受取手形
  11: [
    (a) => `売掛金${fmt(a)}円を同額の受取手形で回収した。`,
    (a) => `得意先から売掛金${fmt(a)}円の代わりに約束手形を受け取った。`,
    (a) => `A社の売掛金${fmt(a)}円について、約束手形を受け取った。`,
    (a) => `売掛金${fmt(a)}円の決済として受取手形を受領した。`,
    (a) => `売掛金${fmt(a)}円を手形で回収した。`,
    (a) => `前月売掛金${fmt(a)}円を受取手形に切り替えた。`,
  ],
  // 掛け売上＋発送費
  12: [
    (a) => `商品${fmt(a)}円を掛けで販売し、発送費${fmt(Math.round(a * 0.01))}円を現金で支払った。`,
    (a) => `得意先に商品${fmt(a)}円を掛けで売り上げ、配送料${fmt(Math.round(a * 0.01))}円を現金で立て替えた。`,
    (a) => `A社に商品${fmt(a)}円を掛け販売した。発送費${fmt(Math.round(a * 0.01))}円は現金払い。`,
    (a) => `掛け売上${fmt(a)}円を計上し、当社負担の発送費${fmt(Math.round(a * 0.01))}円を現金で支払った。`,
    (a) => `商品${fmt(a)}円を後払いで販売。運送費${fmt(Math.round(a * 0.01))}円を現金で支払った。`,
  ],
  // 前受金充当＋売掛金
  13: [
    (a) => `前受金${fmt(a)}円を受け取っていた商品を引き渡し、残額${fmt(a)}円は掛けとした。`,
    (a) => `手付金${fmt(a)}円を既に受け取っていた商品${fmt(a * 2)}円を納品し、残額は掛けとした。`,
    (a) => `前受金${fmt(a)}円分の商品を引き渡した。残り${fmt(a)}円は売掛金とした。`,
    (a) => `受注済み商品（前受金${fmt(a)}円）を納品した。残代金${fmt(a)}円は翌月回収予定。`,
    (a) => `前受金${fmt(a)}円を受け取っていた注文品を引き渡した。残額${fmt(a)}円を売掛金に計上。`,
  ],
  // 掛け仕入
  14: [
    (a) => `商品${fmt(a)}円を掛けで仕入れた。`,
    (a) => `仕入先から商品${fmt(a)}円を掛け仕入した。`,
    (a) => `B商事から商品${fmt(a)}円を信用購入した。`,
    (a) => `月末払い条件で商品${fmt(a)}円を仕入れた。`,
    (a) => `商品${fmt(a)}円を後払いで仕入れた。`,
    (a) => `仕入先に掛けで商品${fmt(a)}円分を注文し、受け取った。`,
    (a) => `当月掛け仕入分${fmt(a)}円を計上した。`,
    (a) => `C社から商品${fmt(a)}円を仕入れ、代金は来月払い。`,
  ],
  // 買掛金→現金
  15: [
    (a) => `買掛金${fmt(a)}円を現金で支払った。`,
    (a) => `仕入先への買掛金${fmt(a)}円を現金で決済した。`,
    (a) => `B商事の買掛金${fmt(a)}円を現金で支払った。`,
    (a) => `前月仕入分の買掛金${fmt(a)}円を現金で支払った。`,
    (a) => `買掛金${fmt(a)}円の支払期日が到来し、現金で支払った。`,
    (a) => `仕入代金${fmt(a)}円を現金で支払い、買掛金を決済した。`,
    (a) => `買掛金${fmt(a)}円の現金払いが完了した。`,
  ],
  // 買掛金→支払手形
  16: [
    (a) => `買掛金${fmt(a)}円の支払いとして、約束手形を振り出した。`,
    (a) => `B商事への買掛金${fmt(a)}円を手形で支払った。`,
    (a) => `買掛金${fmt(a)}円について、約束手形を振り出して決済した。`,
    (a) => `前月の掛け仕入代金${fmt(a)}円を手形振出で支払った。`,
    (a) => `買掛金${fmt(a)}円の支払いに手形を振り出した。`,
    (a) => `仕入先への未払代金${fmt(a)}円を約束手形で決済した。`,
  ],
  // 現金売上（売上topic）
  17: [
    (a) => `商品${fmt(a)}円を現金で販売した。`,
    (a) => `顧客に商品${fmt(a)}円を現金販売した。`,
    (a) => `当日の現金売上${fmt(a)}円を計上した。`,
    (a) => `食料品${fmt(a)}円を現金で売り上げた。`,
    (a) => `衣料品${fmt(a)}円を現金で販売した。`,
    (a) => `小売販売で商品${fmt(a)}円を現金で受け取った。`,
    (a) => `本日の売上として現金${fmt(a)}円を受領した。`,
  ],
  // 掛け売上（売上topic）
  18: [
    (a) => `商品${fmt(a)}円を掛けで販売した。`,
    (a) => `得意先に商品${fmt(a)}円を掛けで売り上げた。`,
    (a) => `A社へ商品${fmt(a)}円を信用販売した。`,
    (a) => `後払い条件で商品${fmt(a)}円を得意先に販売した。`,
    (a) => `掛け売上${fmt(a)}円を計上した。`,
    (a) => `B商店に商品${fmt(a)}円を掛けで販売した。`,
    (a) => `翌月末払いで商品${fmt(a)}円を販売した。`,
  ],
  // クレジット売上3%
  19: [
    (a) => `クレジットカードで商品${fmt(a)}円を販売した。信販会社手数料は3%とする。`,
    (a) => `クレジット決済で商品${fmt(a)}円を売り上げた。手数料率3%。`,
    (a) => `クレジット払いで商品${fmt(a)}円を販売した（手数料3%）。`,
    (a) => `得意先からクレジットカードで商品${fmt(a)}円の注文を受けた。手数料3%。`,
    (a) => `商品${fmt(a)}円をクレジット販売した。信販手数料3%が差し引かれる。`,
    (a) => `カード決済で商品${fmt(a)}円を売り上げた。手数料は3%。`,
  ],
  // 現金仕入（仕入topic）
  20: [
    (a) => `商品${fmt(a)}円を現金で仕入れた。`,
    (a) => `仕入先から商品${fmt(a)}円を現金で購入した。`,
    (a) => `食料品${fmt(a)}円を現金仕入した。`,
    (a) => `新商品${fmt(a)}円を現金で購入した。`,
    (a) => `当日の現金仕入${fmt(a)}円を計上した。`,
    (a) => `仕入先に${fmt(a)}円を現金で支払い商品を受け取った。`,
    (a) => `衣料品${fmt(a)}円を現金仕入した。`,
  ],
  // 掛け仕入（仕入topic）
  21: [
    (a) => `商品${fmt(a)}円を掛けで仕入れた。`,
    (a) => `仕入先から商品${fmt(a)}円を後払いで仕入れた。`,
    (a) => `C商事より商品${fmt(a)}円を掛け仕入した。`,
    (a) => `翌月末払いで商品${fmt(a)}円を仕入れた。`,
    (a) => `仕入先と掛け取引で商品${fmt(a)}円を購入した。`,
    (a) => `商品${fmt(a)}円の掛け仕入を計上した。`,
    (a) => `B社から商品${fmt(a)}円を信用購入した。`,
  ],
  // 仕入＋引取運賃
  22: [
    (a) => `商品${fmt(a)}円を掛けで仕入れ、引取運賃${fmt(Math.round(a * 0.02))}円を現金で支払った。`,
    (a) => `仕入先から商品${fmt(a)}円を掛けで購入した。当社負担の引取運賃${fmt(Math.round(a * 0.02))}円を現金払い。`,
    (a) => `商品${fmt(a)}円の掛け仕入とともに、運送費${fmt(Math.round(a * 0.02))}円を現金で負担した。`,
    (a) => `掛け仕入${fmt(a)}円について、引取運賃${fmt(Math.round(a * 0.02))}円を現金で支払った。`,
    (a) => `商品${fmt(a)}円を仕入れ、運賃${fmt(Math.round(a * 0.02))}円も含めて仕入原価に計上した。`,
  ],
  // 仕入返品
  23: [
    (a) => `掛けで仕入れた商品のうち${fmt(a)}円分を品質不良のため返品した。`,
    (a) => `仕入先に商品${fmt(a)}円分を品質不良を理由に返品した。`,
    (a) => `不良品${fmt(a)}円分を仕入先へ返送し、掛け代金を減額した。`,
    (a) => `仕入れた商品${fmt(a)}円のうち不良品を返品し、買掛金を減額した。`,
    (a) => `品質不良の仕入商品${fmt(a)}円を返品処理した。`,
    (a) => `仕入先との合意で商品${fmt(a)}円分の返品を行った。`,
  ],
  // 手付金支払（前払金）
  24: [
    (a) => `商品${fmt(a * 2)}円を注文し、手付金として${fmt(a)}円を現金で支払った。`,
    (a) => `仕入先に商品を注文し、手付金${fmt(a)}円を現金で支払った。`,
    (a) => `商品購入の手付金${fmt(a)}円を現金で渡した。`,
    (a) => `注文時に前払いとして${fmt(a)}円を現金で支払った。`,
    (a) => `商品${fmt(a * 2)}円の注文をし、内金${fmt(a)}円を現金で支払った。`,
    (a) => `仕入先へ手付金${fmt(a)}円を現金で送金した。`,
    (a) => `商品発注とともに前払金${fmt(a)}円を現金で渡した。`,
  ],
  // 前払金充当→仕入
  25: [
    (a) => `前払金${fmt(a)}円を支払っていた商品${fmt(a * 3)}円が納品された。残額は掛けとした。`,
    (a) => `手付金${fmt(a)}円を払っていた仕入先から商品${fmt(a * 3)}円が届いた。残額は買掛金。`,
    (a) => `内金${fmt(a)}円を払っていた商品が${fmt(a * 3)}円で納品された。差額は掛けとした。`,
    (a) => `前払金${fmt(a)}円分の商品を受け取った。商品代金総額は${fmt(a * 3)}円で残額は掛け。`,
    (a) => `注文時に払った前払金${fmt(a)}円を充当し、残りは買掛金とした（総額${fmt(a * 3)}円）。`,
  ],
  // 前払金返金
  26: [
    (a) => `注文をキャンセルし、前払金${fmt(a)}円が現金で返金された。`,
    (a) => `仕入先への注文をキャンセルした。前払金${fmt(a)}円が現金で戻った。`,
    (a) => `契約解除により前払金${fmt(a)}円が返金された。`,
    (a) => `注文取消のため、手付金${fmt(a)}円が現金で返還された。`,
    (a) => `前払い済みの${fmt(a)}円が仕入先からキャンセル返金された。`,
  ],
  // 手付金受取（前受金）
  27: [
    (a) => `商品の注文を受け、手付金${fmt(a)}円を現金で受け取った。`,
    (a) => `得意先から注文とともに手付金${fmt(a)}円を現金で受け取った。`,
    (a) => `商品注文の際に内金${fmt(a)}円を現金で受領した。`,
    (a) => `A社から商品受注とともに前受金${fmt(a)}円を現金で受け取った。`,
    (a) => `売上の手付金として${fmt(a)}円を現金で受け取った。`,
    (a) => `受注時に前受金${fmt(a)}円の現金を受領した。`,
    (a) => `商品${fmt(a * 2)}円の注文を受け、頭金${fmt(a)}円を現金で受け取った。`,
  ],
  // 前受金充当→売上
  28: [
    (a) => `前受金${fmt(a)}円を受け取っていた商品${fmt(a * 2)}円を引き渡した。残額は掛けとした。`,
    (a) => `手付金${fmt(a)}円を受け取っていた商品を納品した（総額${fmt(a * 2)}円）。残りは掛け。`,
    (a) => `受注済み商品を引き渡した。前受金${fmt(a)}円を充当し、残額${fmt(a)}円は売掛金。`,
    (a) => `前受金${fmt(a)}円分と売掛金${fmt(a)}円分の商品を引き渡した。`,
    (a) => `前受金${fmt(a)}円を計上していた注文品を納品。残代金${fmt(a)}円は掛けとした。`,
  ],
  // 前受金→普通預金
  29: [
    (a) => `商品${fmt(a)}円の注文を受け、手付金${fmt(Math.round(a * 0.3))}円が普通預金に振り込まれた。`,
    (a) => `得意先から受注し、内金${fmt(Math.round(a * 0.3))}円が普通預金に振り込まれた。`,
    (a) => `A社から前払金${fmt(Math.round(a * 0.3))}円が普通預金に振り込まれた。`,
    (a) => `商品受注とともに前受金${fmt(Math.round(a * 0.3))}円の振り込みを確認した。`,
    (a) => `前受金${fmt(Math.round(a * 0.3))}円の入金が普通預金口座に確認された。`,
  ],
  // 備品売却→未収入金（益）
  30: [
    (a) => `不用になった備品（帳簿価額${fmt(a)}円）を${fmt(Math.round(a * 1.2))}円で売却し、代金は月末に受け取る予定。`,
    (a) => `帳簿価額${fmt(a)}円の備品を${fmt(Math.round(a * 1.2))}円で売却した。代金は後日受領。`,
    (a) => `使用済み備品（帳簿価額${fmt(a)}円）を${fmt(Math.round(a * 1.2))}円で売却し、未収入金を計上した。`,
    (a) => `旧型備品（簿価${fmt(a)}円）を${fmt(Math.round(a * 1.2))}円で売却。代金は翌月受け取り予定。`,
    (a) => `備品（帳簿価額${fmt(a)}円）を売却額${fmt(Math.round(a * 1.2))}円で処分し、未収入金を計上した。`,
  ],
  // 未収入金→現金
  31: [
    (a) => `未収入金${fmt(a)}円を現金で受け取った。`,
    (a) => `未収入金${fmt(a)}円が現金で回収された。`,
    (a) => `前月の未収入金${fmt(a)}円を現金で回収した。`,
    (a) => `備品売却代金（未収入金）${fmt(a)}円を現金で受け取った。`,
    (a) => `未収入金${fmt(a)}円の回収として現金を受領した。`,
    (a) => `当月回収予定の未収入金${fmt(a)}円を現金で受け取った。`,
  ],
  // 備品帳簿価額売却→未収入金
  32: [
    (a) => `備品（帳簿価額${fmt(a)}円）を帳簿価額と同額で売却し、代金は後日受け取る。`,
    (a) => `帳簿価額${fmt(a)}円の備品をそのまま${fmt(a)}円で売却した。代金は後払い。`,
    (a) => `備品（簿価${fmt(a)}円）を${fmt(a)}円で処分し、代金は翌月受領予定。`,
    (a) => `簿価通り${fmt(a)}円で備品を売却した。代金は未収入金として計上。`,
    (a) => `備品売却（${fmt(a)}円）を行い、代金を未収入金に計上した。`,
  ],
  // 未収入金→普通預金
  33: [
    (a) => `未収入金${fmt(a)}円が普通預金に振り込まれた。`,
    (a) => `前月の未収入金${fmt(a)}円が本日普通預金に入金された。`,
    (a) => `備品売却代金（未収入金）${fmt(a)}円が普通預金へ振り込まれた。`,
    (a) => `未収入金${fmt(a)}円の回収として普通預金への振り込みを確認した。`,
    (a) => `未収入金${fmt(a)}円が普通預金口座に着金した。`,
  ],
  // 備品→未払金
  34: [
    (a) => `備品${fmt(a)}円を購入し、代金は月末払いとした。`,
    (a) => `パソコン${fmt(a)}円を購入した。代金は翌月払い。`,
    (a) => `コピー機${fmt(a)}円を購入し、代金は月末に支払い予定。`,
    (a) => `業務用備品${fmt(a)}円を購入した。代金は後払い。`,
    (a) => `備品${fmt(a)}円を購入し、未払金として計上した。`,
    (a) => `オフィス機器${fmt(a)}円を購入し、代金を翌月払いとした。`,
    (a) => `新しい備品${fmt(a)}円を購入した。代金は月末に支払う予定。`,
  ],
  // 未払金→現金
  35: [
    (a) => `未払金${fmt(a)}円を現金で支払った。`,
    (a) => `前月の未払金${fmt(a)}円を現金で決済した。`,
    (a) => `備品購入代金（未払金）${fmt(a)}円を現金で支払った。`,
    (a) => `未払金${fmt(a)}円の支払期日が到来し、現金で支払った。`,
    (a) => `未払金${fmt(a)}円を現金で払い、負債を解消した。`,
    (a) => `未払金${fmt(a)}円を現金で決済した。`,
  ],
  // 通信費→未払金
  36: [
    (a) => `当月分の電話料金${fmt(a)}円が未払いである。`,
    (a) => `当月の電話代${fmt(a)}円がまだ支払われていない。`,
    (a) => `当月の通信費${fmt(a)}円が未払いとなっている。`,
    (a) => `電話・ネット料金${fmt(a)}円が当月末に支払い予定。`,
    (a) => `当月分の通信費${fmt(a)}円が発生しているが未払いである。`,
    (a) => `月次通信費${fmt(a)}円を未払金として計上した。`,
  ],
  // 仮払金→現金
  37: [
    (a) => `出張のため、概算額${fmt(a)}円を現金で渡した。`,
    (a) => `従業員の出張前に概算旅費${fmt(a)}円を現金で渡した。`,
    (a) => `出張費として${fmt(a)}円を仮払いした。`,
    (a) => `出張前に旅費概算${fmt(a)}円を現金で手渡した。`,
    (a) => `従業員出張のため仮払金${fmt(a)}円を現金で支払った。`,
    (a) => `旅費概算として${fmt(a)}円を現金で仮払いした。`,
    (a) => `出張用に仮払金${fmt(a)}円を現金で渡した。`,
  ],
  // 仮払金精算（余剰）
  38: [
    (a) => `出張から戻り、仮払金${fmt(a)}円の精算をした。旅費交通費は${fmt(Math.round(a * 0.9))}円で、残金${fmt(a - Math.round(a * 0.9))}円は現金で返金された。`,
    (a) => `出張旅費の精算完了。仮払金${fmt(a)}円に対し実費${fmt(Math.round(a * 0.9))}円で、差額${fmt(a - Math.round(a * 0.9))}円を現金返却した。`,
    (a) => `出張費精算：仮払金${fmt(a)}円のうち実費は${fmt(Math.round(a * 0.9))}円。差額${fmt(a - Math.round(a * 0.9))}円を返金した。`,
    (a) => `出張から戻り精算した。仮払${fmt(a)}円、実費${fmt(Math.round(a * 0.9))}円。余り${fmt(a - Math.round(a * 0.9))}円は現金で返却。`,
  ],
  // 仮払金精算（不足）
  39: [
    (a) => `出張旅費の精算をした。仮払金${fmt(a)}円に対し実費は${fmt(a + Math.round(a * 0.1))}円だったため、不足分${fmt(Math.round(a * 0.1))}円を現金で追加支払いした。`,
    (a) => `出張旅費の精算：仮払${fmt(a)}円、実費${fmt(a + Math.round(a * 0.1))}円。不足分${fmt(Math.round(a * 0.1))}円を現金追加払い。`,
    (a) => `出張費実績が仮払金${fmt(a)}円を超過し、旅費交通費の差額${fmt(Math.round(a * 0.1))}円を現金で追加精算した。`,
    (a) => `旅費精算の結果：仮払${fmt(a)}円に対し実費${fmt(a + Math.round(a * 0.1))}円。差額${fmt(Math.round(a * 0.1))}円を現金で補填した。`,
  ],
  // 仮払金→消耗品費
  40: [
    (a) => `仮払金${fmt(a)}円で消耗品を購入し、全額消耗した。`,
    (a) => `仮払いしていた${fmt(a)}円で文具を購入した。全量使用。`,
    (a) => `仮払金${fmt(a)}円を使ってコピー用紙を購入し、全て消耗した。`,
    (a) => `仮払${fmt(a)}円の精算：全額消耗品費として使用済みと判明。`,
    (a) => `仮払金${fmt(a)}円で購入した消耗品を全て使用した。`,
  ],
  // 仮受金→現金
  41: [
    (a) => `内容不明の入金${fmt(a)}円があった。`,
    (a) => `理由不明の現金${fmt(a)}円が入金された。`,
    (a) => `原因不明の${fmt(a)}円が現金で入金された。`,
    (a) => `用途不明の入金${fmt(a)}円を仮受金として処理した。`,
    (a) => `不明入金${fmt(a)}円を一時的に仮受金に計上した。`,
    (a) => `現金${fmt(a)}円が入金されたが、内容が不明だった。`,
  ],
  // 仮受金→売掛金振替
  42: [
    (a) => `仮受金${fmt(a)}円は、得意先からの売掛金の回収であることが判明した。`,
    (a) => `仮受金${fmt(a)}円について調査の結果、A社の売掛金回収と判明した。`,
    (a) => `不明入金として計上していた${fmt(a)}円が売掛金の回収と確認された。`,
    (a) => `仮受金${fmt(a)}円の内容が確定し、売掛金の入金であることがわかった。`,
    (a) => `仮受金${fmt(a)}円を売掛金の回収として振り替えた。`,
  ],
  // 仮受金→前受金振替
  43: [
    (a) => `仮受金${fmt(a)}円は、商品注文の手付金であることが判明した。`,
    (a) => `仮受金${fmt(a)}円が得意先からの注文手付金と判明した。`,
    (a) => `不明入金${fmt(a)}円が商品受注の前受金と確認された。`,
    (a) => `仮受金${fmt(a)}円を前受金に振り替えた（注文手付金と判明）。`,
    (a) => `仮受金${fmt(a)}円が注文内金であることが確認され、前受金に振替。`,
  ],
  // 立替金→現金支出
  44: [
    (a) => `従業員に代わって社会保険料${fmt(a)}円を現金で立て替えて支払った。`,
    (a) => `従業員の代わりに${fmt(a)}円を現金で立て替えた。`,
    (a) => `取引先の経費${fmt(a)}円を現金で立て替えた。`,
    (a) => `同僚のために${fmt(a)}円を現金で立て替えて支払った。`,
    (a) => `従業員の立替金${fmt(a)}円を現金で払った。`,
    (a) => `部下の出張費${fmt(a)}円を立替払いした。`,
  ],
  // 立替金→現金回収
  45: [
    (a) => `立替金${fmt(a)}円を現金で回収した。`,
    (a) => `立替払いしていた${fmt(a)}円を現金で返してもらった。`,
    (a) => `従業員から立替金${fmt(a)}円を現金で回収した。`,
    (a) => `立て替えていた${fmt(a)}円が現金で戻ってきた。`,
    (a) => `立替金${fmt(a)}円の返済を現金で受けた。`,
    (a) => `取引先から立替金${fmt(a)}円を現金で回収した。`,
  ],
  // 立替金→普通預金
  46: [
    (a) => `取引先の経費${fmt(a)}円を普通預金から立て替えて支払った。`,
    (a) => `従業員の経費${fmt(a)}円を普通預金から立て替えた。`,
    (a) => `得意先の費用${fmt(a)}円を普通預金から立替払いした。`,
    (a) => `関連会社の支払い${fmt(a)}円を普通預金から代行した。`,
    (a) => `立替金${fmt(a)}円を普通預金から支払った。`,
  ],
  // 立替金→給料控除
  47: [
    (a) => `給料支払時に、従業員の立替金${fmt(a)}円を差し引き、残額を現金で支払った。給料総額は${fmt(a * 5)}円。`,
    (a) => `給料${fmt(a * 5)}円から立替金${fmt(a)}円を差し引き、残額${fmt(a * 4)}円を現金払い。`,
    (a) => `月次給料${fmt(a * 5)}円の支払時に立替金${fmt(a)}円を精算し、差額${fmt(a * 4)}円を現金で渡した。`,
    (a) => `給料${fmt(a * 5)}円から立替金${fmt(a)}円を相殺し、手取り${fmt(a * 4)}円を現金で支払った。`,
  ],
  // 預り金（給料・所得税）
  48: [
    (a) => `給料${fmt(a)}円から所得税${fmt(Math.round(a * 0.1))}円を差し引き、残額${fmt(a - Math.round(a * 0.1))}円を現金で支払った。`,
    (a) => `給与${fmt(a)}円を支払った。所得税${fmt(Math.round(a * 0.1))}円を源泉徴収し、手取り${fmt(a - Math.round(a * 0.1))}円を現金で支払い。`,
    (a) => `当月分給料${fmt(a)}円から源泉所得税${fmt(Math.round(a * 0.1))}円を控除し、差額を現金で渡した。`,
    (a) => `給料${fmt(a)}円支給。10%の所得税${fmt(Math.round(a * 0.1))}円を預かり、残額を現金で支払った。`,
  ],
  // 預り金→現金納付
  49: [
    (a) => `源泉徴収した所得税${fmt(a)}円を税務署に現金で納付した。`,
    (a) => `預かっていた所得税${fmt(a)}円を現金で納税した。`,
    (a) => `源泉所得税の預り金${fmt(a)}円を税務署へ現金で納付した。`,
    (a) => `預り金${fmt(a)}円（所得税分）を現金で税務署に支払った。`,
    (a) => `従業員から預かっていた源泉税${fmt(a)}円を現金で納付した。`,
  ],
  // 預り金（社会保険料）
  50: [
    (a) => `給料${fmt(a)}円から社会保険料（従業員負担分）${fmt(Math.round(a * 0.05))}円を差し引き、残額を普通預金で支払った。`,
    (a) => `月給${fmt(a)}円の支払時に社会保険料${fmt(Math.round(a * 0.05))}円を控除し、手取りを普通預金へ振り込んだ。`,
    (a) => `給与${fmt(a)}円から社会保険料${fmt(Math.round(a * 0.05))}円を天引きし、差額を普通預金で支払った。`,
    (a) => `給料${fmt(a)}円のうち社会保険料${fmt(Math.round(a * 0.05))}円を預かり、残りを普通預金で支給した。`,
  ],
  // 預り金→普通預金納付
  51: [
    (a) => `預り金${fmt(a)}円を普通預金から納付した。`,
    (a) => `社会保険料の預り金${fmt(a)}円を普通預金から支払った。`,
    (a) => `預かっていた社会保険料${fmt(a)}円を普通預金から納付した。`,
    (a) => `預り金${fmt(a)}円の納付として普通預金から送金した。`,
    (a) => `預り金${fmt(a)}円を普通預金で支払い、負債を解消した。`,
  ],
  // クレジット売掛金（3%）
  52: [
    (a) => `クレジットカードで商品${fmt(a)}円を販売した。手数料3%が差し引かれる。`,
    (a) => `クレジット払いで商品${fmt(a)}円を売り上げた。手数料率3%。`,
    (a) => `商品${fmt(a)}円をクレジット決済で販売した（手数料3%）。`,
    (a) => `カード払いで商品${fmt(a)}円を販売。手数料3%は費用計上。`,
    (a) => `クレジット売上${fmt(a)}円を計上した。信販手数料3%。`,
  ],
  // クレジット売掛金→普通預金
  53: [
    (a) => `クレジット売掛金${fmt(a)}円が普通預金に入金された。`,
    (a) => `クレジット売掛金${fmt(a)}円が信販会社から普通預金へ入金された。`,
    (a) => `前月のクレジット売掛金${fmt(a)}円が本日普通預金に入金された。`,
    (a) => `クレジット代金${fmt(a)}円の入金を普通預金で確認した。`,
    (a) => `信販会社からクレジット売掛金${fmt(a)}円が普通預金に振り込まれた。`,
  ],
  // クレジット売掛金（2%）
  54: [
    (a) => `クレジットカードで商品${fmt(a)}円を販売した。信販会社手数料は2%とする。`,
    (a) => `クレジット決済で商品${fmt(a)}円を売り上げた。手数料率2%。`,
    (a) => `商品${fmt(a)}円をクレジット販売した（手数料2%）。`,
    (a) => `カード払いで商品${fmt(a)}円を販売。手数料2%。`,
    (a) => `クレジット売上${fmt(a)}円、手数料2%を計上した。`,
  ],
  // 手形受取（売上）
  55: [
    (a) => `商品${fmt(a)}円を販売し、代金として約束手形を受け取った。`,
    (a) => `得意先に商品${fmt(a)}円を売り上げ、約束手形を受領した。`,
    (a) => `商品${fmt(a)}円の売上代金として受取手形を受け取った。`,
    (a) => `A社に商品${fmt(a)}円を販売し、手形で代金を受け取った。`,
    (a) => `商品${fmt(a)}円の売り上げで約束手形${fmt(a)}円を受け取った。`,
    (a) => `手形決済で商品${fmt(a)}円を売り上げた。`,
  ],
  // 受取手形→普通預金（期日）
  56: [
    (a) => `満期日が到来した受取手形${fmt(a)}円が普通預金に入金された。`,
    (a) => `受取手形${fmt(a)}円の満期日が到来し、普通預金に入金された。`,
    (a) => `期日を迎えた受取手形${fmt(a)}円が普通預金口座に入金された。`,
    (a) => `受取手形${fmt(a)}円が満期を迎え、普通預金に振り込まれた。`,
    (a) => `手形${fmt(a)}円の期日が来て、普通預金に入金された。`,
    (a) => `受取手形${fmt(a)}円が期日決済され普通預金に入った。`,
  ],
  // 売掛金→受取手形振替
  57: [
    (a) => `売掛金${fmt(a)}円を回収するために、得意先から約束手形を受け取った。`,
    (a) => `A社の売掛金${fmt(a)}円について、約束手形を受け取って回収した。`,
    (a) => `得意先から売掛金${fmt(a)}円の決済として約束手形を受領した。`,
    (a) => `売掛金${fmt(a)}円が手形で回収された。`,
    (a) => `前月の売掛金${fmt(a)}円を受取手形で回収した。`,
  ],
  // 売上現金＋手形
  58: [
    (a) => `商品${fmt(a)}円を販売し、${fmt(Math.round(a * 0.3))}円は現金で受け取り、残額は約束手形で受け取った。`,
    (a) => `商品${fmt(a)}円の売上代金のうち現金${fmt(Math.round(a * 0.3))}円と残額を受取手形で回収した。`,
    (a) => `得意先に商品${fmt(a)}円を販売。頭金${fmt(Math.round(a * 0.3))}円現金、残りは手形受取。`,
    (a) => `商品${fmt(a)}円を販売し、一部${fmt(Math.round(a * 0.3))}円現金・残りを手形で受け取った。`,
  ],
  // 手形振出（仕入）
  59: [
    (a) => `商品${fmt(a)}円を仕入れ、約束手形を振り出した。`,
    (a) => `仕入先に商品代金${fmt(a)}円として約束手形を振り出した。`,
    (a) => `商品${fmt(a)}円の仕入れを手形で決済した。`,
    (a) => `商品${fmt(a)}円を仕入れ、支払手形を振り出した。`,
    (a) => `B社から商品${fmt(a)}円を仕入れ、約束手形を渡した。`,
    (a) => `手形振出で商品${fmt(a)}円を仕入れた。`,
  ],
  // 支払手形→普通預金（期日）
  60: [
    (a) => `支払手形${fmt(a)}円の満期日が到来し、普通預金から引き落とされた。`,
    (a) => `振り出した手形${fmt(a)}円の期日が来て、普通預金から決済された。`,
    (a) => `支払手形${fmt(a)}円が満期を迎え、普通預金から引き落とされた。`,
    (a) => `手形期日${fmt(a)}円が到来し、普通預金から引き落とし決済された。`,
    (a) => `期日の来た支払手形${fmt(a)}円が普通預金から引き落とされた。`,
  ],
  // 買掛金→支払手形振替
  61: [
    (a) => `買掛金${fmt(a)}円の支払いとして、約束手形を振り出した。`,
    (a) => `仕入先の買掛金${fmt(a)}円を手形で決済した。`,
    (a) => `買掛金${fmt(a)}円について約束手形を振り出した。`,
    (a) => `前月の買掛金${fmt(a)}円を手形振出で支払った。`,
    (a) => `仕入代金（買掛金）${fmt(a)}円を支払手形で決済した。`,
  ],
  // 仕入現金＋手形
  62: [
    (a) => `商品${fmt(a)}円を仕入れ、${fmt(Math.round(a * 0.4))}円を現金で支払い、残額は約束手形を振り出した。`,
    (a) => `商品${fmt(a)}円の仕入れで現金${fmt(Math.round(a * 0.4))}円払いと残額手形振出。`,
    (a) => `仕入商品${fmt(a)}円のうち${fmt(Math.round(a * 0.4))}円現金払い・残りを手形振出した。`,
    (a) => `商品${fmt(a)}円を仕入れ、一部現金・残りを手形で支払った。`,
  ],
  // 備品→現金
  63: [
    (a) => `パソコン${fmt(a)}円を現金で購入した。`,
    (a) => `業務用パソコン${fmt(a)}円を現金で購入した。`,
    (a) => `オフィス備品${fmt(a)}円を現金で購入した。`,
    (a) => `業務用椅子・デスク${fmt(a)}円を現金で購入した。`,
    (a) => `事務用品（備品）${fmt(a)}円を現金で購入した。`,
    (a) => `プリンター${fmt(a)}円を現金で購入した。`,
    (a) => `業務用備品${fmt(a)}円を現金で購入した。`,
  ],
  // 備品→未払金
  64: [
    (a) => `コピー機${fmt(a)}円を購入し、代金は翌月払いとした。`,
    (a) => `業務用備品${fmt(a)}円を購入した。代金は後払い。`,
    (a) => `パソコン${fmt(a)}円を購入し、未払金として計上した。`,
    (a) => `オフィス機器${fmt(a)}円を購入し、代金を翌月払いとした。`,
    (a) => `備品${fmt(a)}円を後払い条件で購入した。`,
    (a) => `業務用チェア${fmt(a)}円を購入し、翌月払いとした。`,
  ],
  // 備品→普通預金
  65: [
    (a) => `オフィス用家具${fmt(a)}円を購入し、普通預金から支払った。`,
    (a) => `業務用備品${fmt(a)}円を普通預金から購入した。`,
    (a) => `パソコン${fmt(a)}円の代金を普通預金から支払った。`,
    (a) => `備品購入${fmt(a)}円を普通預金から決済した。`,
    (a) => `業務用機器${fmt(a)}円を普通預金から購入した。`,
    (a) => `事務用品（備品）${fmt(a)}円を普通預金で購入した。`,
  ],
  // 備品売却損
  66: [
    (a) => `帳簿価額${fmt(a)}円の備品を${fmt(Math.round(a * 0.7))}円で売却し、代金は現金で受け取った。`,
    (a) => `簿価${fmt(a)}円の備品を${fmt(Math.round(a * 0.7))}円で処分し、現金を受け取った。`,
    (a) => `帳簿価額${fmt(a)}円のパソコンを${fmt(Math.round(a * 0.7))}円で売却した（現金受取）。`,
    (a) => `備品（帳簿価額${fmt(a)}円）を売却し、売却代金${fmt(Math.round(a * 0.7))}円を現金で受け取った。`,
    (a) => `不用備品（簿価${fmt(a)}円）を${fmt(Math.round(a * 0.7))}円で売却し、現金を受領した。`,
  ],
  // 消耗品費→現金
  67: [
    (a) => `文房具${fmt(a)}円を現金で購入し、当期中に全て使用した。`,
    (a) => `ボールペン・メモ帳${fmt(a)}円を現金で購入した（全量使用）。`,
    (a) => `事務用消耗品${fmt(a)}円を現金で購入し使い切った。`,
    (a) => `消耗品${fmt(a)}円を現金で購入し、全て使用した。`,
    (a) => `文具類${fmt(a)}円を現金で購入、全量消耗した。`,
    (a) => `業務に使用する消耗品${fmt(a)}円を現金払いで購入した。`,
  ],
  // 消耗品費→普通預金
  68: [
    (a) => `コピー用紙${fmt(a)}円を購入し、普通預金から支払った。全量使用済。`,
    (a) => `事務用品${fmt(a)}円を普通預金から購入した（全量消耗）。`,
    (a) => `消耗品${fmt(a)}円の代金を普通預金から支払った。`,
    (a) => `消耗品${fmt(a)}円を普通預金で購入し全て使用した。`,
    (a) => `コピー用紙や文具${fmt(a)}円を普通預金から購入し使い切った。`,
  ],
  // 消耗品費→現金（インク）
  69: [
    (a) => `プリンターのインクカートリッジ${fmt(a)}円を現金で購入し、全て使用した。`,
    (a) => `インク・トナー${fmt(a)}円を現金で購入し、消耗した。`,
    (a) => `プリンター用消耗品${fmt(a)}円を現金で購入した（全量使用）。`,
    (a) => `インクカートリッジ${fmt(a)}円の現金購入と使用。`,
    (a) => `複合機消耗品${fmt(a)}円を現金で購入し全て使った。`,
  ],
  // 旅費→現金
  70: [
    (a) => `得意先への訪問のため、電車賃${fmt(a)}円を現金で支払った。`,
    (a) => `営業訪問で電車代${fmt(a)}円を現金で支払った。`,
    (a) => `出張のため交通費${fmt(a)}円を現金で支払った。`,
    (a) => `外出時の交通費${fmt(a)}円を現金払いした。`,
    (a) => `バス・電車代${fmt(a)}円を現金で支払った。`,
    (a) => `業務での旅費${fmt(a)}円を現金で支払った。`,
    (a) => `得意先訪問の交通費${fmt(a)}円を現金で支払った。`,
  ],
  // 旅費→仮払金精算
  71: [
    (a) => `出張精算の結果、仮払金${fmt(a)}円は全て旅費交通費であった。`,
    (a) => `仮払金${fmt(a)}円の精算：全額旅費交通費に充当した。`,
    (a) => `出張費精算で仮払${fmt(a)}円が旅費交通費と判明した。`,
    (a) => `仮払金${fmt(a)}円を旅費交通費として精算した。`,
    (a) => `仮払い${fmt(a)}円の全額が旅費交通費に充当された。`,
  ],
  // 旅費→普通預金
  72: [
    (a) => `新幹線代${fmt(a)}円を普通預金から支払った。`,
    (a) => `出張の交通費${fmt(a)}円を普通預金から支払った。`,
    (a) => `旅費${fmt(a)}円を普通預金で決済した。`,
    (a) => `業務出張の旅費${fmt(a)}円を普通預金から支払った。`,
    (a) => `新幹線・宿泊費${fmt(a)}円を普通預金から支払った。`,
  ],
  // 通信費→現金（切手）
  73: [
    (a) => `切手${fmt(a)}円分を現金で購入し、全て使用した。`,
    (a) => `郵便切手${fmt(a)}円を現金で購入し、全量使用した。`,
    (a) => `業務用切手${fmt(a)}円を現金で購入・使用した。`,
    (a) => `切手・はがき${fmt(a)}円を現金で購入し使い切った。`,
    (a) => `郵送用切手${fmt(a)}円を現金で購入した（全量使用）。`,
  ],
  // 通信費→普通預金（電話代）
  74: [
    (a) => `当月の電話・インターネット料金${fmt(a)}円が普通預金から引き落とされた。`,
    (a) => `当月分の携帯・固定電話代${fmt(a)}円が普通預金から引き落とされた。`,
    (a) => `当月の通信費${fmt(a)}円が普通預金口座から引き落とされた。`,
    (a) => `電話・ネット費用${fmt(a)}円が普通預金から引き落とされた。`,
    (a) => `月次通信費${fmt(a)}円の引き落としを普通預金で確認した。`,
  ],
  // 通信費→現金（宅配）
  75: [
    (a) => `取引先への書類送付のため、宅配便料金${fmt(a)}円を現金で支払った。`,
    (a) => `契約書を郵送するための宅配料金${fmt(a)}円を現金で支払った。`,
    (a) => `書類を得意先へ発送し、宅配業者に${fmt(a)}円を現金で支払った。`,
    (a) => `資料発送の宅配代金${fmt(a)}円を現金で支払った。`,
    (a) => `社内書類を郵便で送付し、送料${fmt(a)}円を現金で支払った。`,
  ],
  // 租税公課→現金（収入印紙）
  76: [
    (a) => `収入印紙${fmt(a)}円を現金で購入し、契約書に貼付した。`,
    (a) => `契約書用の収入印紙${fmt(a)}円を現金で購入した。`,
    (a) => `領収書・契約書用に収入印紙${fmt(a)}円を現金で購入した。`,
    (a) => `収入印紙${fmt(a)}円を現金で購入し使用した。`,
    (a) => `各種書類への貼付用に収入印紙${fmt(a)}円を現金購入した。`,
  ],
  // 租税公課→普通預金（固定資産税）
  77: [
    (a) => `固定資産税${fmt(a)}円を普通預金から納付した。`,
    (a) => `固定資産税の第一期分${fmt(a)}円を普通預金から支払った。`,
    (a) => `不動産の固定資産税${fmt(a)}円を普通預金から納税した。`,
    (a) => `固定資産税${fmt(a)}円の納付を普通預金で行った。`,
    (a) => `事務所の固定資産税${fmt(a)}円を普通預金から支払った。`,
  ],
  // 租税公課→現金（自動車税）
  78: [
    (a) => `自動車税${fmt(a)}円を現金で納付した。`,
    (a) => `業務用車両の自動車税${fmt(a)}円を現金で支払った。`,
    (a) => `会社所有の自動車税${fmt(a)}円を現金で納付した。`,
    (a) => `車両運搬具の自動車税${fmt(a)}円を現金で支払った。`,
    (a) => `自動車税納付${fmt(a)}円を現金で行った。`,
  ],
  // 発送費→現金
  79: [
    (a) => `商品発送のための運賃${fmt(a)}円を現金で支払った。`,
    (a) => `商品の発送費${fmt(a)}円を現金で支払った。`,
    (a) => `得意先への商品発送費用${fmt(a)}円を現金払いした。`,
    (a) => `販売商品の運送費${fmt(a)}円を現金で支払った。`,
    (a) => `発送運賃${fmt(a)}円を現金で支払った。`,
    (a) => `宅配業者への発送費${fmt(a)}円を現金で支払った。`,
  ],
  // 発送費→普通預金
  80: [
    (a) => `得意先への商品発送費${fmt(a)}円を普通預金から支払った。`,
    (a) => `商品発送費${fmt(a)}円を普通預金から支払った。`,
    (a) => `発送費${fmt(a)}円の引き落としを普通預金で確認した。`,
    (a) => `商品の運送費${fmt(a)}円を普通預金から支払った。`,
    (a) => `発送運賃${fmt(a)}円を普通預金で決済した。`,
  ],
  // 発送費→現金（宅配依頼）
  81: [
    (a) => `商品発送を依頼し、宅配業者に${fmt(a)}円を現金で支払った。`,
    (a) => `宅配業者に発送依頼し、料金${fmt(a)}円を現金払いした。`,
    (a) => `商品を発送し、送料${fmt(a)}円を現金で支払った。`,
    (a) => `商品の運送依頼をし、${fmt(a)}円を現金で業者に支払った。`,
    (a) => `得意先への発送を依頼し、運賃${fmt(a)}円を現金で支払った。`,
  ],

  // 消費税：仕入現金（税抜処理）
  101: [
    (a) => `商品${fmt(a)}円（税抜）を現金で仕入れた。消費税（税率10%）は税抜処理とする。`,
    (a) => `仕入先より商品${fmt(a)}円（税抜価格）を現金で購入した。なお消費税は税抜処理とする。`,
    (a) => `税抜価格${fmt(a)}円の商品を現金で仕入れた。消費税率10%・税抜処理。`,
    (a) => `仕入先から税抜${fmt(a)}円の商品を現金で購入した（消費税は税抜処理）。`,
    (a) => `商品${fmt(a)}円（本体価格）を現金で仕入れ、消費税10%を別途仮払消費税として計上する。`,
  ],

  // 消費税：仕入掛（税抜処理）
  102: [
    (a) => `商品${fmt(a)}円（税抜）を掛けで仕入れた。消費税（税率10%）は税抜処理とする。`,
    (a) => `仕入先より商品${fmt(a)}円（税抜）を掛けで購入した。消費税は税抜処理とする。`,
    (a) => `税抜${fmt(a)}円の商品を掛けで仕入れた（消費税率10%・税抜処理）。`,
    (a) => `B社から商品${fmt(a)}円（税抜）を信用取引で仕入れた。消費税は税抜処理とする。`,
    (a) => `掛けで商品${fmt(a)}円（本体価格）を仕入れ、消費税10%を別途計上する。`,
  ],

  // 消費税：売上現金（税抜処理）
  103: [
    (a) => `商品${fmt(a)}円（税抜）を現金で販売した。消費税（税率10%）は税抜処理とする。`,
    (a) => `得意先に商品${fmt(a)}円（税抜価格）を現金で売り上げた。消費税は税抜処理とする。`,
    (a) => `税抜${fmt(a)}円の商品を現金で販売した（消費税率10%・税抜処理）。`,
    (a) => `商品${fmt(a)}円（本体価格）を現金販売し、消費税10%を仮受消費税として計上する。`,
    (a) => `A社に税抜${fmt(a)}円の商品を現金で販売した（消費税は税抜処理）。`,
  ],

  // 消費税：売上掛（税抜処理）
  104: [
    (a) => `商品${fmt(a)}円（税抜）を掛けで販売した。消費税（税率10%）は税抜処理とする。`,
    (a) => `得意先に商品${fmt(a)}円（税抜）を掛けで売り上げた。消費税は税抜処理とする。`,
    (a) => `税抜${fmt(a)}円の商品を掛けで販売した（消費税率10%・税抜処理）。`,
    (a) => `A社に商品${fmt(a)}円（本体価格）を掛けで販売し、消費税10%を別途計上する。`,
    (a) => `商品${fmt(a)}円（税抜）を信用販売した。消費税は税抜処理とする。`,
  ],

  // 消費税：納付（普通預金）
  106: [
    (a) => `確定申告により確定した消費税${fmt(a)}円を普通預金から納付した。`,
    (a) => `消費税の確定申告を行い、未払消費税${fmt(a)}円を普通預金から納税した。`,
    (a) => `当期の消費税${fmt(a)}円を普通預金から税務署へ納付した。`,
    (a) => `消費税申告納付として、普通預金から${fmt(a)}円を支払った。`,
    (a) => `未払消費税${fmt(a)}円の納付期日が到来し、普通預金から支払った。`,
  ],

  // 当座預金：仕入（小切手）
  111: [
    (a) => `商品${fmt(a)}円を仕入れ、小切手を振り出して支払った。`,
    (a) => `仕入先から商品${fmt(a)}円を購入し、小切手を振り出した。`,
    (a) => `商品${fmt(a)}円の仕入れに対し、小切手を振り出して決済した。`,
    (a) => `B社より商品${fmt(a)}円を仕入れ、当座預金から小切手で支払った。`,
    (a) => `小切手を振り出して商品${fmt(a)}円を仕入れた。`,
  ],

  // 当座預金：売掛金回収（小切手）
  112: [
    (a) => `売掛金${fmt(a)}円を得意先振出の小切手で回収した。ただちに当座預金に預け入れた。`,
    (a) => `得意先から小切手${fmt(a)}円を受け取り、当座預金に預け入れた。`,
    (a) => `売掛金${fmt(a)}円を小切手で受領し、当座預金へ入金した。`,
    (a) => `A社から売掛金${fmt(a)}円を小切手で回収し、当座預金に預けた。`,
    (a) => `売掛代金${fmt(a)}円を小切手で受け取り、当座預金へ預け入れた。`,
  ],

  // 当座借越：返済
  114: [
    (a) => `当座借越${fmt(a)}円を普通預金から返済した。`,
    (a) => `当座借越残高${fmt(a)}円を普通預金で返済した。`,
    (a) => `当座借越${fmt(a)}円の返済として普通預金から送金した。`,
    (a) => `普通預金から${fmt(a)}円を当座借越の返済に充てた。`,
    (a) => `当座借越${fmt(a)}円が解消し、普通預金から引き落とされた。`,
  ],

  // 借入金：借り入れ
  121: [
    (a) => `銀行から${fmt(a)}円を借り入れ、普通預金に入金された。`,
    (a) => `取引銀行より${fmt(a)}円を借り入れ、普通預金に振り込まれた。`,
    (a) => `運転資金として${fmt(a)}円を銀行から借り入れ、普通預金に入金した。`,
    (a) => `銀行からの融資${fmt(a)}円が普通預金に振り込まれた。`,
    (a) => `金融機関から${fmt(a)}円を借り入れた（普通預金口座に入金）。`,
  ],

  // 借入金：返済（元本のみ）
  122: [
    (a) => `借入金${fmt(a)}円の返済期日が到来し、普通預金から返済した。`,
    (a) => `銀行への借入金${fmt(a)}円を普通預金から返済した。`,
    (a) => `借入金${fmt(a)}円を期日通り普通預金から支払った。`,
    (a) => `金融機関への借入金${fmt(a)}円を普通預金から返済した。`,
    (a) => `借入元本${fmt(a)}円の返済日が到来し、普通預金から引き落とされた。`,
  ],
};

// variantsを各テンプレートに注入
QUESTION_TEMPLATES.forEach(t => {
  if (TEMPLATE_VARIANTS[t.id]) {
    t.variants = TEMPLATE_VARIANTS[t.id];
  }
});

if (typeof module !== 'undefined') module.exports = { QUESTION_TEMPLATES, ACCOUNT_LIST, fmt, randAmt };
