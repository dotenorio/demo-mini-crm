/**
 * Armazenamento em disco, para rodar a demo sem nenhuma conta externa.
 * Tudo num único JSON (por padrão ./.dados/crm.json, fora do Git).
 * Não use em produção: na Vercel o disco é somente leitura e não persiste.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Contato, Interacao, Tarefa } from "../tipos";
import { filtrarContatos, ID_VALIDO, porQuandoDesc, porVencimento } from "./comum";
import type { Repositorio } from "./tipos";

interface Banco {
  contatos: Contato[];
  interacoes: Interacao[];
  tarefas: Tarefa[];
}

const vazio = (): Banco => ({ contatos: [], interacoes: [], tarefas: [] });

export function criarRepositorioLocal(pasta: string): Repositorio {
  const arquivo = path.join(pasta, "crm.json");
  let fila: Promise<unknown> = Promise.resolve();

  async function ler(): Promise<Banco> {
    try {
      return { ...vazio(), ...(JSON.parse(await readFile(arquivo, "utf8")) as Partial<Banco>) };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return vazio();
      throw e;
    }
  }

  /** Grava em arquivo temporário e renomeia, para não corromper o JSON no meio da escrita. */
  async function gravar(banco: Banco) {
    await mkdir(pasta, { recursive: true });
    const tmp = `${arquivo}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, JSON.stringify(banco, null, 1));
    await rename(tmp, arquivo);
  }

  /** Serializa as escritas: duas alterações ao mesmo tempo não se sobrescrevem. */
  function alterar(mudanca: (banco: Banco) => void): Promise<void> {
    const tarefa = fila.then(async () => {
      const banco = await ler();
      mudanca(banco);
      await gravar(banco);
    });
    fila = tarefa.catch(() => undefined);
    return tarefa;
  }

  function substituir<T extends { id: string }>(lista: T[], item: T) {
    const i = lista.findIndex((x) => x.id === item.id);
    if (i >= 0) lista[i] = item;
    else lista.push(item);
  }

  return {
    nome: "local",

    async listarContatos(filtro) {
      return filtrarContatos((await ler()).contatos, filtro);
    },

    async buscarContato(id) {
      if (!ID_VALIDO.test(id)) return null;
      return (await ler()).contatos.find((c) => c.id === id) ?? null;
    },

    async buscarContatoPorTelefone(telefone) {
      return (await ler()).contatos.find((c) => c.telefone === telefone) ?? null;
    },

    salvarContato(contato) {
      return alterar((b) => substituir(b.contatos, contato));
    },

    excluirContato(id) {
      return alterar((b) => {
        b.contatos = b.contatos.filter((c) => c.id !== id);
        b.interacoes = b.interacoes.filter((i) => i.contatoId !== id);
        b.tarefas = b.tarefas.filter((t) => t.contatoId !== id);
      });
    },

    async listarInteracoes(contatoId) {
      return (await ler()).interacoes.filter((i) => i.contatoId === contatoId).sort(porQuandoDesc);
    },

    salvarInteracao(interacao) {
      return alterar((b) => substituir(b.interacoes, interacao));
    },

    async listarTarefas({ contatoId, situacao = "pendentes" } = {}) {
      return (await ler()).tarefas
        .filter((t) => !contatoId || t.contatoId === contatoId)
        .filter((t) => situacao === "todas" || !t.concluida)
        .sort(porVencimento);
    },

    async buscarTarefa(id) {
      if (!ID_VALIDO.test(id)) return null;
      return (await ler()).tarefas.find((t) => t.id === id) ?? null;
    },

    salvarTarefa(tarefa) {
      return alterar((b) => substituir(b.tarefas, tarefa));
    },

    async contarContatos() {
      return (await ler()).contatos.length;
    },

    limparTudo() {
      return alterar((b) => Object.assign(b, vazio()));
    },
  };
}
