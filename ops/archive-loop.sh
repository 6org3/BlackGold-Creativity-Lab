#!/bin/sh
set -eu

CONFIG="${RCLONE_CONFIG:-/config/rclone/rclone.conf}"
REMOTE="${DRIVE_REMOTE:-blackgold-drive}"
ROOT="${DRIVE_ROOT:-Black Gold/Creativity Lab}"
INTERVAL="${ARCHIVE_INTERVAL_SECONDS:-300}"

ensure_remote_layout() {
  for folder in 00_Inbox 01_Briefs 02_References 03_Working 04_Review 05_Approved 99_Archive; do
    rclone mkdir --config "$CONFIG" "$REMOTE:$ROOT/$folder"
  done
}

copy_job_set() {
  state="$1"
  destination="$2"
  include_results="$3"
  for metadata in "/content/$state"/img-*.json; do
    [ -f "$metadata" ] || continue
    job_id="$(basename "$metadata" .json)"
    target="$REMOTE:$ROOT/$destination/$job_id"
    rclone copyto --config "$CONFIG" "$metadata" "$target/metadata.json" --retries 5 --low-level-retries 10
    if [ "$include_results" = "yes" ] && [ -d "/content/results/$job_id" ]; then
      rclone copy --config "$CONFIG" "/content/results/$job_id" "$target/assets" --retries 5 --low-level-retries 10
    fi
    if [ -f "/content/manifests/$job_id.json" ]; then
      rclone copyto --config "$CONFIG" "/content/manifests/$job_id.json" "$target/approval.json" --retries 5 --low-level-retries 10
    fi
    rclone lsf --config "$CONFIG" "$target" >/dev/null
    printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ) $state $job_id" > "/archive-state/$state-$job_id.verified"
  done
}

while true; do
  if [ ! -s "$CONFIG" ]; then
    printf '%s\n' "Drive pendiente: falta $CONFIG"
    sleep "$INTERVAL"
    continue
  fi
  if ensure_remote_layout; then
    copy_job_set pending 03_Working no
    copy_job_set running 03_Working no
    copy_job_set done 04_Review yes
    copy_job_set approved 05_Approved yes
    copy_job_set failed 99_Archive yes
  fi
  sleep "$INTERVAL"
done
