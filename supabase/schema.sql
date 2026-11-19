-- Rode uma vez no SQL Editor do Supabase.
-- As tabelas ficam num schema próprio ("mini_crm"), então o CRM pode dividir um projeto
-- do Supabase com outro sistema sem misturar tabelas.
--
-- Depois de rodar, exponha o schema para a API do Supabase:
--   Project Settings → Data API → Exposed schemas → adicione "mini_crm".

create schema if not exists mini_crm;

create table if not exists mini_crm.contatos (
  id              uuid primary key,
  nome            text        not null,
  telefone        text        not null unique, -- só dígitos, com DDD
  email           text,
  origem          text        not null,
  etapa_id        text        not null,
  observacoes     text,
  valor_centavos  bigint,
  extras          jsonb       not null default '{}',
  texto_busca     text        not null, -- nome, e-mail e telefone sem acento, para a busca
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  etapa_desde     timestamptz not null default now(),
  exemplo         boolean     not null default false
);

create index if not exists contatos_atualizado_idx on mini_crm.contatos (atualizado_em desc);
create index if not exists contatos_etapa_idx on mini_crm.contatos (etapa_id);

create table if not exists mini_crm.interacoes (
  id          uuid primary key,
  contato_id  uuid        not null references mini_crm.contatos (id) on delete cascade,
  tipo        text        not null,
  texto       text        not null,
  quando      timestamptz not null,
  autor       text        not null check (autor in ('painel', 'api', 'sistema')),
  criado_em   timestamptz not null default now()
);

create index if not exists interacoes_contato_idx on mini_crm.interacoes (contato_id, quando desc);

create table if not exists mini_crm.tarefas (
  id           uuid primary key,
  contato_id   uuid        not null references mini_crm.contatos (id) on delete cascade,
  titulo       text        not null,
  vence_em     date        not null,
  concluida    boolean     not null default false,
  criado_em    timestamptz not null default now(),
  concluida_em timestamptz
);

create index if not exists tarefas_pendentes_idx on mini_crm.tarefas (vence_em) where not concluida;

-- Dados pessoais: RLS ligado e NENHUMA policy.
-- A chave pública (anon) não lê nada; só o servidor, com a service_role, acessa.
alter table mini_crm.contatos   enable row level security;
alter table mini_crm.interacoes enable row level security;
alter table mini_crm.tarefas    enable row level security;

-- Só o servidor (service_role) usa o schema
grant usage on schema mini_crm to service_role;
grant all on all tables in schema mini_crm to service_role;
alter default privileges in schema mini_crm grant all on tables to service_role;
