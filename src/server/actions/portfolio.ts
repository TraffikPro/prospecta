"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireRole } from "@/server/auth/guards";
import { loginPath } from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";
import {
  PortfolioError,
  reassignLeadToOperator,
  setOperatorWeeklyQuota,
} from "@/server/services/portfolio.service";

export type PortfolioActionState = {
  error?: string;
  ok?: boolean;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function setWeeklyQuotaAction(
  _prev: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const sessionUser = await getSessionUser();
  try {
    requireRole(sessionUser, "ADMIN");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(loginPath("session_expired"));
    }
    if (error instanceof AuthorizationError) {
      return { error: "Apenas administradores podem definir a meta." };
    }
    throw error;
  }

  const targetUserId = formString(formData, "userId");
  const weeklyTarget = Number.parseInt(formString(formData, "weeklyTarget"), 10);

  try {
    await setOperatorWeeklyQuota({
      actorId: sessionUser!.id,
      targetUserId,
      weeklyTarget,
    });
  } catch (error) {
    if (error instanceof PortfolioError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function reassignLeadAction(
  _prev: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const sessionUser = await getSessionUser();
  try {
    requireRole(sessionUser, "ADMIN");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(loginPath("session_expired"));
    }
    if (error instanceof AuthorizationError) {
      return { error: "Apenas administradores podem reatribuir." };
    }
    throw error;
  }

  const leadId = formString(formData, "leadId");
  const assigneeId = formString(formData, "assigneeId");

  try {
    await reassignLeadToOperator({
      actorId: sessionUser!.id,
      leadId,
      assigneeId,
    });
  } catch (error) {
    if (error instanceof PortfolioError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/app/leads/${leadId}`);
  revalidatePath("/app/my-leads");
  revalidatePath("/admin/users");
  return { ok: true };
}
