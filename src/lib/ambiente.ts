/**
 * Variáveis de ambiente (ver .env.example). Só para o servidor.
 */
import "server-only";

const producao = process.env.NODE_ENV === "production";

/** Modo demonstração: login e chave da API exibidos na tela e dados fictícios de exemplo. */
export const modoDemo = (process.env.MODO_DEMO ?? "true") !== "false";

export const LOGIN_DEMO = { email: "recepcao@sorrisoclaro.exemplo", senha: "demo1234" };

/** Chave pública da API no modo demonstração (aparece na tela de integração). */
export const CHAVE_API_DEMO = "demo-chave-publica-mini-crm";

export function credenciaisPainel(): { email: string; senha: string } {
  const email = process.env.PAINEL_EMAIL;
  const senha = process.env.PAINEL_SENHA;
  if (email && senha) return { email, senha };
  if (modoDemo) return LOGIN_DEMO;
  throw new Error("Defina PAINEL_EMAIL e PAINEL_SENHA (ou MODO_DEMO=true).");
}

/** true quando a tela de login deve mostrar o usuário e a senha de demonstração. */
export const loginDemoAtivo = () => modoDemo && !process.env.PAINEL_EMAIL;

export function segredoSessao(): string {
  const s = process.env.SESSAO_SEGREDO;
  if (s && s.length >= 32) return s;
  if (producao) throw new Error("Defina SESSAO_SEGREDO com pelo menos 32 caracteres.");
  return "segredo-de-desenvolvimento-nao-use-em-producao!!";
}

/**
 * Chave da API (cabeçalho `Authorization: Bearer <chave>`).
 * Sem CRM_API_CHAVE: no modo demo usa a chave pública de demonstração; fora dele, a API fica desligada.
 */
export function chaveApi(): string | null {
  const c = process.env.CRM_API_CHAVE;
  if (c) return c.length >= 24 ? c : null;
  return modoDemo ? CHAVE_API_DEMO : null;
}

export const chaveApiDemoAtiva = () => modoDemo && !process.env.CRM_API_CHAVE;

export function configSupabase(): { url: string; chave: string; schema: string } | null {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && chave ? { url, chave, schema: process.env.SUPABASE_SCHEMA || "mini_crm" } : null;
}

export const pastaDados = process.env.DADOS_DIR || ".dados";
