# Mini CRM: contatos, funil arrastável, histórico e tarefas

**Demo no ar:** <https://demo-mini-crm.vercel.app> (o login de demonstração aparece na tela)

> ⚠️ **Projeto de demonstração.** A clínica "Sorriso Claro Odontologia", as pessoas, os telefones e as conversas são **fictícios**.
> Todas as páginas mostram uma faixa avisando disso e não são indexadas pelo Google.
> Não digite dados reais na demo.

CRM enxuto para negócios pequenos que hoje controlam os clientes no caderno, em planilha ou na memória do WhatsApp.
A equipe cadastra quem pediu informação, acompanha cada pessoa num **funil em colunas** (arrastando os cartões, inclusive no celular),
registra **cada conversa no histórico** e agenda o **próximo retorno**. Um **painel** mostra quantos estão em cada etapa e quanto do que foi encerrado virou venda.

O exemplo é uma clínica odontológica. Etapas, origens, tipos de registro e campos ficam num único arquivo de configuração,
então o mesmo sistema serve para escritório de advocacia, estética, imobiliária, escola, prestador de serviço etc.

| Painel | Funil (computador) |
|---|---|
| ![Painel com os números do funil](docs/prints/01-painel.jpg) | ![Funil em colunas](docs/prints/02-funil.jpg) |

| Funil no celular (toque e segure para arrastar) | Contato no celular | Contato: histórico e tarefas |
|---|---|---|
| ![Cartão sendo arrastado no celular](docs/prints/04-funil-celular.jpg) | ![Dados do contato no celular](docs/prints/05-contato-celular.jpg) | ![Página do contato no computador](docs/prints/03-contato.jpg) |

| Integração (API para o atendimento no WhatsApp) |
|---|
| ![Página da API](docs/prints/06-api.jpg) |

## O problema

Em negócio pequeno, o "CRM" costuma ser o WhatsApp da recepção: a conversa some no meio de outras, ninguém lembra de retornar
quem pediu orçamento na semana passada, e não dá para saber de onde vêm os clientes que fecham.
Os CRMs prontos resolvem isso, mas cobram por usuário, têm dezenas de telas e exigem que o negócio se adapte a eles.

## A solução

1. **Contatos** com nome, telefone, e-mail, origem, observações e campos próprios do negócio (aqui: tratamento de interesse e melhor período). Busca por nome, telefone ou e-mail (sem precisar acertar acento) e filtro por origem e etapa. O sistema não deixa cadastrar o mesmo telefone duas vezes e mostra o cadastro que já existe.
2. **Funil em colunas**: arraste o cartão para a próxima etapa. No celular, toque e segure. Cada cartão mostra o valor, há quantos dias está parado e a próxima tarefa.
3. **Histórico** por contato: ligação, WhatsApp, e-mail, consulta ou anotação, com data e hora (dá para registrar algo que aconteceu ontem). Mudanças de etapa entram sozinhas no histórico.
4. **Tarefas** com data: "ligar na sexta", "confirmar avaliação". As atrasadas ficam em vermelho e aparecem no menu.
5. **Painel**: quantos em cada etapa, valor em negociação, conversão (fechados ÷ encerrados), conversão por origem e o que fazer hoje.
6. **API** com chave de acesso para outros sistemas criarem contatos e registrarem conversas (pensada para um atendimento no WhatsApp; veja abaixo).
7. Botão **"WhatsApp"** em cada contato, que abre a conversa (link `wa.me`, sem custo).

## API para integração

O CRM tem uma API HTTP simples, autenticada por chave (`Authorization: Bearer <chave>`).
O uso pensado é um robô de atendimento no WhatsApp: quando alguém manda mensagem, ele chama a API com o telefone e a mensagem;
se o contato não existe, é criado; se já existe, a conversa entra no histórico dele. A equipe acompanha tudo no funil.

| Rota | O que faz |
|---|---|
| `POST /api/v1/contatos` | Cria o contato. Se o telefone já existir, devolve o existente (`"criado": false`). Aceita `interacao` para já salvar a primeira mensagem. |
| `GET /api/v1/contatos?telefone=…` | Procura pelo telefone (ou `?busca=` pelo nome) |
| `GET /api/v1/contatos/:id` | Contato, histórico e tarefas pendentes |
| `POST /api/v1/contatos/:id/interacoes` | Registra uma conversa. Com `etapaId`, também move o contato no funil |
| `GET /api/v1/configuracao` | Etapas, origens e tipos de registro aceitos |

```bash
curl -X POST http://localhost:3000/api/v1/contatos \
  -H "Authorization: Bearer demo-chave-publica-mini-crm" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Exemplo",
    "telefone": "5511987654321",
    "origem": "whatsapp",
    "interacao": { "tipo": "whatsapp", "texto": "Quer saber o preço do clareamento." }
  }'
```

O telefone pode vir em qualquer formato (com ou sem `+55`, parênteses e traço). Exemplos completos estão na tela **API** do próprio sistema.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**, pronto para a Vercel
- **@dnd-kit/core** para arrastar os cartões com mouse, toque e teclado
- **Supabase** (PostgreSQL) para guardar os dados, **opcional**: sem ele, a demo grava em disco
- **zod** para validar o que chega pelas telas e pela API
- **Vitest** para testes, **ESLint** e **GitHub Actions** (lint, tipos, testes e build a cada push)

### Decisões técnicas

- **Regras num lugar só.** Telas (Server Actions) e API chamam as mesmas funções (`src/lib/crm.ts`): mesma validação, mesmo registro automático no histórico, mesma checagem de telefone repetido.
- **Funil que responde na hora.** O cartão muda de coluna assim que você solta (`useOptimistic`) e o servidor confirma em seguida. Se der erro, ele volta sozinho.
- **Arrastar no celular sem atrapalhar a rolagem.** Deslizar rápido rola o funil para os lados; tocar e segurar pega o cartão. Na página do contato também há um seletor de etapa, para quem prefere não arrastar.
- **Login próprio em vez de Supabase Auth.** Um cookie assinado com HMAC resolve o acesso da equipe sem depender de outro serviço. Para vários usuários com permissões diferentes, trocar por Supabase Auth é direto.
- **Armazenamento trocável.** Uma interface `Repositorio` com duas implementações: disco local (para rodar a demo sem conta nenhuma) e Supabase (para produção).
- **Schema próprio no Supabase.** As tabelas ficam no schema `mini_crm`, então o CRM pode dividir um projeto do Supabase com outro sistema sem misturar tabelas.
- **Datas no fuso do negócio.** "Hoje", "atrasada" e o horário das conversas são calculados no fuso configurado, não no do servidor (que na Vercel é UTC).
- **Dinheiro em centavos.** Valores são guardados como inteiros, sem erro de arredondamento.

## Dados pessoais e LGPD

- Tudo só é acessado com login. A API exige chave.
- No Supabase, as tabelas têm **RLS ligado e nenhuma policy**: a chave pública (anon) não lê nada; só o servidor, com a `service_role`, acessa.
- O cookie de sessão é `httpOnly`, assinado e expira em 8 horas.
- As páginas pedem para não ser indexadas por buscadores.
- Excluir um contato apaga junto o histórico e as tarefas dele.

Num projeto real ainda é preciso definir com o cliente: quem tem acesso, prazo de guarda e como atender pedidos de exclusão.

## Como rodar localmente

Precisa de Node.js 22 ou mais novo.

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>. Sem nenhuma configuração, a demo:

- grava os dados em `.dados/crm.json` (fora do Git);
- cria 20 contatos fictícios, com histórico e tarefas, na primeira vez;
- mostra o **login de demonstração** na tela: `recepcao@sorrisoclaro.exemplo` / `demo1234`;
- aceita a chave pública de demonstração na API: `demo-chave-publica-mini-crm`.

Para recomeçar: botão "Recomeçar com os dados de exemplo" no fim do painel, ou `npm run seed -- --forcar`.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes (formatos, validação, regras do CRM, indicadores, API e sessão) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos do TypeScript |
| `npm run build` | Build de produção |
| `npm run seed` | Cria os dados fictícios de exemplo (se estiver vazio; `-- --forcar` apaga e recria) |

## Como adaptar para outro cliente

Edite **só** o arquivo [`src/config/crm.ts`](src/config/crm.ts):

- `negocio`: nome, subtítulo, cor principal e fuso horário;
- `demonstracao`: apague este bloco num cliente real (some a faixa de aviso);
- `textos`: como o negócio chama quem está no funil ("Contato", "Paciente", "Cliente") e o nome do campo de valor (apague `valor` se não fizer sentido);
- `etapas`: as colunas do funil, com cor e tipo (`aberta`, `ganho` ou `perdido`; os dois últimos entram na conversão);
- `origens`: de onde os contatos vêm (a primeira é a padrão da API);
- `tiposInteracao`: os tipos de registro do histórico;
- `camposExtras`: campos a mais no cadastro, de texto ou de escolha.

Exemplo para um escritório de advocacia:

```ts
etapas: [
  { id: "triagem", nome: "Triagem", tipo: "aberta", cor: "#64748b" },
  { id: "consulta", nome: "Consulta marcada", tipo: "aberta", cor: "#7c3aed" },
  { id: "proposta", nome: "Proposta de honorários", tipo: "aberta", cor: "#d97706" },
  { id: "contratado", nome: "Contratou", tipo: "ganho", cor: "#16a34a" },
  { id: "desistiu", nome: "Não contratou", tipo: "perdido", cor: "#dc2626" },
],
camposExtras: [
  { tipo: "escolha", id: "area", rotulo: "Área", opcoes: [
    { valor: "trabalhista", rotulo: "Trabalhista" },
    { valor: "familia", rotulo: "Família" },
  ] },
],
```

As telas, a validação, o painel e a API se ajustam sozinhos.

## Publicar com Supabase e Vercel

1. No Supabase, rode [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor (cria o schema `mini_crm` e as tabelas). Depois, em **Project Settings → Data API → Exposed schemas**, adicione `mini_crm`.
2. Na Vercel, importe o repositório e defina as variáveis de ambiente (veja [`.env.example`](.env.example)):
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`;
   - `SESSAO_SEGREDO`, com 32 caracteres aleatórios ou mais (obrigatório em produção);
   - `PAINEL_EMAIL` e `PAINEL_SENHA`;
   - `CRM_API_CHAVE`, com 24 caracteres ou mais, para ligar a API;
   - `MODO_DEMO=false` num cliente real (desliga o login e a chave de demonstração e os dados de exemplo).
3. Opcional: `npm run seed` com as variáveis do Supabase cria os dados de exemplo lá.

> Na Vercel o disco não é permanente, então em produção o Supabase é obrigatório.
> O `vercel.json` coloca as funções em São Paulo (`gru1`), perto do banco do Supabase (`sa-east-1`).

## Limites conhecidos

- Um único login para a equipe. Vários usuários, cada um com seus contatos, pedem Supabase Auth e um campo "responsável".
- A ordem dos cartões dentro da coluna é sempre "mais recente primeiro"; não dá para reordenar à mão.
- Não há importação de planilha nem envio de mensagens pelo WhatsApp (o botão só abre a conversa).
- Não há limite de chamadas por IP na API. Em produção, vale somar um limitador (Vercel Firewall ou Upstash).
- Na demo pública, qualquer pessoa com o login de demonstração vê e altera os mesmos dados. Por isso o aviso para não usar dados reais e o botão de recomeçar.

## Estrutura

```
src/config/crm.ts            etapas, origens, campos e textos (o que muda por cliente)
src/lib/crm.ts               regras: criar, editar, mudar etapa, registrar conversa, tarefas
src/lib/validacao.ts         validação (telas e API)
src/lib/indicadores.ts       números do painel
src/lib/armazenamento/       disco local e Supabase
src/lib/exemplos.ts          dados fictícios da demonstração
src/lib/sessao.ts            cookie de sessão assinado
src/app/(crm)/               painel, funil, contatos, tarefas e página da API
src/app/api/v1/              API para integrações
supabase/schema.sql          tabelas do Supabase
tests/                       testes com Vitest
```

## Como foi feito

Desenvolvido com o Claude Code (IA) sob minha direção: defini o escopo e as regras de negócio, aprovei as decisões técnicas e revisei e testei o resultado. É a mesma forma como trabalho nos projetos de clientes.

---

Feito por [Fernando Tenório](https://github.com/dotenorio) como projeto de portfólio.
