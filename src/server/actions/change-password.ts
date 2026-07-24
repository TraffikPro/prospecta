"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { postAuthPath } from "@/server/auth/login-redirect";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getSessionUser } from "@/server/auth/session";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(1),
});

export type ChangePasswordState = {
  error?: string;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: "Preencha os campos corretamente (mín. 8 caracteres)." };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, passwordHash: true, isActive: true },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  const currentOk = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!currentOk) {
    return { error: "Senha atual incorreta." };
  }

  if (parsed.data.currentPassword === parsed.data.password) {
    return { error: "A nova senha deve ser diferente da atual." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
    },
  });

  redirect(
    postAuthPath({
      mustChangePassword: false,
      role: sessionUser.role,
    }),
  );
}
