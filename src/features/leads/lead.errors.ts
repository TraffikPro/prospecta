export class LeadDuplicateError extends Error {
  readonly code = "DUPLICATE_LEAD" as const;
  readonly existingLeadId: string;

  constructor(existingLeadId: string) {
    super("DUPLICATE_LEAD");
    this.name = "LeadDuplicateError";
    this.existingLeadId = existingLeadId;
  }
}

export class LeadValidationError extends Error {
  readonly code = "LEAD_VALIDATION" as const;

  constructor(message: string) {
    super(message);
    this.name = "LeadValidationError";
  }
}
