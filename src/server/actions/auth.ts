"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INVALID_CREDENTIALS_MESSAGE } from "@/server/auth/errors";
import { postAuthPath } from "@/server/auth/login-redirect";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import {
  runLoginAttemptWithRateLimit,
} from "@/server/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
};

const DUMMY_PASSWORD_HASH =
  "$2b$12$WFFZlj8Vtbt4/K4XVuTxXOmIcHeY2RlYG/Cmirqenm2/XQGzvABLC";

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailRaw =
    typeof formData.get("email") === "string"
      ? String(formData.get("email"))
      : "";
  const attempt = await runLoginAttemptWithRateLimit({
    email: emailRaw,
    requestHeaders: await headers(),
    limitedMessage: INVALID_CREDENTIALS_MESSAGE,
    attempt: async () => {
      const parsed = loginSchema.safeParse({
        email: emailRaw,
        password: formData.get("password"),
      });

      if (!parsed.success) {
        return { error: INVALID_CREDENTIALS_MESSAGE };
      }

      const email = parsed.data.email.toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
      });

      const passwordOk = await verifyPassword(
        parsed.data.password,
        user?.isActive ? user.passwordHash : DUMMY_PASSWORD_HASH,
      );
      if (!user?.isActive || !passwordOk) {
        return { error: INVALID_CREDENTIALS_MESSAGE };
      }

      await createSession(user.id);
      redirect(
        postAuthPath({
          mustChangePassword: user.mustChangePassword,
          role: user.role,
        }),
      );
    },
  });
  if (attempt.rateLimitError) return { error: attempt.rateLimitError };
  return attempt.result ?? {};
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
