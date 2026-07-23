export class ActivityValidationError extends Error {
  readonly code = "ACTIVITY_VALIDATION" as const;

  constructor(message: string) {
    super(message);
    this.name = "ActivityValidationError";
  }
}

export class LeadNotFoundError extends Error {
  readonly code = "LEAD_NOT_FOUND" as const;

  constructor(leadId: string) {
    super(`Lead not found: ${leadId}`);
    this.name = "LeadNotFoundError";
  }
}
