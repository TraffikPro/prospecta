"use client";

import { useState } from "react";

import { Alert, Field, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORGOT_PASSWORD_ACK_MESSAGE } from "@/server/auth/login-redirect";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    // Fatia 1: stub UI only — always acknowledge without probing users.
    window.setTimeout(() => {
      setSubmitted(true);
      setPending(false);
    }, 200);
  }

  if (submitted) {
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
        <Text fontSize="sm">
          <NextLink href="/login">Voltar ao login</NextLink>
        </Text>
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
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

        <Button type="submit" width="full" loading={pending} disabled={pending}>
          {pending ? "Enviando…" : "Enviar"}
        </Button>

        <Text fontSize="sm" color="fg.muted">
          <NextLink href="/login">Voltar ao login</NextLink>
        </Text>
      </Stack>
    </form>
  );
}
