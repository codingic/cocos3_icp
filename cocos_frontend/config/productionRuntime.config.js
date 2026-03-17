const PRODUCTION_RUNTIME = {
  dfxNetwork: "ic",
  replicaHost: "https://ic0.app",
  iiCanisterId: "",
  identityProviderUrl: "https://identity.ic0.app",
  cyclesLedgerCanisterId: "",
  signerCanisterId: "",
  icpLedgerCanisterId: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  chatLedgerCanisterId: "",
  backendCanisterId: "",
  frontendCanisterId: "",
  rpcOverrides: {},
  signerKeyName: "key_1",
};

module.exports = {
  PRODUCTION_RUNTIME,
  default: PRODUCTION_RUNTIME,
};
