/**
 * Regras do CRM, usadas tanto pelas telas (Server Actions) quanto pela API.
 * Não sabe nada de HTTP nem de cookies: recebe a configuração, o repositório e os dados.
 */
import { randomUUID } from "node:crypto";
import type { Repositorio } from "./armazenamento/tipos";
import type { ConfiguracaoCrm, Contato, Interacao, Tarefa } from "./tipos";
import { esquemaContato, esquemaInteracao, esquemaTarefa, validar, type Erros } from "./validacao";
import { ID_VALIDO } from "./armazenamento/comum";
import { nomeEtapa, rotuloOrigem } from "./rotulos";

export type Falha = { ok: false; status: 400 | 404 | 409; mensagem: string; erros?: Erros; existenteId?: string };
export type Sucesso<T> = { ok: true } & T;

interface Opcoes {
  autor: Interacao["autor"];
  agora?: Date;
  exemplo?: boolean;
}

const naoEncontrado = (config: ConfiguracaoCrm): Falha => ({
  ok: false,
  status: 404,
  mensagem: `${config.textos.contato} não encontrado.`,
});

function registroDoSistema(contatoId: string, texto: string, quando: string): Interacao {
  return { id: randomUUID(), contatoId, tipo: "sistema", texto, quando, autor: "sistema", criadoEm: quando };
}

export async function criarContato(
  config: ConfiguracaoCrm,
  repo: Repositorio,
  entrada: unknown,
  { autor, agora = new Date(), exemplo }: Opcoes,
): Promise<Sucesso<{ contato: Contato }> | Falha> {
  const v = validar(esquemaContato(config), entrada);
  if (!v.ok) return { ok: false, status: 400, mensagem: "Confira os campos destacados.", erros: v.erros };

  const existente = await repo.buscarContatoPorTelefone(v.dados.telefone);
  if (existente) {
    return {
      ok: false,
      status: 409,
      mensagem: `Já existe um ${config.textos.contato.toLowerCase()} com este telefone: ${existente.nome}.`,
      erros: { telefone: "Telefone já cadastrado." },
      existenteId: existente.id,
    };
  }

  const quando = agora.toISOString();
  const etapaId = v.dados.etapaId ?? config.etapas[0].id;
  const contato: Contato = {
    id: randomUUID(),
    nome: v.dados.nome,
    telefone: v.dados.telefone,
    email: v.dados.email,
    origem: v.dados.origem,
    etapaId,
    observacoes: v.dados.observacoes,
    valorCentavos: v.dados.valor,
    extras: v.dados.extras,
    criadoEm: quando,
    atualizadoEm: quando,
    etapaDesde: quando,
    ...(exemplo ? { exemplo } : {}),
  };
  await repo.salvarContato(contato);
  const via = autor === "api" ? " pela API" : "";
  await repo.salvarInteracao(
    registroDoSistema(contato.id, `${config.textos.contato} criado${via} (origem: ${rotuloOrigem(config, contato.origem)}, etapa: ${nomeEtapa(config, etapaId)}).`, quando),
  );
  return { ok: true, contato };
}

/** Atualiza os dados cadastrais. Se a etapa mudar, registra no histórico como em `moverEtapa`. */
export async function atualizarContato(
  config: ConfiguracaoCrm,
  repo: Repositorio,
  id: string,
  entrada: unknown,
  { agora = new Date() }: Partial<Opcoes> = {},
): Promise<Sucesso<{ contato: Contato }> | Falha> {
  const atual = await repo.buscarContato(id);
  if (!atual) return naoEncontrado(config);
  const v = validar(esquemaContato(config), entrada);
  if (!v.ok) return { ok: false, status: 400, mensagem: "Confira os campos destacados.", erros: v.erros };

  if (v.dados.telefone !== atual.telefone) {
    const outro = await repo.buscarContatoPorTelefone(v.dados.telefone);
    if (outro && outro.id !== id) {
      return { ok: false, status: 409, mensagem: `Este telefone já é de ${outro.nome}.`, erros: { telefone: "Telefone já cadastrado." }, existenteId: outro.id };
    }
  }

  const quando = agora.toISOString();
  const novaEtapa = v.dados.etapaId ?? atual.etapaId;
  const contato: Contato = {
    ...atual,
    nome: v.dados.nome,
    telefone: v.dados.telefone,
    email: v.dados.email,
    origem: v.dados.origem,
    etapaId: novaEtapa,
    observacoes: v.dados.observacoes,
    valorCentavos: v.dados.valor,
    extras: v.dados.extras,
    atualizadoEm: quando,
    etapaDesde: novaEtapa !== atual.etapaId ? quando : atual.etapaDesde,
  };
  await repo.salvarContato(contato);
  if (novaEtapa !== atual.etapaId) {
    await repo.salvarInteracao(registroDoSistema(id, `Etapa: ${nomeEtapa(config, atual.etapaId)} → ${nomeEtapa(config, novaEtapa)}.`, quando));
  }
  return { ok: true, contato };
}

export async function moverEtapa(
  config: ConfiguracaoCrm,
  repo: Repositorio,
  id: string,
  etapaId: string,
  { agora = new Date() }: Partial<Opcoes> = {},
): Promise<Sucesso<{ contato: Contato }> | Falha> {
  if (!config.etapas.some((e) => e.id === etapaId)) return { ok: false, status: 400, mensagem: "Etapa desconhecida." };
  const atual = await repo.buscarContato(id);
  if (!atual) return naoEncontrado(config);
  if (atual.etapaId === etapaId) return { ok: true, contato: atual };

  const quando = agora.toISOString();
  const contato: Contato = { ...atual, etapaId, etapaDesde: quando, atualizadoEm: quando };
  await repo.salvarContato(contato);
  await repo.salvarInteracao(registroDoSistema(id, `Etapa: ${nomeEtapa(config, atual.etapaId)} → ${nomeEtapa(config, etapaId)}.`, quando));
  return { ok: true, contato };
}

export async function registrarInteracao(
  config: ConfiguracaoCrm,
  repo: Repositorio,
  contatoId: string,
  entrada: unknown,
  { autor, agora = new Date() }: Opcoes,
): Promise<Sucesso<{ interacao: Interacao }> | Falha> {
  const contato = await repo.buscarContato(contatoId);
  if (!contato) return naoEncontrado(config);
  const v = validar(esquemaInteracao(config), entrada);
  if (!v.ok) return { ok: false, status: 400, mensagem: "Confira os campos destacados.", erros: v.erros };

  const criadoEm = agora.toISOString();
  const interacao: Interacao = {
    id: randomUUID(),
    contatoId,
    tipo: v.dados.tipo,
    texto: v.dados.texto,
    quando: v.dados.quando ?? criadoEm,
    autor,
    criadoEm,
  };
  await repo.salvarInteracao(interacao);
  await repo.salvarContato({ ...contato, atualizadoEm: criadoEm });
  return { ok: true, interacao };
}

export async function criarTarefa(
  config: ConfiguracaoCrm,
  repo: Repositorio,
  contatoId: string,
  entrada: unknown,
  { agora = new Date() }: Partial<Opcoes> = {},
): Promise<Sucesso<{ tarefa: Tarefa }> | Falha> {
  if (!(await repo.buscarContato(contatoId))) return naoEncontrado(config);
  const v = validar(esquemaTarefa, entrada);
  if (!v.ok) return { ok: false, status: 400, mensagem: "Confira os campos destacados.", erros: v.erros };
  const tarefa: Tarefa = {
    id: randomUUID(),
    contatoId,
    titulo: v.dados.titulo,
    venceEm: v.dados.venceEm,
    concluida: false,
    criadoEm: agora.toISOString(),
  };
  await repo.salvarTarefa(tarefa);
  return { ok: true, tarefa };
}

export async function marcarTarefa(
  repo: Repositorio,
  id: string,
  concluida: boolean,
  agora = new Date(),
): Promise<Sucesso<{ tarefa: Tarefa }> | Falha> {
  const atual = await repo.buscarTarefa(id);
  if (!atual) return { ok: false, status: 404, mensagem: "Tarefa não encontrada." };
  const tarefa: Tarefa = { ...atual, concluida, concluidaEm: concluida ? agora.toISOString() : undefined };
  await repo.salvarTarefa(tarefa);
  return { ok: true, tarefa };
}

export async function excluirContato(config: ConfiguracaoCrm, repo: Repositorio, id: string): Promise<Sucesso<object> | Falha> {
  if (!ID_VALIDO.test(id) || !(await repo.buscarContato(id))) return naoEncontrado(config);
  await repo.excluirContato(id);
  return { ok: true };
}
