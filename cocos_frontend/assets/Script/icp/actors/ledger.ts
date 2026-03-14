import { getIdentity } from "../auth";
import { createIcpActor } from "../actor";
import { DFX_NETWORK, ICP_LEDGER_CANISTER_ID } from "../runtime";
import { idlFactoryLedger } from "../../did/icp_ledger.did";

type LedgerActorOptions = {
  canisterId?: string;
};

const ledgerActors = new Map<string, any>();

function getIdentityCacheKey(identity: any): string {
  return identity?.getPrincipal?.()?.toText?.() ?? "anonymous";
}

export async function getLedgerActor(options: LedgerActorOptions = {}): Promise<any> {
  const canisterId = options.canisterId || ICP_LEDGER_CANISTER_ID;
  const identity = await getIdentity();
  const cacheKey = `${canisterId}::${getIdentityCacheKey(identity)}`;
  const cached = ledgerActors.get(cacheKey);
  if (cached) return cached;

  const actor = await createIcpActor({
    idlFactory: idlFactoryLedger,
    canisterId,
    identity,
    network: DFX_NETWORK,
    verifyQuerySignatures: false,
    fetchRootKey: true,
    canisterIdAsPrincipal: true,
  });

  ledgerActors.set(cacheKey, actor);
  return actor;
}
