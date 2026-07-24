"use client";

import { useActionState } from "react";

import { Alert, Field, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "@/server/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction}>
      <Stack gap="4" width="full">
        <Field.Root required>
          <Field.Label>E-mail</Field.Label>
          <Input
            name="email"
            type="email"
            autoComplete="username"
            required
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>Senha</Field.Label>
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
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
          {pending ? "Entrando…" : "Entrar"}
        </Button>

        <Text fontSize="sm" textAlign="center">
          <NextLink href="/forgot-password">Esqueci minha senha</NextLink>
        </Text>
      </Stack>
    </form>
  );
}
