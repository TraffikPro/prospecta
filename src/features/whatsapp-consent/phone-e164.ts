const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function isValidPhoneE164(value: string): boolean {
  return E164_PATTERN.test(value);
}

/**
 * Suggest E.164 from legacy digit storage. Display/form only — never persist
 * as consent and never treat as OPTED_IN.
 */
export function suggestPhoneE164(
  legacyPhone: string | null | undefined,
): string | null {
  if (!legacyPhone) {
    return null;
  }
  const trimmed = legacyPhone.trim();
  if (isValidPhoneE164(trimmed)) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    const candidate = `+55${digits}`;
    return isValidPhoneE164(candidate) ? candidate : null;
  }
  if (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith("55")
  ) {
    const candidate = `+${digits}`;
    return isValidPhoneE164(candidate) ? candidate : null;
  }
  return null;
}

export function normalizePhoneE164(value: string): string | null {
  const trimmed = value.trim();
  if (isValidPhoneE164(trimmed)) {
    return trimmed;
  }
  return suggestPhoneE164(trimmed);
}
