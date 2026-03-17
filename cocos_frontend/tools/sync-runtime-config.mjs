import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");
const cocosRoot = path.resolve(import.meta.dirname, "..");
const configRoot = path.join(cocosRoot, "assets", "Script", "config");
const projectConfigRoot = path.join(cocosRoot, "config");
const backendRoot = path.join(workspaceRoot, "backend");

const network = process.env.DFX_NETWORK || "local";
const localCanisterIdsPath = path.join(workspaceRoot, ".dfx", "local", "canister_ids.json");
const localRuntimePath = path.join(configRoot, "localRuntime.generated.js");
const productionRuntimePath = path.join(projectConfigRoot, "productionRuntime.config.js");
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

function readProductionRuntimeConfig() {
  const mod = requireFresh(productionRuntimePath);
  if (!mod) {
    throw new Error(`Production runtime config not found: ${productionRuntimePath}`);
  }

  return resolveInterop(mod, "PRODUCTION_RUNTIME");
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

  const productionRuntime = readProductionRuntimeConfig();

  return {
    dfxNetwork: "ic",
    replicaHost: envText("REPLICA_HOST", productionRuntime.replicaHost || MAINNET_REPLICA_HOST),
    iiCanisterId: envText("II_CANISTER_ID", productionRuntime.iiCanisterId || ""),
    identityProviderUrl: envText(
      "IDENTITY_PROVIDER_URL",
      productionRuntime.identityProviderUrl || MAINNET_IDENTITY_PROVIDER_URL,
    ),
    cyclesLedgerCanisterId: envText(
      "CYCLES_LEDGER_CANISTER_ID",
      productionRuntime.cyclesLedgerCanisterId || "",
    ),
    signerCanisterId: envText("SIGNER_CANISTER_ID", productionRuntime.signerCanisterId || ""),
    icpLedgerCanisterId: envText(
      "ICP_LEDGER_CANISTER_ID",
      productionRuntime.icpLedgerCanisterId || MAINNET_ICP_LEDGER_CANISTER_ID,
    ),
    chatLedgerCanisterId: envText(
      "CHAT_LEDGER_CANISTER_ID",
      productionRuntime.chatLedgerCanisterId || "",
    ),
    rpcOverrides: envJson("RPC_OVERRIDES_JSON", productionRuntime.rpcOverrides || {}),
    signerKeyName: envText("SIGNER_KEY_NAME", productionRuntime.signerKeyName || "key_1"),
    backendCanisterId: envText("BACKEND_CANISTER_ID", productionRuntime.backendCanisterId || ""),
    frontendCanisterId: envText("FRONTEND_CANISTER_ID", productionRuntime.frontendCanisterId || ""),
  };
}

function buildFrontendRuntime(baseRuntime) {
  if (network !== "local") {
    return { ...baseRuntime };
  }

  const canisterIds = readJsonIfExists(localCanisterIdsPath);
  return {
    ...baseRuntime,
    backendCanisterId: getCanisterId(canisterIds, "backend"),
    frontendCanisterId: getCanisterId(canisterIds, "frontend"),
  };
}

function collectMissing(missing, value, label) {
  if (typeof value !== "string" || !value.trim()) {
    missing.push(label);
  }
}

function ensureRuntime(baseRuntime, frontendRuntime) {
  const missing = [];

  collectMissing(missing, baseRuntime.signerCanisterId, "signerCanisterId");
  collectMissing(missing, baseRuntime.signerKeyName, "signerKeyName");

  if (network !== "local") {
    collectMissing(missing, frontendRuntime.backendCanisterId, "backendCanisterId");
    collectMissing(missing, frontendRuntime.frontendCanisterId, "frontendCanisterId");
  }

  if (missing.length === 0) {
    return;
  }

  const sourcePath = network === "local" ? localRuntimePath : productionRuntimePath;
  const envHints =
    network === "local"
      ? "or set the matching local runtime values"
      : "or override them with BACKEND_CANISTER_ID / FRONTEND_CANISTER_ID / SIGNER_CANISTER_ID / SIGNER_KEY_NAME";

  throw new Error(
    `Missing runtime values for DFX_NETWORK='${network}': ${missing.join(", ")}. Update ${sourcePath} ${envHints}.`,
  );
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

const baseRuntime = resolveBaseRuntime();
const frontendRuntime = buildFrontendRuntime(baseRuntime);

ensureRuntime(baseRuntime, frontendRuntime);
writeFrontendRuntime(frontendRuntime);
writeBackendRuntime(baseRuntime);

console.log(`Synced runtime config for network '${network}'.`);
console.log(`backend: ${frontendRuntime.backendCanisterId || "(empty)"}`);
console.log(`frontend: ${frontendRuntime.frontendCanisterId || "(empty)"}`);
console.log(`signer: ${baseRuntime.signerCanisterId}`);
