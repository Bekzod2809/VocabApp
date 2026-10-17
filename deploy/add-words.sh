#!/bin/bash
# VocabApp — laptopdan serverdagi bazaga so'zlar qo'shish (Git Bash'da):
#
#   bash deploy/add-words.sh "Food" words/food.txt
#
# Fayl formati — har qatorda: so'z | tarjima | misol gap   (misol ixtiyoriy, # bilan boshlangan qator - izoh)
# Guruh yo'q bo'lsa yaratiladi. Guruhda allaqachon bor so'z (katta-kichik harf farqsiz) qayta qo'shilmaydi.
#
# So'zlar ilova kutganidek yangi versiya raqami bilan yoziladi: telefonda "Sinx" bosilganda keladi.
# Sinx bilan bir xil qulf (pg_advisory_xact_lock 7001) ishlatiladi, shuning uchun bir vaqtda sinx bo'lsa ham xavfsiz.

set -euo pipefail

SERVER=${SERVER:-root@169.58.150.96}

if [ $# -ne 2 ] || [ ! -f "$2" ]; then
    echo "Ishlatish: bash deploy/add-words.sh \"Guruh nomi\" fayl.txt" >&2
    exit 1
fi

GROUP_NAME="$1"
FILE="$2"

# SQL uchun: ' -> ''
esc() { printf "%s" "$1" | sed "s/'/''/g"; }
trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; s="${s%"${s##*[![:space:]]}"}"; printf "%s" "$s"; }

values=""
count=0
while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    line="$(trim "$line")"
    [ -z "$line" ] && continue
    [[ "$line" == \#* ]] && continue

    term="$(trim "${line%%|*}")"
    rest="${line#*|}"
    translation="$(trim "${rest%%|*}")"
    example=""
    [[ "$rest" == *"|"* ]] && example="$(trim "${rest#*|}")"

    if [ -z "$term" ] || [ -z "$translation" ] || [ "$term" == "$line" ]; then
        echo "O'tkazib yuborildi (format xato): $line" >&2
        continue
    fi

    count=$((count + 1))
    ex_sql="NULL"
    [ -n "$example" ] && ex_sql="'$(esc "$example")'"
    [ -n "$values" ] && values+=","$'\n'
    values+="($count, '$(esc "$term")', '$(esc "$translation")', $ex_sql)"
done < "$FILE"

if [ "$count" -eq 0 ]; then
    echo "Faylda so'z topilmadi" >&2
    exit 1
fi

group_sql="$(esc "$GROUP_NAME")"

sql=$(cat <<SQL
SET client_encoding = 'UTF8';
\set ON_ERROR_STOP on
BEGIN;
SELECT pg_advisory_xact_lock(7001) \gset
UPDATE "SyncStates" SET "CurrentVersion" = "CurrentVersion" + 1 WHERE "SyncStateId" = 1;
CREATE TEMP TABLE _v ON COMMIT DROP AS SELECT "CurrentVersion" AS v FROM "SyncStates" WHERE "SyncStateId" = 1;

INSERT INTO "Groups" ("GroupId", "Name", "CreatedAt", "UpdatedAt", "IsDeleted", "Version")
SELECT gen_random_uuid(), '$group_sql', now(), now(), false, (SELECT v FROM _v)
WHERE NOT EXISTS (SELECT 1 FROM "Groups" WHERE lower("Name") = lower('$group_sql') AND NOT "IsDeleted");

CREATE TEMP TABLE _g ON COMMIT DROP AS
SELECT "GroupId" AS id FROM "Groups"
WHERE lower("Name") = lower('$group_sql') AND NOT "IsDeleted"
ORDER BY "CreatedAt" LIMIT 1;

CREATE TEMP TABLE _new ON COMMIT DROP AS
SELECT t.n, t.term, t.translation, t.example
FROM (VALUES
$values
) AS t(n, term, translation, example)
WHERE NOT EXISTS (
    SELECT 1 FROM "Words" w
    WHERE w."GroupId" = (SELECT id FROM _g) AND lower(w."Term") = lower(t.term) AND NOT w."IsDeleted");

-- Har biriga 1 ms farq: ilovada fayldagi tartibda turadi
INSERT INTO "Words" ("WordId", "GroupId", "Term", "Translation", "Example", "CreatedAt", "UpdatedAt", "IsDeleted", "Version")
SELECT gen_random_uuid(), (SELECT id FROM _g), term, translation, example,
       now() + n * interval '1 millisecond', now() + n * interval '1 millisecond', false, (SELECT v FROM _v)
FROM _new;

SELECT (SELECT count(*) FROM _new) AS qoshildi,
       $count - (SELECT count(*) FROM _new) AS oldin_bor_edi,
       (SELECT count(*) FROM "Words" WHERE "GroupId" = (SELECT id FROM _g) AND NOT "IsDeleted") AS guruhda_jami;
COMMIT;
SQL
)

# Tekshirish uchun: PRINT_SQL=1 bash deploy/add-words.sh ... — faqat SQL'ni chiqaradi
if [ -n "${PRINT_SQL:-}" ]; then
    printf "%s\n" "$sql"
    exit 0
fi

echo "==> \"$GROUP_NAME\" guruhiga $count ta so'z yuborilmoqda"
printf "%s\n" "$sql" | ssh "$SERVER" \
    "docker compose -f /opt/vocabapp/deploy/docker-compose.yml exec -T db psql -U vocabapp -d vocabapp -q -P footer=off"
echo "Tayyor. Telefonda Sinx tugmasini bosing."
