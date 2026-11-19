import type { Metadata } from "next";
import Link from "next/link";
import { configuracao } from "@/config/crm";
import { EtiquetaPrazo } from "@/componentes/Etiquetas";
import { modoDemo } from "@/lib/ambiente";
import { exigirSessao } from "@/lib/autenticacao";
import { dinheiro, hojeNoFuso, plural } from "@/lib/formato";
import { calcularIndicadores, DIAS_PARADO } from "@/lib/indicadores";
import { obterRepositorio } from "@/lib/repositorio";
import { recomecarDemonstracaoAcao } from "./acoes";

export const metadata: Metadata = { title: "Painel" };

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export default async function Painel() {
  await exigirSessao();
  const repo = await obterRepositorio();
  const [contatos, tarefas] = await Promise.all([repo.listarContatos(), repo.listarTarefas()]);
  const ind = calcularIndicadores(configuracao, contatos, tarefas);
  const hoje = hojeNoFuso(configuracao.negocio.fusoHorario);
  const nomes = new Map(contatos.map((c) => [c.id, c.nome]));
  const proximas = tarefas.filter((t) => t.venceEm <= hoje).slice(0, 6);
  const maiorEtapa = Math.max(1, ...ind.porEtapa.map((e) => e.quantidade));
  const { textos } = configuracao;

  const numeros = [
    { rotulo: "Em andamento", valor: String(ind.abertos), detalhe: textos.valor ? `${dinheiro(ind.valorEmAbertoCentavos, true)} em negociação` : undefined },
    {
      rotulo: "Conversão",
      valor: pct(ind.conversao),
      detalhe: `${plural(ind.ganhos, "fechado", "fechados")} de ${plural(ind.ganhos + ind.perdidos, "encerrado", "encerrados")}`,
    },
    { rotulo: "Fechados", valor: String(ind.ganhos), detalhe: textos.valor ? `${dinheiro(ind.valorGanhoCentavos, true)} fechados` : undefined },
    { rotulo: "Novos em 30 dias", valor: String(ind.novosUltimos30Dias), detalhe: `${plural(ind.total, "contato", "contatos")} no total` },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Painel</h1>
          <p className="text-sm text-stone-600">Como está o funil hoje.</p>
        </div>
        <Link href="/contatos/novo" className="botao">
          + Novo {textos.contato.toLowerCase()}
        </Link>
      </div>

      <section aria-label="Números principais" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.rotulo} className="cartao p-4">
            <p className="text-sm text-stone-600">{n.rotulo}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{n.valor}</p>
            {n.detalhe && <p className="mt-1 text-xs text-stone-500">{n.detalhe}</p>}
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="cartao p-5 lg:col-span-3" aria-labelledby="t-etapas">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="t-etapas" className="font-semibold">
              Quantos em cada etapa
            </h2>
            <Link href="/funil" className="link text-sm">
              Abrir o funil
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {ind.porEtapa.map(({ etapa, quantidade, valorCentavos }) => (
              <li key={etapa.id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-medium">{etapa.nome}</span>
                  <span className="text-stone-600">
                    <strong className="text-stone-900">{quantidade}</strong>
                    {textos.valor && valorCentavos > 0 && <span className="ml-2 text-xs">{dinheiro(valorCentavos, true)}</span>}
                  </span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(quantidade / maiorEtapa) * 100}%`, background: etapa.cor, minWidth: quantidade ? 8 : 0 }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {ind.parados > 0 && (
            <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {plural(ind.parados, "contato está parado", "contatos estão parados")} há mais de {DIAS_PARADO} dias na mesma etapa.
            </p>
          )}
        </section>

        <section className="cartao p-5 lg:col-span-2" aria-labelledby="t-tarefas">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="t-tarefas" className="font-semibold">
              Para fazer hoje
            </h2>
            <Link href="/tarefas" className="link text-sm">
              Todas as tarefas
            </Link>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            <span className={ind.tarefas.atrasadas ? "font-semibold text-red-700" : ""}>{plural(ind.tarefas.atrasadas, "atrasada", "atrasadas")}</span>
            {" · "}
            {ind.tarefas.hoje} para hoje · {ind.tarefas.proximos7Dias} nos próximos 7 dias
          </p>
          {proximas.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">Nada pendente para hoje. 🎉</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100">
              {proximas.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.titulo}</p>
                    <Link href={`/contatos/${t.contatoId}`} className="text-sm text-stone-600 hover:text-marca">
                      {nomes.get(t.contatoId) ?? "—"}
                    </Link>
                  </div>
                  <EtiquetaPrazo venceEm={t.venceEm} hoje={hoje} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="cartao mt-6 overflow-x-auto p-5" aria-labelledby="t-origens">
        <h2 id="t-origens" className="font-semibold">
          De onde vêm os contatos
        </h2>
        <table className="mt-3 w-full min-w-md text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              <th className="py-2 font-medium">Origem</th>
              <th className="py-2 text-right font-medium">Contatos</th>
              <th className="py-2 text-right font-medium">Fechados</th>
              <th className="py-2 text-right font-medium">Conversão</th>
            </tr>
          </thead>
          <tbody>
            {ind.porOrigem.map((o) => (
              <tr key={o.origem.valor} className="border-b border-stone-100 last:border-0">
                <td className="py-2">{o.origem.rotulo}</td>
                <td className="py-2 text-right">{o.total}</td>
                <td className="py-2 text-right">{o.ganhos}</td>
                <td className="py-2 text-right font-medium">{pct(o.conversao)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-stone-500">Conversão = fechados ÷ (fechados + não fecharam). Quem ainda está em andamento não entra na conta.</p>
      </section>

      {modoDemo && (
        <form action={recomecarDemonstracaoAcao} className="mt-8 flex flex-wrap items-center gap-3 text-sm text-stone-500">
          <span>Demonstração: alguém mexeu nos dados?</span>
          <button type="submit" className="botao-secundario px-3 py-1.5 text-sm">
            Recomeçar com os dados de exemplo
          </button>
        </form>
      )}
      <p className="mt-4 text-xs text-stone-500">Armazenamento: {repo.nome}.</p>
    </main>
  );
}
