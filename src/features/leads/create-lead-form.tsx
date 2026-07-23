"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createLeadAction,
  type CreateLeadState,
} from "@/server/actions/lead";

const initialState: CreateLeadState = {};

export function CreateLeadForm() {
  const [state, formAction, pending] = useActionState(
    createLeadAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Empresa</span>
        <input
          name="companyName"
          required
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Contato</span>
        <input
          name="contactName"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">E-mail</span>
        <input
          name="email"
          type="email"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Telefone</span>
        <input
          name="phone"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Website</span>
        <input
          name="website"
          type="url"
          placeholder="https://"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>

      {state.error ? (
        <div className="space-y-1 text-sm text-red-700" role="alert">
          <p>{state.error}</p>
          {state.code === "DUPLICATE_LEAD" && state.existingLeadId ? (
            <p>
              <Link
                href={`/app/leads/${state.existingLeadId}`}
                className="underline underline-offset-2"
              >
                Ver lead existente
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar lead"}
        </button>
        <Link
          href="/app/leads"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
