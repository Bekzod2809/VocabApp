#!/bin/bash
# VocabApp — laptopdan serverga deploy (Git Bash'da, repo ildizidan yoki istalgan joydan):
#
#   bash deploy/push-to-server.sh
#
# Boshqa server uchun: SERVER=root@1.2.3.4 bash deploy/push-to-server.sh
# Birinchi marta serverda server-setup.sh va nginx/sertifikat qadamlari bajarilgan bo'lishi kerak (README).

set -euo pipefail

SERVER=${SERVER:-root@169.58.150.96}
cd "$(dirname "$0")/.."

echo "==> Server skripti yangilanmoqda"
ssh "$SERVER" 'mkdir -p /opt/vocabapp && cat > /opt/vocabapp/deploy.sh && chmod +x /opt/vocabapp/deploy.sh' < deploy/server-deploy.sh

echo "==> Kod yuborilmoqda va build qilinmoqda"
tar -czf - \
    --exclude='bin' --exclude='obj' --exclude='Logs' \
    --exclude='appsettings.Development.json' \
    --exclude='node_modules' --exclude='dist' --exclude='android' \
    backend/VocabApp.Api frontend deploy \
    | ssh "$SERVER" /opt/vocabapp/deploy.sh
