"use client";

import type { LeadStage } from "@prisma/client";
import { useActionState, useState } from "react";
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
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <h2 className="text-base font-semibold">Alterar stage</h2>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Novo stage</span>
        <select
          name="stage"
          value={selectedStage}
          onChange={(event) =>
            setSelectedStage(event.target.value as LeadStage)
          }
          className="rounded-md border border-neutral-300 px-3 py-2"
          data-testid="move-stage-select"
        >
          {LEAD_STAGE_ORDER.map((value) => (
            <option key={value} value={value}>
              {leadStageLabels[value]}
              {value === currentStage ? " (atual)" : ""}
            </option>
          ))}
        </select>
      </label>

      {selectedStage === "LOST" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Motivo da perda *</span>
          <textarea
            name="lostReason"
            rows={2}
            className="rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Ex.: sem orçamento, perdeu para concorrente..."
            data-testid="lost-reason"
          />
        </label>
      ) : null}

      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        data-testid="move-stage-submit"
      >
        {pending ? "Salvando…" : "Salvar stage"}
      </button>
    </form>
  );
}
