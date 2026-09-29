# Prompt pra Google Stitch — protótipo Beautly

Baseado em `design.md`. Cole o **Prompt 1** pra criar o projeto e gerar a experiência pública; depois cole o **Prompt 2** no mesmo projeto pra adicionar as telas do painel mantendo o mesmo estilo visual.

---

## Prompt 1 — App + fluxo público da cliente

```
Design a mobile-first web app called "Beautly" — a booking page for independent
beauty professionals (manicurists, nail designers, lash and brow designers) to
share with their existing clients so they can book appointments themselves,
without any login or account creation.

Style: warm, calm, boutique-salon feeling — not childish, not corporate SaaS.
Soft off-white background, one warm terracotta/rosé accent color, generous
whitespace, rounded corners (8-12px), soft shadows, clean friendly sans-serif
typography (Inter or Manrope style). Large tap targets — this is used on a
phone, thumb-first, opened from a WhatsApp link.

Design these screens as one connected flow, one decision per screen:

1. Business page: shows the professional's business name, a small logo, phone
   number, address, and a short description at the top. Below, a vertical
   list of selectable service cards, each showing service name, price in BRL,
   and duration in minutes. Tapping a service advances the flow.

2. Date picker: after picking a service, show a simple date selector limited
   to the next 30 days (not a full month grid — a compact scrollable list or
   simple calendar strip of upcoming dates).

3. Time slot picker: after picking a date, show the available time slots for
   that day as a grid of rounded chip buttons (e.g. 09:00, 09:30, 10:00...).
   Include an empty-state version of this screen with a friendly message for
   when no slots are available that day.

4. Client details form: after picking a time, show a short form with just two
   fields — "Seu nome" and "Seu telefone" with a Brazilian phone number mask
   placeholder like "(11) 91234-5678" — and a prominent confirm button.

5. Confirmation screen: shows a success state with the business name, chosen
   service, date and time, and a note that this same page/link can be
   reopened anytime to view or cancel the booking. Include a visible "Cancelar
   agendamento" button.

6. Cancelled state: a variant of the confirmation screen showing the booking
   as cancelled, calm tone, no error styling.

7. Unavailable page: a neutral, friendly "this page isn't available right now"
   screen for when the business link is inactive — not styled as an error/404,
   just informational.

Also design an empty-state version of screen 1 for when the business has no
active services yet ("Nenhum serviço disponível no momento").

No login, no signup, no password fields, no payment UI, no professional
selection step (there's only ever one professional per page), no calendar
month grid anywhere.
```

---

## Prompt 2 — Painel da profissional (mesmo projeto, mesmo estilo)

```
Now design the authenticated dashboard ("painel") for the beauty professional
who owns this booking page, using the same visual style, colors and
typography established above, but desktop-first and denser/more utilitarian —
this is a working tool she checks between clients, not a marketing page.

Screens:

1. Login: email and password fields, a "Esqueci minha senha" link, minimal
   branding.

2. Appointments list: a chronological table/list of bookings — date, time,
   client name, service, and status (confirmed/cancelled) — with a cancel
   action per row. No calendar grid view — this is explicitly a simple list,
   not a calendar.

3. Services: a list of services with name, price, duration and an
   active/inactive toggle per row, plus an "add service" form (name, price,
   duration).

4. Working hours: a simple per-weekday schedule editor (Monday through
   Sunday, each with open/closed toggle and start/end time when open), plus a
   separate simple list for blocking specific full days (e.g. a date picker
   with a "blocked days" list below it).

5. Business settings: a form for business name, logo upload, phone, address,
   and short description — the same fields shown on the public business page.

Keep the sidebar/top nav simple: Agendamentos, Serviços, Horários,
Configurações. No analytics widgets, no charts, no advanced dashboard —
this professional runs her whole business from this simple list-based tool.
```
