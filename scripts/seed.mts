/**
 * Cria os dados fictícios de exemplo (npm run seed).
 * Usa o Supabase se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estiverem no ambiente; senão, ./.dados.
 * Para recomeçar do zero no modo local, apague a pasta .dados.
 */
import { configuracao } from "../src/config/crm";
import { criarRepositorioLocal } from "../src/lib/armazenamento/local";
import { criarRepositorioSupabase } from "../src/lib/armazenamento/supabase";
import { criarDadosExemplo } from "../src/lib/exemplos";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SCHEMA, DADOS_DIR } = process.env;
const repo =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? criarRepositorioSupabase(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SCHEMA || "mini_crm")
    : criarRepositorioLocal(DADOS_DIR || ".dados");

if ((await repo.contarContatos()) > 0 && !process.argv.includes("--forcar")) {
  console.log(`O armazenamento "${repo.nome}" já tem contatos. Use "npm run seed -- --forcar" para apagar tudo e recriar.`);
  process.exit(0);
}
await repo.limparTudo();
const criados = await criarDadosExemplo(configuracao, repo);
console.log(`${criados} contatos de exemplo criados no armazenamento "${repo.nome}".`);
