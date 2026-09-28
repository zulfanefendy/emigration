"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function FormLogin() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identitas" className="text-sm font-medium text-zinc-700">
          Email atau NIP
        </label>
        <input
          id="identitas"
          name="identitas"
          autoComplete="username"
          defaultValue={state?.identitas}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
        />
        {state?.errors?.identitas && <p className="text-xs text-red-600">{state.errors.identitas[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
        />
        {state?.errors?.password && <p className="text-xs text-red-600">{state.errors.password[0]}</p>}
      </div>

      {state?.pesan && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
      >
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
