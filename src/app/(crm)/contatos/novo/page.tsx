import type { Metadata } from "next";
import Link from "next/link";
import { configuracao } from "@/config/crm";
import { FormContato } from "@/componentes/FormContato";
import { exigirSessao } from "@/lib/autenticacao";

export const metadata: Metadata = { title: `Novo ${configuracao.textos.contato.toLowerCase()}` };

export default async function NovoContato() {
  await exigirSessao();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <Link href="/contatos" className="text-sm text-stone-600 hover:text-marca">
        ← {configuracao.textos.contatos}
      </Link>
      <h1 className="mt-2 mb-5 text-2xl font-bold">Novo {configuracao.textos.contato.toLowerCase()}</h1>
      <div className="cartao p-5">
        <FormContato config={configuracao} />
      </div>
    </main>
  );
}
