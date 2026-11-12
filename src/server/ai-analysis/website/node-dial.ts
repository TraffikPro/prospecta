import http from "node:http";
import https from "node:https";
import type { LookupOptions } from "node:dns";
import { isIP } from "node:net";

import { isBlockedAddress, hostnameWithoutBrackets } from "./address-policy";

export type DialInput = {
  address: string;
  url: URL;
  signal: AbortSignal;
  maxBytes: number;
  timeoutMs: number;
};

export type DialResult =
  | {
      ok: true;
      status: number;
      location: string | null;
      contentType: string | null;
      body: Buffer;
    }
  | {
      ok: false;
      errorCode:
        | "BLOCKED_URL"
        | "DNS_BLOCKED"
        | "TIMEOUT"
        | "TOO_LARGE"
        | "UNAVAILABLE"
        | "UNSUPPORTED_CONTENT";
    };

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string,
  family: number,
) => void;

/**
 * Connects only to the address the guard already classified as public.
 * The system resolver is not consulted again at connect time.
 */
export async function dialPinned(input: DialInput): Promise<DialResult> {
  if (isBlockedAddress(input.address) || isIP(input.address) === 0) {
    return { ok: false, errorCode: "DNS_BLOCKED" };
  }
  if (input.signal.aborted) {
    return { ok: false, errorCode: "TIMEOUT" };
  }

  const family = isIP(input.address) === 6 ? 6 : 4;
  const hostname = hostnameWithoutBrackets(input.url.hostname);
  const isHttps = input.url.protocol === "https:";
  const port = input.url.port || (isHttps ? "443" : "80");
  const path = `${input.url.pathname || "/"}${input.url.search}`;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: DialResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const options = {
      protocol: input.url.protocol,
      hostname,
      port,
      method: "GET",
      path,
      headers: {
        Accept: "text/html,text/plain;q=0.9",
        "User-Agent": "ProspectaLeadAnalysis/0.1",
      },
      servername: hostname,
      timeout: input.timeoutMs,
      autoSelectFamily: false,
      lookup: (
        _hostname: string,
        optionsOrCallback: LookupOptions | LookupCallback,
        maybeCallback?: LookupCallback,
      ) => {
        const callback =
          typeof optionsOrCallback === "function"
            ? optionsOrCallback
            : maybeCallback;
        callback?.(null, input.address, family);
      },
    } as https.RequestOptions;

    const request = (isHttps ? https : http).request(options, (response) => {
      const status = response.statusCode ?? 0;
      const locationHeader = response.headers.location;
      const location = Array.isArray(locationHeader)
        ? (locationHeader[0] ?? null)
        : (locationHeader ?? null);
      const typeHeader = response.headers["content-type"];
      const contentType = Array.isArray(typeHeader)
        ? (typeHeader[0] ?? null)
        : (typeHeader ?? null);

      if (status >= 300 && status < 400) {
        response.resume();
        finish({
          ok: true,
          status,
          location,
          contentType,
          body: Buffer.alloc(0),
        });
        return;
      }

      const declared = response.headers["content-length"];
      const declaredLength =
        typeof declared === "string" ? Number(declared) : Number.NaN;
      if (Number.isFinite(declaredLength) && declaredLength > input.maxBytes) {
        response.destroy();
        finish({ ok: false, errorCode: "TOO_LARGE" });
        return;
      }

      const chunks: Buffer[] = [];
      let received = 0;
      response.on("data", (chunk: Buffer) => {
        received += chunk.length;
        if (received > input.maxBytes) {
          response.destroy();
          finish({ ok: false, errorCode: "TOO_LARGE" });
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        finish({
          ok: true,
          status,
          location: null,
          contentType,
          body: Buffer.concat(chunks),
        });
      });
      response.on("error", () => {
        finish({ ok: false, errorCode: "UNAVAILABLE" });
      });
    });

    request.on("timeout", () => {
      request.destroy();
      finish({ ok: false, errorCode: "TIMEOUT" });
    });
    request.on("error", () => {
      finish({
        ok: false,
        errorCode: input.signal.aborted ? "TIMEOUT" : "UNAVAILABLE",
      });
    });
    input.signal.addEventListener(
      "abort",
      () => {
        request.destroy();
        finish({ ok: false, errorCode: "TIMEOUT" });
      },
      { once: true },
    );
    request.end();
  });
}
