/** Autenticação das telas (cookie) e da API (chave no cabeçalho). Só servidor. */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { chaveApi, segredoSessao } from "./ambiente";
import { COOKIE_SESSAO, iguaisSeguro, lerToken } from "./sessao";

export async function sessaoAtual() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  return lerToken(token, segredoSessao());
}

/** Use no topo de toda página e de toda Server Action: sem login, volta para a tela de entrada. */
export async function exigirSessao() {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/entrar");
  return sessao;
}

/**
 * Confere `Authorization: Bearer <chave>` (ou `X-Api-Key: <chave>`).
 * Devolve uma Response de erro pronta, ou null se a chave estiver certa.
 */
export function conferirChaveApi(req: Request): Response | null {
  const certa = chaveApi();
  if (!certa) return Response.json({ mensagem: "API desligada. Defina CRM_API_CHAVE." }, { status: 503 });
  const cabecalho = req.headers.get("authorization") ?? "";
  const recebida = /^Bearer\s+(.+)$/i.exec(cabecalho)?.[1]?.trim() ?? req.headers.get("x-api-key")?.trim() ?? "";
  if (!recebida || !iguaisSeguro(recebida, certa)) {
    return Response.json({ mensagem: "Chave da API ausente ou inválida." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  }
  return null;
}
