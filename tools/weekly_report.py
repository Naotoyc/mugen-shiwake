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
BOT_KEYS = ("sessions", "pv", "users", "new_users")


def ga4_bots(client, prop: str, dr, lead_dim: str | None = None, groups_out: set | None = None) -> dict[str, dict]:
    """機械的なアクセスとみなす分の件数を返す。キーは lead_dim の値（なければ ""）。

    3条件がすべて重なる行だけを機械とみなす（2026-11-16 ユーザー決定）。
    国が日本以外、参照元が (direct)、滞在時間の合計が 0秒。
    滞在 0秒だけ、参照元が直接だけでは人間も当てはまるので、単独では使わない。
    国が (not set) の行は判定できないので除外しない。内部アクセスの行は別に除外済みなので数えない。
    """
    from google.analytics.data_v1beta.types import Dimension, Metric, RunReportRequest
    dims = ([lead_dim] if lead_dim else []) + [
        "testDataFilterName", "country", "city", "sessionSource", "deviceCategory", "operatingSystem", "browser"]
    resp = client.run_report(RunReportRequest(
        property=prop, date_ranges=dr,
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name="sessions"), Metric(name="screenPageViews"), Metric(name="activeUsers"),
                 Metric(name="newUsers"), Metric(name="userEngagementDuration")], limit=10000,
    ))
    out: dict[str, dict] = {}
    groups: set[tuple] = set()   # 機械とみなした行（期間キー＋国、都市、参照元、端末、OS、ブラウザ）

    def blank() -> dict:
        return {**dict.fromkeys(BOT_KEYS, 0), **{e: 0 for e in EVENTS}}

    for r in resp.rows:
        v = [x.value for x in r.dimension_values]
        key = v.pop(0) if lead_dim else ""
        filt, country, _city, source = v[0], v[1], v[2], v[3]
        if "internal" in filt.lower():
            continue
        if country in ("Japan", "(not set)", "") or source != "(direct)":
            continue
        if float(r.metric_values[4].value) > 0:
            continue
        groups.add((key, *v[1:]))
        row = out.setdefault(key, blank())
        for k, m in zip(BOT_KEYS, r.metric_values[:4]):
            row[k] += int(m.value)
    if groups_out is not None:
        groups_out |= groups
    if not groups:
        return out

    # 同じ行が出したイベント（教材カードの表示など）も数える。
    # 滞在時間はイベント名で分けると 0 になるので、機械の判定は上の結果だけを使う。
    from google.analytics.data_v1beta.types import Filter, FilterExpression, FilterExpressionList
    resp = client.run_report(RunReportRequest(
        property=prop, date_ranges=dr,
        dimensions=[Dimension(name=d) for d in dims + ["eventName"]],
        metrics=[Metric(name="eventCount")], limit=10000,
        dimension_filter=FilterExpression(or_group=FilterExpressionList(expressions=[
            FilterExpression(filter=Filter(field_name="eventName", string_filter=Filter.StringFilter(value=e)))
            for e in EVENTS])),
    ))
    for r in resp.rows:
        v = [x.value for x in r.dimension_values]
        key = v.pop(0) if lead_dim else ""
        if "internal" in v[0].lower() or (key, *v[1:-1]) not in groups:
            continue
        out.setdefault(key, blank())[v[-1]] += int(r.metric_values[0].value)
    return out


def ga4_card_viewers(client, prop: str, dr, bot_groups: set, lead_dim: str | None = None) -> dict[str, int]:
    """教材カードを見た人数（内部と機械的なアクセスを除く）。キーは lead_dim の値（なければ ""）。
    表示回数は1人が長く解くと跳ねるので、判断には人数を使う（2026-11-20 ユーザー決定）。
    国、都市、参照元、端末ごとの人数を足すので、同じ人が別の経路で来た場合は重ねて数える。"""
    from google.analytics.data_v1beta.types import Dimension, Filter, FilterExpression, Metric, RunReportRequest
    dims = ([lead_dim] if lead_dim else []) + [
        "testDataFilterName", "country", "city", "sessionSource", "deviceCategory", "operatingSystem", "browser"]
    resp = client.run_report(RunReportRequest(
        property=prop, date_ranges=dr,
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name="activeUsers")], limit=10000,
        dimension_filter=FilterExpression(filter=Filter(
            field_name="eventName", string_filter=Filter.StringFilter(value="affiliate_view"))),
    ))
    out: dict[str, int] = {}
    for r in resp.rows:
        v = [x.value for x in r.dimension_values]
        key = v.pop(0) if lead_dim else ""
        if "internal" in v[0].lower() or (key, *v[1:]) in bot_groups:
            continue
        out[key] = out.get(key, 0) + int(r.metric_values[0].value)
    return out


def subtract_bot_events(events: dict, bots: dict) -> None:
    for e in EVENTS:
        events[e] = max(0, events.get(e, 0) - bots.get(e, 0))


def subtract_bots(ext: dict, bots: dict, suffix: str = "") -> None:
    for k in BOT_KEYS:
        ext[k + suffix] = max(0, ext.get(k + suffix, 0) - bots.get(k, 0))


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

    # 3) 機械的なアクセスを、全体と内部除外の両方から引く（内部の割合の計算を崩さないため）
    groups: set = set()
    bots = ga4_bots(client, prop, dr, groups_out=groups).get("", dict.fromkeys(BOT_KEYS, 0))
    subtract_bots(total, bots)
    subtract_bots(ext, bots)
    subtract_bot_events(events, bots)
    events["affiliate_viewers"] = ga4_card_viewers(client, prop, dr, groups).get("", 0)

    return {"total": total, "ext": ext, "events": events, "bots": bots}


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
    for d8, b in ga4_bots(client, f"properties/{property_id}",
                          [DateRange(start_date=start.isoformat(), end_date=end.isoformat())], "date").items():
        row = by.get(f"{d8[:4]}-{d8[4:6]}-{d8[6:]}")
        if row:
            row["new_users_ext"] = max(0, row["new_users_ext"] - b["new_users"])
            row["users_ext"] = max(0, row["users_ext"] - b["users"])
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
               *EVENTS, "affiliate_viewers", "gsc_impressions", "gsc_clicks")


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
    groups: set = set()
    for ym, b in ga4_bots(client, prop, dr, "yearMonth", groups_out=groups).items():
        subtract_bots(row_for(ym), b)
        subtract_bots(row_for(ym), b, "_ext")
        subtract_bot_events(row_for(ym), b)
    for ym, n in ga4_card_viewers(client, prop, dr, groups, "yearMonth").items():
        row_for(ym)["affiliate_viewers"] = n
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
               **{e: ga["events"][e] for e in EVENTS}, "affiliate_viewers": ga["events"].get("affiliate_viewers", 0),
               **gsc_sum(s0, e0)}
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
USERS_MIN = 30                     # 訪問した人数の基準（週あたり）
VIEWERS_MIN = 30                   # 教材カードを見た人数の基準（週あたり）
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


def funnel(ga: dict, gsc: dict) -> list[tuple[str, str, int, int, str]]:
    """4つの段階（段階の名前、数字の名前、値、基準、単位）。人はこの順に減っていく。"""
    ev = ga["events"]
    return [
        ("Google 検索に表示される", "Google 検索に表示された回数", gsc["impressions"], GSC_LOW, "回"),
        ("サイトを訪問する", "訪問した人数", ga["ext"]["users"], USERS_MIN, "人"),
        ("教材カードを見る", "教材カードを見た人数", ev.get("affiliate_viewers", 0), VIEWERS_MIN, "人"),
        ("教材カードを押す", "教材カードがクリックされた回数", ev["affiliate_click"], 1, "回"),
    ]


FUNNEL_GUIDE = ("人は「Google 検索に表示される」「サイトを訪問する」「教材カードを見る」「教材カードを押す」の順に減っていきます。"
                "上の段階から順に見て、最初に基準に届いていない段階が、今週の詰まりです。"
                "今週の詰まりより後の段階の数字は、まだ判断に使いません。")


def analyze(ga_cur, ga_prev, gsc_cur, gsc_prev, week_ago: dict | None = None, daily: list[dict] | None = None) -> list[list[str]]:
    """数字を決まった基準で所見にする。1件が1論点で、文のリスト（PREP の順）。
    1件目は必ず「今週の詰まり」。4つの段階を上から見て、最初に基準に届いていない段階を1つだけ示す。"""
    out: list[list[str]] = []
    c = ga_cur["ext"]
    tot = ga_cur["total"]
    ev = ga_cur["events"]
    cur, prev = funnel(ga_cur, gsc_cur), funnel(ga_prev, gsc_prev)
    gsc_error = bool(gsc_cur.get("error"))
    real_q = [q for q in gsc_cur["queries"] if not q["key"].startswith("site:")]
    top = "、".join(q["key"] for q in real_q[:3])
    actions = [
        f"論点ページのインデックス登録の申請と X の投稿を続け、{DECISION_DAY} に Google 検索の伸びを判断します。",
        "表示が多い検索語の論点ページの題名と説明文を見直すべきです。",
        "教材カードを出す位置と、教材カードを出す条件を見直すべきです。",
        "教材カードの文言と、教材カードを出す条件を見直すべきです。",
    ]
    numbers = "、".join(f"{label} {v}{unit}（前週は {pv[2]}{unit}）" for (_, label, v, _, unit), pv in zip(cur, prev))
    examples = [f"4つの数字は、{numbers}でした。"]
    if top:
        examples.append(f"Google 検索で表示が多い検索語は「{top}」です。")
    idx = next((i for i, st in enumerate(cur) if st[2] < st[3] and not (i == 0 and gsc_error)), None)
    if idx is None:
        out.append(prep("4つの段階は、すべて基準を超えました。",
                        ["教材カードがクリックされた回数まで、基準に届いているからです。"],
                        examples, "次は成果通知で、講座の申込件数を追うべきです。"))
    else:
        name, label, v, th, unit = cur[idx]
        out.append(prep(f"今週の詰まりは、「{name}」の段階です。",
                        [f"{label}が {v}{unit}で、基準の {th}{unit}に届いていないからです。"],
                        examples, actions[idx]))
    if gsc_error:
        out.append(prep("Search Console のデータを取得できませんでした。",
                        ["API の呼び出しが失敗したからです。"], [],
                        "サービスアカウントの権限を確認すべきです。"))

    # 教材カードの表示回数が、少ない人数に偏っているとき
    views, viewers = ev["affiliate_view"], ev.get("affiliate_viewers", 0)
    if viewers and views / viewers >= 10:
        out.append(prep("教材カードの表示回数は、少ない人数による回数です。",
                        [f"教材カードの表示 {views}回が、{viewers}人によるものだからです。"], [],
                        "教材カードは、表示回数ではなく、教材カードを見た人数で判断します。"))

    # 内部混入
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

    # 機械的なアクセスの除外（人数を明示する）
    bots = ga_cur.get("bots") or {}
    if bots.get("users"):
        out.append(prep(
            "機械的なアクセスを、4つの数字から除外しました。",
            [f"国が日本以外、参照元が直接、滞在 0秒の3条件が重なるアクセスが {bots['users']}人分あったからです。"],
            [],
            "この報告の数字は、機械的なアクセスを除外した後の値として読んでください。"))
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
    L.append(FUNNEL_GUIDE)
    L.append("")
    L.append("| 段階 | 数字 | 今週 | 前週 | 基準 |")
    L.append("|---|---|---:|---:|---:|")
    for i, ((name, label, v, th, unit), pv) in enumerate(zip(funnel(ga_cur, gsc_cur), funnel(ga_prev, gsc_prev)), 1):
        L.append(f"| {i}. {name} | {label} | {v:,}{unit} | {pv[2]:,}{unit} | 週 {th:,}{unit} |")
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
        L.extend(period_table_md("月ごとの推移（直近6か月、内部と機械的なアクセスを除く）", periods["monthly"][-6:]))
        L.extend(period_table_md("四半期ごとの推移（直近4四半期、内部と機械的なアクセスを除く）", periods["quarterly"][-4:]))
        if periods.get("gsc_error"):
            L.append("月ごと・四半期ごとの Search Console の列は、取得に失敗したため 0 です。")
            L.append("")
    return "\n".join(L)


PERIOD_COLS = [("Google 検索に表示された回数", "gsc_impressions"), ("訪問した人数", "users_ext"),
               ("教材カードを見た人数", "affiliate_viewers"), ("教材カードがクリックされた回数", "affiliate_click")]


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
        L.append(f"| {period_label(r)} | " + " | ".join(f"{r.get(k, 0):,}" for _, k in PERIOD_COLS) + " |")
    L.append("")
    return L


def x_today(today: date, queue_path: str) -> dict | None:
    """tools/x_queue.json から今日の予約文を返す。無ければ None。投稿は人が行う（X API は使わない）。"""
    import json
    path = Path(queue_path)
    if not path.exists():
        return None
    for item in json.loads(path.read_text(encoding="utf-8")):
        if item.get("date") == today.isoformat():
            return item
    return None


def x_intent_url(text: str) -> str:
    """X の投稿画面を本文入りで開くリンク（0円方式。API 課金なし）。"""
    from urllib.parse import quote
    return "https://x.com/intent/post?text=" + quote(text, safe="")


def render_slack(today: date, ga_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, dashboard_url: str = "", notes: list[list[str]] | None = None, periods: dict | None = None, x_item: dict | None = None) -> dict:
    """Slack Incoming Webhook 用 payload（blocks）。数字は「今週 → 前週比」で揃える。"""
    (gs, ge), _ = ga_rng
    cur, prev = funnel(ga_cur, gsc_cur), funnel(ga_prev, gsc_prev)
    fields = [f"*{i}. {label}*\n{v:,}{unit}  ({delta(v, pv[2])})\n基準は週 {th:,}{unit}"
              for i, ((_, label, v, th, unit), pv) in enumerate(zip(cur, prev), 1)]
    title = f"無限仕訳 {today:%-m/%-d} の報告（{gs:%-m/%-d}から{ge:%-m/%-d}までの7日間と、その前の7日間の比較）"
    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": title}},
        {"type": "section", "fields": [{"type": "mrkdwn", "text": f} for f in fields]},
        {"type": "context", "elements": [{"type": "mrkdwn", "text": FUNNEL_GUIDE}]},
    ]
    if notes:
        blocks.append({"type": "divider"})
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": "*所見*"}})
        for n in notes:  # 1件1ブロック（1ブロック 3000 文字の上限を超えないため）
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": note_text(n)}})
    if periods and (periods["monthly"] or periods["quarterly"]):
        def pf(head, r):
            return (f"*{head}: {period_label(r)}*\nGoogle 検索での表示 {r['gsc_impressions']:,}回 / 訪問した人数 {r['users_ext']:,}人 / "
                    f"教材カードを見た人数 {r.get('affiliate_viewers', 0):,}人 / 教材カードのクリック {r['affiliate_click']:,}回")
        heads_m = ["今月", "先月", "先々月"]
        heads_q = ["今四半期", "前四半期"]
        pfields = [pf(h, r) for h, r in zip(heads_m, reversed(periods["monthly"][-3:]))]
        pfields += [pf(h, r) for h, r in zip(heads_q, reversed(periods["quarterly"][-2:]))]
        blocks.append({"type": "divider"})
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": "*月ごと・四半期ごとの推移（内部と機械的なアクセスを除く）*"},})
        blocks.append({"type": "section", "fields": [{"type": "mrkdwn", "text": f} for f in pfields]})
    if x_item:
        blocks.append({"type": "divider"})
        blocks.append({"type": "section", "text": {"type": "mrkdwn",
                       "text": f"*今日の X 投稿（@papatoishi、{x_item['id']}）*\nボタンを押すと本文が入った投稿画面が開くので、確認して「ポスト」を押してください。\n```{x_item['text']}```"}})
        blocks.append({"type": "actions", "elements": [{
            "type": "button", "text": {"type": "plain_text", "text": "X の投稿画面を開きます"},
            "url": x_intent_url(x_item["text"])}]})
    if dashboard_url:
        blocks.append({"type": "actions", "elements": [{
            "type": "button", "text": {"type": "plain_text", "text": "ダッシュボードを開きます"},
            "url": dashboard_url, "style": "primary"}]})
    text = f"{title}: " + " / ".join(f"{label} {v}{unit}" for _, label, v, _, unit in cur)
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
            "bot_users": (ga.get("bots") or {}).get("users", 0), "bot_pv": (ga.get("bots") or {}).get("pv", 0),
            **{e: ga["events"][e] for e in EVENTS},
            "affiliate_viewers": ga["events"].get("affiliate_viewers", 0),
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
    ap.add_argument("--x-queue", help="X の予約文 JSON（tools/x_queue.json）。今日の分があれば Slack に投稿画面を開くボタンを付ける")
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
        x_item = x_today(today, args.x_queue) if args.x_queue else None
        post_slack(render_slack(today, ga_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, args.dashboard_url, notes, periods, x_item))
    return 0


if __name__ == "__main__":
    sys.exit(main())
