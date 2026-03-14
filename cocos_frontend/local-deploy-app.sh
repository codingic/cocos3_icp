#!/bin/bash
set -euo pipefail

DFX_NETWORK_NAME="${DFX_NETWORK:-local}"

echo "Syncing runtime config for network '$DFX_NETWORK_NAME'..."
DFX_NETWORK="$DFX_NETWORK_NAME" node ./tools/sync-runtime-config.mjs

echo "Deploying backend canister to '$DFX_NETWORK_NAME'..."
dfx deploy backend --network "$DFX_NETWORK_NAME"

echo "Refreshing runtime config after backend deploy..."
DFX_NETWORK="$DFX_NETWORK_NAME" node ./tools/sync-runtime-config.mjs

echo "Building Cocos Creator project..."
bash ./build-cocos.sh

echo "Deploying frontend canister to '$DFX_NETWORK_NAME'..."
dfx deploy frontend --network "$DFX_NETWORK_NAME"

echo "Deployment Done!"
