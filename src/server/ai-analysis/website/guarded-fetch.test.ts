import assert from "node:assert/strict";
import { it } from "node:test";
import { createGuardedPageFetcher } from "./guarded-fetch";

const request = { url: "https://fixture.example.test", signal: new AbortController().signal, maxBytes: 1000, timeoutMs: 500 };
it("pins the approved address and rejects HTTP error pages as evidence", async () => {
  let seen = "";
  const fetcher = createGuardedPageFetcher({ lookup: async () => ["93.184.215.14"], dial: async ({ address }) => {
    seen = address; return { ok: true, status: 404, location: null, contentType: "text/html", body: Buffer.from("Not found") };
  } });
  assert.deepEqual(await fetcher.fetch(request), { ok: false, errorCode: "UNAVAILABLE" }); assert.equal(seen, "93.184.215.14");
});
it("mixed public/private DNS answers never reach the transport", async () => {
  let dialed = false;
  const fetcher = createGuardedPageFetcher({ lookup: async () => ["93.184.215.14", "127.0.0.1"], dial: async () => { dialed = true; return { ok: false, errorCode: "UNAVAILABLE" }; } });
  assert.deepEqual(await fetcher.fetch(request), { ok: false, errorCode: "DNS_BLOCKED" }); assert.equal(dialed, false);
});
