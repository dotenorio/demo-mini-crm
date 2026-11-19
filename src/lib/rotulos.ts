/** Ids da configuração → textos para mostrar na tela. Sem dependências de servidor. */
import type { ConfiguracaoCrm } from "./tipos";

export const nomeEtapa = (config: ConfiguracaoCrm, id: string) => config.etapas.find((e) => e.id === id)?.nome ?? id;
export const corEtapa = (config: ConfiguracaoCrm, id: string) => config.etapas.find((e) => e.id === id)?.cor ?? "#78716c";
export const rotuloOrigem = (config: ConfiguracaoCrm, v: string) => config.origens.find((o) => o.valor === v)?.rotulo ?? v;
export const rotuloInteracao = (config: ConfiguracaoCrm, v: string) =>
  v === "sistema" ? "Sistema" : (config.tiposInteracao.find((o) => o.valor === v)?.rotulo ?? v);

/** Valor de um campo extra como texto (rótulo da opção, quando é de escolha). */
export function rotuloExtra(config: ConfiguracaoCrm, campoId: string, valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  const campo = config.camposExtras.find((c) => c.id === campoId);
  if (campo?.tipo === "escolha") return campo.opcoes.find((o) => o.valor === valor)?.rotulo ?? valor;
  return valor;
}
