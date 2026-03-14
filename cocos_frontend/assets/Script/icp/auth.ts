import { getAuthClientCtor, getAuthLocalStorageCtor } from "./globals";
import { IDENTITY_PROVIDER_URL } from "./runtime";

type LoginOptions = {
  onSuccess?: () => void;
  onError?: (err: any) => void;
};

let authClient: any = null;

function getBrowserLocalStorage(): Storage | null {
  try {
    const g: any =
      typeof globalThis !== "undefined"
        ? globalThis
        : typeof window !== "undefined"
          ? window
          : typeof self !== "undefined"
            ? self
            : {};
    return g && g.localStorage ? (g.localStorage as Storage) : null;
  } catch {
    return null;
  }
}

function clearAuthClientStorage(): void {
  const ls = getBrowserLocalStorage();
  if (!ls) return;

  const keys = ["ic-identity", "ic-delegation", "ic-iv", "identity", "delegation", "iv"];
  for (let i = 0; i < keys.length; i++) {
    try {
      ls.removeItem(keys[i]);
    } catch {
      // ignore
    }
  }
}

function formatAuthError(err: any): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err.message === "string" && err.message) return err.message;
  if (typeof err.error === "string" && err.error) return err.error;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function createAuthClient(): Promise<any> {
  const AuthClient = getAuthClientCtor();
  const LocalStorage = getAuthLocalStorageCtor();

  if (LocalStorage) {
    return await AuthClient.create({
      storage: new LocalStorage("ic-", getBrowserLocalStorage() || undefined),
      keyType: "Ed25519",
    });
  }

  return await AuthClient.create();
}

export function initAuth(): void {
  const ls = getBrowserLocalStorage();
  if (ls && !ls.getItem("ic-identity-cleared-v3")) {
    clearAuthClientStorage();
    ls.setItem("ic-identity-cleared-v3", "true");
    console.log("AuthAdapter: Cleared old identity storage.");
  }

  void ensureAuthClient().catch(() => {
    // UI layer handles auth errors.
  });
}

export async function ensureAuthClient(): Promise<any> {
  if (authClient) return authClient;

  try {
    const client = await createAuthClient();
    if (!client) throw new Error("AuthClient creation failed");
    authClient = client;
    return authClient;
  } catch (e: any) {
    const msg = formatAuthError(e);
    if (
      msg.indexOf("Invalid hexadecimal string") >= 0 ||
      msg.indexOf("DelegationChain") >= 0 ||
      msg.indexOf("valid checksum") >= 0
    ) {
      clearAuthClientStorage();
      const client = await createAuthClient();
      if (!client) throw new Error("AuthClient creation failed");
      authClient = client;
      return authClient;
    }
    throw e;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const client = await ensureAuthClient();
  return !!(await client.isAuthenticated());
}

export async function getIdentity(): Promise<any> {
  const client = await ensureAuthClient();
  return client.getIdentity();
}

export function getPrincipalText(): string | null {
  if (!authClient) return null;
  try {
    const identity = authClient.getIdentity();
    return identity?.getPrincipal?.()?.toText?.() ?? null;
  } catch {
    return null;
  }
}

export function login(options: LoginOptions = {}): void {
  void ensureAuthClient()
    .then((client) => {
      if (!client) throw new Error("AuthClient not ready");

      client.login({
        identityProvider: IDENTITY_PROVIDER_URL,
        onSuccess: () => {
          options.onSuccess?.();
        },
        onError: (err: any) => {
          options.onError?.(new Error(`Login failed: ${formatAuthError(err)}`));
        },
      });
    })
    .catch((err: any) => {
      options.onError?.(new Error(`Login failed: ${formatAuthError(err)}`));
    });
}
