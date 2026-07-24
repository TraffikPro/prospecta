import "server-only";

import { Resend } from "resend";

import type { EmailProvider, OutboundEmail } from "./types";

type ResendAdapterOptions = {
  apiKey: string;
  from: string;
};

export class ResendEmailAdapter implements EmailProvider {
  private readonly client: Resend;
  private readonly from: string;

  constructor(options: ResendAdapterOptions) {
    this.client = new Resend(options.apiKey);
    this.from = options.from;
  }

  async send(message: OutboundEmail): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      throw new Error(`Resend send failed: ${error.message}`);
    }
  }
}
