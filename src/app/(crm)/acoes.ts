"use server";
/**
 * Server Actions das telas. Toda ação confere o login antes de mexer em qualquer dado
 * (Server Actions podem ser chamadas por POST direto, não só pela tela).
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { configuracao } from "@/config/crm";
import { modoDemo } from "@/lib/ambiente";
import { exigirSessao } from "@/lib/autenticacao";
import { atualizarContato, criarContato, criarTarefa, excluirContato, marcarTarefa, moverEtapa, registrarInteracao } from "@/lib/crm";
import { obterRepositorio, recomecarDemonstracao } from "@/lib/repositorio";
import { contatoDoFormulario, type Erros } from "@/lib/validacao";

export interface EstadoFormulario {
  ok?: boolean;
  mensagem?: string;
  erros?: Erros;
  /** Muda a cada sucesso, para o formulário limpar os campos. */
  versao?: number;
  /** Quando o telefone já existe: link para o contato que já tem esse número. */
  existenteId?: string;
  /** O que foi digitado, para não perder em caso de erro. */
  valores?: Record<string, string>;
}

const texto = (form: FormData, k: string) => {
  const v = form.get(k);
  return typeof v === "string" ? v : "";
};

const valoresDigitados = (form: FormData) =>
  Object.fromEntries([...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")) as [string, string][]);

/** Cria (id = null) ou atualiza um contato. Em caso de sucesso, vai para a página dele. */
export async function salvarContatoAcao(id: string | null, _anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirSessao();
  const repo = await obterRepositorio();
  const entrada = contatoDoFormulario(form, configuracao);
  const r = id ? await atualizarContato(configuracao, repo, id, entrada) : await criarContato(configuracao, repo, entrada, { autor: "painel" });
  if (!r.ok) return { mensagem: r.mensagem, erros: r.erros, existenteId: r.existenteId, valores: valoresDigitados(form) };
  redirect(`/contatos/${r.contato.id}`);
}

export async function moverEtapaAcao(id: string, etapaId: string): Promise<{ ok: boolean; mensagem?: string }> {
  await exigirSessao();
  const r = await moverEtapa(configuracao, await obterRepositorio(), id, etapaId);
  refresh();
  return r.ok ? { ok: true } : { ok: false, mensagem: r.mensagem };
}

export async function registrarInteracaoAcao(contatoId: string, anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirSessao();
  const r = await registrarInteracao(
    configuracao,
    await obterRepositorio(),
    contatoId,
    { tipo: texto(form, "tipo"), texto: texto(form, "texto"), quando: texto(form, "quando") || undefined },
    { autor: "painel" },
  );
  if (!r.ok) return { mensagem: r.mensagem, erros: r.erros, valores: valoresDigitados(form) };
  refresh();
  return { ok: true, versao: (anterior.versao ?? 0) + 1 };
}

export async function criarTarefaAcao(contatoId: string, anterior: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await exigirSessao();
  const r = await criarTarefa(configuracao, await obterRepositorio(), contatoId, {
    titulo: texto(form, "titulo"),
    venceEm: texto(form, "venceEm"),
  });
  if (!r.ok) return { mensagem: r.mensagem, erros: r.erros, valores: valoresDigitados(form) };
  refresh();
  return { ok: true, versao: (anterior.versao ?? 0) + 1 };
}

export async function marcarTarefaAcao(id: string, concluida: boolean): Promise<void> {
  await exigirSessao();
  await marcarTarefa(await obterRepositorio(), id, concluida);
  refresh();
}

export async function excluirContatoAcao(id: string): Promise<void> {
  await exigirSessao();
  await excluirContato(configuracao, await obterRepositorio(), id);
  redirect("/contatos");
}

export async function recomecarDemonstracaoAcao(): Promise<void> {
  await exigirSessao();
  if (!modoDemo) throw new Error("Só disponível no modo demonstração.");
  await recomecarDemonstracao();
  redirect("/");
}
