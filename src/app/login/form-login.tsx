"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, idPesanField } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login } from "./actions";

export function FormLogin() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state?.pesan && <Alert jenis="gagal">{state.pesan}</Alert>}

      <Field htmlFor="identitas" label="Email atau NIP" error={state?.errors?.identitas}>
        <Input
          id="identitas"
          name="identitas"
          autoComplete="username"
          placeholder="nama@bp3mi.go.id"
          defaultValue={state?.identitas}
          aria-invalid={!!state?.errors?.identitas || undefined}
          aria-describedby={idPesanField("identitas")}
          className="h-11"
        />
      </Field>

      <Field htmlFor="password" label="Password" error={state?.errors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!state?.errors?.password || undefined}
          aria-describedby={idPesanField("password")}
          className="h-11"
        />
      </Field>

      <Button type="submit" ukuran="lg" memuat={pending} ikon={<LogIn />} className="mt-1 w-full">
        {pending ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
