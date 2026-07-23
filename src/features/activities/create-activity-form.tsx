"use client";

import type { ActivityOutcome } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
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
    <form action={formAction} className="flex max-w-lg flex-col gap-3">
      <input type="hidden" name="leadId" value={leadId} />

      <h2 className="text-base font-semibold">Registrar atividade</h2>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Tipo</span>
        <select
          name="type"
          value={type}
          onChange={(event) =>
            setType(event.target.value as "WHATSAPP" | "EMAIL" | "NOTE")
          }
          className="rounded-md border border-neutral-300 px-3 py-2"
        >
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">E-mail</option>
          <option value="NOTE">Nota</option>
        </select>
      </label>

      {type !== "NOTE" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Resultado</span>
          <select
            name="outcome"
            value={outcome}
            onChange={(event) =>
              setOutcome(event.target.value as ActivityOutcome)
            }
            className="rounded-md border border-neutral-300 px-3 py-2"
          >
            {outcomes.map((value) => (
              <option key={value} value={value}>
                {activityOutcomeLabels[value]}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Descrição</span>
        <textarea
          name="body"
          required
          rows={3}
          className="rounded-md border border-neutral-300 px-3 py-2"
          placeholder="O que aconteceu no contato?"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">
          Próximo passo (data)
          {requiresFollowUp ? " *" : " (opcional)"}
        </span>
        <input
          name="nextFollowUpAt"
          type="datetime-local"
          required={requiresFollowUp}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-green-700" role="status">
          Atividade registrada.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar atividade"}
      </button>
    </form>
  );
}
