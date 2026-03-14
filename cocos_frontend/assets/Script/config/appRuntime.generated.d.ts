export interface AppRuntime {
  dfxNetwork: string;
  replicaHost: string;
  iiCanisterId: string;
  identityProviderUrl: string;
  cyclesLedgerCanisterId: string;
  signerCanisterId: string;
  icpLedgerCanisterId: string;
  chatLedgerCanisterId: string;
  backendCanisterId: string;
  frontendCanisterId: string;
  rpcOverrides: Record<string, string>;
  signerKeyName: string;
}

export const APP_RUNTIME: AppRuntime;

declare const _default: {
  APP_RUNTIME: AppRuntime;
  default: AppRuntime;
};

export default _default;
