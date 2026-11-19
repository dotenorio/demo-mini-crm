import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { configuracao } from "@/config/crm";
import { FormContato } from "@/componentes/FormContato";
import { exigirSessao } from "@/lib/autenticacao";
import { obterRepositorio } from "@/lib/repositorio";

export const metadata: Metadata = { title: "Editar cadastro" };

export default async function EditarContato({ params }: PageProps<"/contatos/[id]/editar">) {
  await exigirSessao();
  const { id } = await params;
  const contato = await (await obterRepositorio()).buscarContato(id);
  if (!contato) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <Link href={`/contatos/${contato.id}`} className="text-sm text-stone-600 hover:text-marca">
        ← {contato.nome}
      </Link>
      <h1 className="mt-2 mb-5 text-2xl font-bold">Editar cadastro</h1>
      <div className="cartao p-5">
        <FormContato config={configuracao} contato={contato} />
      </div>
    </main>
  );
}
