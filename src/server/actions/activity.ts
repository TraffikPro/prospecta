"use server";

import { revalidatePath } from "next/cache";
import {
  ActivityValidationError,
  LeadNotFoundError,
} from "@/features/activities/activity.errors";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { createActivityForLead } from "@/server/services/activity.service";

export type CreateActivityState = {
  error?: string;
  code?: "VALIDATION" | "LEAD_NOT_FOUND";
  ok?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createActivityAction(
  _prev: CreateActivityState,
  formData: FormData,
): Promise<CreateActivityState> {
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

  try {
    await createActivityForLead({
      leadId,
      authorId: user.id,
      type: formString(formData, "type"),
      outcome: formString(formData, "outcome") || undefined,
      body: formString(formData, "body"),
      nextFollowUpAt: formString(formData, "nextFollowUpAt") || undefined,
    });
  } catch (error) {
    if (error instanceof ActivityValidationError) {
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
