/** Ícones simples em SVG (traço), sem biblioteca. */
type Props = { className?: string };

function Base({ className = "size-5", children }: Props & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  );
}

export const IconePainel = (p: Props) => (
  <Base {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Base>
);

export const IconeFunil = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="4" width="5" height="16" rx="1.5" />
    <rect x="10" y="4" width="5" height="11" rx="1.5" />
    <rect x="17" y="4" width="4" height="7" rx="1.5" />
  </Base>
);

export const IconeContatos = (p: Props) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2" />
  </Base>
);

export const IconeTarefas = (p: Props) => (
  <Base {...p}>
    <rect x="3.5" y="4" width="17" height="17" rx="2.5" />
    <path d="M8 2.5v3M16 2.5v3M3.5 9h17M8.5 14.5l2.2 2.2 4.8-4.7" />
  </Base>
);

export const IconeIntegracao = (p: Props) => (
  <Base {...p}>
    <path d="M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16" />
  </Base>
);

export const IconeWhatsapp = (p: Props) => (
  <Base {...p}>
    <path d="M3.5 20.5 5 16.3A8.5 8.5 0 1 1 8 19.3l-4.5 1.2Z" />
    <path d="M9 9.2c.3 2.6 2.2 4.6 4.8 5.3l1.2-1.3 2 .9c-.2 1.3-1.2 2-2.4 1.9-3.8-.4-6.7-3.4-7.1-7.1-.1-1.2.6-2.2 1.9-2.4l.9 2-1.3 1.2" />
  </Base>
);

export const IconeMais = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconeRelogio = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);
