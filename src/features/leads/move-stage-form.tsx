"use client";

import type { LeadStage } from "@prisma/client";
import { useActionState, useState } from "react";

import {
  Alert,
  Card,
  Field,
  Heading,
  NativeSelect,
  Stack,
  Textarea,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
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
  const [state, formAction, pending] = useActionState(
    moveLeadStageAction,
    initialState,
  );
  const [selectedStage, setSelectedStage] = useState<LeadStage>(currentStage);

  return (
    <Card.Root variant="outline" borderRadius="card">
      <Card.Body>
        <form action={formAction}>
          <Stack gap="4" maxW="md">
            <input type="hidden" name="leadId" value={leadId} />
            <Heading as="h2" size="md" id="move-stage-heading">
              Alterar stage
            </Heading>

            <Field.Root>
              <Field.Label>Novo stage</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="stage"
                  value={selectedStage}
                  onChange={(event) =>
                    setSelectedStage(event.target.value as LeadStage)
                  }
                  data-testid="move-stage-select"
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
              <Field.Root>
                <Field.Label>Motivo da perda *</Field.Label>
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
              width="fit-content"
              loading={pending}
              disabled={pending}
              data-testid="move-stage-submit"
            >
              {pending ? "Salvando…" : "Salvar stage"}
            </Button>
          </Stack>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
