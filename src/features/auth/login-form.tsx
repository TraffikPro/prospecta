"use client";

import { useActionState } from "react";
import {
  loginAction,
  type LoginState,
} from "@/server/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-800">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none ring-neutral-400 focus:ring-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-800">Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none ring-neutral-400 focus:ring-2"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
