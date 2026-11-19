import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { configuracao } from "@/config/crm";
import { LOGIN_DEMO, loginDemoAtivo } from "@/lib/ambiente";
import { sessaoAtual } from "@/lib/autenticacao";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar() {
  if (await sessaoAtual()) redirect("/");
  const demo = loginDemoAtivo();

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wider text-marca">{configuracao.negocio.nome}</p>
      <h1 className="mt-2 text-2xl font-bold">CRM da clínica</h1>
      <p className="mt-2 mb-6 text-stone-600">Contatos, funil, histórico de conversas e tarefas do dia num só lugar.</p>

      {demo && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Login de demonstração</p>
          <p className="mt-1">
            E-mail: <code className="font-mono">{LOGIN_DEMO.email}</code>
            <br />
            Senha: <code className="font-mono">{LOGIN_DEMO.senha}</code>
          </p>
        </div>
      )}

      <div className="cartao p-5">
        <FormLogin emailInicial={demo ? LOGIN_DEMO.email : undefined} />
      </div>
      <p className="mt-6 text-sm text-stone-500">O CRM guarda dados pessoais dos contatos. Por isso só é acessado com login.</p>
    </main>
  );
}
