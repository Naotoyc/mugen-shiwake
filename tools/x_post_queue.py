#!/usr/bin/env python3
"""tools/x_queue.json の予約投稿を、1回の実行で最大1本だけ X に投稿する。

- 投稿するのは「posted_at が空で、date が今日（JST）以前」の先頭1件。遅延しても1日1本しか出ない
- 成功したら posted_at と tweet_id を書き戻す（コミットは呼び出し側）
- --dry-run は本文を表示するだけで投稿しない
- 認証情報の値はログに出さない
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import x_oauth  # noqa: E402

JST = timezone(timedelta(hours=9))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--queue", default=str(Path(__file__).resolve().parent / "x_queue.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--today", help="YYYY-MM-DD（テスト用。省略時は JST の今日）")
    args = ap.parse_args()

    path = Path(args.queue)
    queue = json.loads(path.read_text(encoding="utf-8"))
    today = args.today or datetime.now(JST).date().isoformat()
    due = [q for q in queue if not q.get("posted_at") and q["date"] <= today]
    if not due:
        remaining = [q for q in queue if not q.get("posted_at")]
        nxt = remaining[0]["date"] if remaining else "なし"
        print(f"今日({today})に出す投稿はありません。次は {nxt} です。")
        return 0
    item = due[0]
    print(f"投稿対象: {item['id']}（予定日 {item['date']}）\n---\n{item['text']}\n---")
    if args.dry_run:
        return 0

    keys = ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET")
    creds = x_oauth.XCredentials({k: os.environ.get(k, "") for k in keys})
    status, body = x_oauth.post_tweet(item["text"], creds)
    if status not in (200, 201) or "data" not in body:
        print(f"投稿失敗: HTTP {status} {json.dumps(body, ensure_ascii=False)[:300]}", file=sys.stderr)
        return 1
    item["posted_at"] = datetime.now(JST).isoformat(timespec="seconds")
    item["tweet_id"] = body["data"]["id"]
    path.write_text(json.dumps(queue, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"投稿しました: https://x.com/papatoishi/status/{item['tweet_id']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
