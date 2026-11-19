import type { Metadata } from "next";
import Link from "next/link";
import { configuracao } from "@/config/crm";
import { exigirSessao } from "@/lib/autenticacao";
import { diasDesde, hojeNoFuso } from "@/lib/formato";
import { obterRepositorio } from "@/lib/repositorio";
import { rotuloExtra, rotuloOrigem } from "@/lib/rotulos";
import { Quadro, type CartaoFunil } from "./Quadro";

export const metadata: Metadata = { title: "Funil" };

export default async function Funil() {
  await exigirSessao();
  const repo = await obterRepositorio();
  const [contatos, tarefas] = await Promise.all([repo.listarContatos(), repo.listarTarefas()]);

  // Próxima tarefa de cada contato (a lista já vem ordenada pelo vencimento)
  const proxima = new Map<string, { titulo: string; venceEm: string }>();
  for (const t of tarefas) if (!proxima.has(t.contatoId)) proxima.set(t.contatoId, { titulo: t.titulo, venceEm: t.venceEm });

  // Só o que o cartão mostra vai para o navegador
  const primeiroExtra = configuracao.camposExtras[0]?.id;
  const cartoes: CartaoFunil[] = contatos.map((c) => ({
    id: c.id,
    nome: c.nome,
    etapaId: c.etapaId,
    origem: rotuloOrigem(configuracao, c.origem),
    detalhe: primeiroExtra ? rotuloExtra(configuracao, primeiroExtra, c.extras[primeiroExtra]) : undefined,
    valorCentavos: c.valorCentavos,
    diasNaEtapa: diasDesde(c.etapaDesde),
    proximaTarefa: proxima.get(c.id),
  }));

  return (
    <main className="flex w-full flex-1 flex-col py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-end justify-between gap-3 px-4">
        <div>
          <h1 className="text-2xl font-bold">Funil</h1>
          <p className="text-sm text-stone-600">
            Arraste os cartões entre as etapas. <span className="md:hidden">No celular, toque e segure o cartão para arrastar.</span>
          </p>
        </div>
        <Link href="/contatos/novo" className="botao">
          + Novo {configuracao.textos.contato.toLowerCase()}
        </Link>
      </div>
      <Quadro
        etapas={configuracao.etapas}
        cartoes={cartoes}
        hoje={hojeNoFuso(configuracao.negocio.fusoHorario)}
        mostrarValor={!!configuracao.textos.valor}
      />
    </main>
  );
}
