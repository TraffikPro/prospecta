"use client";

import { useActionState } from "react";

import { Alert, Field, HStack, Link as ChakraLink, Stack } from "@chakra-ui/react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createLeadAction,
  type CreateLeadState,
} from "@/server/actions/lead";

const initialState: CreateLeadState = {};

export function CreateLeadForm() {
  const [state, formAction, pending] = useActionState(
    createLeadAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <Stack gap="4" maxW="md">
        <Field.Root required>
          <Field.Label>Empresa</Field.Label>
          <Input name="companyName" required />
        </Field.Root>

        <Field.Root>
          <Field.Label>Contato</Field.Label>
          <Input name="contactName" />
        </Field.Root>

        <Field.Root>
          <Field.Label>E-mail</Field.Label>
          <Input name="email" type="email" />
        </Field.Root>

        <Field.Root>
          <Field.Label>Telefone</Field.Label>
          <Input name="phone" />
        </Field.Root>

        <Field.Root>
          <Field.Label>Website</Field.Label>
          <Input name="website" type="url" placeholder="https://" />
        </Field.Root>

        {state.error ? (
          <Alert.Root status="error" variant="subtle" role="alert">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{state.error}</Alert.Description>
              {state.code === "DUPLICATE_LEAD" && state.existingLeadId ? (
                <Alert.Description mt="2">
                  <ChakraLink asChild>
                    <NextLink href={`/app/leads/${state.existingLeadId}`}>
                      Ver lead existente
                    </NextLink>
                  </ChakraLink>
                </Alert.Description>
              ) : null}
            </Alert.Content>
          </Alert.Root>
        ) : null}

        <HStack gap="3">
          <Button type="submit" loading={pending} disabled={pending}>
            {pending ? "Salvando…" : "Salvar lead"}
          </Button>
          <Button asChild variant="outline" colorPalette="gray">
            <NextLink href="/app/leads">Cancelar</NextLink>
          </Button>
        </HStack>
      </Stack>
    </form>
  );
}
