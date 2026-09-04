import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@/server/router";

const link = new RPCLink({
  url:
    typeof window === "undefined"
      ? `http://127.0.0.1:${process.env.PORT ?? "3000"}/rpc`
      : `${window.location.origin}/rpc`,
});

export const client: RouterClient<AppRouter> = createORPCClient(link);
export const orpc = createTanstackQueryUtils(client);
