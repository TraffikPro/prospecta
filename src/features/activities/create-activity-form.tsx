"use client";

import type { ActivityOutcome } from "@prisma/client";
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
};

export function CreateActivityForm({ leadId }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createActivityAction,
    initialState,
  );
  const [type, setType] = useState<"WHATSAPP" | "EMAIL" | "NOTE">("WHATSAPP");
  const [outcome, setOutcome] = useState<ActivityOutcome>("SENT_NO_REPLY");

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
          <Stack gap="4" maxW="lg">
            <input type="hidden" name="leadId" value={leadId} />

            <Heading as="h2" size="md" id="register-activity-heading">
              Registrar atividade
            </Heading>

            <Field.Root>
              <Field.Label>Tipo</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="type"
                  value={type}
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
              <Field.Root>
                <Field.Label>Resultado</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    name="outcome"
                    value={outcome}
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
                rows={3}
                placeholder="O que aconteceu no contato?"
              />
            </Field.Root>

            <Field.Root required={requiresFollowUp}>
              <Field.Label>
                Próximo passo (data)
                {requiresFollowUp ? "" : " (opcional)"}
              </Field.Label>
              <Input
                name="nextFollowUpAt"
                type="datetime-local"
                required={requiresFollowUp}
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
              <Alert.Root status="success" variant="subtle" role="status">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>Atividade registrada.</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}

            <Button
              type="submit"
              width="fit-content"
              loading={pending}
              disabled={pending}
            >
              {pending ? "Salvando…" : "Salvar atividade"}
            </Button>
          </Stack>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
