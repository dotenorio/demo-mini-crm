/**
 * Armazenamento no Supabase (PostgreSQL). Só o servidor acessa, com a chave service_role.
 * As tabelas ficam num schema próprio (padrão "mini_crm"), então dá para dividir um projeto
 * do Supabase com outro sistema. Ver supabase/schema.sql.
 */
import { createClient } from "@supabase/supabase-js";
import type { Contato, Interacao, Tarefa } from "../tipos";
import { ID_VALIDO, textoBusca } from "./comum";
import type { FiltroContatos, Repositorio } from "./tipos";
import { normalizarBusca, telefoneSoDigitos } from "../formato";

interface LinhaContato {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  origem: string;
  etapa_id: string;
  observacoes: string | null;
  valor_centavos: number | null;
  extras: Record<string, string>;
  texto_busca: string;
  criado_em: string;
  atualizado_em: string;
  etapa_desde: string;
  exemplo: boolean;
}

interface LinhaInteracao {
  id: string;
  contato_id: string;
  tipo: string;
  texto: string;
  quando: string;
  autor: Interacao["autor"];
  criado_em: string;
}

interface LinhaTarefa {
  id: string;
  contato_id: string;
  titulo: string;
  vence_em: string;
  concluida: boolean;
  criado_em: string;
  concluida_em: string | null;
}

const iso = (v: string) => new Date(v).toISOString();

const paraContato = (l: LinhaContato): Contato => ({
  id: l.id,
  nome: l.nome,
  telefone: l.telefone,
  email: l.email ?? undefined,
  origem: l.origem,
  etapaId: l.etapa_id,
  observacoes: l.observacoes ?? undefined,
  valorCentavos: l.valor_centavos ?? undefined,
  extras: l.extras ?? {},
  criadoEm: iso(l.criado_em),
  atualizadoEm: iso(l.atualizado_em),
  etapaDesde: iso(l.etapa_desde),
  exemplo: l.exemplo,
});

const deContato = (c: Contato): LinhaContato => ({
  id: c.id,
  nome: c.nome,
  telefone: c.telefone,
  email: c.email ?? null,
  origem: c.origem,
  etapa_id: c.etapaId,
  observacoes: c.observacoes ?? null,
  valor_centavos: c.valorCentavos ?? null,
  extras: c.extras,
  texto_busca: textoBusca(c),
  criado_em: c.criadoEm,
  atualizado_em: c.atualizadoEm,
  etapa_desde: c.etapaDesde,
  exemplo: !!c.exemplo,
});

const paraInteracao = (l: LinhaInteracao): Interacao => ({
  id: l.id,
  contatoId: l.contato_id,
  tipo: l.tipo,
  texto: l.texto,
  quando: iso(l.quando),
  autor: l.autor,
  criadoEm: iso(l.criado_em),
});

const paraTarefa = (l: LinhaTarefa): Tarefa => ({
  id: l.id,
  contatoId: l.contato_id,
  titulo: l.titulo,
  venceEm: l.vence_em,
  concluida: l.concluida,
  criadoEm: iso(l.criado_em),
  concluidaEm: l.concluida_em ? iso(l.concluida_em) : undefined,
});

/** Escapa curingas do LIKE e tira o que quebraria o filtro `or()` do PostgREST. */
const termoSeguro = (s: string) => s.replace(/[,()"]/g, " ").replace(/[\\%_]/g, (c) => `\\${c}`);

function falhou(acao: string, error: { message: string } | null) {
  if (error) throw new Error(`Falha ao ${acao}: ${error.message}`);
}

export function criarRepositorioSupabase(url: string, chaveServico: string, schema = "mini_crm"): Repositorio {
  const db = createClient(url, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema },
  });

  return {
    nome: "supabase",

    async listarContatos({ busca, origem, etapaId, limite = 500 }: FiltroContatos = {}) {
      let q = db.from("contatos").select("*").order("atualizado_em", { ascending: false }).limit(limite);
      if (origem) q = q.eq("origem", origem);
      if (etapaId) q = q.eq("etapa_id", etapaId);
      const termo = termoSeguro(normalizarBusca(busca ?? "")).trim();
      if (termo) {
        const digitos = telefoneSoDigitos(termo);
        q =
          digitos.length >= 3
            ? q.or(`texto_busca.ilike.%${termo}%,telefone.ilike.%${digitos}%`)
            : q.ilike("texto_busca", `%${termo}%`);
      }
      const { data, error } = await q;
      falhou("listar contatos", error);
      return (data as LinhaContato[]).map(paraContato);
    },

    async buscarContato(id) {
      if (!ID_VALIDO.test(id)) return null;
      const { data, error } = await db.from("contatos").select("*").eq("id", id).maybeSingle();
      falhou("buscar contato", error);
      return data ? paraContato(data as LinhaContato) : null;
    },

    async buscarContatoPorTelefone(telefone) {
      const { data, error } = await db.from("contatos").select("*").eq("telefone", telefone).limit(1).maybeSingle();
      falhou("buscar contato pelo telefone", error);
      return data ? paraContato(data as LinhaContato) : null;
    },

    async salvarContato(contato) {
      const { error } = await db.from("contatos").upsert(deContato(contato));
      falhou("salvar contato", error);
    },

    async excluirContato(id) {
      // interações e tarefas saem junto (on delete cascade)
      const { error } = await db.from("contatos").delete().eq("id", id);
      falhou("excluir contato", error);
    },

    async listarInteracoes(contatoId) {
      const { data, error } = await db
        .from("interacoes")
        .select("*")
        .eq("contato_id", contatoId)
        .order("quando", { ascending: false })
        .order("criado_em", { ascending: false });
      falhou("listar histórico", error);
      return (data as LinhaInteracao[]).map(paraInteracao);
    },

    async salvarInteracao(i) {
      const linha: LinhaInteracao = {
        id: i.id,
        contato_id: i.contatoId,
        tipo: i.tipo,
        texto: i.texto,
        quando: i.quando,
        autor: i.autor,
        criado_em: i.criadoEm,
      };
      const { error } = await db.from("interacoes").upsert(linha);
      falhou("salvar interação", error);
    },

    async listarTarefas({ contatoId, situacao = "pendentes" } = {}) {
      let q = db
        .from("tarefas")
        .select("*")
        .order("concluida")
        .order("vence_em")
        .order("criado_em")
        .limit(1000);
      if (contatoId) q = q.eq("contato_id", contatoId);
      if (situacao === "pendentes") q = q.eq("concluida", false);
      const { data, error } = await q;
      falhou("listar tarefas", error);
      return (data as LinhaTarefa[]).map(paraTarefa);
    },

    async buscarTarefa(id) {
      if (!ID_VALIDO.test(id)) return null;
      const { data, error } = await db.from("tarefas").select("*").eq("id", id).maybeSingle();
      falhou("buscar tarefa", error);
      return data ? paraTarefa(data as LinhaTarefa) : null;
    },

    async salvarTarefa(t) {
      const linha: LinhaTarefa = {
        id: t.id,
        contato_id: t.contatoId,
        titulo: t.titulo,
        vence_em: t.venceEm,
        concluida: t.concluida,
        criado_em: t.criadoEm,
        concluida_em: t.concluidaEm ?? null,
      };
      const { error } = await db.from("tarefas").upsert(linha);
      falhou("salvar tarefa", error);
    },

    async contarContatos() {
      const { count, error } = await db.from("contatos").select("id", { count: "exact", head: true });
      falhou("contar contatos", error);
      return count ?? 0;
    },

    async limparTudo() {
      // Apaga os contatos; interações e tarefas vão junto pelo cascade
      const { error } = await db.from("contatos").delete().not("id", "is", null);
      falhou("limpar dados", error);
    },
  };
}
