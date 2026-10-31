#!/bin/sh
# 無限仕訳 週次レポート（ローカル cron 用）。toishi-revenue-os の venv・.env・サービスアカウントを借りる。
# cron: 30 6 * * 1 （月曜 06:30 JST）
set -e
cd "$(dirname "$0")/.."
OS_DIR="$HOME/command-center/toishi-revenue-os"
exec "$OS_DIR/.venv/bin/python3" tools/weekly_report.py \
  --env-file "$OS_DIR/.env" \
  --append "$HOME/my-Superbrain/projects/無限仕訳/progress.md" \
  --slack "$@"
