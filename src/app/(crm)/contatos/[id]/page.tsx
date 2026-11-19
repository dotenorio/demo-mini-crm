import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { configuracao } from "@/config/crm";
import { EtiquetaEtapa, EtiquetaExemplo, EtiquetaPrazo } from "@/componentes/Etiquetas";
import { IconeWhatsapp } from "@/componentes/Icones";
import { exigirSessao } from "@/lib/autenticacao";
import { dataHoraBr, dinheiro, diasDesde, hojeNoFuso, linkWhatsapp, somarDias, telefoneFormatado } from "@/lib/formato";
import { obterRepositorio } from "@/lib/repositorio";
import { corEtapa, nomeEtapa, rotuloExtra, rotuloInteracao, rotuloOrigem } from "@/lib/rotulos";
import { BotaoExcluir, CaixaTarefa, FormInteracao, FormTarefa, SeletorEtapa } from "./Interativos";

export async function generateMetadata({ params }: PageProps<"/contatos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const contato = await (await obterRepositorio()).buscarContato(id);
  return { title: contato?.nome ?? configuracao.textos.contato };
}

const tempoNaEtapa = (dias: number) => (dias === 0 ? "entrou nesta etapa hoje" : dias === 1 ? "há 1 dia nesta etapa" : `há ${dias} dias nesta etapa`);

const AUTOR: Record<string, string> = { api: "via API", painel: "", sistema: "" };

export default async function PaginaContato({ params }: PageProps<"/contatos/[id]">) {
  await exigirSessao();
  const { id } = await params;
  const repo = await obterRepositorio();
  const contato = await repo.buscarContato(id);
  if (!contato) notFound();
  const [interacoes, tarefas] = await Promise.all([repo.listarInteracoes(id), repo.listarTarefas({ contatoId: id, situacao: "todas" })]);

  const fuso = configuracao.negocio.fusoHorario;
  const hoje = hojeNoFuso(fuso);
  const { textos } = configuracao;
  const pendentes = tarefas.filter((t) => !t.concluida);
  const concluidas = tarefas.filter((t) => t.concluida).slice(0, 5);

  const dados: [string, React.ReactNode][] = [
    ["Telefone", <span key="telefone" className="whitespace-nowrap">{telefoneFormatado(contato.telefone)}</span>],
    ["E-mail", contato.email ? <a key="email" href={`mailto:${contato.email}`} className="link break-all">{contato.email}</a> : "—"],
    ["Origem", rotuloOrigem(configuracao, contato.origem)],
    ...configuracao.camposExtras.map((c): [string, React.ReactNode] => [c.rotulo, rotuloExtra(configuracao, c.id, contato.extras[c.id]) ?? "—"]),
    ...(textos.valor ? [[textos.valor, contato.valorCentavos !== undefined ? dinheiro(contato.valorCentavos) : "—"] as [string, React.ReactNode]] : []),
    ["Cadastrado em", dataHoraBr(contato.criadoEm, fuso)],
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Link href="/contatos" className="text-sm text-stone-600 hover:text-marca">
        ← {textos.contatos}
      </Link>

      <header className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {contato.nome} {contato.exemplo && <EtiquetaExemplo />}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <EtiquetaEtapa nome={nomeEtapa(configuracao, contato.etapaId)} cor={corEtapa(configuracao, contato.etapaId)} />
            <span>{tempoNaEtapa(diasDesde(contato.etapaDesde))}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <a href={linkWhatsapp(contato.telefone)} target="_blank" rel="noopener noreferrer" className="botao-secundario">
            <IconeWhatsapp className="size-5 text-green-600" /> WhatsApp
          </a>
          <Link href={`/contatos/${contato.id}/editar`} className="botao-secundario">
            Editar
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="space-y-6">
          <section className="cartao space-y-4 p-5" aria-label="Dados do cadastro">
            <SeletorEtapa contatoId={contato.id} etapaId={contato.etapaId} etapas={configuracao.etapas} />
            <dl className="divide-y divide-stone-100 text-sm">
              {dados.map(([rotulo, valor]) => (
                <div key={rotulo} className="flex justify-between gap-4 py-1.5">
                  <dt className="text-stone-500">{rotulo}</dt>
                  <dd className="min-w-0 text-right text-stone-900">{valor}</dd>
                </div>
              ))}
            </dl>
            {contato.observacoes && (
              <div className="rounded-lg bg-stone-50 p-3 text-sm whitespace-pre-line text-stone-700">{contato.observacoes}</div>
            )}
          </section>

          <section className="cartao p-5" aria-labelledby="t-tarefas">
            <h2 id="t-tarefas" className="mb-3 font-semibold">
              Próximas tarefas
            </h2>
            {pendentes.length === 0 && <p className="mb-3 text-sm text-stone-500">Nenhuma tarefa pendente.</p>}
            <ul className="mb-4 space-y-2">
              {[...pendentes, ...concluidas].map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <CaixaTarefa id={t.id} concluida={t.concluida} titulo={t.titulo} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${t.concluida ? "text-stone-400 line-through" : ""}`}>{t.titulo}</p>
                  </div>
                  <EtiquetaPrazo venceEm={t.venceEm} hoje={hoje} concluida={t.concluida} />
                </li>
              ))}
            </ul>
            <FormTarefa contatoId={contato.id} sugestaoData={somarDias(hoje, 1)} />
          </section>
        </aside>

        <section className="cartao p-5" aria-labelledby="t-historico">
          <h2 id="t-historico" className="mb-3 font-semibold">
            Histórico
          </h2>
          <FormInteracao contatoId={contato.id} tipos={configuracao.tiposInteracao} />

          <ol className="mt-6 space-y-0">
            {interacoes.map((i) => (
              <li key={i.id} className="relative border-l-2 border-stone-200 pb-5 pl-5 last:pb-0">
                <span
                  className={`absolute top-1 -left-[7px] size-3 rounded-full border-2 border-white ${i.tipo === "sistema" ? "bg-stone-300" : "bg-marca"}`}
                  aria-hidden
                />
                <p className="text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">{rotuloInteracao(configuracao, i.tipo)}</span> · {dataHoraBr(i.quando, fuso)}
                  {AUTOR[i.autor] && <span className="ml-1 rounded bg-sky-50 px-1 text-sky-800">{AUTOR[i.autor]}</span>}
                </p>
                <p className={`mt-0.5 text-sm whitespace-pre-line ${i.tipo === "sistema" ? "text-stone-500" : "text-stone-900"}`}>{i.texto}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-8">
        <BotaoExcluir contatoId={contato.id} nome={contato.nome} />
      </div>
    </main>
  );
}
