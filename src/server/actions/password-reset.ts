"use server";

import { z } from "zod";

import { clearSessionCookie } from "@/server/auth/cookies";
import {
  PasswordResetError,
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/server/services/password-reset.service";

const requestSchema = z.object({
  email: z.string().trim().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
  confirmPassword: z.string().min(1),
});

export type ForgotPasswordState = {
  acknowledged?: boolean;
  error?: string;
};

export type ResetPasswordState = {
  ok?: boolean;
  error?: string;
};

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = requestSchema.safeParse({
    email: formData.get("email"),
  });

  // Anti-enumeration: invalid shape still gets the same ack path on the client
  // when we return acknowledged; keep a soft validation error for empty/malformed.
  if (!parsed.success) {
    return { acknowledged: true };
  }

  await requestPasswordReset(parsed.data.email);
  return { acknowledged: true };
}

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: "Link inválido ou expirado." };
  }

  try {
    await resetPasswordWithToken(parsed.data);
    // Server Action — safe to clear cookie if a stale session cookie is present.
    await clearSessionCookie();
    return { ok: true };
  } catch (error) {
    if (error instanceof PasswordResetError) {
      return { error: error.message };
    }
    throw error;
  }
}
