import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const CHAVE = "chave-de-teste-com-mais-de-24-caracteres";
const ID_INEXISTENTE = "00000000-0000-4000-8000-000000000000";
let pasta: string;
let rotaContatos: typeof import("@/app/api/v1/contatos/route");
let rotaInteracoes: typeof import("@/app/api/v1/contatos/[id]/interacoes/route");
let rotaContato: typeof import("@/app/api/v1/contatos/[id]/route");

beforeAll(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), "crm-api-"));
  vi.stubEnv("DADOS_DIR", pasta);
  vi.stubEnv("MODO_DEMO", "false"); // sem dados de exemplo e sem chave pública
  vi.stubEnv("CRM_API_CHAVE", CHAVE);
  rotaContatos = await import("@/app/api/v1/contatos/route");
  rotaInteracoes = await import("@/app/api/v1/contatos/[id]/interacoes/route");
  rotaContato = await import("@/app/api/v1/contatos/[id]/route");
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(pasta, { recursive: true, force: true });
});

const req = (url: string, corpo?: object, chave: string | null = CHAVE) =>
  new Request(`http://localhost${url}`, {
    method: corpo ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(chave ? { Authorization: `Bearer ${chave}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("API /api/v1", () => {
  it("recusa sem chave ou com chave errada", async () => {
    expect((await rotaContatos.POST(req("/api/v1/contatos", { nome: "X" }, null))).status).toBe(401);
    expect((await rotaContatos.GET(req("/api/v1/contatos?telefone=11987654321", undefined, "errada"))).status).toBe(401);
  });

  it("cria o contato com a primeira mensagem e, na segunda vez, devolve o mesmo", async () => {
    const corpo = {
      nome: "Maria Exemplo",
      telefone: "5511987654321",
      origem: "whatsapp",
      interacao: { tipo: "whatsapp", texto: "Quero saber o preço do clareamento." },
    };
    const r1 = await rotaContatos.POST(req("/api/v1/contatos", corpo));
    expect(r1.status).toBe(201);
    const j1 = await r1.json();
    expect(j1).toMatchObject({ criado: true, contato: { telefone: "11987654321" }, interacao: { autor: "api" } });

    const r2 = await rotaContatos.POST(req("/api/v1/contatos", { ...corpo, nome: "Maria (de novo)" }));
    expect(r2.status).toBe(200);
    const j2 = await r2.json();
    expect(j2.criado).toBe(false);
    expect(j2.contato.id).toBe(j1.contato.id);
    expect(j2.contato.nome).toBe("Maria Exemplo"); // não sobrescreve o cadastro

    const busca = await (await rotaContatos.GET(req("/api/v1/contatos?telefone=(11)98765-4321"))).json();
    expect(busca.contatos.map((c: { id: string }) => c.id)).toEqual([j1.contato.id]);

    const ri = await rotaInteracoes.POST(
      req(`/api/v1/contatos/${j1.contato.id}/interacoes`, { tipo: "whatsapp", texto: "Agendou avaliação.", etapaId: "avaliacao" }),
      ctx(j1.contato.id),
    );
    expect(ri.status).toBe(201);
    expect((await ri.json()).contato.etapaId).toBe("avaliacao");

    const detalhe = await (await rotaContato.GET(req(`/api/v1/contatos/${j1.contato.id}`), ctx(j1.contato.id))).json();
    // 2 mensagens vindas dos POSTs de contato + 1 interação
    expect(detalhe.interacoes.filter((i: { autor: string }) => i.autor === "api")).toHaveLength(3);
    expect(detalhe.interacoes.some((i: { texto: string }) => i.texto.includes("→ Avaliação agendada"))).toBe(true);
  });

  it("devolve os erros de validação", async () => {
    const r = await rotaContatos.POST(req("/api/v1/contatos", { nome: "", telefone: "123" }));
    expect(r.status).toBe(400);
    expect(Object.keys((await r.json()).erros).sort()).toEqual(["nome", "telefone"]);
    const etapa = await rotaInteracoes.POST(req("/api/v1/contatos/x/interacoes", { texto: "oi", etapaId: "lua" }), ctx("x"));
    expect(etapa.status).toBe(400);
    const sumido = await rotaInteracoes.POST(req(`/api/v1/contatos/${ID_INEXISTENTE}/interacoes`, { texto: "oi" }), ctx(ID_INEXISTENTE));
    expect(sumido.status).toBe(404);
  });
});
