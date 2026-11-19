"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { EtiquetaPrazo } from "@/componentes/Etiquetas";
import { dinheiro } from "@/lib/formato";
import { DIAS_PARADO } from "@/lib/indicadores";
import type { Etapa } from "@/lib/tipos";
import { moverEtapaAcao } from "../acoes";

export interface CartaoFunil {
  id: string;
  nome: string;
  etapaId: string;
  origem: string;
  detalhe?: string;
  valorCentavos?: number;
  diasNaEtapa: number;
  proximaTarefa?: { titulo: string; venceEm: string };
}

interface Props {
  etapas: Etapa[];
  cartoes: CartaoFunil[];
  hoje: string;
  mostrarValor: boolean;
}

/** Primeiro olha onde está o dedo/ponteiro; se não estiver sobre nenhuma coluna, usa a área do cartão. */
const colisao: CollisionDetection = (args) => {
  const sob = pointerWithin(args);
  return sob.length ? sob : rectIntersection(args);
};

export function Quadro({ etapas, cartoes, hoje, mostrarValor }: Props) {
  const [erro, setErro] = useState<string>();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const ultimoArraste = useRef(0);

  // Move o cartão na hora; se o servidor recusar, ele volta sozinho para a etapa anterior
  const [lista, moverOtimista] = useOptimistic(cartoes, (atual, { id, etapaId }: { id: string; etapaId: string }) => {
    const movido = atual.find((c) => c.id === id);
    if (!movido) return atual;
    return [{ ...movido, etapaId, diasNaEtapa: 0 }, ...atual.filter((c) => c.id !== id)];
  });

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // No celular: toque e segure para arrastar; deslizar rápido continua rolando a tela
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const nomeDe = (id: string | number) => lista.find((c) => c.id === id)?.nome ?? "cartão";
  const etapaDe = (id: string | number | undefined) => etapas.find((e) => e.id === id)?.nome ?? "fora das etapas";
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Pegou ${nomeDe(active.id)}.`,
    onDragOver: ({ active, over }) => `${nomeDe(active.id)} sobre ${etapaDe(over?.id)}.`,
    onDragEnd: ({ active, over }) => (over ? `${nomeDe(active.id)} movido para ${etapaDe(over.id)}.` : `${nomeDe(active.id)} voltou para o lugar.`),
    onDragCancel: ({ active }) => `Movimento cancelado. ${nomeDe(active.id)} voltou para o lugar.`,
  };

  function aoSoltar({ active, over }: DragEndEvent) {
    setArrastando(null);
    ultimoArraste.current = Date.now();
    const id = String(active.id);
    const etapaId = over ? String(over.id) : null;
    const cartao = lista.find((c) => c.id === id);
    if (!etapaId || !cartao || cartao.etapaId === etapaId) return;
    setErro(undefined);
    iniciar(async () => {
      moverOtimista({ id, etapaId });
      const r = await moverEtapaAcao(id, etapaId);
      if (!r.ok) setErro(r.mensagem ?? "Não foi possível mover. Tente de novo.");
    });
  }

  const emArraste = arrastando ? lista.find((c) => c.id === arrastando) : undefined;

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={colisao}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: {
          draggable: "Para mover um cartão, aperte espaço, use as setas para escolher a etapa e aperte espaço de novo. Esc cancela.",
        },
      }}
      onDragStart={({ active }) => setArrastando(String(active.id))}
      onDragEnd={aoSoltar}
      onDragCancel={() => setArrastando(null)}
    >
      {erro && (
        <p role="alert" className="mx-4 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {erro}
        </p>
      )}
      <div
        className={`mt-4 flex flex-1 gap-3 overflow-x-auto px-4 pb-4 ${arrastando ? "" : "snap-x snap-mandatory md:snap-none"}`}
        style={{ scrollPaddingInline: 16 }}
      >
        {etapas.map((etapa) => {
          const daEtapa = lista.filter((c) => c.etapaId === etapa.id);
          return (
            <Coluna
              key={etapa.id}
              etapa={etapa}
              quantidade={daEtapa.length}
              totalCentavos={mostrarValor ? daEtapa.reduce((s, c) => s + (c.valorCentavos ?? 0), 0) : undefined}
            >
              {daEtapa.map((c) => (
                <CartaoArrastavel key={c.id} cartao={c} parado={etapa.tipo === "aberta" && c.diasNaEtapa > DIAS_PARADO} hoje={hoje} mostrarValor={mostrarValor} ultimoArraste={ultimoArraste} />
              ))}
            </Coluna>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {emArraste && (
          <div className="rotate-2 cursor-grabbing">
            <ConteudoCartao cartao={emArraste} hoje={hoje} mostrarValor={mostrarValor} levantado />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Coluna({ etapa, quantidade, totalCentavos, children }: { etapa: Etapa; quantidade: number; totalCentavos?: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${etapa.nome}: ${quantidade}`}
      className={`flex w-[82vw] max-w-80 shrink-0 snap-start flex-col rounded-xl border bg-stone-100/80 transition sm:w-72 ${
        isOver ? "border-marca bg-marca/5 ring-2 ring-marca/20" : "border-stone-200"
      }`}
    >
      <header className="rounded-t-xl border-t-4 px-3 pt-2.5 pb-2" style={{ borderTopColor: etapa.cor }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">{etapa.nome}</h2>
          <span className="rounded-full bg-white px-2 text-sm font-semibold text-stone-600">{quantidade}</span>
        </div>
        {!!totalCentavos && <p className="text-xs text-stone-500">{dinheiro(totalCentavos, true)}</p>}
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
        {children}
        {quantidade === 0 && <p className="px-2 py-6 text-center text-sm text-stone-400">Solte um cartão aqui</p>}
      </div>
    </section>
  );
}

function CartaoArrastavel({
  cartao,
  parado,
  hoje,
  mostrarValor,
  ultimoArraste,
}: {
  cartao: CartaoFunil;
  parado: boolean;
  hoje: string;
  mostrarValor: boolean;
  ultimoArraste: React.RefObject<number>;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: cartao.id });
  return (
    <Link
      ref={setNodeRef}
      href={`/contatos/${cartao.id}`}
      {...listeners}
      {...attributes}
      aria-roledescription="cartão arrastável"
      onClick={(e) => {
        // Soltar o cartão não deve abrir a página do contato
        if (Date.now() - ultimoArraste.current < 300) e.preventDefault();
      }}
      className={`block touch-manipulation rounded-lg select-none [-webkit-touch-callout:none] ${isDragging ? "opacity-30" : ""}`}
    >
      <ConteudoCartao cartao={cartao} parado={parado} hoje={hoje} mostrarValor={mostrarValor} />
    </Link>
  );
}

function ConteudoCartao({
  cartao,
  parado,
  hoje,
  mostrarValor,
  levantado,
}: {
  cartao: CartaoFunil;
  parado?: boolean;
  hoje: string; mostrarValor: boolean; levantado?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-stone-200 bg-white p-3 text-left transition hover:border-marca/50 ${
        levantado ? "shadow-xl ring-2 ring-marca/30" : "shadow-sm"
      }`}
    >
      <p className="font-semibold leading-snug">{cartao.nome}</p>
      <p className="mt-0.5 text-xs text-stone-500">{[cartao.detalhe, cartao.origem].filter(Boolean).join(" · ")}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-stone-800">{mostrarValor && cartao.valorCentavos ? dinheiro(cartao.valorCentavos, true) : ""}</span>
        <span className={parado ? "font-medium text-amber-700" : "text-stone-400"} title="Dias nesta etapa">
          {cartao.diasNaEtapa === 0 ? "hoje" : `${cartao.diasNaEtapa}d na etapa`}
        </span>
      </div>
      {cartao.proximaTarefa && (
        <p className="mt-2 flex items-center gap-1.5 border-t border-stone-100 pt-2 text-xs text-stone-600">
          <EtiquetaPrazo venceEm={cartao.proximaTarefa.venceEm} hoje={hoje} />
          <span className="truncate">{cartao.proximaTarefa.titulo}</span>
        </p>
      )}
    </div>
  );
}
