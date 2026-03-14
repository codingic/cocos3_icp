import { getIdentity } from "./auth";
import { createIcpAgent } from "./agent";
import { getActorCtor, getPrincipalCtor } from "./globals";
import { DFX_NETWORK, getReplicaHost, isLocalNetwork } from "./runtime";

export type CreateIcpActorParams = {
  idlFactory: any;
  canisterId: string;
  identity?: any;
  host?: string;
  network?: string;
  isLocal?: boolean;
  verifyQuerySignatures?: boolean;
  fetchRootKey?: boolean;
  forceApiV2?: boolean;
  canisterIdAsPrincipal?: boolean;
};

export async function createIcpActor(params: CreateIcpActorParams): Promise<any> {
  const network = params.network ?? DFX_NETWORK;
  const isLocal = params.isLocal ?? isLocalNetwork(network);
  const identity = params.identity ?? (await getIdentity());
  const host = params.host ?? getReplicaHost(network);

  const agent = await createIcpAgent({
    identity,
    host,
    isLocal,
    verifyQuerySignatures: params.verifyQuerySignatures,
    fetchRootKey: params.fetchRootKey,
    forceApiV2: params.forceApiV2 ?? isLocal,
  });

  const Actor = getActorCtor();
  const actorCanisterId = params.canisterIdAsPrincipal
    ? getPrincipalCtor().fromText(params.canisterId)
    : params.canisterId;

  return Actor.createActor(params.idlFactory, {
    agent,
    canisterId: actorCanisterId,
  });
}
