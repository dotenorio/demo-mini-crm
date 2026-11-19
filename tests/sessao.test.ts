import { describe, expect, it } from "vitest";
import { criarToken, DURACAO_SESSAO_S, iguaisSeguro, lerToken } from "@/lib/sessao";

const SEGREDO = "x".repeat(40);

describe("sessão do painel", () => {
  it("lê um token válido", () => {
    expect(lerToken(criarToken("dono@exemplo.com", SEGREDO), SEGREDO)?.email).toBe("dono@exemplo.com");
  });

  it("recusa token adulterado, de outro segredo ou vencido", () => {
    const token = criarToken("dono@exemplo.com", SEGREDO);
    const [conteudo, assinatura] = token.split(".");
    const falso = Buffer.from(JSON.stringify({ email: "invasor@x.com", exp: 9999999999 })).toString("base64url");
    expect(lerToken(`${falso}.${assinatura}`, SEGREDO)).toBeNull();
    expect(lerToken(`${conteudo}.${assinatura}x`, SEGREDO)).toBeNull();
    expect(lerToken(token, "y".repeat(40))).toBeNull();
    expect(lerToken(token, SEGREDO, Date.now() + (DURACAO_SESSAO_S + 1) * 1000)).toBeNull();
    expect(lerToken(undefined, SEGREDO)).toBeNull();
    expect(lerToken("lixo", SEGREDO)).toBeNull();
  });

  it("compara senhas", () => {
    expect(iguaisSeguro("demo1234", "demo1234")).toBe(true);
    expect(iguaisSeguro("demo1234", "demo12345")).toBe(false);
  });
});
