"use client";

import type { ActivityOutcome } from "@prisma/client";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Card,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Textarea,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { activityOutcomeLabels } from "@/features/activities/activity.labels";
import { shouldRequireNextFollowUp } from "@/features/activities/activity.rules";
import {
  createActivityAction,
  type CreateActivityState,
} from "@/server/actions/activity";

const initialState: CreateActivityState = {};

const outcomes = Object.keys(activityOutcomeLabels) as ActivityOutcome[];

type Props = {
  leadId: string;
  /** Allowlisted contextual return (fila / inteligência / pipeline / leads). */
  returnHref?: string;
};

export function CreateActivityForm({
  leadId,
  returnHref = "/app/my-leads",
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createActivityAction,
    initialState,
  );
  const [type, setType] = useState<"WHATSAPP" | "EMAIL" | "NOTE">("WHATSAPP");
  const [outcome, setOutcome] = useState<ActivityOutcome>("SENT_NO_REPLY");
  const [body, setBody] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");

  const requiresFollowUp = useMemo(
    () =>
      shouldRequireNextFollowUp({
        type,
        outcome: type === "NOTE" ? null : outcome,
      }),
    [type, outcome],
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <Card.Root variant="outline" borderRadius="card">
      <Card.Body>
        <form action={formAction}>
          <Stack gap="4" maxW={{ base: "full", lg: "lg" }} w="full">
            <input type="hidden" name="leadId" value={leadId} />

            <Heading as="h2" size="md" id="register-activity-heading">
              Registrar atividade
            </Heading>

            <Field.Root required>
              <Field.Label>Tipo</Field.Label>
              <NativeSelect.Root size="lg">
                <NativeSelect.Field
                  name="type"
                  value={type}
                  minH="11"
                  onChange={(event) =>
                    setType(event.target.value as "WHATSAPP" | "EMAIL" | "NOTE")
                  }
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="NOTE">Nota</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            {type !== "NOTE" ? (
              <Field.Root required>
                <Field.Label>Resultado</Field.Label>
                <NativeSelect.Root size="lg">
                  <NativeSelect.Field
                    name="outcome"
                    value={outcome}
                    minH="11"
                    onChange={(event) =>
                      setOutcome(event.target.value as ActivityOutcome)
                    }
                  >
                    {outcomes.map((value) => (
                      <option key={value} value={value}>
                        {activityOutcomeLabels[value]}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
            ) : null}

            <Field.Root required>
              <Field.Label>Descrição</Field.Label>
              <Textarea
                name="body"
                required
                rows={4}
                minH="28"
                fontSize="md"
                placeholder="O que aconteceu no contato?"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </Field.Root>

            <Field.Root required={requiresFollowUp}>
              <Field.Label>
                Próximo passo (data)
                {requiresFollowUp ? " — obrigatório" : " (opcional)"}
              </Field.Label>
              <Input
                name="nextFollowUpAt"
                type="datetime-local"
                required={requiresFollowUp}
                minH="11"
                fontSize="md"
                value={nextFollowUpAt}
                onChange={(event) => setNextFollowUpAt(event.target.value)}
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
            {state.ok ? (
              <Stack gap="3">
                <Alert.Root status="success" variant="subtle" role="status">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>Atividade registrada.</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
                <Button
                  asChild
                  variant="outline"
                  minH="11"
                  width={{ base: "full", md: "fit-content" }}
                >
                  <NextLink href={returnHref}>Voltar</NextLink>
                </Button>
              </Stack>
            ) : null}

            <Stack
              gap="2"
              position={{ base: "sticky", md: "static" }}
              bottom={{ base: "4", md: "auto" }}
              bg={{ base: "bg", md: "transparent" }}
              py={{ base: "2", md: "0" }}
              mt="2"
              zIndex="1"
              borderTopWidth={{ base: "1px", md: "0" }}
              borderColor="border"
            >
              <Button
                type="submit"
                width={{ base: "full", md: "fit-content" }}
                minH="11"
                loading={pending}
                disabled={pending}
              >
                {pending ? "Salvando…" : "Salvar atividade"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
