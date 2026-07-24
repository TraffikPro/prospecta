"use client";

import { useActionState } from "react";

import {
  Alert,
  Field,
  Fieldset,
  Link as ChakraLink,
  Stack,
} from "@chakra-ui/react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "@/server/actions/password-reset";
import { FORGOT_PASSWORD_ACK_MESSAGE } from "@/server/auth/login-redirect";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.acknowledged) {
    return (
      <Stack gap="4" width="full">
        <Alert.Root status="success" variant="subtle" role="status">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description data-testid="forgot-password-ack">
              {FORGOT_PASSWORD_ACK_MESSAGE}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
        <ChakraLink
          asChild
          fontSize="sm"
          fontWeight="medium"
          color="brand.fg"
          _hover={{ opacity: 0.8 }}
        >
          <NextLink href="/login">Voltar ao login</NextLink>
        </ChakraLink>
      </Stack>
    );
  }

  return (
    <form action={formAction}>
      <Fieldset.Root disabled={pending}>
        <Fieldset.Content>
          <Stack gap="4" width="full">
            <Field.Root required>
              <Field.Label>E-mail</Field.Label>
              <Input
                name="email"
                type="email"
                autoComplete="username"
                required
                minH="touch"
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
              minH="touch"
              loading={pending}
              disabled={pending}
            >
              {pending ? "Enviando…" : "Enviar"}
            </Button>

            <ChakraLink
              asChild
              fontSize="sm"
              fontWeight="medium"
              color="brand.fg"
              _hover={{ opacity: 0.8 }}
            >
              <NextLink href="/login">Voltar ao login</NextLink>
            </ChakraLink>
          </Stack>
        </Fieldset.Content>
      </Fieldset.Root>
    </form>
  );
}
