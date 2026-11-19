/** GET /api/v1/configuracao → etapas, origens, tipos de interação e campos extras (para quem integra saber os ids). */
import { configuracao } from "@/config/crm";
import { conferirChaveApi } from "@/lib/autenticacao";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const negado = conferirChaveApi(req);
  if (negado) return negado;
  const { etapas, origens, tiposInteracao, camposExtras, textos } = configuracao;
  return Response.json({ textos, etapas, origens, tiposInteracao, camposExtras });
}
