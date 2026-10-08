#!/usr/bin/env bash
# Ignored Build Step for Vercel — docs/** only.
# Exit 0 = skip deployment build; exit 1 = proceed with build.
# Fail-open to BUILD on missing base, Git errors, HEAD mismatch, or any non-docs path.
set -eu

PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
EXPECTED_HEAD="${VERCEL_GIT_COMMIT_SHA:-}"

if [ -z "$PREV" ]; then
  echo "missing VERCEL_GIT_PREVIOUS_SHA → BUILD"
  exit 1
fi

if [ -z "$EXPECTED_HEAD" ]; then
  echo "missing VERCEL_GIT_COMMIT_SHA → BUILD"
  exit 1
fi

if ! ACTUAL_HEAD="$(git rev-parse HEAD)"; then
  echo "git rev-parse HEAD failed → BUILD"
  exit 1
fi

if [ "$ACTUAL_HEAD" != "$EXPECTED_HEAD" ]; then
  echo "HEAD (${ACTUAL_HEAD}) != VERCEL_GIT_COMMIT_SHA (${EXPECTED_HEAD}) → BUILD"
  exit 1
fi

if ! git cat-file -e "${PREV}^{commit}" 2>/dev/null; then
  echo "previous SHA not in clone → BUILD"
  exit 1
fi

DIFF_FILE=""
cleanup() {
  if [ -n "${DIFF_FILE}" ]; then
    rm -f "$DIFF_FILE"
  fi
}
trap cleanup EXIT

DIFF_FILE="$(mktemp)"

set +e
git diff --no-renames --name-only -z "$PREV" HEAD >"$DIFF_FILE"
DIFF_STATUS=$?
set -e

if [ "$DIFF_STATUS" -ne 0 ]; then
  echo "git diff failed (exit ${DIFF_STATUS}) → BUILD"
  exit 1
fi

CHANGED=()
while IFS= read -r -d '' file; do
  CHANGED+=("$file")
done <"$DIFF_FILE"

if [ "${#CHANGED[@]}" -eq 0 ]; then
  echo "empty diff → BUILD"
  exit 1
fi

for file in "${CHANGED[@]}"; do
  case "$file" in
    docs/*) ;;
    *)
      echo "non-docs change: ${file} → BUILD"
      exit 1
      ;;
  esac
done

echo "only docs/** since ${PREV} → SKIP"
exit 0
