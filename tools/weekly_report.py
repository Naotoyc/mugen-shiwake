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

出力: 1週1ブロック（### 日付見出し＋表）。--append 先に「## 週次レポート」節が無ければ末尾に作る。
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
        metrics=[Metric(name="sessions"), Metric(name="screenPageViews")],
    ))
    total = {"sessions": 0, "pv": 0}
    ext = {"sessions": 0, "pv": 0}
    for r in resp.rows:
        name = r.dimension_values[0].value
        s, pv = int(r.metric_values[0].value), int(r.metric_values[1].value)
        total["sessions"] += s
        total["pv"] += pv
        if "internal" not in name.lower():
            ext["sessions"] += s
            ext["pv"] += pv

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


# ---------------------------------------------------------------- 表示
def delta(cur: float, prev: float, pct: bool = False) -> str:
    if pct:
        return f"{cur - prev:+.1f}pt"
    if prev == 0:
        return "—" if cur == 0 else "new"
    return f"{(cur - prev) / prev * 100:+.0f}%"


def ratio(num: int, den: int) -> float:
    return (num / den * 100) if den else 0.0


def short_page(url: str) -> str:
    return url.replace(SITE_URL_DEFAULT, "/") or "/"


def render_md(today: date, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev) -> str:
    (gs, ge), (gps, gpe) = ga_rng
    (ss, se), (sps, spe) = gsc_rng
    L = []
    L.append(f"### {today.isoformat()}")
    L.append("")
    L.append(f"GA4 集計 {gs:%m/%d}〜{ge:%m/%d}（前週 {gps:%m/%d}〜{gpe:%m/%d}）"
             f" / GSC 集計 {ss:%m/%d}〜{se:%m/%d}（反映遅れのため3日前まで）")
    L.append("")
    L.append("| 指標 | 今週 | 前週 | 前週比 |")
    L.append("|---|---:|---:|---:|")

    def row(label, c, p, pct=False, fmt="{:,}"):
        f = (lambda v: f"{v:.1f}%") if pct else (lambda v: fmt.format(v))
        L.append(f"| {label} | {f(c)} | {f(p)} | {delta(c, p, pct)} |")

    row("セッション", ga_cur["total"]["sessions"], ga_prev["total"]["sessions"])
    row("　内部除外", ga_cur["ext"]["sessions"], ga_prev["ext"]["sessions"])
    row("表示回数（PV）", ga_cur["total"]["pv"], ga_prev["total"]["pv"])
    row("　内部除外", ga_cur["ext"]["pv"], ga_prev["ext"]["pv"])
    ev_c, ev_p = ga_cur["events"], ga_prev["events"]
    row("affiliate_view", ev_c["affiliate_view"], ev_p["affiliate_view"])
    row("affiliate_click", ev_c["affiliate_click"], ev_p["affiliate_click"])
    row("click/view", ratio(ev_c["affiliate_click"], ev_c["affiliate_view"]),
        ratio(ev_p["affiliate_click"], ev_p["affiliate_view"]), pct=True)
    row("topic_page_to_app", ev_c["topic_page_to_app"], ev_p["topic_page_to_app"])
    row("GSC 表示回数", gsc_cur["impressions"], gsc_prev["impressions"])
    row("GSC クリック", gsc_cur["clicks"], gsc_prev["clicks"])
    L.append("")

    if gsc_cur["queries"]:
        L.append("GSC 表示回数 上位クエリ")
        L.append("")
        L.append("| クエリ | 表示 | クリック | 順位 |")
        L.append("|---|---:|---:|---:|")
        for r in gsc_cur["queries"]:
            L.append(f"| {r['key']} | {r['impressions']} | {r['clicks']} | {r['position']:.1f} |")
        L.append("")
    if gsc_cur["pages"]:
        L.append("GSC 表示回数 上位ページ")
        L.append("")
        L.append("| ページ | 表示 | クリック | 順位 |")
        L.append("|---|---:|---:|---:|")
        for r in gsc_cur["pages"]:
            L.append(f"| {short_page(r['key'])} | {r['impressions']} | {r['clicks']} | {r['position']:.1f} |")
        L.append("")
    if gsc_cur.get("error"):
        L.append("GSC: 取得失敗（サービスアカウントの権限を確認）。上の GSC 行は 0 扱い")
    elif not gsc_cur["queries"] and not gsc_cur["pages"]:
        L.append("GSC 上位クエリ／ページ: データなし（表示回数0）")
        L.append("")
    return "\n".join(L)


def render_slack(today: date, ga_cur, ga_prev, gsc_cur, gsc_prev) -> str:
    ev_c, ev_p = ga_cur["events"], ga_prev["events"]
    cv_c = ratio(ev_c["affiliate_click"], ev_c["affiliate_view"])
    cv_p = ratio(ev_p["affiliate_click"], ev_p["affiliate_view"])
    lines = [
        f"*無限仕訳 週次 {today:%Y/%m/%d}*（直近7日 / 前週比）",
        f"• セッション {ga_cur['ext']['sessions']:,}（内部除外） {delta(ga_cur['ext']['sessions'], ga_prev['ext']['sessions'])}"
        f" ／ PV {ga_cur['ext']['pv']:,} {delta(ga_cur['ext']['pv'], ga_prev['ext']['pv'])}",
        f"• 教材カード view {ev_c['affiliate_view']} → click {ev_c['affiliate_click']}"
        f"（{cv_c:.1f}%、{delta(cv_c, cv_p, pct=True)}）",
        f"• 論点→アプリ {ev_c['topic_page_to_app']} {delta(ev_c['topic_page_to_app'], ev_p['topic_page_to_app'])}",
        f"• GSC 表示 {gsc_cur['impressions']:,} {delta(gsc_cur['impressions'], gsc_prev['impressions'])}"
        f" ／ クリック {gsc_cur['clicks']:,} {delta(gsc_cur['clicks'], gsc_prev['clicks'])}",
    ]
    if gsc_cur["queries"]:
        lines.append("• 上位クエリ: " + " / ".join(f"{r['key']}({r['impressions']})" for r in gsc_cur["queries"][:3]))
    lines.append(f"詳細: progress.md の {SECTION_HEADING}")
    return "\n".join(lines)


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


def post_slack(text: str) -> None:
    import requests
    url = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not url:
        print("SLACK_WEBHOOK_URL 未設定のため Slack 送信スキップ", file=sys.stderr)
        return
    r = requests.post(url, json={"text": text}, timeout=30)
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
    try:
        gsc_cur = gsc_fetch(site_url, sa_path, *gsc_rng[0], top=True)
        gsc_prev = gsc_fetch(site_url, sa_path, *gsc_rng[1], top=False)
    except Exception as e:  # 権限不足などでも GA4 分は残す
        print(f"GSC 取得失敗（GA4 のみで出力）: {str(e)[:160]}", file=sys.stderr)
        empty = {"impressions": 0, "clicks": 0, "queries": [], "pages": []}
        gsc_cur, gsc_prev = dict(empty, error=True), dict(empty)

    md = render_md(today, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev)
    print(md)
    if args.out:
        Path(args.out).write_text(md + "\n", encoding="utf-8")
    if args.append:
        append_block(Path(args.append), md, f"### {today.isoformat()}", replace=args.replace)
    if args.slack:
        post_slack(render_slack(today, ga_cur, ga_prev, gsc_cur, gsc_prev))
    return 0


if __name__ == "__main__":
    sys.exit(main())
