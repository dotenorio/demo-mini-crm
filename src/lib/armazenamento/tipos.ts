import type { Contato, Interacao, Tarefa } from "../tipos";

export interface FiltroContatos {
  /** Procura no nome, telefone e e-mail (sem acento e sem caixa). */
  busca?: string;
  origem?: string;
  etapaId?: string;
  limite?: number;
}

export interface FiltroTarefas {
  contatoId?: string;
  /** "pendentes" (padrão) ou "todas". */
  situacao?: "pendentes" | "todas";
}

/**
 * Onde os dados ficam guardados. Duas implementações: disco local (demo sem conta) e Supabase.
 * Regras de negócio (histórico automático, validação) ficam em src/lib/crm.ts, não aqui.
 */
export interface Repositorio {
  nome: "local" | "supabase";

  listarContatos(filtro?: FiltroContatos): Promise<Contato[]>;
  buscarContato(id: string): Promise<Contato | null>;
  buscarContatoPorTelefone(telefone: string): Promise<Contato | null>;
  /** Cria ou atualiza (pelo id). */
  salvarContato(contato: Contato): Promise<void>;
  /** Apaga o contato com o histórico e as tarefas dele. */
  excluirContato(id: string): Promise<void>;

  listarInteracoes(contatoId: string): Promise<Interacao[]>;
  salvarInteracao(interacao: Interacao): Promise<void>;

  listarTarefas(filtro?: FiltroTarefas): Promise<Tarefa[]>;
  buscarTarefa(id: string): Promise<Tarefa | null>;
  salvarTarefa(tarefa: Tarefa): Promise<void>;

  contarContatos(): Promise<number>;
  /** Apaga tudo (usado para recomeçar a demonstração). */
  limparTudo(): Promise<void>;
}
