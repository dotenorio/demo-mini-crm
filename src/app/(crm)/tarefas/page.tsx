import type { Metadata } from "next";
import Link from "next/link";
import { configuracao } from "@/config/crm";
import { EtiquetaPrazo } from "@/componentes/Etiquetas";
import { exigirSessao } from "@/lib/autenticacao";
import { hojeNoFuso, telefoneFormatado } from "@/lib/formato";
import { obterRepositorio } from "@/lib/repositorio";
import type { Tarefa } from "@/lib/tipos";
import { CaixaTarefa } from "../contatos/[id]/Interativos";

export const metadata: Metadata = { title: "Tarefas" };

export default async function Tarefas() {
  await exigirSessao();
  const repo = await obterRepositorio();
  const [tarefas, contatos] = await Promise.all([repo.listarTarefas(), repo.listarContatos()]);
  const hoje = hojeNoFuso(configuracao.negocio.fusoHorario);
  const porId = new Map(contatos.map((c) => [c.id, c]));

  const grupos: { titulo: string; tarefas: Tarefa[]; destaque?: string }[] = [
    { titulo: "Atrasadas", tarefas: tarefas.filter((t) => t.venceEm < hoje), destaque: "text-red-700" },
    { titulo: "Hoje", tarefas: tarefas.filter((t) => t.venceEm === hoje), destaque: "text-amber-800" },
    { titulo: "Próximos dias", tarefas: tarefas.filter((t) => t.venceEm > hoje) },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold">Tarefas</h1>
      <p className="text-sm text-stone-600">Lembretes de retorno de todos os contatos. Marque quando concluir.</p>

      {tarefas.length === 0 && <p className="cartao mt-6 p-5 text-stone-600">Nenhuma tarefa pendente. 🎉</p>}

      {grupos
        .filter((g) => g.tarefas.length > 0)
        .map((g) => (
          <section key={g.titulo} className="mt-6" aria-labelledby={`g-${g.titulo}`}>
            <h2 id={`g-${g.titulo}`} className={`mb-2 text-sm font-semibold tracking-wide uppercase ${g.destaque ?? "text-stone-600"}`}>
              {g.titulo} ({g.tarefas.length})
            </h2>
            <ul className="cartao divide-y divide-stone-100">
              {g.tarefas.map((t) => {
                const c = porId.get(t.contatoId);
                return (
                  <li key={t.id} className="flex items-start gap-3 p-4">
                    <CaixaTarefa id={t.id} concluida={t.concluida} titulo={t.titulo} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t.titulo}</p>
                      {c && (
                        <p className="text-sm text-stone-600">
                          <Link href={`/contatos/${c.id}`} className="hover:text-marca">
                            {c.nome}
                          </Link>{" "}
                          · {telefoneFormatado(c.telefone)}
                        </p>
                      )}
                    </div>
                    <EtiquetaPrazo venceEm={t.venceEm} hoje={hoje} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </main>
  );
}
