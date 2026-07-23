"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LeadDuplicateError,
  LeadValidationError,
} from "@/features/leads/lead.errors";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import {
  createLeadForOwner,
  moveLeadStage,
} from "@/server/services/lead.service";

export type CreateLeadState = {
  error?: string;
  code?: "DUPLICATE_LEAD" | "VALIDATION" | "UNAUTHENTICATED";
  existingLeadId?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createLeadAction(
  _prev: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const sessionUser = await getSessionUser();

  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const user = sessionUser!;
  let createdId: string;

  try {
    const created = await createLeadForOwner({
      companyName: formString(formData, "companyName"),
      contactName: formString(formData, "contactName") || undefined,
      email: formString(formData, "email") || undefined,
      phone: formString(formData, "phone") || undefined,
      website: formString(formData, "website") || undefined,
      ownerId: user.id,
    });
    createdId = created.id;
  } catch (error) {
    if (error instanceof LeadDuplicateError) {
      return {
        error: "Já existe um lead com este e-mail ou telefone.",
        code: "DUPLICATE_LEAD",
        existingLeadId: error.existingLeadId,
      };
    }
    if (error instanceof LeadValidationError) {
      return {
        error: error.message,
        code: "VALIDATION",
      };
    }
    throw error;
  }

  redirect(`/app/leads/${createdId}`);
}

export type MoveLeadStageState = {
  error?: string;
  ok?: boolean;
};

export async function moveLeadStageAction(
  _prev: MoveLeadStageState,
  formData: FormData,
): Promise<MoveLeadStageState> {
  const sessionUser = await getSessionUser();

  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const user = sessionUser!;
  const leadId = formString(formData, "leadId");

  try {
    await moveLeadStage({
      leadId,
      actorId: user.id,
      stage: formString(formData, "stage"),
      lostReason: formString(formData, "lostReason") || undefined,
    });
  } catch (error) {
    if (error instanceof LeadValidationError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/app/leads/${leadId}`);
  revalidatePath("/app/pipeline");
  redirect(`/app/leads/${leadId}`);
}
