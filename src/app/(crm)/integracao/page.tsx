import type { Metadata } from "next";
import { headers } from "next/headers";
import { configuracao } from "@/config/crm";
import { chaveApi, chaveApiDemoAtiva } from "@/lib/ambiente";
import { exigirSessao } from "@/lib/autenticacao";

export const metadata: Metadata = { title: "Integração (API)" };

function Codigo({ children }: { children: string }) {
  return <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-900 p-4 text-[13px] leading-relaxed text-stone-100">{children}</pre>;
}

export default async function Integracao() {
  await exigirSessao();
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const demo = chaveApiDemoAtiva();
  const ligada = !!chaveApi();
  const chave = demo ? chaveApi()! : "SUA_CHAVE";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold">Integração (API)</h1>
      <p className="mt-2 text-stone-700">
        Outros sistemas podem criar contatos e registrar conversas aqui. O uso pensado é um <strong>atendimento no WhatsApp</strong>: quando
        alguém manda mensagem, o robô cria o contato (ou acha o que já existe pelo telefone) e salva a conversa no histórico. A equipe vê tudo
        no funil.
      </p>

      <section className="cartao mt-6 p-5">
        <h2 className="font-semibold">Chave de acesso</h2>
        {!ligada ? (
          <p className="mt-2 text-sm text-stone-700">
            A API está desligada. Defina a variável <code>CRM_API_CHAVE</code> (24 caracteres ou mais) para ligar.
          </p>
        ) : demo ? (
          <p className="mt-2 text-sm text-stone-700">
            Na demonstração a chave é pública: <code className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-amber-900">{chave}</code>
            <br />
            Num cliente real ela fica só na variável <code>CRM_API_CHAVE</code> do servidor.
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-700">
            A chave está na variável <code>CRM_API_CHAVE</code> do servidor. Ela não aparece nesta tela.
          </p>
        )}
        <p className="mt-2 text-sm text-stone-700">
          Envie em todas as chamadas no cabeçalho <code>Authorization: Bearer &lt;chave&gt;</code>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">1. Criar contato (ou achar pelo telefone)</h2>
        <p className="mt-1 text-sm text-stone-700">
          Se o telefone já existir, devolve o contato existente com <code>{`"criado": false`}</code>. O campo <code>interacao</code> é
          opcional e já salva a primeira mensagem no histórico.
        </p>
        <Codigo>{`curl -X POST ${base}/api/v1/contatos \\
  -H "Authorization: Bearer ${chave}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "nome": "Maria Exemplo",
    "telefone": "5511987654321",
    "origem": "whatsapp",
    "extras": { "tratamento": "clareamento" },
    "interacao": { "tipo": "whatsapp", "texto": "Quer saber o preço do clareamento." }
  }'`}</Codigo>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">2. Registrar uma conversa (e mudar a etapa)</h2>
        <p className="mt-1 text-sm text-stone-700">
          <code>quando</code> e <code>etapaId</code> são opcionais. Com <code>etapaId</code>, o contato anda no funil (ex.: o robô agendou a
          avaliação).
        </p>
        <Codigo>{`curl -X POST ${base}/api/v1/contatos/ID_DO_CONTATO/interacoes \\
  -H "Authorization: Bearer ${chave}" \\
  -H "Content-Type: application/json" \\
  -d '{ "tipo": "whatsapp", "texto": "Agendou avaliação para 25/11 às 9h.", "etapaId": "avaliacao" }'`}</Codigo>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Outras rotas</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
          <li>
            <code>GET /api/v1/contatos?telefone=11987654321</code>: procura pelo telefone (ou <code>?busca=</code> por nome).
          </li>
          <li>
            <code>GET /api/v1/contatos/ID</code>: contato, histórico e tarefas pendentes.
          </li>
          <li>
            <code>GET /api/v1/configuracao</code>: etapas, origens e tipos de registro aceitos.
          </li>
        </ul>
      </section>

      <section className="cartao mt-8 overflow-x-auto p-5">
        <h2 className="font-semibold">Valores aceitos</h2>
        <dl className="mt-3 space-y-3 text-sm">
          {[
            ["etapaId", configuracao.etapas.map((e) => [e.id, e.nome])],
            ["origem", configuracao.origens.map((o) => [o.valor, o.rotulo])],
            ["tipo (interação)", configuracao.tiposInteracao.map((o) => [o.valor, o.rotulo])],
          ].map(([campo, valores]) => (
            <div key={campo as string}>
              <dt className="font-medium">{campo as string}</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {(valores as string[][]).map(([v, r]) => (
                  <code key={v} title={r} className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                    {v}
                  </code>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
