import type { Metadata } from "next";
import Link from "next/link";
import { configuracao } from "@/config/crm";
import { EtiquetaEtapa, EtiquetaExemplo } from "@/componentes/Etiquetas";
import { exigirSessao } from "@/lib/autenticacao";
import { dataHoraBr, plural, telefoneFormatado } from "@/lib/formato";
import { obterRepositorio } from "@/lib/repositorio";
import { corEtapa, nomeEtapa, rotuloExtra, rotuloOrigem } from "@/lib/rotulos";

export const metadata: Metadata = { title: configuracao.textos.contatos };

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 100) : "");

export default async function Contatos({ searchParams }: PageProps<"/contatos">) {
  await exigirSessao();
  const params = await searchParams;
  const busca = texto(params.q).trim();
  const origem = configuracao.origens.some((o) => o.valor === params.origem) ? texto(params.origem) : "";
  const etapaId = configuracao.etapas.some((e) => e.id === params.etapa) ? texto(params.etapa) : "";

  const repo = await obterRepositorio();
  const contatos = await repo.listarContatos({ busca, origem: origem || undefined, etapaId: etapaId || undefined });
  const { textos } = configuracao;
  const extra = configuracao.camposExtras[0];
  const filtrando = !!(busca || origem || etapaId);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{textos.contatos}</h1>
        <Link href="/contatos/novo" className="botao">
          + Novo {textos.contato.toLowerCase()}
        </Link>
      </div>

      <form role="search" className="cartao mt-5 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <label htmlFor="q" className="sr-only">
          Buscar por nome, telefone ou e-mail
        </label>
        <input id="q" name="q" type="search" defaultValue={busca} placeholder="Nome, telefone ou e-mail" className="campo-entrada" />
        <label htmlFor="origem" className="sr-only">
          Origem
        </label>
        <select id="origem" name="origem" defaultValue={origem} className="campo-entrada sm:w-44">
          <option value="">Todas as origens</option>
          {configuracao.origens.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <label htmlFor="etapa" className="sr-only">
          Etapa
        </label>
        <select id="etapa" name="etapa" defaultValue={etapaId} className="campo-entrada sm:w-48">
          <option value="">Todas as etapas</option>
          {configuracao.etapas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
        <button type="submit" className="botao">
          Buscar
        </button>
      </form>

      <p className="mt-5 mb-3 text-sm text-stone-600" aria-live="polite">
        {contatos.length === 0 ? "Nenhum contato encontrado." : plural(contatos.length, textos.contato.toLowerCase(), textos.contatos.toLowerCase())}
        {busca && ` para “${busca}”`}
        {filtrando && (
          <>
            {" · "}
            <Link href="/contatos" className="link">
              limpar filtros
            </Link>
          </>
        )}
      </p>

      {contatos.length > 0 && (
        <div className="cartao overflow-hidden">
          {/* Computador: tabela */}
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-4 py-2.5 font-medium">Telefone</th>
                {extra && <th className="px-4 py-2.5 font-medium">{extra.rotulo}</th>}
                <th className="px-4 py-2.5 font-medium">Origem</th>
                <th className="px-4 py-2.5 font-medium">Etapa</th>
                <th className="px-4 py-2.5 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {contatos.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/contatos/${c.id}`} className="font-semibold hover:text-marca">
                      {c.nome}
                    </Link>{" "}
                    {c.exemplo && <EtiquetaExemplo />}
                    {c.email && <span className="block text-xs text-stone-500">{c.email}</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{telefoneFormatado(c.telefone)}</td>
                  {extra && <td className="px-4 py-3">{rotuloExtra(configuracao, extra.id, c.extras[extra.id]) ?? "—"}</td>}
                  <td className="px-4 py-3">{rotuloOrigem(configuracao, c.origem)}</td>
                  <td className="px-4 py-3">
                    <EtiquetaEtapa nome={nomeEtapa(configuracao, c.etapaId)} cor={corEtapa(configuracao, c.etapaId)} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600">{dataHoraBr(c.atualizadoEm, configuracao.negocio.fusoHorario).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Celular: lista */}
          <ul className="divide-y divide-stone-100 md:hidden">
            {contatos.map((c) => (
              <li key={c.id}>
                <Link href={`/contatos/${c.id}`} className="block p-4 active:bg-stone-50">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{c.nome}</p>
                    <EtiquetaEtapa nome={nomeEtapa(configuracao, c.etapaId)} cor={corEtapa(configuracao, c.etapaId)} />
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {telefoneFormatado(c.telefone)} · {rotuloOrigem(configuracao, c.origem)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
