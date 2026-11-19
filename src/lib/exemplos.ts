/**
 * Dados FICTÍCIOS para o modo demonstração (o CRM não começa vazio).
 * Nomes inventados, telefones na faixa (11) 90000-xxxx e e-mails @exemplo.com.
 * As datas são relativas a "agora", então o funil sempre parece vivo.
 */
import { randomUUID } from "node:crypto";
import type { Repositorio } from "./armazenamento/tipos";
import { hojeNoFuso, somarDias } from "./formato";
import type { ConfiguracaoCrm, Contato, Interacao, Tarefa } from "./tipos";

interface Exemplo {
  nome: string;
  origem: string;
  etapa: string;
  tratamento: string;
  periodo?: string;
  valor?: number;
  /** Há quantos dias o contato chegou. */
  chegou: number;
  /** Há quantos dias está na etapa atual. */
  naEtapa: number;
  obs?: string;
  historico: [diasAtras: number, tipo: string, texto: string][];
  /** Próxima tarefa: [daqui a quantos dias (negativo = atrasada), título]. */
  tarefa?: [number, string];
}

const EXEMPLOS: Exemplo[] = [
  {
    nome: "Ana Beatriz Fictícia",
    origem: "instagram",
    etapa: "novo",
    tratamento: "clareamento",
    chegou: 0,
    naEtapa: 0,
    historico: [[0, "whatsapp", "Perguntou o preço do clareamento depois de ver o post de antes e depois."]],
    tarefa: [0, "Responder com valores e horários livres"],
  },
  {
    nome: "Bruno Exemplo Santos",
    origem: "google",
    etapa: "novo",
    tratamento: "implante",
    periodo: "noite",
    chegou: 1,
    naEtapa: 1,
    historico: [[1, "anotacao", "Preencheu o formulário do site às 23h. Quer saber se parcela."]],
    tarefa: [0, "Ligar depois das 18h"],
  },
  {
    nome: "Camila Demonstração Rocha",
    origem: "whatsapp",
    etapa: "novo",
    tratamento: "checkup",
    chegou: 2,
    naEtapa: 2,
    historico: [[2, "whatsapp", "Mandou áudio pedindo horário para limpeza."]],
  },
  {
    nome: "Diego Teste Almeida",
    origem: "indicacao",
    etapa: "conversa",
    tratamento: "ortodontia",
    periodo: "tarde",
    valor: 4800,
    chegou: 6,
    naEtapa: 4,
    obs: "Indicado pela Elisa. Tem 16 anos, a mãe é quem decide.",
    historico: [
      [6, "whatsapp", "Mãe pediu informações sobre aparelho autoligado."],
      [4, "ligacao", "Expliquei as opções. Vai conversar com o pai e retornar."],
    ],
    tarefa: [1, "Mandar fotos de casos de aparelho autoligado"],
  },
  {
    nome: "Elisa Modelo Carvalho",
    origem: "instagram",
    etapa: "conversa",
    tratamento: "lentes",
    valor: 12000,
    chegou: 9,
    naEtapa: 8,
    historico: [
      [9, "whatsapp", "Quer lentes nos 6 dentes da frente para o casamento em março."],
      [8, "whatsapp", "Mandei o vídeo explicando o procedimento."],
    ],
    tarefa: [-2, "Cobrar retorno sobre a avaliação"],
  },
  {
    nome: "Felipe Amostra Lima",
    origem: "site",
    etapa: "conversa",
    tratamento: "implante",
    periodo: "manha",
    chegou: 3,
    naEtapa: 3,
    historico: [[3, "email", "Pediu orçamento de implante unitário por e-mail."]],
    tarefa: [2, "Enviar tabela de valores por e-mail"],
  },
  {
    nome: "Giovana Simulada Pereira",
    origem: "whatsapp",
    etapa: "conversa",
    tratamento: "clareamento",
    chegou: 12,
    naEtapa: 11,
    historico: [[12, "whatsapp", "Perguntou se clareamento caseiro funciona. Ficou de pensar."]],
  },
  {
    nome: "Henrique Ilustrativo Costa",
    origem: "google",
    etapa: "avaliacao",
    tratamento: "implante",
    valor: 9500,
    chegou: 10,
    naEtapa: 2,
    obs: "Perdeu dois dentes de baixo. Tem receio de cirurgia.",
    historico: [
      [10, "ligacao", "Ligou pelo anúncio do Google. Muito interessado."],
      [2, "whatsapp", "Avaliação marcada para quinta às 9h."],
    ],
    tarefa: [3, "Confirmar avaliação na véspera"],
  },
  {
    nome: "Isabela Hipotética Nunes",
    origem: "indicacao",
    etapa: "avaliacao",
    tratamento: "ortodontia",
    periodo: "tarde",
    valor: 5200,
    chegou: 15,
    naEtapa: 5,
    historico: [
      [15, "whatsapp", "Indicada pela tia, que já é paciente."],
      [5, "ligacao", "Agendada avaliação com a ortodontista."],
    ],
    tarefa: [1, "Confirmar avaliação na véspera"],
  },
  {
    nome: "João Pedro Exemplar",
    origem: "instagram",
    etapa: "avaliacao",
    tratamento: "lentes",
    valor: 15000,
    chegou: 7,
    naEtapa: 1,
    historico: [[1, "whatsapp", "Agendou avaliação pelo WhatsApp para sábado."]],
    tarefa: [4, "Separar fotos de casos de lentes para mostrar"],
  },
  {
    nome: "Larissa Teste Moreira",
    origem: "site",
    etapa: "orcamento",
    tratamento: "implante",
    valor: 18500,
    chegou: 20,
    naEtapa: 6,
    obs: "Protocolo superior. Quer pagar em 12x.",
    historico: [
      [20, "email", "Pediu informações sobre protocolo."],
      [9, "consulta", "Fez a avaliação e a tomografia. Caso indicado para protocolo."],
      [6, "email", "Orçamento enviado com 3 formas de pagamento."],
    ],
    tarefa: [-1, "Ligar para tirar dúvidas do orçamento"],
  },
  {
    nome: "Marcos Fictício Ribeiro",
    origem: "indicacao",
    etapa: "orcamento",
    tratamento: "ortodontia",
    periodo: "noite",
    valor: 6400,
    chegou: 18,
    naEtapa: 3,
    historico: [
      [18, "ligacao", "Indicado por paciente. Quer alinhadores invisíveis."],
      [5, "consulta", "Avaliação feita. Escaneamento digital agendado."],
      [3, "whatsapp", "Orçamento dos alinhadores enviado."],
    ],
    tarefa: [2, "Retornar sobre o orçamento"],
  },
  {
    nome: "Natália Amostra Dias",
    origem: "instagram",
    etapa: "orcamento",
    tratamento: "clareamento",
    valor: 1200,
    chegou: 14,
    naEtapa: 10,
    historico: [
      [12, "consulta", "Avaliação feita. Clareamento de consultório + caseiro."],
      [10, "whatsapp", "Orçamento enviado. Disse que está comparando com outra clínica."],
    ],
  },
  {
    nome: "Otávio Demonstrativo Melo",
    origem: "google",
    etapa: "fechado",
    tratamento: "implante",
    valor: 8900,
    chegou: 35,
    naEtapa: 12,
    historico: [
      [35, "ligacao", "Chegou pelo Google procurando implante."],
      [25, "consulta", "Avaliação e tomografia."],
      [12, "anotacao", "Fechou o implante em 10x. Cirurgia marcada."],
    ],
  },
  {
    nome: "Paula Simulação Teixeira",
    origem: "indicacao",
    etapa: "fechado",
    tratamento: "lentes",
    valor: 14000,
    chegou: 40,
    naEtapa: 20,
    historico: [
      [40, "whatsapp", "Indicada pela irmã, que já é paciente. Quer lentes."],
      [30, "consulta", "Avaliação e mock-up feitos."],
      [20, "anotacao", "Contrato assinado. Entrada paga."],
    ],
  },
  {
    nome: "Rafael Ilustração Gomes",
    origem: "whatsapp",
    etapa: "fechado",
    tratamento: "checkup",
    valor: 350,
    chegou: 8,
    naEtapa: 5,
    historico: [
      [8, "whatsapp", "Pediu horário para limpeza."],
      [5, "consulta", "Limpeza feita. Retorno em 6 meses."],
    ],
    tarefa: [175, "Lembrar do retorno de 6 meses"],
  },
  {
    nome: "Sabrina Exemplo Freitas",
    origem: "instagram",
    etapa: "fechado",
    tratamento: "clareamento",
    valor: 1200,
    chegou: 22,
    naEtapa: 15,
    historico: [
      [22, "whatsapp", "Veio pelo sorteio do Instagram."],
      [15, "consulta", "Fechou o clareamento combinado."],
    ],
  },
  {
    nome: "Thiago Modelo Barros",
    origem: "site",
    etapa: "perdido",
    tratamento: "implante",
    valor: 9500,
    chegou: 45,
    naEtapa: 25,
    obs: "Achou caro. Fechou com clínica popular perto de casa.",
    historico: [
      [45, "email", "Pediu orçamento pelo site."],
      [30, "consulta", "Avaliação feita."],
      [25, "ligacao", "Desistiu por causa do preço."],
    ],
  },
  {
    nome: "Vanessa Teste Cardoso",
    origem: "instagram",
    etapa: "perdido",
    tratamento: "lentes",
    valor: 12000,
    chegou: 50,
    naEtapa: 30,
    historico: [
      [50, "whatsapp", "Pediu preço das lentes."],
      [30, "whatsapp", "Parou de responder depois do orçamento."],
    ],
  },
  {
    nome: "William Fictício Prado",
    origem: "google",
    etapa: "perdido",
    tratamento: "ortodontia",
    chegou: 28,
    naEtapa: 18,
    historico: [
      [28, "ligacao", "Queria só manutenção de aparelho de outra clínica."],
      [18, "anotacao", "Não atendemos manutenção de terceiros. Encerrado."],
    ],
  },
];

/** Cria os dados de exemplo. Devolve quantos contatos foram criados. */
export async function criarDadosExemplo(config: ConfiguracaoCrm, repo: Repositorio, agora = new Date()): Promise<number> {
  const etapas = new Set(config.etapas.map((e) => e.id));
  const origens = new Set(config.origens.map((o) => o.valor));
  const tipos = new Set(config.tiposInteracao.map((o) => o.valor));
  const hoje = hojeNoFuso(config.negocio.fusoHorario, agora);
  // Volta "n dias" e ajusta a hora, para os registros não ficarem todos no mesmo minuto
  const diasAtras = (n: number, minutos = 0) => new Date(agora.getTime() - n * 86_400_000 - minutos * 60_000).toISOString();

  let criados = 0;
  for (const [i, ex] of EXEMPLOS.entries()) {
    // Se alguém trocou a configuração, pula o que não existe mais
    if (!etapas.has(ex.etapa) || !origens.has(ex.origem)) continue;
    const ultimo = Math.min(ex.chegou, ex.naEtapa, ...ex.historico.map((h) => h[0]));
    const contato: Contato = {
      id: randomUUID(),
      nome: ex.nome,
      telefone: `1190000${String(1001 + i * 37).padStart(4, "0")}`,
      email: i % 3 === 0 ? undefined : `${ex.nome.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@exemplo.com`,
      origem: ex.origem,
      etapaId: ex.etapa,
      observacoes: ex.obs,
      valorCentavos: ex.valor === undefined ? undefined : ex.valor * 100,
      extras: { tratamento: ex.tratamento, ...(ex.periodo ? { periodo: ex.periodo } : {}) },
      criadoEm: diasAtras(ex.chegou, 90 + i * 7),
      atualizadoEm: diasAtras(ultimo, i * 3),
      etapaDesde: diasAtras(ex.naEtapa, 30 + i),
      exemplo: true,
    };
    await repo.salvarContato(contato);

    const registros: Interacao[] = [
      {
        id: randomUUID(),
        contatoId: contato.id,
        tipo: "sistema",
        texto: "Contato criado (dados de exemplo).",
        quando: contato.criadoEm,
        autor: "sistema",
        criadoEm: contato.criadoEm,
      },
      ...ex.historico
        .filter(([, tipo]) => tipos.has(tipo))
        .map(([dias, tipo, texto], j): Interacao => {
          const quando = diasAtras(dias, 60 - j * 5 + i);
          return { id: randomUUID(), contatoId: contato.id, tipo, texto, quando, autor: "painel", criadoEm: quando };
        }),
    ];
    for (const r of registros) await repo.salvarInteracao(r);

    if (ex.tarefa) {
      const tarefa: Tarefa = {
        id: randomUUID(),
        contatoId: contato.id,
        titulo: ex.tarefa[1],
        venceEm: somarDias(hoje, ex.tarefa[0]),
        concluida: false,
        criadoEm: diasAtras(Math.max(0, ultimo)),
      };
      await repo.salvarTarefa(tarefa);
    }
    criados++;
  }
  return criados;
}
