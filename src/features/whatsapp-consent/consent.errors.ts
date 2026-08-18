export class WhatsAppConsentValidationError extends Error {
  readonly code = "WHATSAPP_CONSENT_VALIDATION" as const;

  constructor(message: string) {
    super(message);
    this.name = "WhatsAppConsentValidationError";
  }
}
