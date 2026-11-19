/**
 * Escolhe onde guardar os dados:
 *  - Supabase, se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estiverem definidos;
 *  - senão, disco local (./.dados), que é o jeito mais rápido de rodar a demo.
 * No modo demonstração, o armazenamento vazio recebe dados fictícios de exemplo.
 */
import "server-only";
import { configuracao } from "@/config/crm";
import { configSupabase, modoDemo, pastaDados } from "./ambiente";
import { criarRepositorioLocal } from "./armazenamento/local";
import { criarRepositorioSupabase } from "./armazenamento/supabase";
import type { Repositorio } from "./armazenamento/tipos";
import { criarDadosExemplo } from "./exemplos";

let repo: Repositorio | undefined;
let preparo: Promise<void> | undefined;

export async function obterRepositorio(): Promise<Repositorio> {
  if (!repo) {
    const sb = configSupabase();
    repo = sb ? criarRepositorioSupabase(sb.url, sb.chave, sb.schema) : criarRepositorioLocal(pastaDados);
  }
  if (modoDemo) {
    const r = repo;
    preparo ??= (async () => {
      if ((await r.contarContatos()) === 0) await criarDadosExemplo(configuracao, r);
    })().catch((e) => {
      preparo = undefined;
      throw e;
    });
    await preparo;
  }
  return repo;
}

/** Apaga tudo e recria os dados de exemplo (botão "recomeçar a demonstração"). */
export async function recomecarDemonstracao(): Promise<void> {
  const r = await obterRepositorio();
  await r.limparTudo();
  await criarDadosExemplo(configuracao, r);
}
