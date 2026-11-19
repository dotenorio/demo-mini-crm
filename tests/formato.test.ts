import { describe, expect, it } from "vitest";
import {
  campoDataHoraParaUtc,
  dinheiro,
  hojeNoFuso,
  prazoEmTexto,
  somarDias,
  telefoneFormatado,
  telefoneSoDigitos,
  telefoneValido,
  utcParaCampoDataHora,
  valorParaCentavos,
} from "@/lib/formato";

const SP = "America/Sao_Paulo";

describe("telefone", () => {
  it("aceita vários formatos e tira o 55 do WhatsApp", () => {
    expect(telefoneSoDigitos("(11) 98765-4321")).toBe("11987654321");
    expect(telefoneSoDigitos("+55 11 98765-4321")).toBe("11987654321");
    expect(telefoneSoDigitos("5511987654321")).toBe("11987654321");
    expect(telefoneSoDigitos("1133334444")).toBe("1133334444");
  });

  it("valida DDD e tamanho", () => {
    expect(telefoneValido("11987654321")).toBe(true);
    expect(telefoneValido("1133334444")).toBe(true);
    expect(telefoneValido("0198765432")).toBe(false);
    expect(telefoneValido("987654321")).toBe(false);
  });

  it("formata", () => {
    expect(telefoneFormatado("11987654321")).toBe("(11) 98765-4321");
    expect(telefoneFormatado("1133334444")).toBe("(11) 3333-4444");
  });
});

describe("valor em reais", () => {
  it("entende o jeito brasileiro de escrever", () => {
    expect(valorParaCentavos("3500")).toBe(350000);
    expect(valorParaCentavos("3.500")).toBe(350000);
    expect(valorParaCentavos("3.500,50")).toBe(350050);
    expect(valorParaCentavos("R$ 1.234,5")).toBe(123450);
    expect(valorParaCentavos("99.90")).toBe(9990);
    expect(valorParaCentavos("")).toBeUndefined();
    expect(valorParaCentavos("abc")).toBeNaN();
  });

  it("formata em reais", () => {
    expect(dinheiro(350050)).toBe("R$ 3.500,50");
    expect(dinheiro(350050, true)).toBe("R$ 3.501");
  });
});

describe("datas no fuso do negócio", () => {
  it("converte o campo datetime-local de São Paulo para UTC e de volta", () => {
    expect(campoDataHoraParaUtc("2026-11-19T14:30", SP)).toBe("2026-11-19T17:30:00.000Z");
    expect(utcParaCampoDataHora("2026-11-19T17:30:00.000Z", SP)).toBe("2026-11-19T14:30");
    expect(campoDataHoraParaUtc("2026-02-31T10:00", SP)).toBeNull();
    expect(campoDataHoraParaUtc("ontem", SP)).toBeNull();
  });

  it("calcula o dia de hoje no fuso, não em UTC", () => {
    // 01:00 UTC do dia 20 ainda é dia 19 em São Paulo
    expect(hojeNoFuso(SP, new Date("2026-11-20T01:00:00Z"))).toBe("2026-11-19");
  });

  it("descreve o prazo", () => {
    expect(somarDias("2026-11-30", 2)).toBe("2026-12-02");
    expect(prazoEmTexto("2026-11-19", "2026-11-19")).toBe("hoje");
    expect(prazoEmTexto("2026-11-20", "2026-11-19")).toBe("amanhã");
    expect(prazoEmTexto("2026-11-16", "2026-11-19")).toBe("atrasada 3 dias");
    expect(prazoEmTexto("2026-12-25", "2026-11-19")).toBe("25/12/2026");
  });
});
