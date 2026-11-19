import { prazoEmTexto } from "@/lib/formato";

/** Etiqueta com a cor da etapa do funil. */
export function EtiquetaEtapa({ nome, cor }: { nome: string; cor: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-stone-700">
      <span className="size-2 rounded-full" style={{ background: cor }} aria-hidden />
      {nome}
    </span>
  );
}

/** Prazo de tarefa: vermelho se atrasada, âmbar se hoje. */
export function EtiquetaPrazo({ venceEm, hoje, concluida }: { venceEm: string; hoje: string; concluida?: boolean }) {
  const cor = concluida
    ? "bg-stone-100 text-stone-500"
    : venceEm < hoje
      ? "bg-red-50 text-red-700"
      : venceEm === hoje
        ? "bg-amber-50 text-amber-800"
        : "bg-stone-100 text-stone-600";
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${cor}`}>{prazoEmTexto(venceEm, hoje)}</span>;
}

export function EtiquetaExemplo() {
  return <span className="rounded bg-stone-100 px-1.5 py-0.5 align-middle text-[11px] font-medium text-stone-500">exemplo</span>;
}
