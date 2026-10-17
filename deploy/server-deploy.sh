#!/bin/bash
# VocabApp — serverdagi deploy skripti.
#
# Loyiha arxivi (tar.gz: backend/VocabApp.Api, frontend/, deploy/) stdin orqali keladi.
# Laptopdan push-to-server.sh yuboradi va har safar shu skriptning yangi nusxasini
# /opt/vocabapp/deploy.sh ga o'zi yozib qo'yadi.
#
# Serverda boshqa loyihalar ham bor: skript faqat /opt/vocabapp va "vocabapp" compose loyihasiga tegadi.

set -euo pipefail

VAQTINCHA=$(mktemp -d)
trap 'rm -rf "$VAQTINCHA"' EXIT

echo "==> Arxiv ochilmoqda"
tar -xzf - -C "$VAQTINCHA"

echo "==> Backend kodi yangilanmoqda"
mkdir -p /opt/vocabapp/src /opt/vocabapp/deploy
rm -rf /opt/vocabapp/src/VocabApp.Api
mv "$VAQTINCHA/backend/VocabApp.Api" /opt/vocabapp/src/VocabApp.Api
# deploy papkasidagi .env (parollar) saqlanib qoladi, qolganlari yangilanadi
find /opt/vocabapp/deploy -mindepth 1 -maxdepth 1 ! -name .env -exec rm -rf {} +
cp -r "$VAQTINCHA/deploy/." /opt/vocabapp/deploy/
chmod +x /opt/vocabapp/deploy/*.sh

if [ ! -f /opt/vocabapp/deploy/.env ]; then
    echo "XATO: /opt/vocabapp/deploy/.env yo'q (birinchi marta: server-setup.sh)" >&2
    exit 1
fi

echo "==> Sayt (frontend) build qilinmoqda"
# Laptopni yuklamaslik uchun build serverda, vaqtinchalik node konteynerida; npm keshi volume'da qoladi
docker run --rm --memory 1g \
    -v "$VAQTINCHA/frontend:/app" -v vocabapp-npm-cache:/root/.npm -w /app \
    node:22-alpine sh -c 'npm ci --no-audit --no-fund --loglevel=error && npm run build'
# Bir zumda almashtiriladi: eski fayllar o'chguncha sayt bo'sh qolmaydi
rm -rf /opt/vocabapp/www.new /opt/vocabapp/www.old
cp -r "$VAQTINCHA/frontend/dist" /opt/vocabapp/www.new
[ -d /opt/vocabapp/www ] && mv /opt/vocabapp/www /opt/vocabapp/www.old
mv /opt/vocabapp/www.new /opt/vocabapp/www
rm -rf /opt/vocabapp/www.old

echo "==> Build qilinib, qayta ishga tushirilmoqda"
cd /opt/vocabapp/deploy
docker compose up -d --build
docker image prune -f > /dev/null

echo "==> API tekshirilmoqda"
for i in $(seq 1 30); do
    if curl -sf http://127.0.0.1:5090/health > /dev/null; then
        echo "Deploy muvaffaqiyatli yakunlandi"
        exit 0
    fi
    sleep 2
done

echo "XATO: API 60 soniya ichida javob bermadi. Oxirgi loglar:" >&2
docker compose logs --tail 50 api >&2
exit 1
