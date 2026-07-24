"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INVALID_CREDENTIALS_MESSAGE } from "@/server/auth/errors";
import { postAuthPath } from "@/server/auth/login-redirect";
import { verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  const passwordOk = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );
  if (!passwordOk) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  await createSession(user.id);
  redirect(
    postAuthPath({
      mustChangePassword: user.mustChangePassword,
      role: user.role,
    }),
  );
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
