"use client";

import { useActionState } from "react";

import { Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import {
  fillWalletAction,
  type PortfolioActionState,
} from "@/server/actions/portfolio";

const initial: PortfolioActionState = {};

type FillWalletButtonProps = {
  disabled?: boolean;
  running?: boolean;
};

export function FillWalletButton({
  disabled = false,
  running = false,
}: FillWalletButtonProps) {
  const [state, formAction, pending] = useActionState(
    fillWalletAction,
    initial,
  );
  const busy = pending || running || state.code === "RUNNING";

  return (
    <form action={formAction}>
      <Button
        type="submit"
        size="sm"
        loading={busy}
        disabled={disabled || busy}
        data-testid="fill-wallet-button"
      >
        {busy ? "Completando carteira..." : "Completar minha carteira"}
      </Button>
      {state.error ? (
        <Text fontSize="sm" color="fg.error" role="alert" mt="2">
          {state.error}
        </Text>
      ) : null}
      {state.message && !state.error ? (
        <Text fontSize="sm" color="fg.muted" role="status" mt="2">
          {state.message}
        </Text>
      ) : null}
    </form>
  );
}
