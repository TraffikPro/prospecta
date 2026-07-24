import "server-only";

import type { EmailProvider, OutboundEmail } from "./types";

/** Dev/test adapter — never logs the full reset URL token in production builds. */
export class ConsoleEmailAdapter implements EmailProvider {
  async send(message: OutboundEmail): Promise<void> {
    const safeText =
      process.env.NODE_ENV === "production"
        ? "[redacted in production console adapter]"
        : message.text;
    console.info("[email:console]", {
      to: message.to,
      subject: message.subject,
      text: safeText,
    });
  }
}
