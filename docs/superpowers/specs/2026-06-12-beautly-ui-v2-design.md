# Beautly UI v2 — Redesenho completo da interface

**Data:** 2026-06-12
**Status:** Aprovado (brainstorming)
**Escopo:** Recriar toda a camada de apresentação do Beautly (todas as telas:
cliente, painel da profissional e admin da plataforma) com padrão pixel-perfect,
mobile-first e foco em conversão/usabilidade.

## Objetivo

Elevar o nível visual de toda a interface mantendo **intacta** a lógica de
negócio. Este é um redesenho de **apresentação**: muda JSX e CSS; não muda
server actions, validação zod, escopo por `businessId`, fluxo de OTP/sessão,
schema, repositórios nem serviços.

## Decisões (do brainstorming)

| Decisão | Escolha |
|---|---|
| Escopo | **Todas as telas de uma vez** (cliente + admin + plataforma) |
| Base técnica | **Híbrido**: Tailwind v4 utilitário + Radix pontual (só onde a11y pesa) |
| Paleta | **Millennial & Lilás** (rosa millennial + lilás/lavanda + tinta índigo) |
| Personalidade | **Suave & Glow** (gradientes rosa→lilás, sombras coloridas, cantos macios) |
| Painel admin | Mesma paleta/DNA, **versão mais sóbria** (menos gradiente, mais respiro) |
| Tipografia | **Manter** DM Sans (texto) + Fraunces (display/serifa) |

## Princípios não-negociáveis (preservados)

Todas as regras do `CLAUDE.md` continuam valendo. Em especial, a UI:

- Permanece 100% em **pt-BR com acentos corretos**, voz direta para usuárias
  não técnicas.
- Exibe preços como **inteiros em reais** (`R$ 30`, sem centavos).
- Renderiza datas com `formatInTimeZone` no timezone do negócio.
- Não altera nenhuma server action, contrato de `useActionState`, nem mensagens
  de erro amigáveis já existentes (apenas a forma como são exibidas).

## 1. Identidade visual

Retunamos a escala `brand-*` **mantendo os nomes dos tokens** (as classes atuais
continuam resolvendo durante a migração) e adicionamos as escalas `lilac-*`
(acento) e `ink-*` (texto). Definidas em `@theme` no `globals.css`.

### Paleta

```
/* Rosa (primária) */
--color-brand-50:  #FCF6FA;
--color-brand-100: #FBE9F2;
--color-brand-200: #F7D6E7;
--color-brand-300: #F3B6D3;
--color-brand-400: #EC8FBA;
--color-brand-500: #EC6FA6;   /* início do gradiente */
--color-brand-600: #D14A86;   /* primária sólida: texto, links, botão admin */
--color-brand-700: #B4356E;
--color-brand-800: #8E2A57;
--color-brand-900: #5E1C3A;

/* Lilás (acento) */
--color-lilac-50:  #F6F1FD;
--color-lilac-100: #EDE3FB;
--color-lilac-200: #E0D0F7;
--color-lilac-300: #C9AEF0;
--color-lilac-400: #B79CED;   /* fim do gradiente */
--color-lilac-500: #9B6BE0;
--color-lilac-600: #7C53D6;   /* realces, chips de horário */
--color-lilac-700: #6438BE;

/* Tinta (texto) */
--color-ink-900:   #2E2440;   /* títulos e texto forte */
--color-ink-700:   #4A3F5C;   /* texto corpo */
--color-ink-500:   #8B8197;   /* texto secundário / muted */

/* Superfícies */
fundo de página:   #FCF6FA (brand-50)
card/superfície:   #FFFFFF
```

### Assinaturas "Suave & Glow"

- **Gradiente da marca:** `linear-gradient(90deg, #EC6FA6, #B79CED)` —
  usado em botões primários (cliente) e em texto de hero via
  `background-clip: text`.
- **Sombras coloridas (glow):** lilás `rgba(183,156,237,.35)` e rosa
  `rgba(209,74,134,.18)`, em vez de sombras cinza neutras.
- **Cantos macios:** cards em `rounded-3xl`; botões/inputs em `rounded-2xl`.
- **Hover:** leve elevação (`translateY(-2px)`) + intensificação do glow.
- **Fundos blush:** seções com `linear-gradient(160deg,#FDEFF6,#F1E9FC)` nas
  áreas de destaque da cliente.

### Intensidade por área

- **Telas da cliente:** Suave & Glow pleno (gradientes, glow, fundos blush).
- **Painel da profissional / plataforma:** versão sóbria — botões primários
  **sólidos** (`brand-600`, sem gradiente), glow reduzido, mais espaço em branco,
  cards mais planos. Mantém a mesma paleta e tipografia.

## 2. Design system (`src/app/globals.css` reescrito)

Reescrevemos os tokens e as classes componentizadas **mantendo os mesmos nomes**
para não quebrar telas ainda não migradas, e adicionamos algumas novas.

### Classes existentes (retunadas)

- `.card` — `rounded-3xl`, borda `brand-100`, fundo branco, `.shadow-glow` suave.
- `.btn-primary` — **gradiente** rosa→lilás, texto branco, glow, hover-lift,
  estados `focus-visible`/`disabled`. (Telas da cliente.)
- `.btn-secondary` — contorno suave sobre branco, hover lilás.
- `.input` — `rounded-2xl`, borda `brand-200`, focus ring `brand-100`.
- `.field-label` — label de campo.
- `.chip` / `.chip-selected` — chips de horário; selecionado usa `lilac-600`.
- `.badge` — pílula de status.
- `.alert-error` / `.alert-success` / `.alert-info` — caixas de mensagem.

### Classes novas

- `.btn-solid` — botão primário **sólido** `brand-600` (painel admin; sem gradiente).
- `.btn-ghost` — ação terciária discreta.
- `.section-label` — rótulo pequeno em maiúsculas (ex.: "Escolha um serviço").
- `.shadow-glow` — utilitário de sombra colorida.
- `.skeleton` — placeholder de carregamento (shimmer suave).

## 3. Componentes React (`src/components/`)

Radix entra **só onde acessibilidade/interação justifica**. O resto das telas
continua usando classes utilitárias.

### `ConfirmDialog` (Radix AlertDialog)

Substitui o `window.confirm()` nativo usado hoje em
[meus-agendamentos/list.tsx](src/app/[slug]/meus-agendamentos/list.tsx#L112)
para cancelar agendamento. Props: título, descrição, rótulo de confirmação,
variante (perigo/neutro) e o conteúdo do `form`/ação a executar. Gerencia foco,
ESC e overlay. Reutilizável no painel (ex.: toggle de status, exclusões).

### `OtpInput`

Campo de código segmentado (6 células) para o passo de confirmação do
agendamento — momento crítico de conversão. Requisitos:

- `inputMode="numeric"`, `autoComplete="one-time-code"` na primeira célula.
- Navegação por seta/Backspace, colagem de código completo distribuída entre as
  células, foco automático ao avançar.
- Expõe o valor concatenado em um `input` oculto chamado `code` para a server
  action `confirmAction` continuar recebendo o mesmo campo.
- Acessível: `aria-label` por célula, foco visível.

### `StatusBadge`

Badge de status do agendamento (CONFIRMED / CANCELED_BY_CLIENT /
CANCELED_BY_PROFESSIONAL / RESCHEDULED) com cores da nova paleta, encapsulando
os mapas `STATUS_LABEL` / `STATUS_BADGE` que hoje vivem inline na lista.

> Radix `DropdownMenu` e `Toast` ficam fora por enquanto; só entram se uma
> necessidade real surgir durante a execução (YAGNI).

## 4. Telas redesenhadas (inventário completo)

Cada tela é migrada isoladamente para poder ser revisada sozinha. A lógica
(server actions, props, data flow) é preservada; muda só a marcação/estilo.

### Cliente (Suave & Glow pleno)

| Tela | Arquivos | Notas de redesenho |
|---|---|---|
| Landing | `app/page.tsx` | Hero com gradiente no texto, blocos "como funciona", card de preço destacado, CTA óbvio. Porta de entrada — capricho extra. |
| Página pública | `app/[slug]/page.tsx` | Header do negócio com avatar/logo, lista de serviços como cards clicáveis com preço/duração, CTA "meus agendamentos". |
| Agendamento | `app/[slug]/agendar/page.tsx` + `booking-form.tsx` | **Stepper visual** (1 data/horário · 2 dados), grid de horários refinado, `OtpInput` segmentado. |
| Confirmação | `app/[slug]/agendar/confirmado/page.tsx` | Tela de sucesso celebrativa (glow), resumo do agendamento, próximos passos. |
| Meus agendamentos | `app/[slug]/meus-agendamentos/page.tsx` + `access-form.tsx` + `list.tsx` | Acesso por telefone+OTP, cards de agendamento com `StatusBadge`, `ConfirmDialog` no cancelar, painel de remarcação. |

### Profissional (versão sóbria)

| Tela | Arquivos | Notas |
|---|---|---|
| Login | `app/admin/login/page.tsx` | Card centralizado, sóbrio, com marca. |
| Layout + nav | `app/admin/layout.tsx` + `nav.tsx` + `copy-link.tsx` | Cabeçalho com navegação por abas (estado ativo), botão copiar-link. |
| Dashboard | `app/admin/page.tsx` | Visão do dia, link público, atalhos. |
| Agenda do dia | `app/admin/agenda/page.tsx` | Lista de agendamentos do dia, clara e legível. |
| Serviços | `app/admin/services/page.tsx` | CRUD de serviços com cards/forms. |
| Perfil do negócio | `app/admin/business/page.tsx` + `form.tsx` | Form de dados + upload de logo. |
| Horários | `app/admin/business/hours/page.tsx` + `hours-form.tsx` | Grade de dias/horários de atendimento. |

### Plataforma (versão sóbria)

| Tela | Arquivos | Notas |
|---|---|---|
| Login | `app/platform/login/page.tsx` | Igual ao login admin, identidade plataforma. |
| Dashboard | `app/platform/page.tsx` + `layout.tsx` | Lista de profissionais. |
| Nova profissional | `app/platform/professionals/new/page.tsx` | Form de cadastro. |

## 5. Estratégia de migração

1. Reescrever `globals.css` (tokens + classes) — base de tudo.
2. Criar os componentes compartilhados (`ConfirmDialog`, `OtpInput`,
   `StatusBadge`).
3. Migrar tela a tela, começando pelas da cliente (maior impacto de conversão):
   landing → página pública → agendamento → confirmação → meus agendamentos.
4. Migrar painel da profissional (layout/nav primeiro, depois páginas).
5. Migrar plataforma.

Como as classes utilitárias mantêm os nomes, telas ainda não migradas continuam
renderizando de forma coerente durante o processo.

## 6. Dependências

- Adicionar primitivos Radix necessários (`@radix-ui/react-alert-dialog`).
  Sem `shadcn/ui` completo. Nada de outras libs pesadas.

## 7. Verificação

- `npm run lint` e `npm run build` verdes.
- `npm run test` (vitest) permanece intacto — nenhum teste de domínio/serviço
  muda (redesenho é só apresentação).
- Checagem visual mobile-first das telas-chave rodando o app (estados hover,
  active, disabled; responsividade smartphone → desktop).
- Conferir acessibilidade dos novos componentes (foco, teclado, leitor de tela
  no `ConfirmDialog` e `OtpInput`).

## Fora de escopo

- Qualquer mudança de regra de negócio, schema, serviço ou repositório.
- Novas funcionalidades (segue a seção 8 do escopo / regra 9.4 — MVP simples).
- Internacionalização, tema escuro, animações complexas.
