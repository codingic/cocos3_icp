function missingLibMessage(name: string): string {
  return `${name} missing. Ensure the lib3 bundle is loaded before application.js`;
}

export function getDfinityAgentModule(): any {
  const mod = (globalThis as any)?.DfinityAgent;
  if (!mod) throw new Error(missingLibMessage("DfinityAgent"));
  return mod;
}

export function getDfinityAuthClientModule(): any {
  const mod = (globalThis as any)?.DfinityAuthClient;
  if (!mod) throw new Error(missingLibMessage("DfinityAuthClient"));
  return mod;
}

export function getActorCtor(): any {
  const Actor = getDfinityAgentModule()?.Actor;
  if (!Actor) throw new Error(missingLibMessage("DfinityAgent.Actor"));
  return Actor;
}

export function getHttpAgentCtor(): any {
  const HttpAgent = getDfinityAgentModule()?.HttpAgent;
  if (!HttpAgent) throw new Error(missingLibMessage("DfinityAgent.HttpAgent"));
  return HttpAgent;
}

export function getPrincipalCtor(): any {
  const Principal = getDfinityAgentModule()?.Principal;
  if (!Principal) throw new Error(missingLibMessage("DfinityAgent.Principal"));
  return Principal;
}

export function getAuthClientCtor(): any {
  const AuthClient = getDfinityAuthClientModule()?.AuthClient;
  if (!AuthClient) throw new Error(missingLibMessage("DfinityAuthClient.AuthClient"));
  return AuthClient;
}

export function getAuthLocalStorageCtor(): any {
  return getDfinityAuthClientModule()?.LocalStorage ?? null;
}
