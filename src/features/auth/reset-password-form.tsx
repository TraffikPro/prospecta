"use client";

import { useActionState } from "react";

import { Alert, Field, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/server/actions/password-reset";
import { PASSWORD_CHANGED_MESSAGE } from "@/server/auth/login-redirect";

const initialState: ResetPasswordState = {};

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  if (state.ok) {
    return (
      <Stack gap="4" width="full">
        <Alert.Root
          status="success"
          variant="subtle"
          role="status"
          data-testid="password-reset-success"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{PASSWORD_CHANGED_MESSAGE}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
        <Text fontSize="sm">
          <NextLink href="/login">Fazer login</NextLink>
        </Text>
      </Stack>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <Stack gap="4" width="full">
        <Field.Root required>
          <Field.Label>Nova senha</Field.Label>
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>Confirmar senha</Field.Label>
          <Input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field.Root>

        {state.error ? (
          <Alert.Root status="error" variant="subtle" role="alert">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{state.error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ) : null}

        <Button type="submit" width="full" loading={pending} disabled={pending}>
          {pending ? "Alterando…" : "Alterar senha"}
        </Button>

        <Text fontSize="sm" color="fg.muted">
          <NextLink href="/login">Voltar ao login</NextLink>
        </Text>
      </Stack>
    </form>
  );
}
