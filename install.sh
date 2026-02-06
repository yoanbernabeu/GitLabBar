#!/bin/bash
set -e

APP_NAME='GitLabBar'
APP_PATH="/Applications/${APP_NAME}.app"
REPO='yoanbernabeu/GitLabBar'
TMP_ZIP="/tmp/${APP_NAME}.zip"

echo "==> Fetching latest release..."
DOWNLOAD_URL=$(curl -sL "https://api.github.com/repos/${REPO}/releases/latest" | grep darwin-arm64 | grep -o 'https://.*\.zip')

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Error: could not find download URL."
  exit 1
fi

if [ -d "$APP_PATH" ]; then
  echo "==> Stopping ${APP_NAME}..."
  killall "$APP_NAME" 2>/dev/null || true
  sleep 1
  echo "==> Removing previous version..."
  rm -rf "$APP_PATH"
fi

echo "==> Downloading ${APP_NAME}..."
curl -sL -o "$TMP_ZIP" "$DOWNLOAD_URL"

echo "==> Installing to /Applications..."
unzip -qo "$TMP_ZIP" -d /Applications
xattr -cr "$APP_PATH"
rm -f "$TMP_ZIP"

echo "==> Launching ${APP_NAME}..."
open "$APP_PATH"

echo ""
echo "${APP_NAME} is ready!"
