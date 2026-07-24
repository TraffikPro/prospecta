import "server-only";

import { ConsoleEmailAdapter } from "./console-adapter";
import { ResendEmailAdapter } from "./resend-adapter";
import type { EmailProvider } from "./types";

export type { EmailProvider, OutboundEmail } from "./types";
export { MemoryEmailAdapter } from "./memory-adapter";

export function createEmailProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  const useResend =
    explicit === "resend" ||
    (!explicit && Boolean(process.env.RESEND_API_KEY?.trim()));

  if (useResend) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      throw new Error(
        "RESEND_API_KEY and EMAIL_FROM are required when EMAIL_PROVIDER=resend",
      );
    }
    return new ResendEmailAdapter({ apiKey, from });
  }

  return new ConsoleEmailAdapter();
}
