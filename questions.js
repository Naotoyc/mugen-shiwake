'use strict';

const ACCOUNT_LIST = [
  '現金','普通預金','売掛金','受取手形','前払金','未収入金','立替金',
  'クレジット売掛金','備品','仮払金','買掛金','支払手形','借入金',
  '未払金','前受金','仮受金','預り金','未払配当金','繰越利益剰余金',
  '売上','受取利息','貸倒引当金戻入','固定資産売却益','仕入',
  '支払手数料','発送費','消耗品費','旅費交通費','通信費','租税公課',
  '給料','貸倒引当金繰入','貸倒損失','固定資産売却損','減価償却費',
  '貸倒引当金','備品減価償却累計額','車両運搬具減価償却累計額','損益',
  '社会保険料',
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
        question: `仮払金${fmt(a)}円で精算したが、実費は${fmt(a + extra)}円だったため、不足分${fmt(extra)}円を現金で追加支払いした。`,
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
      question: `宅配便の送料${fmt(a)}円を現金で支払った。`,
      debit:  [{ account: '通信費', amount: a }],
      credit: [{ account: '現金',   amount: a }],
      explanation: '宅配便の送料は通信費（費用↑）借方、現金（資産↓）貸方。'
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
    (a) => `仮払金${fmt(a)}円の精算完了。実費${fmt(Math.round(a * 0.9))}円で、差額${fmt(a - Math.round(a * 0.9))}円を現金返却した。`,
    (a) => `出張費精算：仮払金${fmt(a)}円のうち実費は${fmt(Math.round(a * 0.9))}円。差額${fmt(a - Math.round(a * 0.9))}円を返金した。`,
    (a) => `出張から戻り精算した。仮払${fmt(a)}円、実費${fmt(Math.round(a * 0.9))}円。余り${fmt(a - Math.round(a * 0.9))}円は現金で返却。`,
  ],
  // 仮払金精算（不足）
  39: [
    (a) => `仮払金${fmt(a)}円で精算したが、実費は${fmt(a + Math.round(a * 0.1))}円だったため、不足分${fmt(Math.round(a * 0.1))}円を現金で追加支払いした。`,
    (a) => `仮払${fmt(a)}円の精算で実費${fmt(a + Math.round(a * 0.1))}円。不足分${fmt(Math.round(a * 0.1))}円を現金追加払い。`,
    (a) => `出張費実績が仮払金${fmt(a)}円を超過し、差額${fmt(Math.round(a * 0.1))}円を現金で追加精算した。`,
    (a) => `精算結果：仮払${fmt(a)}円に対し実費${fmt(a + Math.round(a * 0.1))}円。差額${fmt(Math.round(a * 0.1))}円を現金で補填した。`,
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
    (a) => `宅配便の送料${fmt(a)}円を現金で支払った。`,
    (a) => `荷物の発送料${fmt(a)}円を現金で支払った。`,
    (a) => `宅配業者に送料${fmt(a)}円を現金で支払った。`,
    (a) => `資料発送の宅配代金${fmt(a)}円を現金で支払った。`,
    (a) => `小包の発送費用${fmt(a)}円を現金払いした。`,
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
};

// variantsを各テンプレートに注入
QUESTION_TEMPLATES.forEach(t => {
  if (TEMPLATE_VARIANTS[t.id]) {
    t.variants = TEMPLATE_VARIANTS[t.id];
  }
});

if (typeof module !== 'undefined') module.exports = { QUESTION_TEMPLATES, ACCOUNT_LIST, fmt, randAmt };
