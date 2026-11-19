import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { configuracao } from "@/config/crm";
import { criarRepositorioLocal } from "@/lib/armazenamento/local";
import type { Repositorio } from "@/lib/armazenamento/tipos";
import { atualizarContato, criarContato, criarTarefa, excluirContato, marcarTarefa, moverEtapa, registrarInteracao } from "@/lib/crm";
import { criarDadosExemplo } from "@/lib/exemplos";
import { calcularIndicadores } from "@/lib/indicadores";

let pasta: string;
let repo: Repositorio;

beforeEach(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "crm-"));
  repo = criarRepositorioLocal(pasta);
});
afterEach(() => rm(pasta, { recursive: true, force: true }));

const novo = (extra: object = {}) =>
  criarContato(configuracao, repo, { nome: "Maria Exemplo", telefone: "11987654321", origem: "instagram", ...extra }, { autor: "painel" });

describe("fluxo do CRM", () => {
  it("cria o contato na primeira etapa e registra no histórico", async () => {
    const r = await novo();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.contato.etapaId).toBe(configuracao.etapas[0].id);
    const hist = await repo.listarInteracoes(r.contato.id);
    expect(hist).toHaveLength(1);
    expect(hist[0]).toMatchObject({ tipo: "sistema", autor: "sistema" });
  });

  it("não deixa cadastrar o mesmo telefone duas vezes", async () => {
    const a = await novo();
    const b = await novo({ nome: "Outra Pessoa", telefone: "+55 11 98765-4321" });
    expect(b).toMatchObject({ ok: false, status: 409, existenteId: a.ok ? a.contato.id : "" });
  });

  it("muda de etapa e deixa registrado de onde para onde", async () => {
    const r = await novo();
    if (!r.ok) throw new Error("falhou");
    const m = await moverEtapa(configuracao, repo, r.contato.id, "avaliacao", { agora: new Date(Date.now() + 1000) });
    expect(m.ok && m.contato.etapaId).toBe("avaliacao");
    const hist = await repo.listarInteracoes(r.contato.id);
    expect(hist[0].texto).toBe("Etapa: Novo contato → Avaliação agendada.");
    expect((await moverEtapa(configuracao, repo, r.contato.id, "nao-existe")).ok).toBe(false);
  });

  it("edita o cadastro e registra a troca de etapa feita pelo formulário", async () => {
    const r = await novo();
    if (!r.ok) throw new Error("falhou");
    const e = await atualizarContato(configuracao, repo, r.contato.id, {
      nome: "Maria E.",
      telefone: "11987654321",
      origem: "google",
      etapaId: "fechado",
      valor: "1.200",
    });
    expect(e.ok && e.contato).toMatchObject({ nome: "Maria E.", origem: "google", etapaId: "fechado", valorCentavos: 120000 });
    expect((await repo.listarInteracoes(r.contato.id)).some((i) => i.texto.includes("→ Tratamento fechado"))).toBe(true);
  });

  it("registra interação, cria e conclui tarefa, e exclui tudo junto", async () => {
    const r = await novo();
    if (!r.ok) throw new Error("falhou");
    const id = r.contato.id;
    expect((await registrarInteracao(configuracao, repo, id, { tipo: "ligacao", texto: "Liguei" }, { autor: "painel" })).ok).toBe(true);
    const t = await criarTarefa(configuracao, repo, id, { titulo: "Retornar", venceEm: "2026-11-20" });
    if (!t.ok) throw new Error("falhou");
    expect(await repo.listarTarefas()).toHaveLength(1);
    await marcarTarefa(repo, t.tarefa.id, true);
    expect(await repo.listarTarefas()).toHaveLength(0);
    expect(await repo.listarTarefas({ situacao: "todas" })).toHaveLength(1);

    expect((await excluirContato(configuracao, repo, id)).ok).toBe(true);
    expect(await repo.listarInteracoes(id)).toHaveLength(0);
    expect(await repo.listarTarefas({ situacao: "todas" })).toHaveLength(0);
  });

  it("busca por nome sem acento, por telefone e filtra por origem e etapa", async () => {
    await novo({ nome: "Joaquina Conceição" });
    await novo({ nome: "Pedro Exemplo", telefone: "21912345678", origem: "google" });
    expect((await repo.listarContatos({ busca: "conceicao" })).map((c) => c.nome)).toEqual(["Joaquina Conceição"]);
    expect((await repo.listarContatos({ busca: "(21) 91234" })).map((c) => c.nome)).toEqual(["Pedro Exemplo"]);
    expect(await repo.listarContatos({ origem: "google", etapaId: "novo" })).toHaveLength(1);
  });
});

describe("dados de exemplo e indicadores", () => {
  it("o seed respeita as regras e o painel soma certo", async () => {
    const agora = new Date("2026-11-19T15:00:00Z");
    const n = await criarDadosExemplo(configuracao, repo, agora);
    const contatos = await repo.listarContatos();
    expect(contatos).toHaveLength(n);
    expect(new Set(contatos.map((c) => c.telefone)).size).toBe(n); // telefones únicos

    const ind = calcularIndicadores(configuracao, contatos, await repo.listarTarefas(), agora);
    expect(ind.porEtapa.reduce((s, e) => s + e.quantidade, 0)).toBe(n);
    expect(ind.abertos + ind.ganhos + ind.perdidos).toBe(n);
    expect(ind.conversao).toBeCloseTo(ind.ganhos / (ind.ganhos + ind.perdidos));
    expect(ind.tarefas.atrasadas).toBeGreaterThan(0);
    expect(ind.tarefas.hoje).toBeGreaterThan(0);
  });

  it("conversão é nula sem nenhum negócio encerrado", () => {
    expect(calcularIndicadores(configuracao, [], []).conversao).toBeNull();
  });
});
