"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireRole } from "@/server/auth/guards";
import { loginPath } from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";
import {
  AcquisitionConflictError,
  AcquisitionDispatchError,
  AcquisitionValidationError,
  requestAcquisitionJob,
} from "@/server/services/acquisition-job.service";

export type RequestAcquisitionState = {
  error?: string;
  code?:
    | "VALIDATION"
    | "CONFLICT"
    | "DISPATCH"
    | "FORBIDDEN"
    | "UNAUTHENTICATED";
  existingJobId?: string;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function requestAcquisitionAction(
  _prev: RequestAcquisitionState,
  formData: FormData,
): Promise<RequestAcquisitionState> {
  const sessionUser = await getSessionUser();

  try {
    // Fase 1: free Places pull is ADMIN-only. MEMBER uses carteira (Fase 3).
    requireRole(sessionUser, "ADMIN");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(loginPath("session_expired"));
    }
    if (error instanceof AuthorizationError) {
      return {
        error:
          "Apenas administradores podem solicitar pull livre de aquisição.",
        code: "FORBIDDEN",
      };
    }
    throw error;
  }

  try {
    await requestAcquisitionJob({
      requestedById: sessionUser!.id,
      raw: {
        city: formString(formData, "city"),
        query: formString(formData, "query"),
        limit: formString(formData, "limit"),
        campaign: formString(formData, "campaign"),
        confirmed: formString(formData, "confirmed") || undefined,
      },
    });
  } catch (error) {
    if (error instanceof AcquisitionValidationError) {
      return { error: error.message, code: "VALIDATION" };
    }
    if (error instanceof AcquisitionConflictError) {
      return {
        error: error.message,
        code: "CONFLICT",
        existingJobId: error.existingJobId,
      };
    }
    if (error instanceof AcquisitionDispatchError) {
      return { error: error.message, code: "DISPATCH" };
    }
    throw error;
  }

  revalidatePath("/admin/acquisition");
  return {};
}
