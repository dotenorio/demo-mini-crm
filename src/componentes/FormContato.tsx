"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarContatoAcao, type EstadoFormulario } from "@/app/(crm)/acoes";
import { centavosParaCampo } from "@/lib/formato";
import type { ConfiguracaoCrm, Contato } from "@/lib/tipos";

interface Props {
  config: ConfiguracaoCrm;
  /** Sem contato = cadastro novo. */
  contato?: Contato;
}

function Campo({ id, rotulo, erro, children }: { id: string; rotulo: string; erro?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="mt-1 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}

export function FormContato({ config, contato }: Props) {
  const acao = salvarContatoAcao.bind(null, contato?.id ?? null);
  const [estado, enviar, pendente] = useActionState<EstadoFormulario, FormData>(acao, {});
  const e = estado.erros ?? {};
  // Depois de um erro, mantém o que foi digitado
  const v = (campo: string, atual?: string) => estado.valores?.[campo] ?? atual ?? "";
  const invalido = (campo: string) => (e[campo] ? { "aria-invalid": true, "aria-describedby": `${campo}-erro` } : {});

  return (
    <form action={enviar} className="space-y-5" noValidate>
      {estado.mensagem && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {estado.mensagem}{" "}
          {estado.existenteId && (
            <Link href={`/contatos/${estado.existenteId}`} className="font-semibold underline underline-offset-4">
              Abrir o cadastro existente
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Campo id="nome" rotulo="Nome *" erro={e.nome}>
            <input id="nome" name="nome" required autoComplete="off" defaultValue={v("nome", contato?.nome)} className="campo-entrada" {...invalido("nome")} />
          </Campo>
        </div>
        <Campo id="telefone" rotulo="Telefone / WhatsApp *" erro={e.telefone}>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            required
            placeholder="(11) 98765-4321"
            defaultValue={v("telefone", contato?.telefone)}
            className="campo-entrada"
            {...invalido("telefone")}
          />
        </Campo>
        <Campo id="email" rotulo="E-mail" erro={e.email}>
          <input id="email" name="email" type="email" inputMode="email" defaultValue={v("email", contato?.email)} className="campo-entrada" {...invalido("email")} />
        </Campo>
        <Campo id="origem" rotulo="Origem *" erro={e.origem}>
          <select id="origem" name="origem" defaultValue={v("origem", contato?.origem ?? config.origens[0].valor)} className="campo-entrada" {...invalido("origem")}>
            {config.origens.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="etapaId" rotulo="Etapa do funil" erro={e.etapaId}>
          <select id="etapaId" name="etapaId" defaultValue={v("etapaId", contato?.etapaId ?? config.etapas[0].id)} className="campo-entrada">
            {config.etapas.map((et) => (
              <option key={et.id} value={et.id}>
                {et.nome}
              </option>
            ))}
          </select>
        </Campo>

        {config.camposExtras.map((campo) => {
          const nome = `extra_${campo.id}`;
          const atual = v(nome, contato?.extras[campo.id]);
          return (
            <Campo key={campo.id} id={nome} rotulo={campo.rotulo} erro={e[campo.id]}>
              {campo.tipo === "escolha" ? (
                <select id={nome} name={nome} defaultValue={atual} className="campo-entrada">
                  <option value="">—</option>
                  {campo.opcoes.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.rotulo}
                    </option>
                  ))}
                </select>
              ) : (
                <input id={nome} name={nome} defaultValue={atual} placeholder={campo.placeholder} className="campo-entrada" />
              )}
            </Campo>
          );
        })}

        {config.textos.valor && (
          <Campo id="valor" rotulo={`${config.textos.valor} (R$)`} erro={e.valor}>
            <input
              id="valor"
              name="valor"
              inputMode="decimal"
              placeholder="Ex.: 3.500,00"
              defaultValue={v("valor", centavosParaCampo(contato?.valorCentavos))}
              className="campo-entrada"
              {...invalido("valor")}
            />
          </Campo>
        )}

        <div className="sm:col-span-2">
          <Campo id="observacoes" rotulo="Observações" erro={e.observacoes}>
            <textarea id="observacoes" name="observacoes" rows={4} defaultValue={v("observacoes", contato?.observacoes)} className="campo-entrada" />
          </Campo>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="botao" disabled={pendente}>
          {pendente ? "Salvando…" : contato ? "Salvar alterações" : `Cadastrar ${config.textos.contato.toLowerCase()}`}
        </button>
        <Link href={contato ? `/contatos/${contato.id}` : "/contatos"} className="botao-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
