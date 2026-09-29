# Beautly 1.0.0 — o que ficou para depois

O MVP está implementado (issues #2 a #12). Este documento lista o que **não** foi feito ou não foi verificado, em ordem de importância. A spec e as decisões estão em [`mvp-1.0.0.md`](./mvp-1.0.0.md) e [`../CONTEXT.md`](../CONTEXT.md).

## Antes de colocar uma profissional real

1. **Deploy na Vercel:** feito. O repositório está ligado à Vercel (cada push na `main` vira deploy de Produção), `beautly.cloud`, `painel.` e `demo.` respondem, e as variáveis de Produção estão completas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_PANEL_URL`, `RESEND_API_KEY`, `EMAIL_FROM`). Reserva, cancelamento e e-mail foram testados em produção. As variáveis do app anterior (senhas de admin, Prisma, sessão etc.) foram removidas. Restam no projeto as variáveis criadas pela integração Supabase↔Vercel (`POSTGRES_*`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), que o Beautly não usa e podem ser removidas se a integração não for necessária. O plano Hobby é só para estudo (ver `architecture.md`).
2. **Nada foi clicado em um navegador real.** Toda a verificação foi por testes de banco, testes de componente (jsdom) e cenários HTTP contra o Supabase real. Falta um passe manual completo, no celular e no desktop: agendar, cancelar, painel, upload de logo.
3. **Resend:** domínio `beautly.cloud` verificado; o envio foi testado de verdade em produção com `Beautly <contato@beautly.cloud>` (agendamento e cancelamento). Falta olhar o HTML do e-mail renderizado num cliente de e-mail real.
4. **"Esqueci minha senha" nunca foi testado de ponta a ponta.** No Supabase (Authentication → URL Configuration): *Site URL* = `https://painel.beautly.cloud` e, em *Redirect URLs*, `https://painel.beautly.cloud/auth/callback` e `http://localhost:3000/auth/callback`. Além disso, o SMTP padrão do Supabase é limitado a poucos e-mails por hora e só entrega para endereços da equipe do projeto: para profissionais reais, configurar SMTP próprio em Authentication → Emails → SMTP Settings (Resend: host `smtp.resend.com`, porta `465`, usuário `resend`, senha = a chave do Resend, remetente `contato@beautly.cloud`).
5. **Limpeza e segurança no projeto Supabase:**
   - Apagar os 3 usuários antigos do Auth (restos do app anterior) e a conta de teste `fabio-gja@hotmail.com` / tenant `demo` antes de ter clientes reais (a senha de teste está no histórico da conversa).
   - Ligar *leaked password protection* e mais opções de MFA em Auth (avisos do advisor).
   - Mover a extensão `btree_gist` do schema `public` para `extensions` (aviso do advisor).
6. **Limite de taxa por IP** nos endpoints públicos (`/slots`, `/appointments`, `/agendamento/<token>/cancel`). Existe o teto de 3 agendamentos futuros por telefone (no banco), mas não há proteção contra volume de requisições.

## Recomendado logo depois

7. **Testes end-to-end no repositório.** Os cenários rodados contra o Supabase real (reserva e corrida, cancelamento, painel, logo, e-mail) foram scripts temporários fora do repo. Vale transformá-los em Playwright/CI, com um projeto Supabase de staging.
8. **Ambiente e migrations:** há um único projeto Supabase e as migrations foram aplicadas pelo MCP/SQL Editor. Falta `supabase/config.toml` e o fluxo `supabase db push`, e separar staging de produção.
9. **Desempenho:** a consulta de tenant por subdomínio não tem cache (a arquitetura previa); a agenda do painel mostra no máximo 200 próximos e 100 anteriores, sem paginação.
10. **E-mail:** envio é "melhor esforço" (sem fila nem reenvio); uma falha só vai para o log.
11. **Visual:** o Stitch só tinha telas públicas; o painel usa os tokens do design system, sem telas desenhadas. O logo usa `<img>` simples (sem `next/image`). Falta QA visual e de acessibilidade.
12. **Operação do founder:** validar em produção o passo a passo de `supabase-studio-guia.md` (criar usuário no Auth, criar a linha do tenant, ativar e desativar).
13. `.mcp.json` (MCP do Supabase) está sem commit; decidir se vai para o repositório.

## Decisões de produto tomadas na implementação (revisar)

- Só se cancela um agendamento que **ainda não terminou** (na tela da cliente e no painel); depois do horário o link mostra "Já aconteceu".
- **Teto de 3 agendamentos futuros confirmados por telefone**, em cada tenant.
- O link do agendamento **não expira**, mas fica inacessível se o tenant estiver inativo.
- **E-mail só quando a cliente agenda ou cancela pelo link**; cancelamento feito pela própria profissional no painel não gera e-mail.
- A janela vai de hoje até hoje + 30 dias, inclusive (31 datas).
- Do Stitch ficaram de fora, de propósito: pagamento presencial, lembrete por WhatsApp, "cancelamento sem custo até 2h", "adicionar à agenda" e mapa.

## Fora do escopo do MVP (já decidido na spec)

Pagamentos online, lembretes automáticos/WhatsApp, reagendamento, CRM, calendário visual, múltiplos profissionais, self-signup de tenant, painel de admin da plataforma.
