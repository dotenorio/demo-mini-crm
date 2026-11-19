/** Formatação e conversões usadas no navegador e no servidor (sem dependências). */

/** Remove acentos e caixa para a busca. */
export function normalizarBusca(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "+55 (11) 98765-4321" → "11987654321". Tira o 55 do país quando vem junto (como no WhatsApp). */
export function telefoneSoDigitos(v: string): string {
  const n = v.replace(/\D/g, "");
  return n.replace(/^55(?=\d{10,11}$)/, "");
}

/** DDD válido (11 a 99) + 8 ou 9 dígitos. */
export function telefoneValido(digitos: string): boolean {
  return /^[1-9][1-9]\d{8,9}$/.test(digitos);
}

export function telefoneFormatado(v: string): string {
  const n = telefoneSoDigitos(v);
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return v;
}

/** Link para abrir a conversa no WhatsApp (wa.me não precisa da API paga). */
export const linkWhatsapp = (telefone: string) => `https://wa.me/55${telefoneSoDigitos(telefone)}`;

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const BRL_INTEIRO = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function dinheiro(centavos: number, inteiro = false): string {
  return (inteiro ? BRL_INTEIRO : BRL).format(centavos / 100);
}

/** "1.234,56", "1234.56", "R$ 1.234" → centavos. Vazio → undefined. Inválido → NaN. */
export function valorParaCentavos(texto: string): number | undefined {
  let t = texto.replace(/R\$|\s/g, "");
  if (!t) return undefined;
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  return Math.round(Number(t) * 100);
}

/** Centavos → texto para preencher o campo do formulário ("1234,50"). */
export const centavosParaCampo = (c?: number) => (c === undefined ? "" : (c / 100).toFixed(2).replace(".", ",").replace(/,00$/, ""));

function partesNoFuso(data: Date, fuso: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(data);
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return { ano: v("year"), mes: v("month"), dia: v("day"), hora: v("hour"), minuto: v("minute"), segundo: v("second") };
}

/** Data de hoje no fuso do negócio: "2026-11-19". */
export function hojeNoFuso(fuso: string, agora = new Date()): string {
  const p = partesNoFuso(agora, fuso);
  return `${p.ano}-${p.mes}-${p.dia}`;
}

/** "2026-11-19" + 3 → "2026-11-22" */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Diferença em dias entre duas datas "AAAA-MM-DD" (b - a). */
export function diasEntreDatas(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/** "2026-11-19" → "19/11/2026" */
export function dataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** ISO UTC → "19/11/2026 14:32" no fuso do negócio. */
export function dataHoraBr(iso: string, fuso: string): string {
  const p = partesNoFuso(new Date(iso), fuso);
  return `${p.dia}/${p.mes}/${p.ano} ${p.hora}:${p.minuto}`;
}

/** ISO UTC → "2026-11-19T14:32" no fuso do negócio (valor de um <input type="datetime-local">). */
export function utcParaCampoDataHora(iso: string, fuso: string): string {
  const p = partesNoFuso(new Date(iso), fuso);
  return `${p.ano}-${p.mes}-${p.dia}T${p.hora}:${p.minuto}`;
}

/** "2026-11-19T14:32" no fuso do negócio → ISO UTC. Devolve null se o texto não for uma data. */
export function campoDataHoraParaUtc(valor: string, fuso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor);
  if (!m) return null;
  const [ano, mes, dia, hora, minuto] = m.slice(1).map(Number);
  const desejado = Date.UTC(ano, mes - 1, dia, hora, minuto);
  if (Number.isNaN(desejado) || new Date(desejado).getUTCDate() !== dia) return null;
  // Acha o deslocamento do fuso naquele instante (duas passadas cobrem a troca de horário de verão)
  let utc = desejado;
  for (let i = 0; i < 2; i++) {
    const p = partesNoFuso(new Date(utc), fuso);
    const visto = Date.UTC(+p.ano, +p.mes - 1, +p.dia, +p.hora, +p.minuto);
    utc += desejado - visto;
  }
  return new Date(utc).toISOString();
}

/** Prazo de uma tarefa em palavras: "hoje", "amanhã", "atrasada 3 dias", "em 5 dias". */
export function prazoEmTexto(venceEm: string, hoje: string): string {
  const d = diasEntreDatas(hoje, venceEm);
  if (d === 0) return "hoje";
  if (d === 1) return "amanhã";
  if (d === -1) return "atrasada 1 dia";
  if (d < 0) return `atrasada ${-d} dias`;
  if (d < 7) return `em ${d} dias`;
  return dataBr(venceEm);
}

/** Dias inteiros desde um instante (ISO) até agora. */
export function diasDesde(iso: string, agora = new Date()): number {
  return Math.max(0, Math.floor((agora.getTime() - Date.parse(iso)) / 86_400_000));
}

export function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}
