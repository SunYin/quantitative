import assert from "node:assert/strict";
import { test } from "node:test";
import { rpcUrl } from "./rpc-url.ts";

test("chart RPC url is always absolute", () => {
  assert.equal(rpcUrl({ origin: "http://localhost:3001" }), "http://localhost:3001/rpc");
  assert.equal(rpcUrl({ origin: "https://example.com/" }), "https://example.com/rpc");
  assert.equal(rpcUrl({ port: "8080" }), "http://127.0.0.1:8080/rpc");
  assert.match(rpcUrl({ origin: "http://127.0.0.1:3000" }), /^https?:\/\//);
  assert.notEqual(rpcUrl({ origin: "http://localhost:3000" }), "/rpc");
});

test("relative /rpc is rejected", () => {
  assert.throws(() => rpcUrl({ origin: "/rpc" }), /absolute/);
});
