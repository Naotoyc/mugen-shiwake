#!/usr/bin/env python3
"""@papatoishi 用の X アクセストークンを PIN 方式（OAuth 1.0a, oob）で取得する。1回だけ手元で実行する。

使い方:
  X_API_KEY=... X_API_SECRET=... python3 tools/x_authorize.py
  1) 表示された URL をブラウザで開き、@papatoishi でログインして「アプリを認証」を押す
  2) 表示された PIN をこのターミナルに貼る
  3) トークンは ~/.mugen_x_tokens.env に保存される（画面には出さない）。
     その2行の値を GitHub の Secrets X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET に貼る

X_API_KEY / X_API_SECRET は developer.x.com のアプリ（note-autopost と同じアプリで可）のもの。
アプリの User authentication settings で「Read and write」と「OAuth 1.0a」が有効で、
Callback URL に何か1つ入っている必要がある（oob はコールバックを使わないが、空だと設定を保存できない）。
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


def _q(s: str) -> str:
    return urllib.parse.quote(s, safe="")


def _signed_post(url: str, key: str, secret: str, token: str = "", token_secret: str = "",
                 extra: dict[str, str] | None = None) -> dict[str, str]:
    oauth = {
        "oauth_consumer_key": key, "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1", "oauth_timestamp": str(int(time.time())),
        "oauth_version": "1.0", **(extra or {}),
    }
    if token:
        oauth["oauth_token"] = token
    param_str = "&".join(f"{_q(k)}={_q(oauth[k])}" for k in sorted(oauth))
    base = "&".join(["POST", _q(url), _q(param_str)])
    signing_key = f"{_q(secret)}&{_q(token_secret)}".encode()
    oauth["oauth_signature"] = base64.b64encode(hmac.new(signing_key, base.encode(), hashlib.sha1).digest()).decode()
    header = "OAuth " + ", ".join(f'{_q(k)}="{_q(v)}"' for k, v in sorted(oauth.items()))
    req = urllib.request.Request(url, data=b"", headers={"Authorization": header}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as res:
        return dict(urllib.parse.parse_qsl(res.read().decode()))


def main() -> int:
    key, secret = os.environ.get("X_API_KEY", ""), os.environ.get("X_API_SECRET", "")
    if not key or not secret:
        print("X_API_KEY と X_API_SECRET を環境変数で渡してください", file=sys.stderr)
        return 2
    rt = _signed_post("https://api.x.com/oauth/request_token", key, secret, extra={"oauth_callback": "oob"})
    print("1) このURLを開き、@papatoishi でログインして認証してください:")
    print(f"   https://api.x.com/oauth/authorize?oauth_token={rt['oauth_token']}")
    pin = input("2) 表示された PIN を貼ってください: ").strip()
    at = _signed_post("https://api.x.com/oauth/access_token", key, secret, rt["oauth_token"], rt["oauth_token_secret"],
                      extra={"oauth_verifier": pin})
    out = Path.home() / ".mugen_x_tokens.env"
    out.write_text(f"X_ACCESS_TOKEN={at['oauth_token']}\nX_ACCESS_TOKEN_SECRET={at['oauth_token_secret']}\n", encoding="utf-8")
    out.chmod(0o600)
    print(f"3) @{at.get('screen_name', '?')} のトークンを {out} に保存しました。値は表示しません。")
    print("   その2行を GitHub の Settings > Secrets に X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET として登録してください。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
