"use client";
/** Partes da página do contato que reagem na hora: etapa, novo registro, nova tarefa, concluir e excluir. */
import { useActionState, useOptimistic, useState, useTransition } from "react";
import type { Etapa, Opcao } from "@/lib/tipos";
import {
  criarTarefaAcao,
  excluirContatoAcao,
  marcarTarefaAcao,
  moverEtapaAcao,
  registrarInteracaoAcao,
  type EstadoFormulario,
} from "../../acoes";

export function SeletorEtapa({ contatoId, etapaId, etapas }: { contatoId: string; etapaId: string; etapas: Etapa[] }) {
  const [atual, setAtual] = useOptimistic(etapaId);
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string>();
  const cor = etapas.find((e) => e.id === atual)?.cor;

  return (
    <div>
      <label htmlFor="etapa" className="rotulo">
        Etapa do funil
      </label>
      <div className="flex items-center gap-2">
        <span className="size-3 shrink-0 rounded-full" style={{ background: cor }} aria-hidden />
        <select
          id="etapa"
          value={atual}
          disabled={pendente}
          onChange={(ev) => {
            const nova = ev.target.value;
            setErro(undefined);
            iniciar(async () => {
              setAtual(nova);
              const r = await moverEtapaAcao(contatoId, nova);
              if (!r.ok) setErro(r.mensagem);
            });
          }}
          className="campo-entrada"
        >
          {etapas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>
      {erro && <p className="mt-1 text-sm text-red-700">{erro}</p>}
    </div>
  );
}

export function FormInteracao({ contatoId, tipos }: { contatoId: string; tipos: Opcao[] }) {
  const [estado, enviar, pendente] = useActionState<EstadoFormulario, FormData>(registrarInteracaoAcao.bind(null, contatoId), {});
  const e = estado.erros ?? {};
  return (
    // key: depois de salvar, o formulário volta limpo
    <form key={estado.versao ?? 0} action={enviar} className="space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de registro">
        {tipos.map((t) => (
          <label key={t.valor} className="cursor-pointer">
            <input
              type="radio"
              name="tipo"
              value={t.valor}
              defaultChecked={(estado.valores?.tipo ?? tipos[0].valor) === t.valor}
              className="peer sr-only"
            />
            <span className="inline-block rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700 peer-checked:border-marca peer-checked:bg-marca peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-marca/40">
              {t.rotulo}
            </span>
          </label>
        ))}
      </div>
      <label htmlFor="texto" className="sr-only">
        O que aconteceu
      </label>
      <textarea
        id="texto"
        name="texto"
        rows={3}
        required
        placeholder="Ex.: Liguei, ela pediu para retornar na sexta."
        defaultValue={estado.valores?.texto}
        aria-invalid={e.texto ? true : undefined}
        className="campo-entrada"
      />
      {e.texto && <p className="text-sm text-red-700">{e.texto}</p>}
      <details className="text-sm" open={!!estado.valores?.quando}>
        <summary className="cursor-pointer text-stone-600">Aconteceu em outro dia ou horário?</summary>
        <label htmlFor="quando" className="rotulo mt-2">
          Data e hora
        </label>
        <input id="quando" name="quando" type="datetime-local" defaultValue={estado.valores?.quando} className="campo-entrada sm:w-64" />
        {e.quando && <p className="mt-1 text-red-700">{e.quando}</p>}
      </details>
      <button type="submit" className="botao" disabled={pendente}>
        {pendente ? "Salvando…" : "Registrar no histórico"}
      </button>
    </form>
  );
}

export function FormTarefa({ contatoId, sugestaoData }: { contatoId: string; sugestaoData: string }) {
  const [estado, enviar, pendente] = useActionState<EstadoFormulario, FormData>(criarTarefaAcao.bind(null, contatoId), {});
  const e = estado.erros ?? {};
  return (
    <form key={estado.versao ?? 0} action={enviar} className="grid grid-cols-[1fr_auto] gap-2">
      <div className="col-span-2">
        <label htmlFor="titulo" className="sr-only">
          Próxima tarefa
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          placeholder="Próxima tarefa. Ex.: Ligar para confirmar"
          defaultValue={estado.valores?.titulo}
          aria-invalid={e.titulo ? true : undefined}
          className="campo-entrada"
        />
        {e.titulo && <p className="mt-1 text-sm text-red-700">{e.titulo}</p>}
      </div>
      <div>
        <label htmlFor="venceEm" className="sr-only">
          Para quando
        </label>
        <input
          id="venceEm"
          name="venceEm"
          type="date"
          required
          defaultValue={estado.valores?.venceEm ?? sugestaoData}
          aria-invalid={e.venceEm ? true : undefined}
          className="campo-entrada"
        />
        {e.venceEm && <p className="mt-1 text-sm text-red-700">{e.venceEm}</p>}
      </div>
      <button type="submit" className="botao-secundario" disabled={pendente}>
        {pendente ? "Salvando…" : "Agendar"}
      </button>
    </form>
  );
}

export function CaixaTarefa({ id, concluida, titulo }: { id: string; concluida: boolean; titulo: string }) {
  const [marcada, setMarcada] = useOptimistic(concluida);
  const [, iniciar] = useTransition();
  return (
    <input
      type="checkbox"
      checked={marcada}
      aria-label={`${marcada ? "Reabrir" : "Concluir"}: ${titulo}`}
      onChange={(ev) => {
        const valor = ev.target.checked;
        iniciar(async () => {
          setMarcada(valor);
          await marcarTarefaAcao(id, valor);
        });
      }}
      className="mt-0.5 size-5 shrink-0 cursor-pointer accent-(--marca)"
    />
  );
}

export function BotaoExcluir({ contatoId, nome }: { contatoId: string; nome: string }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() => {
        if (confirm(`Excluir ${nome}? O histórico e as tarefas também serão apagados. Não dá para desfazer.`)) {
          iniciar(() => excluirContatoAcao(contatoId));
        }
      }}
      className="text-sm text-red-700 underline underline-offset-4 disabled:opacity-60"
    >
      {pendente ? "Excluindo…" : "Excluir cadastro"}
    </button>
  );
}
