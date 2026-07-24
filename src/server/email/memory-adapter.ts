import type { EmailProvider, OutboundEmail } from "./types";

/** In-memory adapter for unit tests. */
export class MemoryEmailAdapter implements EmailProvider {
  readonly sent: OutboundEmail[] = [];

  async send(message: OutboundEmail): Promise<void> {
    this.sent.push(message);
  }

  clear(): void {
    this.sent.length = 0;
  }
}
