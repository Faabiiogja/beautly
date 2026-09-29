// Ícones no estilo Material Symbols usados nas telas do Stitch, inline para não carregar a fonte de ícones.
const base = { width: 18, height: 18, viewBox: '0 -960 960 960', fill: 'currentColor', 'aria-hidden': true } as const

export const ChatIcon = () => (
  <svg {...base}>
    <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Z" />
  </svg>
)

export const PinIcon = () => (
  <svg {...base}>
    <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z" />
  </svg>
)

export const ClockIcon = () => (
  <svg {...base} width={16} height={16}>
    <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
  </svg>
)

// Traço (não preenchido), viewBox 24x24: mostrar/ocultar senha no campo de texto.
const strokeBase = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'aria-hidden': true } as const

export const EyeIcon = () => (
  <svg {...strokeBase}>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    <path
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
)

export const EyeOffIcon = () => (
  <svg {...strokeBase}>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    <path
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" strokeWidth="1.8" />
  </svg>
)

export const MailIcon = () => (
  <svg {...strokeBase} width={24} height={24}>
    <rect x="3" y="6" width="18" height="13" rx="2" strokeWidth="1.8" />
    <path d="M4 7.5l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
)
