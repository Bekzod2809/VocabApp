#!/bin/bash
# VocabApp — bazaning kunlik zaxira nusxasi.
#
# /etc/cron.d/vocabapp dan har kuni ishga tushadi (server-setup.sh yoki README).
# Nusxalar: /opt/vocabapp/backups/vocabapp-YYYY-MM-DD_HHMM.sql.gz, oxirgi 14 kuni saqlanadi.
#
# Tiklash:
#   gunzip -c FAYL.sql.gz | docker compose -f /opt/vocabapp/deploy/docker-compose.yml exec -T db psql -U vocabapp -d vocabapp

set -euo pipefail

BACKUP_DIR=/opt/vocabapp/backups
FILE="$BACKUP_DIR/vocabapp-$(date +%F_%H%M).sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose -f /opt/vocabapp/deploy/docker-compose.yml exec -T db \
    pg_dump -U vocabapp -d vocabapp --clean --if-exists | gzip > "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

find "$BACKUP_DIR" -name 'vocabapp-*.sql.gz' -mtime +14 -delete

echo "$(date '+%F %T') backup: $FILE ($(du -h "$FILE" | cut -f1))"
