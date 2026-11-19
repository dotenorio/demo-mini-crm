import Link from "next/link";
import { configuracao } from "@/config/crm";
import { NavegacaoInferior, NavegacaoTopo } from "@/componentes/Navegacao";
import { exigirSessao } from "@/lib/autenticacao";
import { hojeNoFuso } from "@/lib/formato";
import { obterRepositorio } from "@/lib/repositorio";
import { sair } from "../acoes-sessao";

/** Moldura das telas internas: cabeçalho, navegação e botão de sair. */
export default async function LayoutCrm({ children }: LayoutProps<"/">) {
  const sessao = await exigirSessao();
  const repo = await obterRepositorio();
  const hoje = hojeNoFuso(configuracao.negocio.fusoHorario);
  const atrasadas = (await repo.listarTarefas()).filter((t) => t.venceEm < hoje).length;

  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5">
          <Link href="/" className="mr-auto min-w-0 md:mr-4">
            <span className="block truncate font-bold text-marca">{configuracao.negocio.nome}</span>
            <span className="block text-xs text-stone-500">CRM</span>
          </Link>
          <div className="md:mr-auto">
            <NavegacaoTopo rotuloContatos={configuracao.textos.contatos} tarefasAtrasadas={atrasadas} />
          </div>
          <form action={sair} className="flex items-center gap-3 text-sm text-stone-600">
            <span className="hidden lg:inline">{sessao.email}</span>
            <button type="submit" className="botao-secundario px-3 py-1.5 text-sm">
              Sair
            </button>
          </form>
        </div>
      </header>
      {children}
      <NavegacaoInferior rotuloContatos={configuracao.textos.contatos} tarefasAtrasadas={atrasadas} />
    </div>
  );
}
