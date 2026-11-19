/**
 * ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA TROCAR PARA OUTRO CLIENTE.
 *
 * Aqui ficam o nome do negócio, as etapas do funil, as origens dos contatos,
 * os tipos de registro do histórico e os campos a mais do cadastro.
 * As telas, a validação, o painel e a API são montados a partir daqui.
 *
 * Dicas:
 *  - Mudou o id de uma etapa ou origem? Os contatos antigos guardam o id antigo.
 *    Prefira mudar só o `nome`/`rotulo` e manter o `id`.
 *  - Etapa "ganho" e "perdido" encerram o negócio e entram no cálculo de conversão.
 *
 * ATENÇÃO: o negócio abaixo é FICTÍCIO. É só uma demonstração.
 */
import type { ConfiguracaoCrm } from "@/lib/tipos";

export const configuracao: ConfiguracaoCrm = {
  negocio: {
    nome: "Sorriso Claro Odontologia",
    subtitulo: "Clínica fictícia · São Paulo/SP",
    corPrimaria: "#0f766e",
    fusoHorario: "America/Sao_Paulo",
  },

  demonstracao: {
    texto: "Demonstração com clínica e dados fictícios. Não digite dados reais.",
    link: {
      texto: "Ver o código no GitHub",
      url: "https://github.com/dotenorio/demo-mini-crm",
    },
  },

  textos: {
    contato: "Contato",
    contatos: "Contatos",
    valor: "Valor do orçamento",
  },

  etapas: [
    { id: "novo", nome: "Novo contato", tipo: "aberta", cor: "#64748b" },
    { id: "conversa", nome: "Em conversa", tipo: "aberta", cor: "#0284c7" },
    { id: "avaliacao", nome: "Avaliação agendada", tipo: "aberta", cor: "#7c3aed" },
    { id: "orcamento", nome: "Orçamento enviado", tipo: "aberta", cor: "#d97706" },
    { id: "fechado", nome: "Tratamento fechado", tipo: "ganho", cor: "#16a34a" },
    { id: "perdido", nome: "Não fechou", tipo: "perdido", cor: "#dc2626" },
  ],

  /** A primeira é a padrão quando a API não informa a origem. */
  origens: [
    { valor: "whatsapp", rotulo: "WhatsApp" },
    { valor: "instagram", rotulo: "Instagram" },
    { valor: "google", rotulo: "Google" },
    { valor: "indicacao", rotulo: "Indicação" },
    { valor: "site", rotulo: "Site" },
  ],

  tiposInteracao: [
    { valor: "anotacao", rotulo: "Anotação" },
    { valor: "ligacao", rotulo: "Ligação" },
    { valor: "whatsapp", rotulo: "WhatsApp" },
    { valor: "email", rotulo: "E-mail" },
    { valor: "consulta", rotulo: "Avaliação na clínica" },
  ],

  camposExtras: [
    {
      tipo: "escolha",
      id: "tratamento",
      rotulo: "Tratamento de interesse",
      opcoes: [
        { valor: "implante", rotulo: "Implante" },
        { valor: "ortodontia", rotulo: "Aparelho (ortodontia)" },
        { valor: "clareamento", rotulo: "Clareamento" },
        { valor: "lentes", rotulo: "Lentes de contato dental" },
        { valor: "checkup", rotulo: "Limpeza e check-up" },
        { valor: "outro", rotulo: "Outro" },
      ],
    },
    {
      tipo: "escolha",
      id: "periodo",
      rotulo: "Melhor período para contato",
      opcoes: [
        { valor: "manha", rotulo: "Manhã" },
        { valor: "tarde", rotulo: "Tarde" },
        { valor: "noite", rotulo: "Noite" },
      ],
    },
  ],
};
