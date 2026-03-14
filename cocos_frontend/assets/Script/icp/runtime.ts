import appRuntimeModule from "../config/appRuntime.generated.js";

type AppRuntime = {
  dfxNetwork?: string;
  replicaHost?: string;
  iiCanisterId?: string;
  identityProviderUrl?: string;
  cyclesLedgerCanisterId?: string;
  signerCanisterId?: string;
  icpLedgerCanisterId?: string;
  chatLedgerCanisterId?: string;
  backendCanisterId?: string;
  frontendCanisterId?: string;
  rpcOverrides?: Record<string, string>;
  signerKeyName?: string;
};

type AppRuntimeInteropModule = {
  APP_RUNTIME?: AppRuntime;
  default?: AppRuntime;
};

function resolveAppRuntime(): AppRuntime {
  const mod = (appRuntimeModule ?? {}) as AppRuntime | AppRuntimeInteropModule;

  if ((mod as AppRuntimeInteropModule).APP_RUNTIME) {
    return (mod as AppRuntimeInteropModule).APP_RUNTIME as AppRuntime;
  }

  if ((mod as AppRuntimeInteropModule).default) {
    return (mod as AppRuntimeInteropModule).default as AppRuntime;
  }

  return mod as AppRuntime;
}

export const APP_RUNTIME = resolveAppRuntime();

export const DFX_NETWORK = APP_RUNTIME.dfxNetwork || "local";

export const LOCAL_REPLICA_HOST = "http://127.0.0.1:4943";
export const MAINNET_REPLICA_HOST = "https://ic0.app";
export const REPLICA_HOST =
  APP_RUNTIME.replicaHost || (DFX_NETWORK === "local" ? LOCAL_REPLICA_HOST : MAINNET_REPLICA_HOST);

export const II_CANISTER_ID = APP_RUNTIME.iiCanisterId || "";
export const IDENTITY_PROVIDER_URL =
  APP_RUNTIME.identityProviderUrl ||
  (DFX_NETWORK === "local" && II_CANISTER_ID
    ? `http://${II_CANISTER_ID}.localhost:4943`
    : "https://identity.ic0.app");
export const SIGNER_CANISTER_ID = APP_RUNTIME.signerCanisterId || "";
export const CYCLES_LEDGER_CANISTER_ID = APP_RUNTIME.cyclesLedgerCanisterId || "";
export const ICP_LEDGER_CANISTER_ID =
  APP_RUNTIME.icpLedgerCanisterId || "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const CHAT_LEDGER_CANISTER_ID = APP_RUNTIME.chatLedgerCanisterId || "";
export const BACKEND_CANISTER_ID = APP_RUNTIME.backendCanisterId || "";
export const FRONTEND_CANISTER_ID = APP_RUNTIME.frontendCanisterId || "";

export const II_CANISTER_ID_LOCAL = II_CANISTER_ID;
export const IDENTITY_PROVIDER_URL_LOCAL = IDENTITY_PROVIDER_URL;
export const SIGNER_CANISTER_ID_LOCAL = SIGNER_CANISTER_ID;
export const CYCLES_LEDGER_CANISTER_ID_LOCAL = CYCLES_LEDGER_CANISTER_ID;
export const ICP_LEDGER_CANISTER_ID_LOCAL = ICP_LEDGER_CANISTER_ID;
export const BACKEND_CANISTER_ID_LOCAL_FALLBACK = BACKEND_CANISTER_ID;

// Preserve the legacy misspelling while the rest of the app still imports it.
export const LEAGER_ICP_ID_LOCAL = ICP_LEDGER_CANISTER_ID;

export function isLocalNetwork(network: string = DFX_NETWORK): boolean {
  return network === "local";
}

export function getReplicaHost(network: string = DFX_NETWORK): string {
  if (network === DFX_NETWORK && REPLICA_HOST) {
    return REPLICA_HOST;
  }
  return isLocalNetwork(network) ? LOCAL_REPLICA_HOST : MAINNET_REPLICA_HOST;
}
