import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertAddressesPublic,
  evaluateRequestUrl,
  isBlockedAddress,
} from "./address-policy";
import { createGuardedPageFetcher, createNodePageFetcher, lookupAll } from "./guarded-fetch";
import type { DialResult } from "./node-dial";
import { dialPinned } from "./node-dial";
import { htmlToText } from "./html-text";
import { FICTIONAL_PAGE_HTML, METADATA_URL } from "../fixtures";

describe("public address policy", () => {
  it("blocks loopback, private, link-local, metadata and non-http URLs", () => {
    const blocked = [
      "http://127.0.0.1/",
      "http://2130706433/",
      "http://0x7f000001/",
      "http://localhost/",
      "http://10.1.2.3/",
      "http://192.168.0.5/",
      "http://172.16.4.2/",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "http://[::ffff:127.0.0.1]/",
      "http://metadata.google.internal/",
      "http://printer.local/",
      "file:///etc/passwd",
      "https://user:pass@clinica-aurora-exemplo.test/",
      "https://clinica-aurora-exemplo.test:22/",
    ];
    for (const url of blocked) {
      assert.equal(evaluateRequestUrl(url).ok, false, url);
    }
  });

  it("allows a public http(s) business URL", () => {
    const decision = evaluateRequestUrl(
      "https://clinica-aurora-exemplo.test/contato",
    );
    assert.equal(decision.ok, true);
    if (decision.ok) {
      assert.equal(decision.url.hostname, "clinica-aurora-exemplo.test");
    }
  });

  it("blocks any private answer in a DNS set", () => {
    assert.equal(assertAddressesPublic(["1.2.3.4"]).ok, true);
    assert.equal(assertAddressesPublic(["1.2.3.4", "10.0.0.8"]).ok, false);
    assert.equal(assertAddressesPublic([]).ok, false);
    assert.equal(isBlockedAddress("::1"), true);
    assert.equal(isBlockedAddress("fc00::1"), true);
    assert.equal(isBlockedAddress("fe80::1"), true);
  });
});

describe("guarded page fetch", () => {
  it("does not dial when DNS returns a private address", async () => {
    let dials = 0;
    const fetcher = createGuardedPageFetcher({
      async lookup() {
        return ["203.0.113.10"];
      },
      async dial() {
        dials += 1;
        const result: DialResult = { ok: false, errorCode: "UNAVAILABLE" };
        return result;
      },
    });
    const result = await fetcher.fetch({
      url: "https://clinica-aurora-exemplo.test/",
      signal: AbortSignal.timeout(200),
      maxBytes: 1000,
      timeoutMs: 100,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.errorCode, "DNS_BLOCKED");
    }
    assert.equal(dials, 0);
  });

  it("pins a public address and returns a redirect without following it", async () => {
    const dialed: string[] = [];
    const fetcher = createGuardedPageFetcher({
      async lookup() {
        return ["1.2.3.4"];
      },
      async dial(input) {
        dialed.push(input.address);
        return {
          ok: true,
          status: 302,
          location: "http://127.0.0.1/secret",
          contentType: "text/html",
          body: Buffer.from("ignore"),
        };
      },
    });
    const result = await fetcher.fetch({
      url: "https://clinica-aurora-exemplo.test/inicio",
      signal: AbortSignal.timeout(200),
      maxBytes: 1000,
      timeoutMs: 100,
    });
    assert.deepEqual(dialed, ["1.2.3.4"]);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.kind, "redirect");
    }
  });

  it("rejects an oversized body from the dial", async () => {
    const fetcher = createGuardedPageFetcher({
      async lookup() {
        return ["1.2.3.4"];
      },
      async dial() {
        return {
          ok: true,
          status: 200,
          location: null,
          contentType: "text/html",
          body: Buffer.alloc(50),
        };
      },
    });
    const result = await fetcher.fetch({
      url: "https://clinica-aurora-exemplo.test/",
      signal: AbortSignal.timeout(200),
      maxBytes: 10,
      timeoutMs: 100,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.errorCode, "TOO_LARGE");
    }
  });
});

describe("node fetch guard", () => {
  it("refuses loopback before opening a socket", async () => {
    const dial = await dialPinned({
      address: "127.0.0.1",
      url: new URL("http://127.0.0.1/"),
      signal: AbortSignal.timeout(200),
      maxBytes: 100,
      timeoutMs: 50,
    });
    assert.deepEqual(dial, { ok: false, errorCode: "DNS_BLOCKED" });

    const fetched = await createNodePageFetcher().fetch({
      url: METADATA_URL,
      signal: AbortSignal.timeout(500),
      maxBytes: 100,
      timeoutMs: 200,
    });
    assert.equal(fetched.ok, false);
  });

  it("treats localhost resolution as non-public", async () => {
    const addresses = await lookupAll("localhost");
    assert.ok(addresses.length > 0);
    assert.equal(assertAddressesPublic(addresses).ok, false);
  });
});

describe("html text", () => {
  it("drops script content and keeps visible untrusted text", () => {
    const text = htmlToText(FICTIONAL_PAGE_HTML, 2_000);
    assert.equal(text.includes("169.254.169.254/latest/meta-data"), true);
    assert.equal(text.includes("inspectWebsite"), false);
    assert.equal(text.toLowerCase().includes("agendamento"), true);
  });
});
