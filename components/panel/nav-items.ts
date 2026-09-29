import { CalendarIcon, ClockIcon, ScissorsIcon, TuneIcon } from '@/components/public/icons'

type NavItem = { href: string; label: string; mobileLabel?: string; icon: () => React.JSX.Element }

// Itens de navegação do painel, usados pela barra lateral (desktop) e pela barra inferior (celular).
// No celular "Configurações" vira "Ajustes" (mesma rota).
export const NAV_ITEMS: NavItem[] = [
  { href: '/agendamentos', label: 'Agendamentos', icon: CalendarIcon },
  { href: '/servicos', label: 'Serviços', icon: ScissorsIcon },
  { href: '/horarios', label: 'Horários', icon: ClockIcon },
  { href: '/configuracoes', label: 'Configurações', mobileLabel: 'Ajustes', icon: TuneIcon },
]

// Mesma regra pra Sidebar (desktop) e BottomNav (celular): a rota em si, ou uma sub-rota dela.
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
