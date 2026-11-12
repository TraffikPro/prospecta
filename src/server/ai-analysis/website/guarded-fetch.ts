import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import {
  assertAddressesPublic,
  evaluateRequestUrl,
  hostnameWithoutBrackets,
  isBlockedAddress,
} from "./address-policy";
import { isTextContentType } from "./html-text";
import { dialPinned, type DialInput, type DialResult } from "./node-dial";

export type FetchErrorCode =
  | "BLOCKED_URL"
  | "DNS_BLOCKED"
  | "TIMEOUT"
  | "TOO_LARGE"
  | "UNAVAILABLE"
  | "UNSUPPORTED_CONTENT";

export type PublicFetchRequest = {
  url: string;
  signal: AbortSignal;
  maxBytes: number;
  timeoutMs: number;
};

export type PublicFetchResult =
  | {
      ok: true;
      kind: "document";
      url: string;
      status: number;
      text: string;
    }
  | {
      ok: true;
      kind: "redirect";
      url: string;
      status: number;
      location: string;
    }
  | { ok: false; errorCode: FetchErrorCode };

export type { DialInput, DialResult };

export type PageFetcherIo = {
  lookup(hostname: string): Promise<string[]>;
  dial(input: DialInput): Promise<DialResult>;
};

export type PublicPageFetcher = {
  fetch(request: PublicFetchRequest): Promise<PublicFetchResult>;
};

/**
 * One HTTP request. Redirects are returned, not followed.
 * Every resolved address must be public before the pinned dial runs.
 */
export function createGuardedPageFetcher(io: PageFetcherIo): PublicPageFetcher {
  return {
    async fetch(request) {
      if (request.signal.aborted) {
        return { ok: false, errorCode: "TIMEOUT" };
      }
      const decision = evaluateRequestUrl(request.url);
      if (!decision.ok) {
        return { ok: false, errorCode: "BLOCKED_URL" };
      }

      const hostname = hostnameWithoutBrackets(decision.url.hostname);
      let addresses: string[];
      try {
        addresses = await io.lookup(hostname);
      } catch {
        return { ok: false, errorCode: "UNAVAILABLE" };
      }
      if (!assertAddressesPublic(addresses).ok) {
        return { ok: false, errorCode: "DNS_BLOCKED" };
      }
      const pin = addresses[0];
      if (!pin || isBlockedAddress(pin)) {
        return { ok: false, errorCode: "DNS_BLOCKED" };
      }

      const dialed = await io.dial({
        address: pin,
        url: decision.url,
        signal: request.signal,
        maxBytes: request.maxBytes,
        timeoutMs: request.timeoutMs,
      });
      if (!dialed.ok) {
        return dialed;
      }
      if (dialed.status >= 300 && dialed.status < 400) {
        if (!dialed.location) {
          return { ok: false, errorCode: "UNAVAILABLE" };
        }
        return {
          ok: true,
          kind: "redirect",
          url: decision.url.href,
          status: dialed.status,
          location: dialed.location,
        };
      }
      if (dialed.status < 200 || dialed.status >= 300) {
        return { ok: false, errorCode: "UNAVAILABLE" };
      }
      if (!isTextContentType(dialed.contentType)) {
        return { ok: false, errorCode: "UNSUPPORTED_CONTENT" };
      }
      if (dialed.body.length > request.maxBytes) {
        return { ok: false, errorCode: "TOO_LARGE" };
      }
      return {
        ok: true,
        kind: "document",
        url: decision.url.href,
        status: dialed.status,
        text: dialed.body.toString("utf8"),
      };
    },
  };
}

export async function lookupAll(hostname: string): Promise<string[]> {
  const host = hostnameWithoutBrackets(hostname);
  if (isIP(host) !== 0) {
    return [host];
  }
  const records = await lookup(host, { all: true, verbatim: true });
  return records.map((record) => record.address);
}

export function createNodePageFetcher(): PublicPageFetcher {
  return createGuardedPageFetcher({
    lookup: lookupAll,
    dial: dialPinned,
  });
}
