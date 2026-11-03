#!/usr/bin/env python3
"""無限仕訳 週次レポート — GA4 / GSC の直近7日と前週比を Markdown で出す。

使い方（toishi-revenue-os の venv と .env を借りる）:
  ~/command-center/toishi-revenue-os/.venv/bin/python3 tools/weekly_report.py \
      --env-file ~/command-center/toishi-revenue-os/.env \
      --append ~/my-Superbrain/projects/無限仕訳/progress.md --slack

環境変数（.env か環境から）:
  GOOGLE_SERVICE_ACCOUNT_JSON   サービスアカウント JSON のパス（toishi-revenue-os と共用）
  MUGEN_GA4_PROPERTY_ID         無限仕訳の GA4 プロパティID（数字。測定ID G-... ではない）
  MUGEN_GSC_SITE_URL            省略時 https://naotoyc.github.io/mugen-shiwake/
  SLACK_WEBHOOK_URL             --slack 時に使う（10KChoices 日次レポートと同じ Webhook）
  DASHBOARD_URL                 Slack のボタンのリンク先（--dashboard-url でも可）

出力: 1週1ブロック（### 日付見出し＋表＋所見＋月ごと・四半期ごとの表）。所見は1件1論点で、結論・理由・例・結論（PREP）の順に1文1行で書く。--append 先に「## 週次レポート」節が無ければ末尾に作る。
同じ見出しが既にあれば追記しない（再実行しても二重にならない）。
認証情報の値はログにも出力にも出さない。
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import date, timedelta
from pathlib import Path

SITE_URL_DEFAULT = "https://naotoyc.github.io/mugen-shiwake/"
EVENTS = ["affiliate_view", "affiliate_click", "topic_page_to_app"]
SECTION_HEADING = "## 週次レポート"


# ---------------------------------------------------------------- 日付
def week_ranges(ga_end: date, gsc_end: date):
    """直近7日（end を含む）と、その前の7日。GSC は反映が2〜3日遅れるので別の end を取る。"""
    def rng(end: date):
        cur = (end - timedelta(days=6), end)
        prev = (end - timedelta(days=13), end - timedelta(days=7))
        return cur, prev
    return rng(ga_end), rng(gsc_end)


# ---------------------------------------------------------------- GA4
def ga4_fetch(property_id: str, sa_path: str, start: date, end: date) -> dict:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Filter, FilterExpression, FilterExpressionList,
        Metric, RunReportRequest,
    )
    from google.oauth2 import service_account

    creds = service_account.Credentials.from_service_account_file(
        sa_path, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
    client = BetaAnalyticsDataClient(credentials=creds)
    prop = f"properties/{property_id}"
    dr = [DateRange(start_date=start.isoformat(), end_date=end.isoformat())]

    # 1) セッション・PV。testDataFilterName で「Internal Traffic」フィルタ（テスト状態）の行を分離する。
    #    フィルタが「有効」なら内部は既に除外済みで、全体＝内部除外になる。
    resp = client.run_report(RunReportRequest(
        property=prop, date_ranges=dr,
        dimensions=[Dimension(name="testDataFilterName")],
        metrics=[Metric(name="sessions"), Metric(name="screenPageViews"),
                 Metric(name="activeUsers"), Metric(name="newUsers")],
    ))
    keys = ("sessions", "pv", "users", "new_users")
    total = dict.fromkeys(keys, 0)
    ext = dict.fromkeys(keys, 0)
    for r in resp.rows:
        name = r.dimension_values[0].value
        vals = [int(m.value) for m in r.metric_values]
        for k, v in zip(keys, vals):
            total[k] += v
            if "internal" not in name.lower():
                ext[k] += v

    # 2) カスタムイベント件数
    resp = client.run_report(RunReportRequest(
        property=prop, date_ranges=dr,
        dimensions=[Dimension(name="eventName")],
        metrics=[Metric(name="eventCount")],
        dimension_filter=FilterExpression(or_group=FilterExpressionList(expressions=[
            FilterExpression(filter=Filter(
                field_name="eventName",
                string_filter=Filter.StringFilter(value=e))) for e in EVENTS
        ])),
    ))
    events = {e: 0 for e in EVENTS}
    for r in resp.rows:
        events[r.dimension_values[0].value] = int(r.metric_values[0].value)

    return {"total": total, "ext": ext, "events": events}


def ga4_daily(property_id: str, sa_path: str, start: date, end: date) -> list[dict]:
    """日別の新規ユーザー・ユーザー（内部除外）。伸びの判定用。"""
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest
    from google.oauth2 import service_account
    creds = service_account.Credentials.from_service_account_file(
        sa_path, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
    client = BetaAnalyticsDataClient(credentials=creds)
    resp = client.run_report(RunReportRequest(
        property=f"properties/{property_id}",
        date_ranges=[DateRange(start_date=start.isoformat(), end_date=end.isoformat())],
        dimensions=[Dimension(name="date"), Dimension(name="testDataFilterName")],
        metrics=[Metric(name="newUsers"), Metric(name="activeUsers")], limit=1000,
    ))
    by: dict[str, dict] = {}
    for r in resp.rows:
        d, name = r.dimension_values[0].value, r.dimension_values[1].value
        if "internal" in name.lower():
            continue
        iso = f"{d[:4]}-{d[4:6]}-{d[6:]}"
        row = by.setdefault(iso, {"date": iso, "new_users_ext": 0, "users_ext": 0})
        row["new_users_ext"] += int(r.metric_values[0].value)
        row["users_ext"] += int(r.metric_values[1].value)
    days = []
    d = start
    while d <= end:
        days.append(by.get(d.isoformat(), {"date": d.isoformat(), "new_users_ext": 0, "users_ext": 0}))
        d += timedelta(days=1)
    return days


# ---------------------------------------------------------------- GSC
def gsc_fetch(site_url: str, sa_path: str, start: date, end: date, top: bool) -> dict:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        sa_path, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
    svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)

    def q(dims: list[str], limit: int = 100):
        body = {"startDate": start.isoformat(), "endDate": end.isoformat(),
                "dimensions": dims, "rowLimit": limit}
        return svc.searchanalytics().query(siteUrl=site_url, body=body).execute().get("rows", [])

    totals = q([], 1)
    out = {
        "impressions": int(totals[0]["impressions"]) if totals else 0,
        "clicks": int(totals[0]["clicks"]) if totals else 0,
        "queries": [], "pages": [],
    }
    if top:
        for key, dim in (("queries", "query"), ("pages", "page")):
            rows = sorted(q([dim]), key=lambda r: r["impressions"], reverse=True)[:5]
            out[key] = [{"key": r["keys"][0], "impressions": int(r["impressions"]),
                         "clicks": int(r["clicks"]), "position": r["position"]} for r in rows]
    return out


# ---------------------------------------------------------------- 月次・四半期
PERIOD_START = date(2026, 5, 1)    # 集計を始める月（サイトの初回コミットは 2026-05-13）
PERIOD_KEYS = ("sessions", "sessions_ext", "pv", "pv_ext", "users", "users_ext", "new_users", "new_users_ext",
               *EVENTS, "gsc_impressions", "gsc_clicks")


def month_ranges(start: date, end: date) -> list[tuple[str, date, date]]:
    """start の月から end の月までの (キー, 初日, 末日) 。末日は end を超えない。"""
    out = []
    y, m = start.year, start.month
    while date(y, m, 1) <= end:
        last = (date(y + (m == 12), m % 12 + 1, 1) - timedelta(days=1))
        out.append((f"{y}-{m:02d}", date(y, m, 1), min(last, end)))
        y, m = (y + 1, 1) if m == 12 else (y, m + 1)
    return out


def quarter_ranges(start: date, end: date) -> list[tuple[str, date, date]]:
    out = []
    y, q = start.year, (start.month - 1) // 3 + 1
    while date(y, (q - 1) * 3 + 1, 1) <= end:
        s0 = date(y, (q - 1) * 3 + 1, 1)
        last = (date(y + (q == 4), (q % 4) * 3 + 1, 1) - timedelta(days=1))
        out.append((f"{y}-Q{q}", s0, min(last, end)))
        y, q = (y + 1, 1) if q == 4 else (y, q + 1)
    return out


def ga4_by_month(property_id: str, sa_path: str, start: date, end: date) -> dict[str, dict]:
    """yearMonth ごとの訪問とイベント（内部込み・内部除外）。キーは "YYYY-MM"。"""
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (
        DateRange, Dimension, Filter, FilterExpression, FilterExpressionList, Metric, RunReportRequest,
    )
    from google.oauth2 import service_account
    creds = service_account.Credentials.from_service_account_file(
        sa_path, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
    client = BetaAnalyticsDataClient(credentials=creds)
    prop = f"properties/{property_id}"
    dr = [DateRange(start_date=start.isoformat(), end_date=end.isoformat())]
    by: dict[str, dict] = {}

    def row_for(ym: str) -> dict:
        return by.setdefault(f"{ym[:4]}-{ym[4:]}", {k: 0 for k in PERIOD_KEYS})

    resp = client.run_report(RunReportRequest(
        property=prop, date_ranges=dr,
        dimensions=[Dimension(name="yearMonth"), Dimension(name="testDataFilterName")],
        metrics=[Metric(name="sessions"), Metric(name="screenPageViews"),
                 Metric(name="activeUsers"), Metric(name="newUsers")], limit=1000,
    ))
    for r in resp.rows:
        row = row_for(r.dimension_values[0].value)
        internal = "internal" in r.dimension_values[1].value.lower()
        for k, m in zip(("sessions", "pv", "users", "new_users"), r.metric_values):
            row[k] += int(m.value)
            if not internal:
                row[k + "_ext"] += int(m.value)
    resp = client.run_report(RunReportRequest(
        property=prop, date_ranges=dr,
        dimensions=[Dimension(name="yearMonth"), Dimension(name="eventName")],
        metrics=[Metric(name="eventCount")], limit=1000,
        dimension_filter=FilterExpression(or_group=FilterExpressionList(expressions=[
            FilterExpression(filter=Filter(field_name="eventName", string_filter=Filter.StringFilter(value=e)))
            for e in EVENTS])),
    ))
    for r in resp.rows:
        row_for(r.dimension_values[0].value)[r.dimension_values[1].value] += int(r.metric_values[0].value)
    return by


def gsc_by_day(site_url: str, sa_path: str, start: date, end: date) -> dict[str, dict]:
    """日ごとの表示回数とクリック数。キーは ISO 日付。"""
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    creds = service_account.Credentials.from_service_account_file(
        sa_path, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
    svc = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    body = {"startDate": start.isoformat(), "endDate": end.isoformat(), "dimensions": ["date"], "rowLimit": 5000}
    rows = svc.searchanalytics().query(siteUrl=site_url, body=body).execute().get("rows", [])
    return {r["keys"][0]: {"gsc_impressions": int(r["impressions"]), "gsc_clicks": int(r["clicks"])} for r in rows}


def build_periods(property_id: str, sa_path: str, site_url: str, end: date) -> dict:
    """月ごと・四半期ごとの集計。訪問者（ユーザー）は期間内の重複を除くため、四半期は GA4 に期間指定で取り直す。
    GSC が取れなければ gsc_* は 0 のまま、gsc_error を立てる。"""
    months = month_ranges(PERIOD_START, end)
    quarters = quarter_ranges(PERIOD_START, end)
    ga_m = ga4_by_month(property_id, sa_path, PERIOD_START, end)
    gsc_error = False
    try:
        gsc_d = gsc_by_day(site_url, sa_path, PERIOD_START, end)
    except Exception as e:
        print(f"GSC 月次取得失敗: {str(e)[:160]}", file=sys.stderr)
        gsc_d, gsc_error = {}, True

    def gsc_sum(s0: date, e0: date) -> dict:
        imp = clk = 0
        for d, v in gsc_d.items():
            if s0.isoformat() <= d <= e0.isoformat():
                imp += v["gsc_impressions"]; clk += v["gsc_clicks"]
        return {"gsc_impressions": imp, "gsc_clicks": clk}

    monthly = []
    for key, s0, e0 in months:
        rec = {k: 0 for k in PERIOD_KEYS}
        rec.update(ga_m.get(key, {}))
        rec.update(gsc_sum(s0, e0))
        rec.update({"key": key, "label": f"{s0.year}年{s0.month}月", "start": s0.isoformat(), "end": e0.isoformat(),
                    "days": (e0 - s0).days + 1, "partial": e0.month == end.month and e0.year == end.year and e0.day < 28})
        monthly.append(rec)
    quarterly = []
    for key, s0, e0 in quarters:
        ga = ga4_fetch(property_id, sa_path, s0, e0)
        rec = {"sessions": ga["total"]["sessions"], "sessions_ext": ga["ext"]["sessions"],
               "pv": ga["total"]["pv"], "pv_ext": ga["ext"]["pv"],
               "users": ga["total"]["users"], "users_ext": ga["ext"]["users"],
               "new_users": ga["total"]["new_users"], "new_users_ext": ga["ext"]["new_users"],
               **{e: ga["events"][e] for e in EVENTS}, **gsc_sum(s0, e0)}
        q = int(key[-1])
        rec.update({"key": key, "label": f"{s0.year}年{(q-1)*3+1}月から{q*3}月", "start": s0.isoformat(), "end": e0.isoformat(),
                    "days": (e0 - s0).days + 1, "partial": e0 == end and (e0.month % 3 != 0 or e0.day < 28)})
        quarterly.append(rec)
    # 公開前の、すべて 0 の月・四半期は先頭から落とす
    def trim(rows):
        while rows and all(rows[0][k] == 0 for k in PERIOD_KEYS):
            rows.pop(0)
        return rows
    return {"monthly": trim(monthly), "quarterly": trim(quarterly), "gsc_error": gsc_error, "end": end.isoformat()}


# ---------------------------------------------------------------- 所見
GSC_LOW, GSC_HIGH = 100, 500       # 2026-12-01 の判断基準（週あたり検索表示回数）
AFF_MIN_VIEWS = 500                # 教材カードの判定に必要な表示回数（外部）
DECISION_DAY = "2026-12-01"        # 独自ドメインと投資の判断日


def prep(point: str, reasons=(), examples=(), action: str = "") -> list[str]:
    """所見1件を PREP（結論・理由・例・結論）の順の文のリストにする。例は無ければ省く。
    各文は結論を先に書く。理由は「理由は〜からです」、例は「具体的には〜」、締めは「そのため〜」で始める。"""
    lines = [point]
    lines += [("理由は、" if i == 0 else "また、") + r for i, r in enumerate([r for r in reasons if r])]
    lines += [("具体的には、" if i == 0 else "") + e for i, e in enumerate([e for e in examples if e])]
    if action:
        lines.append(f"そのため、{action}")
    return lines


def analyze(ga_cur, ga_prev, gsc_cur, gsc_prev, week_ago: dict | None = None, daily: list[dict] | None = None) -> list[list[str]]:
    """数字を決まった基準で所見にする。1件が1論点で、文のリスト（PREP の順）。
    順序は 1) 訪問 2) 内部混入 3) 教材カード 4) 論点ページからの移動 5) 検索。"""
    out: list[list[str]] = []
    c, p = ga_cur["ext"], ga_prev["ext"]
    tot = ga_cur["total"]

    # 1) 訪問（内部を除く）
    n7 = n14 = zero = None
    if daily and len(daily) >= 14:
        n7 = sum(d["new_users_ext"] for d in daily[-7:])
        n14 = sum(d["new_users_ext"] for d in daily[-14:-7])
        zero = sum(1 for d in daily[-7:] if d["new_users_ext"] == 0)
    reasons, examples = [], []
    if c["users"] == 0:
        point = "内部を除いた訪問者は、この7日間にいませんでした。"
        reasons.append("内部を除いた訪問者が 0人だったからです。")
    elif n7 is not None and n7 >= 5 and n7 >= n14 * 1.5:
        point = "初めて訪問した人は増えています。"
        reasons.append(f"初めて訪問した人が直近7日で {n7}人で、その前の7日の {n14}人より多いからです。")
    elif n7 is not None and n14 >= 5 and n7 <= n14 * 0.67:
        point = "初めて訪問した人は減っています。"
        reasons.append(f"初めて訪問した人が直近7日で {n7}人で、その前の7日の {n14}人より少ないからです。")
    elif c["users"] < 30:
        point = "訪問者は少人数のままです。"
        reasons.append(f"内部を除いた訪問者が {c['users']}人で（前週は {p['users']}人）、週 30人に届いていないからです。")
        if n7 is not None:
            reasons.append(f"初めて訪問した人も直近7日で {n7}人、その前の7日で {n14}人と少ないからです。")
    else:
        point = "訪問者は週 30人を超えています。"
        reasons.append(f"内部を除いた訪問者が {c['users']}人で、前週の {p['users']}人から {delta(c['users'], p['users'])} だったからです。")
        if n7 is not None:
            reasons.append(f"初めて訪問した人は直近7日で {n7}人、その前の7日で {n14}人でした。")
    if zero and c["users"] > 0:
        examples.append(f"初めての訪問者がいなかった日は、直近7日のうち {zero}日ありました。")
    examples.append(f"訪問回数は {c['sessions']}回、ページ表示は {c['pv']}回でした。")
    if c["sessions"] and c["users"] and c["sessions"] / c["users"] >= 3:
        examples.append(f"1人あたりの訪問回数は {c['sessions']/c['users']:.1f}回で、少人数が繰り返し使っています。")
    if c["users"] < 30:
        action = "訪問者の数で判断を変える段階ではなく、X と note からの流入を作る作業を続けるべきです。"
    else:
        action = "訪問者の伸びを月ごとの表で確認し、伸びた月に何をしたかを記録すべきです。"
    out.append(prep(point, reasons, examples, action))

    # 2) 内部混入
    if tot["pv"]:
        mix = 1 - c["pv"] / tot["pv"]
        if mix >= 0.3:
            out.append(prep(
                "内部のアクセスが数字に混ざっています。",
                [f"内部のアクセスがページ表示の {mix*100:.0f}% を占めているからです。"],
                [],
                "設定していない端末で ?internal=1 を開いてから、数字を判断に使うべきです。"))
        elif tot["users"] - c["users"] == 0 and tot["pv"] > 20:
            out.append(prep(
                "自分の端末のアクセスが集計に入っている可能性が高いです。",
                ["内部として記録されたアクセスが 0 だったからです。"],
                [],
                "自分が使う端末すべてで ?internal=1 を一度開くべきです。"))

    # 3) 教材カード
    ev, evp = ga_cur["events"], ga_prev["events"]
    v, k = ev["affiliate_view"], ev["affiliate_click"]
    cvr = ratio(k, v)
    ex = [f"表示 {v}回、クリック {k}回で、クリック率は {cvr:.1f}% でした（前週は表示 {evp['affiliate_view']}回、クリック {evp['affiliate_click']}回）。"]
    if v < AFF_MIN_VIEWS:
        out.append(prep(
            "教材カードの配置と文言は、まだ判断できません。",
            [f"表示回数が {v}回で、判定に必要な {AFF_MIN_VIEWS}回に届いていないからです。"],
            ex,
            f"配置と文言は変えずに、表示回数が {AFF_MIN_VIEWS}回に達するまで待ちます。"))
    elif cvr < 1.0:
        out.append(prep(
            "教材カードは、出す条件と文言を変える必要があります。",
            [f"表示回数が {v}回あるのに、クリック率が {cvr:.1f}% で 1% を下回っているからです。"],
            ex,
            "カードを出す条件（つまずいたとき）と文言を変えるべきです。"))
    else:
        out.append(prep(
            "教材カードはクリックされています。",
            [f"表示回数 {v}回に対して、クリック率が {cvr:.1f}% で 1% を超えているからです。"],
            ex,
            "次は成果通知で発生件数を追うべきです。"))

    # 4) 論点ページからの移動
    tp = ev["topic_page_to_app"]
    if tp or evp["topic_page_to_app"]:
        if tp:
            out.append(prep(
                "論点ページは、アプリへの入口として働いています。",
                [f"論点ページからアプリへ移動した回数が {tp}回あったからです（前週は {evp['topic_page_to_app']}回）。"],
                [],
                "論点ページの解説を増やす方針を続けるべきです。"))
        else:
            out.append(prep(
                "論点ページからアプリへの移動は、この7日間にありませんでした。",
                [f"論点ページからアプリへ移動した回数が 0回だったからです（前週は {evp['topic_page_to_app']}回）。"],
                [],
                "論点ページへの流入そのものが無いか、Google 検索の表示回数と合わせて見るべきです。"))

    # 5) 検索
    gi, gc = gsc_cur["impressions"], gsc_cur["clicks"]
    if gsc_cur.get("error"):
        out.append(prep(
            "Search Console のデータを取得できませんでした。",
            ["API の呼び出しが失敗したからです。"],
            [],
            "サービスアカウントの権限を確認すべきです。"))
    else:
        real_q = [q for q in gsc_cur["queries"] if not q["key"].startswith("site:")]
        top = "、".join(q["key"] for q in real_q[:3])
        ex = [f"Google 検索に表示された回数は {gi}回（前週は {gsc_prev['impressions']}回）、検索からクリックされた回数は {gc}回でした。"]
        if gi == 0 or not real_q:
            out.append(prep(
                "検索流入はまだ始まっていません。",
                ["一般的な検索語での表示がまだ無く、インデックス登録を待っている段階だからです。"],
                ex,
                f"{DECISION_DAY} の判断日までは、X と note からの流入を優先すべきです。"))
        elif gi < GSC_LOW:
            out.append(prep(
                "検索流入はまだ立ち上がっていません。",
                [f"Google 検索に表示された回数が週 {gi}回で、基準の {GSC_LOW}回に届いていないからです。"],
                ex + [f"表示が多い検索語は「{top}」です。"],
                f"{DECISION_DAY} の判断日までは、X と note からの流入を優先すべきです。"))
        elif gi < GSC_HIGH:
            out.append(prep(
                "検索に拾われ始めています。",
                [f"Google 検索に表示された回数が週 {gi}回で、{GSC_LOW}回から {GSC_HIGH}回の範囲に入ったからです。"],
                ex + [f"表示が多い検索語は「{top}」です。"],
                "表示が多い検索語の論点ページから、解説と例題を厚くすべきです。"))
        else:
            out.append(prep(
                "検索流入は投資の基準を超えました。",
                [f"Google 検索に表示された回数が週 {gi}回で、基準の {GSC_HIGH}回を超えたからです。"],
                ex + [f"表示が多い検索語は「{top}」です。"],
                "論点ページに第2問を追加し、2級講座への導線に時間を割くべきです。"))
    return out


def note_text(lines: list[str], bullet: str = "・", indent: str = "　") -> str:
    """所見1件を表示用の文字列にする。先頭行に「・」、以降は全角空白で字下げし、2行ごとに空行を入れる。"""
    out = []
    for i, ln in enumerate(lines):
        if i and i % 2 == 0:
            out.append("")
        out.append((bullet if i == 0 else indent) + ln)
    return "\n".join(out)


# ---------------------------------------------------------------- 表示
def delta(cur: float, prev: float, pct: bool = False) -> str:
    if pct:
        return f"{cur - prev:+.1f}ポイント"
    if prev == 0:
        return "変化なし" if cur == 0 else "前週は 0"
    return f"{(cur - prev) / prev * 100:+.0f}%"


def ratio(num: int, den: int) -> float:
    return (num / den * 100) if den else 0.0


def short_page(url: str) -> str:
    return url.replace(SITE_URL_DEFAULT, "/") or "/"


def render_md(today: date, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes: list[list[str]] | None = None, periods: dict | None = None) -> str:
    (gs, ge), (gps, gpe) = ga_rng
    (ss, se), (sps, spe) = gsc_rng
    L = []
    L.append(f"### {today.isoformat()}")
    L.append("")
    L.append(f"GA4 は {gs:%m/%d}から{ge:%m/%d}までを集計し、前週は {gps:%m/%d}から{gpe:%m/%d}までです。"
             f" Search Console は反映が遅れるため {ss:%m/%d}から{se:%m/%d}までを集計しています。")
    L.append("")
    L.append("| 項目 | 今週 | 前週 | 前週からの変化 |")
    L.append("|---|---:|---:|---:|")

    def row(label, c, p, pct=False, fmt="{:,}"):
        f = (lambda v: f"{v:.1f}%") if pct else (lambda v: fmt.format(v))
        L.append(f"| {label} | {f(c)} | {f(p)} | {delta(c, p, pct)} |")

    row("訪問回数（セッション）", ga_cur["total"]["sessions"], ga_prev["total"]["sessions"])
    row("　うち内部を除いた回数", ga_cur["ext"]["sessions"], ga_prev["ext"]["sessions"])
    row("ページが表示された回数（PV）", ga_cur["total"]["pv"], ga_prev["total"]["pv"])
    row("　うち内部を除いた回数", ga_cur["ext"]["pv"], ga_prev["ext"]["pv"])
    row("訪問した人数（ユーザー）", ga_cur["total"]["users"], ga_prev["total"]["users"])
    row("　うち内部を除いた人数", ga_cur["ext"]["users"], ga_prev["ext"]["users"])
    row("初めて訪問した人数（内部を除く）", ga_cur["ext"]["new_users"], ga_prev["ext"]["new_users"])
    ev_c, ev_p = ga_cur["events"], ga_prev["events"]
    row("教材カードが表示された回数（affiliate_view）", ev_c["affiliate_view"], ev_p["affiliate_view"])
    row("教材カードがクリックされた回数（affiliate_click）", ev_c["affiliate_click"], ev_p["affiliate_click"])
    row("教材カードのクリック率（クリック÷表示）", ratio(ev_c["affiliate_click"], ev_c["affiliate_view"]),
        ratio(ev_p["affiliate_click"], ev_p["affiliate_view"]), pct=True)
    row("論点ページからアプリへ移動した回数（topic_page_to_app）", ev_c["topic_page_to_app"], ev_p["topic_page_to_app"])
    row("Google 検索に表示された回数（GSC）", gsc_cur["impressions"], gsc_prev["impressions"])
    row("Google 検索からクリックされた回数（GSC）", gsc_cur["clicks"], gsc_prev["clicks"])
    L.append("")
    if notes:
        L.append("所見")
        L.append("")
        for n in notes:
            # 1文1行。行末の2つの空白は Markdown の改行。2行ごとの空行はそのまま段落の区切りになる
            L.append(note_text(n).replace("\n", "  \n"))
            L.append("")

    if gsc_cur["queries"]:
        L.append("Google 検索で表示回数が多かった検索語（上位5件）")
        L.append("")
        L.append("| 検索語 | 表示された回数 | クリックされた回数 | 平均順位 |")
        L.append("|---|---:|---:|---:|")
        for r in gsc_cur["queries"]:
            L.append(f"| {r['key']} | {r['impressions']} | {r['clicks']} | {r['position']:.1f} |")
        L.append("")
    if gsc_cur["pages"]:
        L.append("Google 検索で表示回数が多かったページ（上位5件）")
        L.append("")
        L.append("| ページ | 表示された回数 | クリックされた回数 | 平均順位 |")
        L.append("|---|---:|---:|---:|")
        for r in gsc_cur["pages"]:
            L.append(f"| {short_page(r['key'])} | {r['impressions']} | {r['clicks']} | {r['position']:.1f} |")
        L.append("")
    if gsc_cur.get("error"):
        L.append("Search Console のデータを取得できませんでした。上の表の GSC の行は 0 として扱っています。サービスアカウントの権限を確認してください。")
        L.append("")
    elif not gsc_cur["queries"] and not gsc_cur["pages"]:
        L.append("Google 検索での表示はまだないため、検索語とページの表は空です。")
        L.append("")
    if periods:
        L.extend(period_table_md("月ごとの推移（直近6か月、内部を除く）", periods["monthly"][-6:]))
        L.extend(period_table_md("四半期ごとの推移（直近4四半期、内部を除く）", periods["quarterly"][-4:]))
        if periods.get("gsc_error"):
            L.append("月ごと・四半期ごとの Search Console の列は、取得に失敗したため 0 です。")
            L.append("")
    return "\n".join(L)


PERIOD_COLS = [("訪問した人数", "users_ext"), ("初めて訪問した人数", "new_users_ext"), ("訪問回数", "sessions_ext"),
               ("ページが表示された回数", "pv_ext"), ("教材カードが表示された回数", "affiliate_view"),
               ("教材カードがクリックされた回数", "affiliate_click"), ("論点ページからアプリへ移動した回数", "topic_page_to_app"),
               ("Google 検索に表示された回数", "gsc_impressions"), ("Google 検索からクリックされた回数", "gsc_clicks")]


def period_label(r: dict) -> str:
    """途中の期間は「2026年11月（2日まで）」「2026年10月から12月（11月2日まで）」のように末日を添える。"""
    if not r.get("partial"):
        return r["label"]
    e = date.fromisoformat(r["end"])
    return r["label"] + (f"（{e.day}日まで）" if r["key"][5:6] != "Q" else f"（{e.month}月{e.day}日まで）")


def period_table_md(title: str, rows: list[dict]) -> list[str]:
    if not rows:
        return []
    L = [title, "", "| 期間 | " + " | ".join(c for c, _ in PERIOD_COLS) + " |", "|---|" + "---:|" * len(PERIOD_COLS)]
    for r in rows:
        L.append(f"| {period_label(r)} | " + " | ".join(f"{r[k]:,}" for _, k in PERIOD_COLS) + " |")
    L.append("")
    return L


def render_slack(today: date, ga_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, dashboard_url: str = "", notes: list[list[str]] | None = None, periods: dict | None = None) -> dict:
    """Slack Incoming Webhook 用 payload（blocks）。数字は「今週 → 前週比」で揃える。"""
    (gs, ge), _ = ga_rng
    ev_c, ev_p = ga_cur["events"], ga_prev["events"]
    cv_c = ratio(ev_c["affiliate_click"], ev_c["affiliate_view"])
    cv_p = ratio(ev_p["affiliate_click"], ev_p["affiliate_view"])

    def kpi(label, cur, prev, pct=False):
        val = f"{cur:.1f}%" if pct else f"{cur:,}"
        return f"*{label}*\n{val}  ({delta(cur, prev, pct)})"

    fields = [
        kpi("訪問した人数（内部を除く）", ga_cur["ext"]["users"], ga_prev["ext"]["users"]),
        kpi("訪問回数（内部を除く）", ga_cur["ext"]["sessions"], ga_prev["ext"]["sessions"]),
        kpi("ページが表示された回数（内部を除く）", ga_cur["ext"]["pv"], ga_prev["ext"]["pv"]),
        kpi("教材カードが表示された回数", ev_c["affiliate_view"], ev_p["affiliate_view"]),
        kpi("教材カードがクリックされた回数", ev_c["affiliate_click"], ev_p["affiliate_click"]),
        kpi("教材カードのクリック率", cv_c, cv_p, pct=True),
        kpi("論点ページからアプリへ移動した回数", ev_c["topic_page_to_app"], ev_p["topic_page_to_app"]),
        kpi("Google 検索に表示された回数", gsc_cur["impressions"], gsc_prev["impressions"]),
        kpi("Google 検索からクリックされた回数", gsc_cur["clicks"], gsc_prev["clicks"]),
    ]
    title = f"無限仕訳 {today:%-m/%-d} の報告（{gs:%-m/%-d}から{ge:%-m/%-d}までの7日間と、その前の7日間の比較）"
    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": title}},
        {"type": "section", "fields": [{"type": "mrkdwn", "text": f} for f in fields[:5]]},
        {"type": "section", "fields": [{"type": "mrkdwn", "text": f} for f in fields[5:]]},
    ]
    if notes:
        blocks.append({"type": "divider"})
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": "*所見*"}})
        for n in notes:  # 1件1ブロック（1ブロック 3000 文字の上限を超えないため）
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": note_text(n)}})
    if periods and (periods["monthly"] or periods["quarterly"]):
        def pf(head, r):
            return (f"*{head}: {period_label(r)}*\n訪問者 {r['users_ext']:,}人 / 初めての訪問者 {r['new_users_ext']:,}人 / "
                    f"検索表示 {r['gsc_impressions']:,}回 / 教材カードのクリック {r['affiliate_click']:,}回")
        heads_m = ["今月", "先月", "先々月"]
        heads_q = ["今四半期", "前四半期"]
        pfields = [pf(h, r) for h, r in zip(heads_m, reversed(periods["monthly"][-3:]))]
        pfields += [pf(h, r) for h, r in zip(heads_q, reversed(periods["quarterly"][-2:]))]
        blocks.append({"type": "divider"})
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": "*月ごと・四半期ごとの推移（内部を除く）*"},})
        blocks.append({"type": "section", "fields": [{"type": "mrkdwn", "text": f} for f in pfields]})
    if dashboard_url:
        blocks.append({"type": "actions", "elements": [{
            "type": "button", "text": {"type": "plain_text", "text": "ダッシュボードを開きます"},
            "url": dashboard_url, "style": "primary"}]})
    text = (f"{title}: 訪問者 {ga_cur['ext']['users']}人 / 訪問 {ga_cur['ext']['sessions']}回 / ページ表示 {ga_cur['ext']['pv']}回 / "
            f"教材カードの表示 {ev_c['affiliate_view']}回 クリック {ev_c['affiliate_click']}回 / Google 検索での表示 {gsc_cur['impressions']}回")
    return {"text": text, "blocks": blocks}


# ---------------------------------------------------------------- 出力
def append_block(path: Path, block: str, heading: str, replace: bool = False) -> bool:
    """見出し行（行全体が一致）で判定する。本文中に同じ文字列が引用されていても誤判定しない。"""
    import re
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    if re.search(rf"^{re.escape(heading)}\s*$", text, re.M):
        if not replace:
            print(f"skip: {heading} は既に {path.name} にある（--replace で上書き）")
            return False
        # 同日ブロック（見出しから次の見出し or 末尾まで）を差し替える
        text = re.sub(rf"^{re.escape(heading)}\s*$.*?(?=^#{{2,3}} |\Z)", block.rstrip("\n") + "\n\n",
                      text, count=1, flags=re.M | re.S).rstrip("\n") + "\n"
        path.write_text(text, encoding="utf-8")
        print(f"replace: {heading} を差し替えた")
        return True
    if not re.search(rf"^{re.escape(SECTION_HEADING)}\s*$", text, re.M):
        text = text.rstrip("\n") + f"\n\n{SECTION_HEADING}\n\n週1（月曜朝）自動追記。生成元: mugen-shiwake/tools/weekly_report.py\n"
    text = text.rstrip("\n") + "\n\n" + block.rstrip("\n") + "\n"
    path.write_text(text, encoding="utf-8")
    return True


def snapshot(today: date, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes: list[list[str]] | None = None, daily: list[dict] | None = None, periods: dict | None = None) -> dict:
    """ダッシュボード用の1日分スナップショット（直近7日と前週の値）。"""
    def flat(ga, gsc):
        return {
            "sessions": ga["total"]["sessions"], "sessions_ext": ga["ext"]["sessions"],
            "pv": ga["total"]["pv"], "pv_ext": ga["ext"]["pv"],
            "users": ga["total"]["users"], "users_ext": ga["ext"]["users"],
            "new_users": ga["total"]["new_users"], "new_users_ext": ga["ext"]["new_users"],
            **{e: ga["events"][e] for e in EVENTS},
            "gsc_impressions": gsc["impressions"], "gsc_clicks": gsc["clicks"],
        }
    return {
        "date": today.isoformat(),
        "ga_range": [d.isoformat() for d in ga_rng[0]],
        "gsc_range": [d.isoformat() for d in gsc_rng[0]],
        "cur": flat(ga_cur, gsc_cur), "prev": flat(ga_prev, gsc_prev),
        "queries": gsc_cur["queries"], "pages": gsc_cur["pages"],
        "gsc_error": bool(gsc_cur.get("error")),
        "notes": [note_text(n) for n in (notes or [])],
        "daily": daily or [],
        "periods": periods or {"monthly": [], "quarterly": []},
    }


def upsert_history(path: Path, snap: dict, keep: int = 400) -> None:
    import json
    hist = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    hist = [h for h in hist if h.get("date") != snap["date"]] + [snap]
    hist = sorted(hist, key=lambda h: h["date"])[-keep:]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(hist, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"history: {len(hist)} 日分 → {path}")


def post_slack(payload: dict) -> None:
    import requests
    url = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not url:
        print("SLACK_WEBHOOK_URL 未設定のため Slack 送信スキップ", file=sys.stderr)
        return
    r = requests.post(url, json=payload, timeout=30)
    r.raise_for_status()
    print("Slack に送信した")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--env-file", help=".env のパス（toishi-revenue-os のものを借りる）")
    ap.add_argument("--append", help="progress.md のパス。末尾の「## 週次レポート」節にブロックを追記")
    ap.add_argument("--out", help="Markdown をこのファイルにも書く")
    ap.add_argument("--slack", action="store_true", help="SLACK_WEBHOOK_URL に要約を送る")
    ap.add_argument("--date", help="集計基準日 YYYY-MM-DD（省略時は今日）")
    ap.add_argument("--replace", action="store_true", help="同日のブロックが既にあれば差し替える（権限追加後の再実行用）")
    ap.add_argument("--history", help="ダッシュボード用 history.json のパス。当日分を upsert する")
    ap.add_argument("--dashboard-url", default=os.environ.get("DASHBOARD_URL", ""), help="Slack のボタンから開くURL")
    args = ap.parse_args()

    if args.env_file:
        from dotenv import load_dotenv
        load_dotenv(args.env_file, override=False)

    sa_path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    if sa_path and not os.path.isabs(sa_path) and args.env_file:
        sa_path = str(Path(args.env_file).resolve().parent / sa_path)
    property_id = os.environ.get("MUGEN_GA4_PROPERTY_ID", "")
    site_url = os.environ.get("MUGEN_GSC_SITE_URL", SITE_URL_DEFAULT)
    missing = [k for k, v in (("GOOGLE_SERVICE_ACCOUNT_JSON", sa_path), ("MUGEN_GA4_PROPERTY_ID", property_id)) if not v]
    if missing:
        print("未設定: " + ", ".join(missing), file=sys.stderr)
        return 2

    today = date.fromisoformat(args.date) if args.date else date.today()
    ga_rng, gsc_rng = week_ranges(today - timedelta(days=1), today - timedelta(days=3))

    ga_cur = ga4_fetch(property_id, sa_path, *ga_rng[0])
    ga_prev = ga4_fetch(property_id, sa_path, *ga_rng[1])
    daily = ga4_daily(property_id, sa_path, today - timedelta(days=28), today - timedelta(days=1))
    try:
        gsc_cur = gsc_fetch(site_url, sa_path, *gsc_rng[0], top=True)
        gsc_prev = gsc_fetch(site_url, sa_path, *gsc_rng[1], top=False)
    except Exception as e:  # 権限不足などでも GA4 分は残す
        print(f"GSC 取得失敗（GA4 のみで出力）: {str(e)[:160]}", file=sys.stderr)
        empty = {"impressions": 0, "clicks": 0, "queries": [], "pages": []}
        gsc_cur, gsc_prev = dict(empty, error=True), dict(empty)

    week_ago = None
    if args.history and Path(args.history).exists():
        import json
        target = (today - timedelta(days=7)).isoformat()
        week_ago = next((h for h in json.loads(Path(args.history).read_text(encoding="utf-8")) if h.get("date") == target), None)
    notes = analyze(ga_cur, ga_prev, gsc_cur, gsc_prev, week_ago, daily)
    try:
        periods = build_periods(property_id, sa_path, site_url, today - timedelta(days=1))
    except Exception as e:  # 月次が取れなくても週次は出す
        print(f"月次・四半期の取得失敗（週次のみで出力）: {str(e)[:160]}", file=sys.stderr)
        periods = None

    md = render_md(today, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes, periods)
    print(md)
    if args.out:
        Path(args.out).write_text(md + "\n", encoding="utf-8")
    written = True
    if args.append:
        written = append_block(Path(args.append), md, f"### {today.isoformat()}", replace=args.replace)
    if args.history:
        upsert_history(Path(args.history), snapshot(today, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes, daily, periods))
    if args.slack and not written:
        print("同日ブロックをスキップしたので Slack 送信も省略")
    elif args.slack:
        post_slack(render_slack(today, ga_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, args.dashboard_url, notes, periods))
    return 0


if __name__ == "__main__":
    sys.exit(main())
