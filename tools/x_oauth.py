"""X API v2 の OAuth 1.0a ユーザーコンテキスト署名（標準ライブラリのみ）。

note-autopost/x_oauth.py から流用。読み取り件数の計測は外した。"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

API_BASE = "https://api.x.com/2"


class XCredentials:
    __slots__ = ("api_key", "api_secret", "access_token", "access_secret")

    def __init__(self, env: dict[str, str]) -> None:
        need = ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET")
        missing = [k for k in need if not env.get(k)]
        if missing:
            raise SystemExit(f".env に未設定のキーがあります: {', '.join(missing)}")
        self.api_key = env["X_API_KEY"]
        self.api_secret = env["X_API_SECRET"]
        self.access_token = env["X_ACCESS_TOKEN"]
        self.access_secret = env["X_ACCESS_TOKEN_SECRET"]


def _quote(s: str) -> str:
    return urllib.parse.quote(s, safe="")


def auth_header(method: str, url: str, creds: XCredentials,
                query: dict[str, str] | None = None) -> str:
    """OAuth 1.0a の Authorization ヘッダーを生成する。

    JSON ボディは署名対象外（X API v2 の仕様）。クエリ文字列のみ含める。
    """
    oauth = {
        "oauth_consumer_key": creds.api_key,
        "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": creds.access_token,
        "oauth_version": "1.0",
    }
    all_params = {**oauth, **(query or {})}
    param_str = "&".join(f"{_quote(k)}={_quote(all_params[k])}" for k in sorted(all_params))
    base = "&".join([method.upper(), _quote(url), _quote(param_str)])
    signing_key = f"{_quote(creds.api_secret)}&{_quote(creds.access_secret)}".encode()
    oauth["oauth_signature"] = base64.b64encode(
        hmac.new(signing_key, base.encode(), hashlib.sha1).digest()
    ).decode()
    return "OAuth " + ", ".join(f'{_quote(k)}="{_quote(v)}"' for k, v in sorted(oauth.items()))


def request(method: str, path: str, creds: XCredentials,
            payload: dict[str, Any] | None = None, timeout: int = 30,
            params: dict[str, str] | None = None) -> tuple[int, dict]:
    url = f"{API_BASE}{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    # OAuth1.0a ではクエリ文字列も署名対象に含める
    headers = {"Authorization": auth_header(method, url, creds, params)}
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            body = json.loads(res.read().decode() or "{}")
            return res.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, {"raw": body[:500]}


def verify(creds: XCredentials) -> tuple[int, dict]:
    """読み取りのみ。認証が通るかの確認に使う。"""
    return request("GET", "/users/me", creds)


def post_tweet(text: str, creds: XCredentials) -> tuple[int, dict]:
    return request("POST", "/tweets", creds, {"text": text})
