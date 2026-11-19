"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "../acoes-sessao";

export function FormLogin({ emailInicial }: { emailInicial?: string }) {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, { email: emailInicial });
  return (
    <form action={acao} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block font-medium">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={estado.email} className="campo-entrada" />
      </div>
      <div>
        <label htmlFor="senha" className="mb-1 block font-medium">
          Senha
        </label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required className="campo-entrada" />
      </div>
      {estado.erro && (
        <p className="text-sm font-medium text-red-700" role="alert">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao w-full" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
