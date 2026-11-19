/**
 * GET  /api/v1/contatos?telefone=11987654321   procura pelo telefone (ou ?busca=texto)
 * POST /api/v1/contatos                          cria o contato; se o telefone já existir, devolve o existente
 *
 * Pensado para integrações como um atendimento no WhatsApp: a cada conversa nova,
 * o robô chama o POST com o telefone e a primeira mensagem, sem precisar checar antes se o contato existe.
 */
import { configuracao } from "@/config/crm";
import { erroInterno, lerJson, responderFalha, SEM_CACHE } from "@/lib/api";
import { conferirChaveApi } from "@/lib/autenticacao";
import { criarContato, registrarInteracao } from "@/lib/crm";
import { telefoneSoDigitos, telefoneValido } from "@/lib/formato";
import { obterRepositorio } from "@/lib/repositorio";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const negado = conferirChaveApi(req);
  if (negado) return negado;
  const url = new URL(req.url);
  const telefone = telefoneSoDigitos(url.searchParams.get("telefone") ?? "");
  const busca = (url.searchParams.get("busca") ?? "").slice(0, 100);
  if (!telefone && !busca) return Response.json({ mensagem: "Informe ?telefone= ou ?busca=." }, { status: 400 });

  try {
    const repo = await obterRepositorio();
    if (telefone) {
      if (!telefoneValido(telefone)) return Response.json({ mensagem: "Telefone inválido." }, { status: 400 });
      const contato = await repo.buscarContatoPorTelefone(telefone);
      return Response.json({ contatos: contato ? [contato] : [] }, { headers: SEM_CACHE });
    }
    return Response.json({ contatos: await repo.listarContatos({ busca, limite: 20 }) }, { headers: SEM_CACHE });
  } catch (e) {
    return erroInterno("API: falha ao buscar contatos", e);
  }
}

export async function POST(req: Request) {
  const negado = conferirChaveApi(req);
  if (negado) return negado;
  const lido = await lerJson(req);
  if ("erro" in lido) return lido.erro;
  const { interacao, ...dados } = lido.corpo;

  try {
    const repo = await obterRepositorio();
    let criado = true;
    let r = await criarContato(configuracao, repo, dados, { autor: "api" });
    if (!r.ok && r.status === 409 && r.existenteId) {
      const existente = await repo.buscarContato(r.existenteId);
      if (existente) {
        r = { ok: true, contato: existente };
        criado = false;
      }
    }
    if (!r.ok) return responderFalha(r);

    let registro;
    if (interacao !== undefined) {
      const ri = await registrarInteracao(configuracao, repo, r.contato.id, interacao, { autor: "api" });
      if (!ri.ok) return responderFalha({ ...ri, mensagem: `Contato salvo, mas a interação não: ${ri.mensagem}` });
      registro = ri.interacao;
    }
    return Response.json(
      { criado, contato: (await repo.buscarContato(r.contato.id)) ?? r.contato, interacao: registro },
      { status: criado ? 201 : 200, headers: SEM_CACHE },
    );
  } catch (e) {
    return erroInterno("API: falha ao criar contato", e);
  }
}
