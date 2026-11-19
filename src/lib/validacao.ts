/**
 * Regras de validação, montadas a partir da configuração.
 * As mesmas regras valem para os formulários do painel e para a API.
 */
import { z } from "zod";
import { campoDataHoraParaUtc, telefoneSoDigitos, telefoneValido, valorParaCentavos } from "./formato";
import type { ConfiguracaoCrm } from "./tipos";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export type Erros = Record<string, string>;
export type Resultado<T> = { ok: true; dados: T } | { ok: false; erros: Erros };

const ids = (lista: { id?: string; valor?: string }[]) => lista.map((o) => (o.id ?? o.valor) as string) as [string, ...string[]];

const textoOpcional = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .optional()
    .transform((v) => v || undefined);

export function esquemaContato(config: ConfiguracaoCrm) {
  return z.object({
    nome: z.string({ error: "Informe o nome." }).trim().min(2, "Informe o nome.").max(120, "Nome muito longo."),
    telefone: z
      .string({ error: "Informe o telefone." })
      .transform(telefoneSoDigitos)
      .refine(telefoneValido, "Telefone inválido. Use DDD + número, ex.: (11) 98765-4321."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(160, "E-mail muito longo.")
      .refine((v) => !v || EMAIL.test(v), "E-mail inválido.")
      .optional()
      .transform((v) => v || undefined),
    origem: z.enum(ids(config.origens), { error: "Escolha a origem." }).default(config.origens[0].valor),
    etapaId: z.enum(ids(config.etapas), { error: "Etapa desconhecida." }).optional(),
    observacoes: textoOpcional(4000, "Observações muito longas (máx. 4.000 caracteres)."),
    valor: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v, ctx) => {
        if (v === undefined || v === "") return undefined;
        const c = typeof v === "number" ? Math.round(v * 100) : valorParaCentavos(v);
        if (c === undefined) return undefined;
        if (!Number.isFinite(c) || c < 0 || c > 100_000_000_00) {
          ctx.addIssue({ code: "custom", message: "Valor inválido. Ex.: 3500 ou 3.500,00." });
          return z.NEVER;
        }
        return c;
      }),
    extras: z
      .record(z.string(), z.string())
      .optional()
      .transform((recebidos, ctx) => {
        const extras: Record<string, string> = {};
        for (const campo of config.camposExtras) {
          const v = recebidos?.[campo.id]?.trim();
          if (!v) continue;
          if (campo.tipo === "escolha" && !campo.opcoes.some((o) => o.valor === v)) {
            ctx.addIssue({ code: "custom", path: [campo.id], message: `Opção inválida em “${campo.rotulo}”.` });
            continue;
          }
          extras[campo.id] = v.slice(0, 200);
        }
        return extras; // campos que não existem na configuração são descartados
      }),
  });
}

export type DadosContato = z.output<ReturnType<typeof esquemaContato>>;

export function esquemaInteracao(config: ConfiguracaoCrm) {
  return z.object({
    tipo: z.enum(ids(config.tiposInteracao), { error: "Escolha o tipo." }).default(config.tiposInteracao[0].valor),
    texto: z.string({ error: "Escreva o que aconteceu." }).trim().min(1, "Escreva o que aconteceu.").max(4000, "Texto muito longo."),
    /** "2026-11-19T14:30" (no fuso do negócio) ou ISO 8601 com fuso. Vazio = agora. */
    quando: z
      .string()
      .optional()
      .transform((v, ctx) => {
        if (!v) return undefined;
        const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)
          ? campoDataHoraParaUtc(v, config.negocio.fusoHorario)
          : /[zZ]|[+-]\d{2}:?\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
            ? new Date(v).toISOString()
            : null;
        if (!iso) {
          ctx.addIssue({ code: "custom", message: "Data e hora inválidas." });
          return z.NEVER;
        }
        return iso;
      }),
  });
}

export type DadosInteracao = z.output<ReturnType<typeof esquemaInteracao>>;

export const esquemaTarefa = z.object({
  titulo: z.string({ error: "Descreva a tarefa." }).trim().min(2, "Descreva a tarefa.").max(200, "Título muito longo."),
  venceEm: z
    .string({ error: "Escolha a data." })
    .refine((v) => DATA.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().startsWith(v), "Data inválida."),
});

export type DadosTarefa = z.output<typeof esquemaTarefa>;

/** Roda um esquema e devolve a primeira mensagem de erro de cada campo. */
export function validar<S extends z.ZodType>(esquema: S, entrada: unknown): Resultado<z.output<S>> {
  const r = esquema.safeParse(entrada);
  if (r.success) return { ok: true, dados: r.data };
  const erros: Erros = {};
  for (const issue of r.error.issues) {
    // Erro dentro de "extras" aparece no próprio campo extra
    const caminho = issue.path[0] === "extras" && issue.path.length > 1 ? String(issue.path[1]) : String(issue.path[0] ?? "geral");
    erros[caminho] ??= issue.message;
  }
  return { ok: false, erros };
}

/** Lê um FormData do formulário de contato no formato que o esquema espera. */
export function contatoDoFormulario(form: FormData, config: ConfiguracaoCrm) {
  const texto = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };
  return {
    nome: texto("nome") ?? "",
    telefone: texto("telefone") ?? "",
    email: texto("email"),
    origem: texto("origem"),
    etapaId: texto("etapaId") || undefined,
    observacoes: texto("observacoes"),
    valor: texto("valor"),
    extras: Object.fromEntries(config.camposExtras.map((c) => [c.id, texto(`extra_${c.id}`) ?? ""])),
  };
}
