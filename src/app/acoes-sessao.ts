"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { credenciaisPainel, segredoSessao } from "@/lib/ambiente";
import { COOKIE_SESSAO, DURACAO_SESSAO_S, criarToken, iguaisSeguro } from "@/lib/sessao";

export interface EstadoLogin {
  erro?: string;
  email?: string;
}

export async function entrar(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  const certo = credenciaisPainel();

  // Avalia os dois sempre (sem atalho), para não revelar qual deles errou pelo tempo de resposta
  const emailOk = iguaisSeguro(email, certo.email.toLowerCase());
  const senhaOk = iguaisSeguro(senha, certo.senha);
  if (!emailOk || !senhaOk) {
    await new Promise((r) => setTimeout(r, 600)); // freia tentativas em sequência
    return { erro: "E-mail ou senha incorretos.", email };
  }

  (await cookies()).set(COOKIE_SESSAO, criarToken(certo.email, segredoSessao()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
  redirect("/");
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect("/entrar");
}
