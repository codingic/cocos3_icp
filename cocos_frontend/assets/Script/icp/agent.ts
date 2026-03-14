import { getHttpAgentCtor } from "./globals";

export type CreateIcpAgentParams = {
  identity: any;
  host?: string;
  isLocal: boolean;
  verifyQuerySignatures?: boolean;
  fetchRootKey?: boolean;
  /**
   * Force all agent HTTP endpoints to /api/v2.
   * WARNING: For many SDKs, query/read_state are designed for /api/v3; forcing /api/v2 can cause 400 errors.
   * Keep this false unless you have confirmed your local replica requires v2 for query.
   */
  forceApiV2?: boolean;
};

function createFetchCompat(
  baseFetch: typeof fetch,
  host: string | undefined,
  isLocal: boolean,
  forceApiV2: boolean | undefined,
): typeof fetch {
  if (!isLocal) return baseFetch;

  return (async (input: any, init?: any) => {
    const normalizeBody = (b: any): any => {
      if (!b) return b;
      if (b instanceof Uint8Array) return b;
      if (b instanceof ArrayBuffer) return new Uint8Array(b);
      if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && ArrayBuffer.isView(b)) {
        if (typeof DataView !== "undefined" && b instanceof DataView) {
          return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
        }
        if ((b as any).buffer) return new Uint8Array((b as any).buffer, b.byteOffset || 0, b.byteLength || 0);
      }
      if (Array.isArray(b)) {
        return new Uint8Array(b.map((n) => (n as any) & 0xff));
      }
      return b;
    };

    const rawUrl = typeof input === "string" ? input : input && input.url ? input.url : String(input);

    let url: URL;
    try {
      url = new URL(rawUrl, host);
    } catch {
      return baseFetch(input as any, init);
    }

    if (forceApiV2) {
      if (url.pathname.startsWith("/api/v3/")) {
        url.pathname = url.pathname.replace("/api/v3/", "/api/v2/");
      } else if (url.pathname.startsWith("/api/v4/")) {
        url.pathname = url.pathname.replace("/api/v4/", "/api/v2/");
      }
    }

    const nextUrl = url.toString();

    if (typeof Request !== "undefined" && input instanceof Request) {
      const baseInit: RequestInit = {
        method: input.method,
        headers: input.headers,
        // @ts-ignore
        credentials: input.credentials,
        // @ts-ignore
        cache: input.cache,
        // @ts-ignore
        redirect: input.redirect,
        // @ts-ignore
        referrer: input.referrer,
        // @ts-ignore
        integrity: input.integrity,
        signal: input.signal,
      };

      let mergedInit: any = { ...baseInit, ...(init || {}) };

      if (mergedInit.body === undefined && input.method !== "GET" && input.method !== "HEAD") {
        try {
          const ab = await input.clone().arrayBuffer();
          mergedInit.body = new Uint8Array(ab);
        } catch {
          // ignore; fall back to no body
        }
      }

      if (mergedInit && "body" in mergedInit) {
        const before = mergedInit.body;
        const after = normalizeBody(before);
        if (after !== before) {
          mergedInit = { ...(mergedInit || {}), body: after };
          if ((globalThis as any).__icpFetchDebug) {
            const len = after && typeof after.byteLength === "number" ? after.byteLength : undefined;
            console.warn("[icp-fetch] normalized body -> Uint8Array, len=", len);
          }
        }
      }

      return baseFetch(nextUrl as any, mergedInit);
    }

    let nextInit: any = init;
    if (nextInit && "body" in nextInit) {
      const before = nextInit.body;
      const after = normalizeBody(before);
      if (after !== before) {
        nextInit = { ...(nextInit || {}), body: after };
        if ((globalThis as any).__icpFetchDebug) {
          const len = after && typeof after.byteLength === "number" ? after.byteLength : undefined;
          console.warn("[icp-fetch] normalized body -> Uint8Array, len=", len);
        }
      }
    }

    return baseFetch(nextUrl as any, nextInit);
  }) as any;
}

export async function createIcpAgent(params: CreateIcpAgentParams): Promise<any> {
  const baseFetch = window.fetch.bind(window);
  const fetchCompat = createFetchCompat(baseFetch, params.host, params.isLocal, params.forceApiV2);

  const HttpAgent = getHttpAgentCtor();
  const agent = await HttpAgent.create({
    identity: params.identity,
    host: params.host,
    verifyQuerySignatures: params.verifyQuerySignatures ?? false,
    fetch: fetchCompat,
  });

  if ((globalThis as any).__icpIdentityDebug) {
    try {
      const identity = params.identity;
      const principal = identity?.getPrincipal?.()?.toText?.() ?? "N/A";
      const pubKey = identity?.getPublicKey?.()?.toDer?.();
      const pubKeyHex = pubKey
        ? Array.from(new Uint8Array(pubKey))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        : "N/A";
      console.log("[ICP Agent] Identity principal:", principal);
      console.log("[ICP Agent] Public key (first 32 bytes):", pubKeyHex.substring(0, 64));
      console.log("[ICP Agent] Public key length:", pubKey?.length ?? 0);
    } catch (e) {
      console.warn("[ICP Agent] Failed to log identity info:", e);
    }
  }

  if (params.isLocal) {
    const originalCall = (agent as any).call?.bind(agent);
    if (originalCall) {
      (agent as any).call = (canisterId: any, options: any, identityOverride?: any) => {
        return originalCall(canisterId, { ...(options || {}), callSync: false }, identityOverride);
      };
    }

    if (params.fetchRootKey !== false && (agent as any).fetchRootKey) {
      await (agent as any).fetchRootKey();
    }
  }

  return agent;
}
