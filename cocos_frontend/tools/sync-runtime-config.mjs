import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
const cocosRoot = path.resolve(import.meta.dirname, "..");
const configRoot = path.join(cocosRoot, "assets", "Script", "config");
const backendRoot = path.join(workspaceRoot, "backend");

const network = process.env.DFX_NETWORK || "local";
const canisterIdsPath = path.join(workspaceRoot, ".dfx", network, "canister_ids.json");
const localRuntimePath = path.join(configRoot, "localRuntime.generated.js");
const frontendRuntimeOutputPath = path.join(configRoot, "appRuntime.generated.js");
const backendRuntimeOutputPath = path.join(backendRoot, "RuntimeConfig.mo");

const LOCAL_REPLICA_HOST = "http://127.0.0.1:4943";
const MAINNET_REPLICA_HOST = "https://ic0.app";
const MAINNET_IDENTITY_PROVIDER_URL = "https://identity.ic0.app";
const MAINNET_ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireFresh(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const resolved = require.resolve(filePath);
  delete require.cache[resolved];
  return require(filePath);
}

function resolveInterop(moduleValue, namedExport) {
  if (!moduleValue) return {};
  if (moduleValue[namedExport]) return moduleValue[namedExport];
  if (moduleValue.default && moduleValue.default[namedExport]) return moduleValue.default[namedExport];
  if (moduleValue.default) return moduleValue.default;
  return moduleValue;
}

function readLocalRuntimeOverrides() {
  const mod = requireFresh(localRuntimePath);
  if (!mod) {
    throw new Error(`Local runtime config not found: ${localRuntimePath}`);
  }

  return resolveInterop(mod, "LOCAL_RUNTIME_OVERRIDES");
}

function envText(name, fallback = "") {
  const value = process.env[name];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function envJson(name, fallback = {}) {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getCanisterId(canisterIds, name) {
  return canisterIds?.[name]?.[network] || "";
}

function resolveBaseRuntime() {
  if (network === "local") {
    const localRuntime = readLocalRuntimeOverrides();
    return {
      dfxNetwork: "local",
      replicaHost: envText("REPLICA_HOST", LOCAL_REPLICA_HOST),
      iiCanisterId: envText("II_CANISTER_ID", localRuntime.iiCanisterId || ""),
      identityProviderUrl: envText("IDENTITY_PROVIDER_URL", localRuntime.identityProviderUrl || ""),
      cyclesLedgerCanisterId: envText(
        "CYCLES_LEDGER_CANISTER_ID",
        localRuntime.cyclesLedgerCanisterId || "",
      ),
      signerCanisterId: envText("SIGNER_CANISTER_ID", localRuntime.signerCanisterId || ""),
      icpLedgerCanisterId: envText(
        "ICP_LEDGER_CANISTER_ID",
        localRuntime.icpLedgerCanisterId || MAINNET_ICP_LEDGER_CANISTER_ID,
      ),
      chatLedgerCanisterId: envText("CHAT_LEDGER_CANISTER_ID", localRuntime.chatLedgerCanisterId || ""),
      rpcOverrides: envJson("RPC_OVERRIDES_JSON", localRuntime.rpcOverrides || {}),
      signerKeyName: envText("SIGNER_KEY_NAME", "dfx_test_key"),
    };
  }

  return {
    dfxNetwork: network,
    replicaHost: envText("REPLICA_HOST", MAINNET_REPLICA_HOST),
    iiCanisterId: envText("II_CANISTER_ID", ""),
    identityProviderUrl: envText("IDENTITY_PROVIDER_URL", MAINNET_IDENTITY_PROVIDER_URL),
    cyclesLedgerCanisterId: envText("CYCLES_LEDGER_CANISTER_ID", ""),
    signerCanisterId: envText("SIGNER_CANISTER_ID", ""),
    icpLedgerCanisterId: envText("ICP_LEDGER_CANISTER_ID", MAINNET_ICP_LEDGER_CANISTER_ID),
    chatLedgerCanisterId: envText("CHAT_LEDGER_CANISTER_ID", ""),
    rpcOverrides: envJson("RPC_OVERRIDES_JSON", {}),
    signerKeyName: envText("SIGNER_KEY_NAME", "key_1"),
  };
}

function buildFrontendRuntime(baseRuntime, canisterIds) {
  return {
    ...baseRuntime,
    backendCanisterId: getCanisterId(canisterIds, "backend"),
    frontendCanisterId: getCanisterId(canisterIds, "frontend"),
  };
}

function ensureBackendRuntime(baseRuntime) {
  if (!baseRuntime.signerCanisterId) {
    throw new Error(`SIGNER_CANISTER_ID is required for DFX_NETWORK='${network}'.`);
  }

  if (!baseRuntime.signerKeyName) {
    throw new Error(`SIGNER_KEY_NAME is required for DFX_NETWORK='${network}'.`);
  }
}

function writeFrontendRuntime(runtimeConfig) {
  const content = `const APP_RUNTIME = ${JSON.stringify(runtimeConfig, null, 2)};

module.exports = {
  APP_RUNTIME,
  default: APP_RUNTIME,
};
`;

  fs.writeFileSync(frontendRuntimeOutputPath, content);
}

function writeBackendRuntime(baseRuntime) {
  const content = `module {
  public let dfxNetwork : Text = ${JSON.stringify(baseRuntime.dfxNetwork)};
  public let signerCanisterId : Text = ${JSON.stringify(baseRuntime.signerCanisterId)};
  public let signerKeyName : Text = ${JSON.stringify(baseRuntime.signerKeyName)};
};
`;

  fs.writeFileSync(backendRuntimeOutputPath, content);
}

const canisterIds = readJsonIfExists(canisterIdsPath);
const baseRuntime = resolveBaseRuntime();
const frontendRuntime = buildFrontendRuntime(baseRuntime, canisterIds);

ensureBackendRuntime(baseRuntime);
writeFrontendRuntime(frontendRuntime);
writeBackendRuntime(baseRuntime);

console.log(`Synced runtime config for network '${network}'.`);
console.log(`backend: ${frontendRuntime.backendCanisterId || "(empty)"}`);
console.log(`frontend: ${frontendRuntime.frontendCanisterId || "(empty)"}`);
console.log(`signer: ${baseRuntime.signerCanisterId}`);
