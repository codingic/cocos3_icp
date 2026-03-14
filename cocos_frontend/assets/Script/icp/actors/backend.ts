import { getIdentity } from "../auth";
import { createIcpActor } from "../actor";
import { idlFactoryBack } from "../../did/backend.did";

type BackendActorOptions = {
  canisterId: string;
};

const backendActors = new Map<string, any>();

function getIdentityCacheKey(identity: any): string {
  return identity?.getPrincipal?.()?.toText?.() ?? "anonymous";
}

export async function getBackendActor(options: BackendActorOptions): Promise<any> {
  const identity = await getIdentity();
  const cacheKey = `${options.canisterId}::${getIdentityCacheKey(identity)}`;
  const cached = backendActors.get(cacheKey);
  if (cached) return cached;

  const actor = await createIcpActor({
    idlFactory: idlFactoryBack,
    canisterId: options.canisterId,
    identity,
    verifyQuerySignatures: false,
    fetchRootKey: true,
  });

  backendActors.set(cacheKey, actor);
  return actor;
}
