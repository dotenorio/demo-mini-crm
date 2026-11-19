/** Números do painel. Função pura: recebe os dados e devolve os totais (fácil de testar). */
import { diasEntreDatas, hojeNoFuso } from "./formato";
import type { ConfiguracaoCrm, Contato, Etapa, Opcao, Tarefa } from "./tipos";

/** Contato aberto há mais que isso na mesma etapa aparece como "parado". */
export const DIAS_PARADO = 7;

export interface Indicadores {
  total: number;
  abertos: number;
  ganhos: number;
  perdidos: number;
  /** ganhos ÷ (ganhos + perdidos). null quando nenhum negócio foi encerrado. */
  conversao: number | null;
  novosUltimos30Dias: number;
  valorEmAbertoCentavos: number;
  valorGanhoCentavos: number;
  parados: number;
  porEtapa: { etapa: Etapa; quantidade: number; valorCentavos: number }[];
  porOrigem: { origem: Opcao; total: number; ganhos: number; encerrados: number; conversao: number | null }[];
  tarefas: { atrasadas: number; hoje: number; proximos7Dias: number };
}

const taxa = (ganhos: number, encerrados: number) => (encerrados ? ganhos / encerrados : null);

export function calcularIndicadores(
  config: ConfiguracaoCrm,
  contatos: Contato[],
  tarefasPendentes: Tarefa[],
  agora = new Date(),
): Indicadores {
  const tipoDe = new Map(config.etapas.map((e) => [e.id, e.tipo]));
  const tipo = (c: Contato) => tipoDe.get(c.etapaId) ?? "aberta";
  const limite30 = agora.getTime() - 30 * 86_400_000;
  const limiteParado = agora.getTime() - DIAS_PARADO * 86_400_000;

  const ganhos = contatos.filter((c) => tipo(c) === "ganho");
  const perdidos = contatos.filter((c) => tipo(c) === "perdido");
  const abertos = contatos.filter((c) => tipo(c) === "aberta");
  const soma = (lista: Contato[]) => lista.reduce((s, c) => s + (c.valorCentavos ?? 0), 0);

  const hoje = hojeNoFuso(config.negocio.fusoHorario, agora);
  const prazo = (t: Tarefa) => diasEntreDatas(hoje, t.venceEm);

  return {
    total: contatos.length,
    abertos: abertos.length,
    ganhos: ganhos.length,
    perdidos: perdidos.length,
    conversao: taxa(ganhos.length, ganhos.length + perdidos.length),
    novosUltimos30Dias: contatos.filter((c) => Date.parse(c.criadoEm) >= limite30).length,
    valorEmAbertoCentavos: soma(abertos),
    valorGanhoCentavos: soma(ganhos),
    parados: abertos.filter((c) => Date.parse(c.etapaDesde) < limiteParado).length,
    porEtapa: config.etapas.map((etapa) => {
      const daEtapa = contatos.filter((c) => c.etapaId === etapa.id);
      return { etapa, quantidade: daEtapa.length, valorCentavos: soma(daEtapa) };
    }),
    porOrigem: config.origens.map((origem) => {
      const daOrigem = contatos.filter((c) => c.origem === origem.valor);
      const g = daOrigem.filter((c) => tipo(c) === "ganho").length;
      const encerrados = g + daOrigem.filter((c) => tipo(c) === "perdido").length;
      return { origem, total: daOrigem.length, ganhos: g, encerrados, conversao: taxa(g, encerrados) };
    }),
    tarefas: {
      atrasadas: tarefasPendentes.filter((t) => prazo(t) < 0).length,
      hoje: tarefasPendentes.filter((t) => prazo(t) === 0).length,
      proximos7Dias: tarefasPendentes.filter((t) => prazo(t) > 0 && prazo(t) <= 7).length,
    },
  };
}
