"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeContatos, IconeFunil, IconeIntegracao, IconePainel, IconeTarefas } from "./Icones";

const ITENS = [
  { href: "/", rotulo: "Painel", Icone: IconePainel },
  { href: "/funil", rotulo: "Funil", Icone: IconeFunil },
  { href: "/contatos", rotulo: "Contatos", Icone: IconeContatos },
  { href: "/tarefas", rotulo: "Tarefas", Icone: IconeTarefas },
  { href: "/integracao", rotulo: "API", Icone: IconeIntegracao },
];

const ativo = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

interface Props {
  rotuloContatos: string;
  tarefasAtrasadas: number;
}

function useItens(rotuloContatos: string) {
  return ITENS.map((i) => (i.href === "/contatos" ? { ...i, rotulo: rotuloContatos } : i));
}

/** No computador: abas no topo do cabeçalho. */
export function NavegacaoTopo({ rotuloContatos, tarefasAtrasadas }: Props) {
  const pathname = usePathname();
  const itens = useItens(rotuloContatos);

  const selo = (href: string) =>
    href === "/tarefas" && tarefasAtrasadas > 0 ? (
      <span className="ml-1 rounded-full bg-red-600 px-1.5 text-[11px] leading-4 font-bold text-white" title="Tarefas atrasadas">
        {tarefasAtrasadas}
      </span>
    ) : null;

  return (
    <nav aria-label="Principal" className="hidden gap-1 md:flex">
      {itens.map(({ href, rotulo, Icone }) => (
        <Link
          key={href}
          href={href}
          aria-current={ativo(pathname, href) ? "page" : undefined}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 aria-[current=page]:bg-marca/10 aria-[current=page]:text-marca"
        >
          <Icone className="size-4" />
          {rotulo}
          {selo(href)}
        </Link>
      ))}
    </nav>
  );
}

/**
 * No celular: barra fixa embaixo, ao alcance do polegar.
 * Fica fora do cabeçalho de propósito: o backdrop-blur do cabeçalho prenderia o `fixed` dentro dele.
 */
export function NavegacaoInferior({ rotuloContatos, tarefasAtrasadas }: Props) {
  const pathname = usePathname();
  const itens = useItens(rotuloContatos);
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {itens.map(({ href, rotulo, Icone }) => (
        <Link
          key={href}
          href={href}
          aria-current={ativo(pathname, href) ? "page" : undefined}
          className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-stone-500 aria-[current=page]:text-marca"
        >
          <Icone className="size-6" />
          {rotulo}
          {href === "/tarefas" && tarefasAtrasadas > 0 && (
            <span className="absolute top-1 left-1/2 ml-2 rounded-full bg-red-600 px-1.5 text-[10px] leading-4 font-bold text-white">
              {tarefasAtrasadas}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
