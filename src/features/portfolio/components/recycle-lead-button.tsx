"use client";

import { useActionState } from "react";

import { Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import {
  recycleLeadAction,
  type PortfolioActionState,
} from "@/server/actions/portfolio";

const initial: PortfolioActionState = {};

export function RecycleLeadButton({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState(
    recycleLeadAction,
    initial,
  );

  return (
    <form action={formAction}>
      <Stack gap="1">
        <input type="hidden" name="leadId" value={leadId} />
        <Button
          type="submit"
          size="xs"
          variant="outline"
          loading={pending}
          disabled={pending}
        >
          Reciclar para o pool
        </Button>
        {state.error ? (
          <Text fontSize="xs" color="fg.error" role="alert">
            {state.error}
          </Text>
        ) : null}
      </Stack>
    </form>
  );
}
