/**
 * POST /api/v1/contatos/:id/interacoes
 * Corpo: { "tipo": "whatsapp", "texto": "...", "quando"?: ISO 8601, "etapaId"?: "avaliacao" }
 * Registra no histórico e, se vier `etapaId`, move o contato no funil (ex.: o robô agendou a avaliação).
 */
import { configuracao } from "@/config/crm";
import { erroInterno, lerJson, responderFalha, SEM_CACHE } from "@/lib/api";
import { conferirChaveApi } from "@/lib/autenticacao";
import { moverEtapa, registrarInteracao } from "@/lib/crm";
import { obterRepositorio } from "@/lib/repositorio";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: RouteContext<"/api/v1/contatos/[id]/interacoes">) {
  const negado = conferirChaveApi(req);
  if (negado) return negado;
  const { id } = await ctx.params;
  const lido = await lerJson(req);
  if ("erro" in lido) return lido.erro;
  const { etapaId, ...dados } = lido.corpo;
  if (etapaId !== undefined && (typeof etapaId !== "string" || !configuracao.etapas.some((e) => e.id === etapaId))) {
    return Response.json({ mensagem: "Etapa desconhecida.", etapas: configuracao.etapas.map((e) => e.id) }, { status: 400 });
  }

  try {
    const repo = await obterRepositorio();
    const r = await registrarInteracao(configuracao, repo, id, dados, { autor: "api" });
    if (!r.ok) return responderFalha(r);
    if (typeof etapaId === "string") {
      const m = await moverEtapa(configuracao, repo, id, etapaId);
      if (!m.ok) return responderFalha(m);
    }
    return Response.json({ interacao: r.interacao, contato: await repo.buscarContato(id) }, { status: 201, headers: SEM_CACHE });
  } catch (e) {
    return erroInterno("API: falha ao registrar interação", e);
  }
}
