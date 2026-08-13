"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireRole } from "@/server/auth/guards";
import { loginPath } from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";
import {
  setUserCanRunAcquisition,
  UserPermissionError,
} from "@/server/services/user.service";

export type SetAcquisitionPermissionState = {
  error?: string;
  ok?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function setAcquisitionPermissionAction(
  _prev: SetAcquisitionPermissionState,
  formData: FormData,
): Promise<SetAcquisitionPermissionState> {
  const sessionUser = await getSessionUser();

  try {
    requireRole(sessionUser, "ADMIN");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(loginPath("session_expired"));
    }
    if (error instanceof AuthorizationError) {
      return { error: "Apenas administradores podem alterar esta permissão." };
    }
    throw error;
  }

  const targetUserId = formString(formData, "userId");
  const enabledRaw = formString(formData, "canRunAcquisition");
  const canRunAcquisition = enabledRaw === "true" || enabledRaw === "on";

  if (!targetUserId) {
    return { error: "Usuário inválido." };
  }

  try {
    await setUserCanRunAcquisition({
      actorId: sessionUser!.id,
      targetUserId,
      canRunAcquisition,
    });
  } catch (error) {
    if (error instanceof UserPermissionError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
