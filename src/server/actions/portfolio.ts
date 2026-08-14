"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireAnyRole, requireRole } from "@/server/auth/guards";
import { loginPath } from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";
import {
  AcquisitionDispatchError,
} from "@/server/services/acquisition-job.service";
import {
  PortfolioError,
  reassignLeadToOperator,
  recycleLeadToPool,
  setOperatorWeeklyQuota,
} from "@/server/services/portfolio.service";
import { requestWalletFill } from "@/server/services/wallet-fill.service";

export type PortfolioActionState = {
  error?: string;
  ok?: boolean;
  code?: "RUNNING" | "DISPATCH";
  message?: string;
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
  const expectedRaw = formString(formData, "expectedActiveAssigneeId");
  const expectedActiveAssigneeId =
    expectedRaw.trim() === "" ? null : expectedRaw;

  try {
    await reassignLeadToOperator({
      actorId: sessionUser!.id,
      leadId,
      assigneeId,
      expectedActiveAssigneeId,
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
  revalidatePath("/admin/high-pool");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function recycleLeadAction(
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
      return { error: "Apenas administradores podem reciclar leads." };
    }
    throw error;
  }

  const leadId = formString(formData, "leadId");

  try {
    await recycleLeadToPool({
      actorId: sessionUser!.id,
      leadId,
    });
  } catch (error) {
    if (error instanceof PortfolioError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/app/leads/${leadId}`);
  revalidatePath("/app/my-leads");
  revalidatePath("/admin/high-pool");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function fillWalletAction(
  _prev: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  void formData;
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(loginPath("session_expired"));
    }
    if (error instanceof AuthorizationError) {
      return { error: "Sem permissão para completar a carteira." };
    }
    throw error;
  }

  try {
    const result = await requestWalletFill({ actorId: sessionUser!.id });
    revalidatePath("/app/my-leads");
    revalidatePath("/", "layout");
    if (result.reused) {
      return {
        ok: true,
        code: "RUNNING",
        message: "Sua carteira já está sendo completada.",
      };
    }
    return {
      ok: true,
      code: "RUNNING",
      message: "Completando carteira...",
    };
  } catch (error) {
    if (error instanceof PortfolioError) {
      return { error: error.message };
    }
    if (error instanceof AcquisitionDispatchError) {
      return { error: error.message, code: "DISPATCH" };
    }
    throw error;
  }
}
