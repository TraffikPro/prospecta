"use client";

import type { LeadStage } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  Alert,
  Card,
  Field,
  Heading,
  NativeSelect,
  Stack,
  Textarea,
  VisuallyHidden,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { notifySuccess } from "@/components/ui/toaster";
import { LEAD_STAGE_ORDER, leadStageLabels } from "@/features/leads/lead.labels";
import {
  moveLeadStageAction,
  type MoveLeadStageState,
} from "@/server/actions/lead";

const initialState: MoveLeadStageState = {};

type Props = {
  leadId: string;
  currentStage: LeadStage;
};

export function MoveStageForm({ leadId, currentStage }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: MoveLeadStageState, formData: FormData) => {
      const next = await moveLeadStageAction(prev, formData);
      if (next.ok) {
        notifySuccess("Etapa atualizada");
      }
      return next;
    },
    initialState,
  );
  const [selectedStage, setSelectedStage] = useState<LeadStage>(currentStage);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <Card.Root variant="outline" borderRadius="card">
      <Card.Body py="1.5" px="3">
        <form action={formAction}>
          <Stack gap="1" w="full">
            <input type="hidden" name="leadId" value={leadId} />
            <Heading as="h2" id="move-stage-heading" size="sm" lineHeight="1.2">
              Alterar etapa
            </Heading>

            <Field.Root gap="1">
              <VisuallyHidden>
                <Field.Label>Nova etapa</Field.Label>
              </VisuallyHidden>
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="stage"
                  aria-labelledby="move-stage-heading"
                  value={selectedStage}
                  onChange={(event) =>
                    setSelectedStage(event.target.value as LeadStage)
                  }
                  data-testid="move-stage-select"
                  style={{ minHeight: "44px" }}
                >
                  {LEAD_STAGE_ORDER.map((value) => (
                    <option key={value} value={value}>
                      {leadStageLabels[value]}
                      {value === currentStage ? " (atual)" : ""}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            {selectedStage === "LOST" ? (
              <Field.Root gap="1">
                <Field.Label fontSize="xs" mb="0">
                  Motivo da perda *
                </Field.Label>
                <Textarea
                  name="lostReason"
                  rows={2}
                  placeholder="Ex.: sem orçamento, perdeu para concorrente..."
                  data-testid="lost-reason"
                />
              </Field.Root>
            ) : null}

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
              data-testid="move-stage-submit"
            >
              {pending ? "Salvando…" : "Salvar etapa"}
            </Button>
          </Stack>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
