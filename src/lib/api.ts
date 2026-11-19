/** Ajudantes das rotas da API (/api/v1). */
import "server-only";
import type { Falha } from "./crm";

const LIMITE_BYTES = 64_000;
export const SEM_CACHE = { "Cache-Control": "no-store" };

/** Lê o corpo JSON com limite de tamanho. Devolve o objeto ou uma Response de erro. */
export async function lerJson(req: Request): Promise<{ corpo: Record<string, unknown> } | { erro: Response }> {
  const texto = await req.text();
  if (texto.length > LIMITE_BYTES) return { erro: Response.json({ mensagem: "Corpo grande demais." }, { status: 413 }) };
  try {
    const corpo: unknown = JSON.parse(texto || "{}");
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) throw new Error();
    return { corpo: corpo as Record<string, unknown> };
  } catch {
    return { erro: Response.json({ mensagem: "Envie um objeto JSON." }, { status: 400 }) };
  }
}

export function responderFalha(f: Falha): Response {
  return Response.json({ mensagem: f.mensagem, erros: f.erros, existenteId: f.existenteId }, { status: f.status, headers: SEM_CACHE });
}

export function erroInterno(contexto: string, e: unknown): Response {
  console.error(contexto, e);
  return Response.json({ mensagem: "Erro interno. Tente de novo em instantes." }, { status: 500, headers: SEM_CACHE });
}
