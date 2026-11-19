/**
 * Tipos do CRM. A configuração (src/config/crm.ts) segue `ConfiguracaoCrm`;
 * os dados guardados seguem `Contato`, `Interacao` e `Tarefa`.
 */

/** "aberta" = em andamento; "ganho" e "perdido" encerram o negócio (entram na conversão). */
export type TipoEtapa = "aberta" | "ganho" | "perdido";

export interface Etapa {
  id: string;
  nome: string;
  tipo: TipoEtapa;
  /** Cor da faixa da coluna no funil (qualquer cor CSS). */
  cor: string;
}

export interface Opcao {
  valor: string;
  rotulo: string;
}

/** Campo a mais no cadastro do contato, além de nome, telefone, e-mail, origem e observações. */
export type CampoExtra =
  | { tipo: "texto"; id: string; rotulo: string; placeholder?: string }
  | { tipo: "escolha"; id: string; rotulo: string; opcoes: Opcao[] };

export interface ConfiguracaoCrm {
  negocio: {
    nome: string;
    subtitulo: string;
    corPrimaria: string;
    fusoHorario: string;
  };
  /** Apague este bloco num cliente real: some a faixa de aviso e o login de demonstração. */
  demonstracao?: {
    texto: string;
    link?: { texto: string; url: string };
  };
  textos: {
    /** Como o negócio chama quem está no funil: "Contato", "Paciente", "Cliente", "Lead"… */
    contato: string;
    contatos: string;
    /** Nome do campo de valor (orçamento, honorários, mensalidade). Sem ele, o valor não aparece. */
    valor?: string;
  };
  /** Colunas do funil, na ordem. Precisa de pelo menos uma etapa "aberta", uma "ganho" e uma "perdido". */
  etapas: Etapa[];
  /** De onde o contato veio (Instagram, indicação…). */
  origens: Opcao[];
  /** Tipos de registro no histórico (ligação, WhatsApp, consulta…). */
  tiposInteracao: Opcao[];
  camposExtras: CampoExtra[];
}

export interface Contato {
  id: string;
  nome: string;
  /** Só dígitos, com DDD e sem o 55. */
  telefone: string;
  email?: string;
  origem: string;
  etapaId: string;
  observacoes?: string;
  /** Em centavos, para não ter problema de arredondamento. */
  valorCentavos?: number;
  extras: Record<string, string>;
  /** ISO 8601 (UTC) */
  criadoEm: string;
  atualizadoEm: string;
  /** Quando entrou na etapa atual (para mostrar há quantos dias está parado). */
  etapaDesde: string;
  /** true para dados fictícios criados pelo seed. */
  exemplo?: boolean;
}

/** "sistema" são registros automáticos (contato criado, mudança de etapa). */
export type TipoInteracao = string;

export interface Interacao {
  id: string;
  contatoId: string;
  tipo: TipoInteracao;
  texto: string;
  /** Quando aconteceu (ISO 8601 UTC). Pode ser no passado: "liguei ontem". */
  quando: string;
  /** Quem registrou: o painel, a API (ex.: atendimento no WhatsApp) ou o próprio sistema. */
  autor: "painel" | "api" | "sistema";
  criadoEm: string;
}

export interface Tarefa {
  id: string;
  contatoId: string;
  titulo: string;
  /** Data no fuso do negócio, "AAAA-MM-DD". */
  venceEm: string;
  concluida: boolean;
  criadoEm: string;
  concluidaEm?: string;
}
