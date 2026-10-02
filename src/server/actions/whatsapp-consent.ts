"use server";

import { revalidatePath } from "next/cache";
import { LeadNotFoundError } from "@/features/activities/activity.errors";
import { WhatsAppConsentValidationError } from "@/features/whatsapp-consent/consent.errors";
import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { recordWhatsAppConsent } from "@/server/services/whatsapp-consent.service";

export type RecordWhatsAppConsentState = {
  error?: string;
  code?: "VALIDATION" | "LEAD_NOT_FOUND" | "FORBIDDEN";
  ok?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function recordWhatsAppConsentAction(
  _prev: RecordWhatsAppConsentState,
  formData: FormData,
): Promise<RecordWhatsAppConsentState> {
  const sessionUser = await getSessionUser();

  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return { error: "Autenticação necessária", code: "VALIDATION" };
    }
    throw error;
  }

  const user = sessionUser!;
  const leadId = formString(formData, "leadId");
  // actorId is derived from the session only — never from FormData.

  try {
    await recordWhatsAppConsent({
      leadId,
      actorId: user.id,
      status: formString(formData, "status"),
      source: formString(formData, "source"),
      purpose: formString(formData, "purpose") || undefined,
      purposeNote: formString(formData, "purposeNote") || undefined,
      evidenceAt: formString(formData, "evidenceAt"),
      phoneE164: formString(formData, "phoneE164") || undefined,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: "Acesso negado", code: "FORBIDDEN" };
    }
    if (error instanceof WhatsAppConsentValidationError) {
      return { error: error.message, code: "VALIDATION" };
    }
    if (error instanceof LeadNotFoundError) {
      return { error: "Lead não encontrado", code: "LEAD_NOT_FOUND" };
    }
    throw error;
  }

  revalidatePath(`/app/leads/${leadId}`);
  return { ok: true };
}
