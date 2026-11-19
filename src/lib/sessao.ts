/**
 * Sessão do CRM: um cookie httpOnly assinado com HMAC-SHA256.
 * Formato: base64url(JSON) + "." + base64url(assinatura).
 * Sem dependência de banco: trocar a variável SESSAO_SEGREDO derruba todas as sessões.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESSAO = "crm_sessao";
export const DURACAO_SESSAO_S = 60 * 60 * 8; // 8 horas

interface DadosSessao {
  email: string;
  exp: number; // segundos desde 1970
}

const assinar = (conteudo: string, segredo: string) => createHmac("sha256", segredo).update(conteudo).digest("base64url");

export function criarToken(email: string, segredo: string, agora = Date.now()): string {
  const dados: DadosSessao = { email, exp: Math.floor(agora / 1000) + DURACAO_SESSAO_S };
  const conteudo = Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${conteudo}.${assinar(conteudo, segredo)}`;
}

export function lerToken(token: string | undefined, segredo: string, agora = Date.now()): DadosSessao | null {
  if (!token) return null;
  const [conteudo, assinatura, ...resto] = token.split(".");
  if (!conteudo || !assinatura || resto.length) return null;
  const esperada = Buffer.from(assinar(conteudo, segredo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;
  try {
    const dados = JSON.parse(Buffer.from(conteudo, "base64url").toString("utf8")) as DadosSessao;
    if (typeof dados.email !== "string" || typeof dados.exp !== "number") return null;
    if (dados.exp * 1000 < agora) return null;
    return dados;
  } catch {
    return null;
  }
}

/** Compara textos em tempo constante (evita descobrir a senha medindo o tempo da resposta). */
export function iguaisSeguro(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
