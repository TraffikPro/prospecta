"use client";

import { useActionState } from "react";

import { Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import {
  reassignLeadAction,
  type PortfolioActionState,
} from "@/server/actions/portfolio";

type OperatorOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type LeadReassignFormProps = {
  leadId: string;
  currentOwnerId: string;
  operators: OperatorOption[];
};

const initial: PortfolioActionState = {};

export function LeadReassignForm({
  leadId,
  currentOwnerId,
  operators,
}: LeadReassignFormProps) {
  const [state, formAction, pending] = useActionState(
    reassignLeadAction,
    initial,
  );

  return (
    <form action={formAction} data-testid="lead-reassign-form">
      <Stack
        gap="2"
        borderWidth="1px"
        borderColor="border"
        borderRadius="card"
        p="3"
      >
        <Text fontWeight="semibold" fontSize="sm">
          Reatribuir (carteira semanal)
        </Text>
        <Text fontSize="xs" color="fg.muted">
          Move o responsável e cria assignment HIGH na semana atual do
          destinatário.
        </Text>
        <input type="hidden" name="leadId" value={leadId} />
        <input
          type="hidden"
          name="expectedActiveAssigneeId"
          value={currentOwnerId}
        />
        <select
          name="assigneeId"
          defaultValue={currentOwnerId}
          disabled={pending}
          style={{ minHeight: 44, padding: "0.5rem" }}
        >
          {operators.map((op) => (
            <option key={op.id} value={op.id}>
              {op.name} ({op.role})
            </option>
          ))}
        </select>
        {state.error ? (
          <Text fontSize="xs" color="fg.error" role="alert">
            {state.error}
          </Text>
        ) : null}
        {state.ok ? (
          <Text fontSize="xs" color="fg.muted">
            Reatribuído.
          </Text>
        ) : null}
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          Reatribuir
        </Button>
      </Stack>
    </form>
  );
}
