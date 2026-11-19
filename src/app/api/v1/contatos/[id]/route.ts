/** GET /api/v1/contatos/:id → contato, histórico e tarefas pendentes. */
import { configuracao } from "@/config/crm";
import { erroInterno, SEM_CACHE } from "@/lib/api";
import { conferirChaveApi } from "@/lib/autenticacao";
import { obterRepositorio } from "@/lib/repositorio";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: RouteContext<"/api/v1/contatos/[id]">) {
  const negado = conferirChaveApi(req);
  if (negado) return negado;
  const { id } = await ctx.params;
  try {
    const repo = await obterRepositorio();
    const contato = await repo.buscarContato(id);
    if (!contato) return Response.json({ mensagem: `${configuracao.textos.contato} não encontrado.` }, { status: 404 });
    const [interacoes, tarefas] = await Promise.all([repo.listarInteracoes(id), repo.listarTarefas({ contatoId: id })]);
    return Response.json({ contato, interacoes, tarefas }, { headers: SEM_CACHE });
  } catch (e) {
    return erroInterno("API: falha ao ler contato", e);
  }
}
