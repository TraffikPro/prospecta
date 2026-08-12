"use client";

import { useActionState } from "react";

import { Alert, Field, HStack, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestAcquisitionAction,
  type RequestAcquisitionState,
} from "@/server/actions/acquisition";

const initialState: RequestAcquisitionState = {};

export function AcquisitionRequestForm() {
  const [state, formAction, pending] = useActionState(
    requestAcquisitionAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <Stack gap="4" maxW="lg">
        <Field.Root required>
          <Field.Label>Cidade</Field.Label>
          <Input
            name="city"
            required
            placeholder="Santos SP"
            disabled={pending}
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>Nicho / busca</Field.Label>
          <Input
            name="query"
            required
            placeholder="clínica odontológica"
            disabled={pending}
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label>Limite de leads HIGH</Field.Label>
          <Input
            name="limit"
            type="number"
            min={1}
            max={30}
            defaultValue={10}
            required
            disabled={pending}
          />
          <Field.HelperText>Entre 1 e 30. Só sync com score ≥ 70.</Field.HelperText>
        </Field.Root>

        <Field.Root required>
          <Field.Label>Campanha (slug)</Field.Label>
          <Input
            name="campaign"
            required
            placeholder="santos-odontologia-2026-07"
            disabled={pending}
          />
        </Field.Root>

        <HStack as="label" gap="2" align="flex-start">
          <input
            type="checkbox"
            name="confirmed"
            value="on"
            disabled={pending}
            required
            style={{ marginTop: "0.25rem" }}
          />
          <Text fontSize="sm">
            Confirmo o pull (Places no runner externo; custo de API)
          </Text>
        </HStack>

        {state.error ? (
          <Alert.Root status="error" variant="subtle" role="alert">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{state.error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ) : null}

        <Button type="submit" loading={pending} disabled={pending}>
          {pending ? "Solicitando…" : "Puxar leads"}
        </Button>

        <Text fontSize="sm" color="fg.muted">
          O Google Places permanece no runner externo. Os leads entram na
          Intelligence Inbox após o sync.
        </Text>
      </Stack>
    </form>
  );
}
