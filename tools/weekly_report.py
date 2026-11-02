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


# ---------------------------------------------------------------- 所見
GSC_LOW, GSC_HIGH = 100, 500       # 2026-12-01 の判断基準（週あたり検索表示回数）
AFF_MIN_VIEWS = 500                # 教材カードの判定に必要な表示回数（外部）


def analyze(ga_cur, ga_prev, gsc_cur, gsc_prev, week_ago: dict | None = None) -> list[str]:
    """数字を決まった基準で文章化する。順序は 1) 外部アクセス 2) 混入 3) 教材カード 4) 導線 5) 検索。"""
    out: list[str] = []
    c, p = ga_cur["ext"], ga_prev["ext"]
    tot = ga_cur["total"]

    # 1) 外部アクセス
    s = f"外部ユーザー {c['users']}人（前週 {p['users']}）、セッション {c['sessions']}、PV {c['pv']}。"
    if week_ago and week_ago.get("cur", {}).get("users_ext") is not None:
        wa = week_ago["cur"]["users_ext"]
        s += f" 7日前の時点の7日値は {wa}人で{delta(c['users'], wa)}。"
    if c["users"] == 0:
        s += " 外部からの訪問はまだない。"
    elif c["sessions"] and c["users"] and c["sessions"] / c["users"] >= 3:
        s += f" 1人あたり {c['sessions']/c['users']:.1f} セッションで、少人数が繰り返し使っている。"
    out.append(s)

    # 2) 内部混入
    if tot["pv"]:
        mix = 1 - c["pv"] / tot["pv"]
        if mix >= 0.3:
            out.append(f"内部アクセスが PV の {mix*100:.0f}% を占める。未設定の端末で ?internal=1 を開いてから数字を信用する。")
        elif tot["users"] - c["users"] == 0 and tot["pv"] > 20:
            out.append("内部フラグ付きのアクセスが 0。自分の端末が全て計測に入っている可能性が高い。")

    # 3) 教材カード
    ev, evp = ga_cur["events"], ga_prev["events"]
    v, k = ev["affiliate_view"], ev["affiliate_click"]
    cvr = ratio(k, v)
    if v < AFF_MIN_VIEWS:
        out.append(f"教材カード 表示 {v}・クリック {k}（{cvr:.1f}%）。表示 {AFF_MIN_VIEWS} 未満なので配置・文言の判断は保留。")
    elif cvr < 1.0:
        out.append(f"教材カード 表示 {v}・クリック {k}（{cvr:.1f}%）。1% 未満。出す条件（つまずき時）と文言を変える。")
    else:
        out.append(f"教材カード 表示 {v}・クリック {k}（{cvr:.1f}%）。クリックは出ている。次は成果通知で発生件数を追う。")

    # 4) 導線
    tp = ev["topic_page_to_app"]
    if tp or evp["topic_page_to_app"]:
        out.append(f"論点ページ→アプリ {tp}（前週 {evp['topic_page_to_app']}）。")

    # 5) 検索
    gi, gc = gsc_cur["impressions"], gsc_cur["clicks"]
    if gsc_cur.get("error"):
        out.append("検索（GSC）は取得失敗。権限を確認。")
    else:
        real_q = [q for q in gsc_cur["queries"] if not q["key"].startswith("site:")]
        s = f"検索表示 {gi}（前週 {gsc_prev['impressions']}）、クリック {gc}。"
        if gi == 0 or not real_q:
            s += " 一般クエリでの表示はまだなく、インデックス待ち。"
        elif gi < GSC_LOW:
            s += f" 週 {GSC_LOW} 未満で SEO は立ち上がり前。上位クエリ: " + "／".join(q["key"] for q in real_q[:3]) + "。"
        elif gi < GSC_HIGH:
            s += f" 週 {GSC_LOW}〜{GSC_HIGH} で拾われ始めている。上位クエリ: " + "／".join(q["key"] for q in real_q[:3]) + "。"
        else:
            s += f" 週 {GSC_HIGH} 超。論点ページの第2問追加と2級導線に時間を割く段階。"
        out.append(s)
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


def render_md(today: date, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes: list[str] | None = None) -> str:
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
    row("ユーザー数", ga_cur["total"]["users"], ga_prev["total"]["users"])
    row("　内部除外", ga_cur["ext"]["users"], ga_prev["ext"]["users"])
    row("新規ユーザー（内部除外）", ga_cur["ext"]["new_users"], ga_prev["ext"]["new_users"])
    ev_c, ev_p = ga_cur["events"], ga_prev["events"]
    row("affiliate_view", ev_c["affiliate_view"], ev_p["affiliate_view"])
    row("affiliate_click", ev_c["affiliate_click"], ev_p["affiliate_click"])
    row("click/view", ratio(ev_c["affiliate_click"], ev_c["affiliate_view"]),
        ratio(ev_p["affiliate_click"], ev_p["affiliate_view"]), pct=True)
    row("topic_page_to_app", ev_c["topic_page_to_app"], ev_p["topic_page_to_app"])
    row("GSC 表示回数", gsc_cur["impressions"], gsc_prev["impressions"])
    row("GSC クリック", gsc_cur["clicks"], gsc_prev["clicks"])
    L.append("")
    if notes:
        L.append("所見")
        L.append("")
        L.extend(f"- {n}" for n in notes)
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


def render_slack(today: date, ga_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, dashboard_url: str = "", notes: list[str] | None = None) -> dict:
    """Slack Incoming Webhook 用 payload（blocks）。数字は「今週 → 前週比」で揃える。"""
    (gs, ge), _ = ga_rng
    ev_c, ev_p = ga_cur["events"], ga_prev["events"]
    cv_c = ratio(ev_c["affiliate_click"], ev_c["affiliate_view"])
    cv_p = ratio(ev_p["affiliate_click"], ev_p["affiliate_view"])

    def kpi(label, cur, prev, pct=False):
        val = f"{cur:.1f}%" if pct else f"{cur:,}"
        return f"*{label}*\n{val}  ({delta(cur, prev, pct)})"

    fields = [
        kpi("ユーザー（内部除外）", ga_cur["ext"]["users"], ga_prev["ext"]["users"]),
        kpi("セッション（内部除外）", ga_cur["ext"]["sessions"], ga_prev["ext"]["sessions"]),
        kpi("PV（内部除外）", ga_cur["ext"]["pv"], ga_prev["ext"]["pv"]),
        kpi("教材カード 表示", ev_c["affiliate_view"], ev_p["affiliate_view"]),
        kpi("教材カード クリック", ev_c["affiliate_click"], ev_p["affiliate_click"]),
        kpi("クリック率", cv_c, cv_p, pct=True),
        kpi("論点ページ→アプリ", ev_c["topic_page_to_app"], ev_p["topic_page_to_app"]),
        kpi("Google 検索 表示", gsc_cur["impressions"], gsc_prev["impressions"]),
        kpi("Google 検索 クリック", gsc_cur["clicks"], gsc_prev["clicks"]),
    ]
    title = f"無限仕訳 {today:%-m/%-d}（{gs:%-m/%-d}〜{ge:%-m/%-d} の7日間・前週比）"
    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": title}},
        {"type": "section", "fields": [{"type": "mrkdwn", "text": f} for f in fields[:5]]},
        {"type": "section", "fields": [{"type": "mrkdwn", "text": f} for f in fields[5:]]},
    ]
    if notes:
        blocks.append({"type": "divider"})
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": "*所見*\n" + "\n".join(f"• {n}" for n in notes)}})
    if dashboard_url:
        blocks.append({"type": "actions", "elements": [{
            "type": "button", "text": {"type": "plain_text", "text": "ダッシュボードを開く"},
            "url": dashboard_url, "style": "primary"}]})
    text = (f"{title}: ユーザー {ga_cur['ext']['users']} / セッション {ga_cur['ext']['sessions']} / PV {ga_cur['ext']['pv']} / "
            f"教材カード {ev_c['affiliate_view']}→{ev_c['affiliate_click']} / 検索表示 {gsc_cur['impressions']}")
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


def snapshot(today: date, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes: list[str] | None = None) -> dict:
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
        "notes": notes or [],
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
    notes = analyze(ga_cur, ga_prev, gsc_cur, gsc_prev, week_ago)

    md = render_md(today, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes)
    print(md)
    if args.out:
        Path(args.out).write_text(md + "\n", encoding="utf-8")
    written = True
    if args.append:
        written = append_block(Path(args.append), md, f"### {today.isoformat()}", replace=args.replace)
    if args.history:
        upsert_history(Path(args.history), snapshot(today, ga_rng, gsc_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, notes))
    if args.slack and not written:
        print("同日ブロックをスキップしたので Slack 送信も省略")
    elif args.slack:
        post_slack(render_slack(today, ga_rng, ga_cur, ga_prev, gsc_cur, gsc_prev, args.dashboard_url, notes))
    return 0


if __name__ == "__main__":
    sys.exit(main())
