"use client";

import { useActionState } from "react";

import { Alert, Field, Fieldset, Stack } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/server/actions/change-password";
import { logoutAction } from "@/server/actions/auth";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <Stack gap="4" width="full">
      <form action={formAction}>
        <Fieldset.Root disabled={pending}>
          <Fieldset.Content>
            <Stack gap="4" width="full">
              <Field.Root required>
                <Field.Label>Senha atual</Field.Label>
                <PasswordInput
                  name="currentPassword"
                  autoComplete="current-password"
                  required
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Nova senha</Field.Label>
                <PasswordInput
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </Field.Root>

              <Field.Root required>
                <Field.Label>Confirmar nova senha</Field.Label>
                <PasswordInput
                  name="confirmPassword"
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

              <Button
                type="submit"
                width="full"
                loading={pending}
                disabled={pending}
              >
                {pending ? "Alterando…" : "Alterar senha"}
              </Button>
            </Stack>
          </Fieldset.Content>
        </Fieldset.Root>
      </form>

      <form action={logoutAction}>
        <Button type="submit" variant="ghost" width="full">
          Sair
        </Button>
      </form>
    </Stack>
  );
}
