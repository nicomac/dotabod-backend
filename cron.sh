#!/bin/bash

set -a; source .env.prod; set +a
set -a; source .env.local; set +a

# PostgreSQL Backup util
# Automatic backup utility, run in cron job under postgres user
# Example cron line:
# 0 * * * * /path/to/backup/cron.sh

# Set the number of backups to keep
num_backups=24

# Set the directory to store the backups
backup_dir="$HOME/psql_backups"
mkdir -p "$backup_dir"

# Create a timestamp for the current backup
timestamp=$(date +%Y-%m-%d-%H-%M)

# Create the backup file name
backup_file="$backup_dir/$timestamp.sql"

# Use pg_dump to create a backup of the database
# Specific arguments just for supabase
pg_dump -d "${DATABASE_URL%\?*}" \
    --no-comments \
    -N supabase_functions \
    -N auth \
    -N realtime \
    > "$backup_file"

# Compress the backup file using gzip
gzip -f "$backup_file"

# Use the `aws` CLI to upload the backup file to S3
aws s3 cp "$backup_file.gz" "s3://$AWS_BUCKET_NAME/$timestamp.sql.gz"

# Delete the local backup file
rm "$backup_file.gz"

# Check if the number of backups in the S3 bucket exceeds the limit
if [ "$(aws s3 ls "s3://$AWS_BUCKET_NAME" | wc -l)" -gt $num_backups ]; then
  # Remove the oldest backup
  oldest_backup=$(aws s3 ls "s3://$AWS_BUCKET_NAME" | sort | head -n 1 | awk '{print $4}')
  aws s3 rm "s3://$AWS_BUCKET_NAME/$oldest_backup"
fi
