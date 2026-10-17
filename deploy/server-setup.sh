#!/bin/bash
# VocabApp — serverni BIR MARTA tayyorlash (deploy'dan oldin).
#
#   ssh root@SERVER 'bash -s' < deploy/server-setup.sh
#
# Qiladi: papkalar, tasodifiy parolli .env, kunlik backup cron.
# Mavjud .env bo'lsa tegmaydi. Nginx va sertifikat — README dagi qadamlar.

set -euo pipefail

mkdir -p /opt/vocabapp/deploy /opt/vocabapp/src /opt/vocabapp/backups
chmod 700 /opt/vocabapp /opt/vocabapp/deploy /opt/vocabapp/backups

if [ ! -f /opt/vocabapp/deploy/.env ]; then
    umask 077
    cat > /opt/vocabapp/deploy/.env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECURITY_KEY=$(openssl rand -base64 48 | tr -d '\n')
EOF
    echo ".env yaratildi (tasodifiy parollar bilan)"
else
    echo ".env allaqachon bor — o'zgartirilmadi"
fi

# Kunlik backup: har kuni 03:40 da (jurnal backup'i bilan bir vaqtga to'g'ri kelmaydi)
cat > /etc/cron.d/vocabapp <<'EOF'
40 3 * * * root bash /opt/vocabapp/deploy/backup.sh >> /var/log/vocabapp-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/vocabapp
echo "Backup cron qo'shildi: /etc/cron.d/vocabapp"

echo "Tayyor. Endi laptopdan: bash deploy/push-to-server.sh"
