import { describe, expect, it } from "vitest";
import { configuracao } from "@/config/crm";
import { esquemaContato, esquemaInteracao, esquemaTarefa, validar } from "@/lib/validacao";

const contatoOk = { nome: "  Maria Exemplo ", telefone: "+55 (11) 98765-4321", origem: "instagram" };

describe("validação do contato", () => {
  it("normaliza os dados válidos", () => {
    const r = validar(esquemaContato(configuracao), { ...contatoOk, email: "MARIA@Exemplo.com", valor: "3.500,00" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dados).toMatchObject({ nome: "Maria Exemplo", telefone: "11987654321", email: "maria@exemplo.com", valor: 350000 });
  });

  it("usa a primeira origem quando não vem nenhuma (API)", () => {
    const r = validar(esquemaContato(configuracao), { nome: "Maria", telefone: "11987654321" });
    expect(r.ok && r.dados.origem).toBe(configuracao.origens[0].valor);
  });

  it("aponta o erro de cada campo", () => {
    const r = validar(esquemaContato(configuracao), { nome: "M", telefone: "123", email: "x@", origem: "tv", valor: "muito" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.erros).sort()).toEqual(["email", "nome", "origem", "telefone", "valor"]);
  });

  it("descarta campos extras que não existem e recusa opção inválida", () => {
    const ok = validar(esquemaContato(configuracao), { ...contatoOk, extras: { tratamento: "implante", inventado: "x" } });
    expect(ok.ok && ok.dados.extras).toEqual({ tratamento: "implante" });
    const ruim = validar(esquemaContato(configuracao), { ...contatoOk, extras: { tratamento: "botox" } });
    expect(!ruim.ok && ruim.erros.tratamento).toMatch(/Opção inválida/);
  });
});

describe("validação de interação e tarefa", () => {
  it("aceita data do formulário (fuso do negócio) ou ISO com fuso", () => {
    const e = esquemaInteracao(configuracao);
    const doForm = validar(e, { tipo: "ligacao", texto: "Liguei", quando: "2026-11-19T09:00" });
    expect(doForm.ok && doForm.dados.quando).toBe("2026-11-19T12:00:00.000Z");
    const iso = validar(e, { texto: "Oi", quando: "2026-11-19T09:00:00-03:00" });
    expect(iso.ok && iso.dados).toMatchObject({ tipo: "anotacao", quando: "2026-11-19T12:00:00.000Z" });
    expect(validar(e, { texto: "Oi", quando: "19/11/2026" }).ok).toBe(false);
    expect(validar(e, { texto: "   " }).ok).toBe(false);
  });

  it("confere a data da tarefa", () => {
    expect(validar(esquemaTarefa, { titulo: "Ligar", venceEm: "2026-11-20" }).ok).toBe(true);
    expect(validar(esquemaTarefa, { titulo: "Ligar", venceEm: "2026-02-30" }).ok).toBe(false);
    expect(validar(esquemaTarefa, { titulo: "L", venceEm: "2026-11-20" }).ok).toBe(false);
  });
});
