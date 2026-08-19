import { isIP } from "node:net";

export type ClientIpContext = {
  isVercel: boolean;
  nodeEnv: string;
};

function parseIpv4(value: string): number[] | null {
  if (isIP(value) !== 4) return null;
  const octets = value.split(".").map(Number);
  return octets.length === 4 ? octets : null;
}

function expandIpv6(value: string): number[] | null {
  if (isIP(value) !== 6 || value.includes("%")) return null;

  const doubleColonParts = value.toLowerCase().split("::");
  if (doubleColonParts.length > 2) return null;

  const parseSide = (side: string): number[] | null => {
    if (!side) return [];
    const parts = side.split(":");
    const words: number[] = [];

    for (const [index, part] of parts.entries()) {
      if (part.includes(".")) {
        if (index !== parts.length - 1) return null;
        const octets = parseIpv4(part);
        if (!octets) return null;
        words.push((octets[0]! << 8) | octets[1]!);
        words.push((octets[2]! << 8) | octets[3]!);
        continue;
      }

      if (!/^[a-f0-9]{1,4}$/.test(part)) return null;
      words.push(Number.parseInt(part, 16));
    }

    return words;
  };

  const left = parseSide(doubleColonParts[0] ?? "");
  const right = parseSide(doubleColonParts[1] ?? "");
  if (!left || !right) return null;

  if (doubleColonParts.length === 1) {
    return left.length === 8 ? left : null;
  }

  const omittedWords = 8 - left.length - right.length;
  if (omittedWords < 1) return null;
  return [...left, ...Array<number>(omittedWords).fill(0), ...right];
}

export function normalizeClientIp(value: string): string | null {
  const version = isIP(value);
  if (version === 4) return parseIpv4(value)?.join(".") ?? null;
  if (version !== 6) return null;

  const words = expandIpv6(value);
  if (!words) return null;

  const isIpv4Mapped =
    words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff;
  if (isIpv4Mapped) {
    return [
      words[6]! >> 8,
      words[6]! & 0xff,
      words[7]! >> 8,
      words[7]! & 0xff,
    ].join(".");
  }

  return `${words
    .slice(0, 4)
    .map((word) => word.toString(16))
    .join(":")}::/64`;
}

function firstValidIp(value: string | null): string | null {
  if (!value) return null;
  const candidate = value.split(",")[0]?.trim();
  return candidate ? normalizeClientIp(candidate) : null;
}

/**
 * Vercel documents that it overwrites x-forwarded-for to prevent client
 * spoofing. We only trust forwarding headers when the runtime confirms Vercel.
 * Local development may use a loopback forwarding header; other production
 * proxies must add an explicit trusted strategy before they can be supported.
 */
export function resolveClientIp(
  requestHeaders: Pick<Headers, "get">,
  context: ClientIpContext = {
    isVercel: process.env.VERCEL === "1",
    nodeEnv: process.env.NODE_ENV ?? "development",
  },
): string | null {
  if (context.isVercel) {
    return (
      firstValidIp(requestHeaders.get("x-vercel-forwarded-for")) ??
      firstValidIp(requestHeaders.get("x-forwarded-for"))
    );
  }

  if (context.nodeEnv !== "production") {
    const localIp = firstValidIp(requestHeaders.get("x-forwarded-for"));
    return localIp === "127.0.0.1" || localIp === "::1" ? localIp : null;
  }

  return null;
}
