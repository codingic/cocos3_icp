export interface LocalRuntimeOverrides {
  iiCanisterId: string;
  identityProviderUrl: string;
  cyclesLedgerCanisterId: string;
  signerCanisterId: string;
  icpLedgerCanisterId: string;
  chatLedgerCanisterId: string;
  rpcOverrides: Record<string, string>;
}

export const LOCAL_RUNTIME_OVERRIDES: LocalRuntimeOverrides;

declare const _default: {
  LOCAL_RUNTIME_OVERRIDES: LocalRuntimeOverrides;
  default: LocalRuntimeOverrides;
};

export default _default;
