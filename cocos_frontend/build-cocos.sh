#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"

BUILD_CONFIG_REL="${COCOS_BUILD_CONFIG:-${1:-buildConfig_web-mobile.json}}"

if [[ "$BUILD_CONFIG_REL" = /* ]]; then
    echo "Please pass a project-relative build config path, for example: buildConfig_web-mobile.json"
    exit 1
fi

BUILD_CONFIG_PATH="$PROJECT_DIR/$BUILD_CONFIG_REL"

if [ ! -f "$BUILD_CONFIG_PATH" ]; then
    echo "Build config not found: $BUILD_CONFIG_PATH"
    exit 1
fi

DEFAULT_COCOS_CREATOR_BIN="/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator"
COCOS_CREATOR_BIN="${COCOS_CREATOR_BIN:-$DEFAULT_COCOS_CREATOR_BIN}"
DFX_NETWORK_NAME="${DFX_NETWORK:-local}"

if [ ! -x "$COCOS_CREATOR_BIN" ]; then
    echo "Cocos Creator binary not found or not executable: $COCOS_CREATOR_BIN"
    echo "Set COCOS_CREATOR_BIN to your local Creator binary path and try again."
    exit 1
fi

echo "Syncing runtime config for network '$DFX_NETWORK_NAME'"
DFX_NETWORK="$DFX_NETWORK_NAME" node "$PROJECT_DIR/tools/sync-runtime-config.mjs"

echo "Using Cocos Creator: $COCOS_CREATOR_BIN"
echo "Project: $PROJECT_DIR"
echo "Build config: $BUILD_CONFIG_REL"

set +e
(
    cd "$PROJECT_DIR"
    "$COCOS_CREATOR_BIN" --project "$PROJECT_DIR" --build "configPath=$BUILD_CONFIG_REL"
)
EXIT_CODE=$?
set -e

if [ "$EXIT_CODE" -ne 0 ] && [ "$EXIT_CODE" -ne 36 ]; then
    echo "Cocos Creator build failed with exit code $EXIT_CODE"
    exit "$EXIT_CODE"
fi

if [ "$EXIT_CODE" -eq 36 ]; then
    echo "Cocos Creator build finished with exit code 36 (likely warnings)."
fi

echo "Cocos Creator build completed."
