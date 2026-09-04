import { createRouterClient } from "@orpc/server";
import { router } from "@/server/router";

export const api = createRouterClient(router);
