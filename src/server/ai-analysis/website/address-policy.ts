import { BlockList, isIP } from "node:net";

const blockList = new BlockList();

function block4(address: string, prefix: number): void {
  blockList.addSubnet(address, prefix, "ipv4");
}

function block6(address: string, prefix: number): void {
  blockList.addSubnet(address, prefix, "ipv6");
}

block4("0.0.0.0", 8);
block4("10.0.0.0", 8);
block4("100.64.0.0", 10);
block4("127.0.0.0", 8);
block4("169.254.0.0", 16);
block4("172.16.0.0", 12);
block4("192.0.0.0", 24);
block4("192.0.2.0", 24);
block4("192.168.0.0", 16);
block4("198.18.0.0", 15);
block4("198.51.100.0", 24);
block4("203.0.113.0", 24);
block4("224.0.0.0", 3);
blockList.addAddress("255.255.255.255", "ipv4");

block6("::", 128);
block6("::1", 128);
block6("fc00::", 7);
block6("fe80::", 10);
block6("ff00::", 8);
block6("2001:db8::", 32);

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.internal",
]);

const BLOCKED_SUFFIXES = [
  ".localhost",
  ".local",
  ".localdomain",
  ".internal",
  ".intranet",
];

export function hostnameWithoutBrackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }
  return hostname;
}

export function ipv4FromMapped(address: string): string | null {
  const lower = address.toLowerCase();
  if (!lower.startsWith("::ffff:")) {
    return null;
  }
  const rest = address.slice("::ffff:".length);
  if (isIP(rest) === 4) {
    return rest;
  }
  const parts = rest.split(":");
  if (
    parts.length === 2 &&
    /^[0-9a-f]{1,4}$/i.test(parts[0] ?? "") &&
    /^[0-9a-f]{1,4}$/i.test(parts[1] ?? "")
  ) {
    const high = Number.parseInt(parts[0] ?? "", 16);
    const low = Number.parseInt(parts[1] ?? "", 16);
    return `${(high >> 8) & 255}.${high & 255}.${(low >> 8) & 255}.${low & 255}`;
  }
  return null;
}

export function isBlockedAddress(address: string): boolean {
  const normalized = hostnameWithoutBrackets(address).toLowerCase();
  const mapped = ipv4FromMapped(normalized);
  if (mapped && isBlockedAddress(mapped)) {
    return true;
  }
  const version = isIP(normalized);
  if (version === 4) {
    return blockList.check(normalized, "ipv4");
  }
  if (version === 6) {
    return blockList.check(normalized, "ipv6");
  }
  return true;
}

export type UrlDecision =
  | { ok: true; url: URL }
  | { ok: false; errorCode: "BLOCKED_URL" };

function defaultPort(protocol: string, port: string): boolean {
  if (!port) return true;
  if (protocol === "https:" && port === "443") return true;
  if (protocol === "http:" && port === "80") return true;
  return false;
}

export function evaluateRequestUrl(raw: string): UrlDecision {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }
  if (url.username || url.password) {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }
  if (!defaultPort(url.protocol, url.port)) {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }

  const hostname = hostnameWithoutBrackets(url.hostname).replace(/\.$/, "").toLowerCase();
  if (!hostname || hostname.includes("%")) {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }
  if (BLOCKED_HOSTS.has(hostname)) {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }
  if (BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }
  if (isIP(hostname) !== 0 && isBlockedAddress(hostname)) {
    return { ok: false, errorCode: "BLOCKED_URL" };
  }

  url.hash = "";
  return { ok: true, url };
}

export function assertAddressesPublic(
  addresses: readonly string[],
): { ok: true } | { ok: false; errorCode: "DNS_BLOCKED" } {
  if (addresses.length === 0) {
    return { ok: false, errorCode: "DNS_BLOCKED" };
  }
  for (const address of addresses) {
    if (isBlockedAddress(address)) {
      return { ok: false, errorCode: "DNS_BLOCKED" };
    }
  }
  return { ok: true };
}

export function samePublicHost(left: URL, right: URL): boolean {
  return (
    left.protocol === right.protocol &&
    left.hostname.toLowerCase() === right.hostname.toLowerCase() &&
    left.port === right.port
  );
}
