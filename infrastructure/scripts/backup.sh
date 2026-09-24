#!/usr/bin/env bash
set -euo pipefail

: "${DIRECT_DATABASE_URL:?DIRECT_DATABASE_URL is required}"
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is required}"
: "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"

BACKUP_BUCKET="${R2_BACKUP_BUCKET_NAME:-joud-backups}"
DATE="$(date -u +%Y-%m-%d_%H-%M-%S)"
FILENAME="backup_${DATE}.sql.gz"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-auto}"

echo "Starting database backup: ${FILENAME}"

pg_dump "${DIRECT_DATABASE_URL}" --no-owner --no-privileges \
  | gzip -9 \
  | aws s3 cp - "s3://${BACKUP_BUCKET}/postgres/${FILENAME}" \
    --endpoint-url "${R2_ENDPOINT}" \
    --only-show-errors

echo "Backup complete: s3://${BACKUP_BUCKET}/postgres/${FILENAME}"
