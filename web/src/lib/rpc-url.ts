type RpcUrlEnv = {
  origin?: string;
  port?: string;
};

export function rpcUrl(env: RpcUrlEnv = {}): string {
  const origin = (env.origin ?? serverOrigin(env.port)).replace(/\/$/, "");
  if (!/^https?:\/\//i.test(origin)) {
    throw new Error("oRPC url must be absolute, not a relative /rpc path");
  }
  return `${origin}/rpc`;
}

export function clientRpcUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return rpcUrl({ origin: window.location.origin });
  }
  return rpcUrl({ port: process.env.PORT ?? "3000" });
}

function serverOrigin(port?: string): string {
  return `http://127.0.0.1:${port ?? process.env.PORT ?? "3000"}`;
}
