import { isPhoneDigitCountValid } from "@/features/leads/lead.normalize";

/** Existing wa.me handoff — opens the chat, never sends. */
export function toWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }
  const digits = phone.replace(/\D/g, "");
  if (!isPhoneDigitCountValid(digits)) {
    return null;
  }
  return `https://wa.me/${digits}`;
}
