import { normalizarBusca, telefoneSoDigitos } from "../formato";
import type { Contato, Interacao, Tarefa } from "../tipos";
import type { FiltroContatos } from "./tipos";

export const ID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Texto em que a busca procura: nome, e-mail e telefone, sem acento. */
export function textoBusca(c: Pick<Contato, "nome" | "telefone" | "email">): string {
  return normalizarBusca(`${c.nome} ${c.email ?? ""} ${c.telefone}`);
}

export function filtrarContatos(contatos: Contato[], { busca, origem, etapaId, limite = 500 }: FiltroContatos = {}): Contato[] {
  const termo = normalizarBusca(busca ?? "");
  const digitos = telefoneSoDigitos(termo);
  return contatos
    .filter((c) => !origem || c.origem === origem)
    .filter((c) => !etapaId || c.etapaId === etapaId)
    .filter((c) => !termo || textoBusca(c).includes(termo) || (digitos.length >= 3 && c.telefone.includes(digitos)))
    .sort(porMaisRecente)
    .slice(0, limite);
}

export const porMaisRecente = (a: Contato, b: Contato) => b.atualizadoEm.localeCompare(a.atualizadoEm);
export const porQuandoDesc = (a: Interacao, b: Interacao) => b.quando.localeCompare(a.quando) || b.criadoEm.localeCompare(a.criadoEm);
export const porVencimento = (a: Tarefa, b: Tarefa) =>
  Number(a.concluida) - Number(b.concluida) || a.venceEm.localeCompare(b.venceEm) || a.criadoEm.localeCompare(b.criadoEm);
