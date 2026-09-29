# Beautly — Especificação do MVP 1.0.0

> Este documento é o resultado de uma sessão de grill-me sobre produto e regras de negócio. Termos e definições vivem em [`CONTEXT.md`](../CONTEXT.md); este documento é a especificação funcional, não o glossário.

## 1. Product Definition

Beautly é um SaaS B2B2C de agendamento para profissionais autônomas de estética (manicures, nail designers, lash designers, designers de sobrancelha, entre outras). Cada profissional recebe sua própria página pública de agendamento (subdomínio próprio, ex: `ana.beautly.cloud`), que ela compartilha com suas clientes atuais para que elas agendem sozinhas, sem trocar mensagens no WhatsApp. A profissional administra serviços, horários e agendamentos por um painel autenticado.

## 2. Problema

Hoje essas profissionais gerenciam sua agenda pelo WhatsApp: conversas espalhadas, dificuldade de saber horários livres, conflitos de agenda, cancelamentos mal organizados e trabalho manual repetitivo.

## 3. ICP da 1.0.0

Profissional autônoma de estética que:
- já tem uma base de clientes ativa que hoje agenda por WhatsApp (o produto organiza esse relacionamento existente, não ajuda a conquistar clientes novas);
- atende sozinha, sem outras profissionais trabalhando junto;
- atende em um único endereço/local;
- consegue pagar ~R$30/mês depois do período piloto gratuito.

## 4. Personas

- **Profissional** (ex.: "Ana, manicure autônoma"): dona do tenant, autenticada via Supabase Auth, gerencia serviços, horários e agendamentos.
- **Cliente** (ex.: "cliente da Ana"): sem conta, identificada por nome + telefone a cada agendamento, acessa a página pública e o link do próprio agendamento.
- **Founder (você)**: opera criação/ativação/desativação de tenants diretamente no Supabase Studio. Não é um "usuário" do produto — não existe UI de admin da plataforma na 1.0.0.

## 5. User Journeys

**J1 — Cliente agenda um serviço**
Acessa `<subdominio>.beautly.cloud` → escolhe serviço → escolhe data → escolhe horário disponível daquele dia → informa nome e telefone (com máscara) → confirma → vê tela de confirmação com link único.

**J2 — Cliente cancela um agendamento**
Reabre o link do agendamento (a qualquer momento, antes ou depois do horário) → cancela → horário é liberado imediatamente na agenda. O link sempre abre e mostra o status real; o cancelamento só é oferecido enquanto o agendamento não terminou (depois disso, cancelar não liberaria nada e apagaria o registro do que aconteceu: o link mostra "Já aconteceu").

**J3 — Profissional configura o negócio pela primeira vez**
Recebe login (criado manualmente pelo founder) → acessa painel → cadastra serviços → configura horário de funcionamento por dia da semana → preenche dados do negócio (nome, logo, telefone, endereço, descrição) → compartilha o link da própria página com suas clientes.

**J4 — Profissional no dia a dia**
Login → vê lista cronológica de agendamentos → eventualmente bloqueia um dia inteiro (viagem, folga) → eventualmente cancela um agendamento pelo painel.

**J5 — Founder cadastra um tenant piloto**
Acessa o Supabase Studio → cria a linha do tenant (dados básicos + ativo) → cria o acesso de login da profissional → repassa credenciais por fora do sistema.

## 6. Escopo IN

- Página pública por tenant (subdomínio próprio)
- Cadastro de serviços (nome, preço, duração, ativo/inativo)
- Configuração de horário de funcionamento por dia da semana
- Bloqueio de dias inteiros
- Motor de disponibilidade (grade fixa de 30 min, considerando duração do serviço, expediente do dia, agendamentos existentes e dias bloqueados)
- Agendamento pela cliente sem conta (nome + telefone com máscara)
- Link único por agendamento (visualizar + cancelar), sem expiração ativa
- Cancelamento pela cliente (via link) e pela profissional (via painel)
- Painel autenticado (Supabase Auth, com recuperação de senha nativa)
- Lista cronológica simples de agendamentos no painel
- Configurações do negócio (nome, logo, telefone, endereço, descrição) refletidas na página pública
- Notificação por e-mail simples à profissional a cada novo agendamento/cancelamento
- Isolamento multi-tenant de dados
- Criação/ativação/desativação de tenant direto no Supabase Studio (sem UI de admin dedicada)
- Fuso horário único e fixo (`America/Sao_Paulo`)

## 7. Escopo OUT

Confirmado como fora da 1.0.0 (do briefing original, mais o que foi excluído durante o grill-me):

- Pagamentos online
- Marketplace
- Aplicativo mobile
- Múltiplos profissionais por estabelecimento / múltiplas agendas / seleção de profissional
- Dashboard avançado / analytics
- Programa de fidelidade / cupons / avaliações
- Integração complexa com WhatsApp / lembretes automáticos
- Controle financeiro / comissão de profissionais / estoque
- CRM (nenhuma entidade "Cliente" reutilizável, nenhuma tela de histórico de cliente)
- Planos diferentes / integrações externas complexas
- Reagendamento como operação própria (usa-se cancelar + criar novo)
- Estado de "no-show" (decisão permanente do produto, não apenas adiada)
- Buffer/intervalo configurável entre atendimentos
- Bloqueio parcial de horário dentro de um dia (só dia inteiro)
- Calendário visual no painel (é lista cronológica)
- Expiração ativa do link de agendamento
- UI de admin da plataforma dentro do produto
- Suporte a múltiplos fusos horários
- Combinação de múltiplos serviços em um único agendamento
- Self-signup de tenant (criação é sempre manual)
- Qualquer campo de plano/vencimento/trial automático (cobrança é 100% manual, fora do sistema)

## 8. Regras de negócio

Ver [`CONTEXT.md`](../CONTEXT.md) para o glossário completo. Resumo das regras centrais:

- Cada tenant tem exatamente um recurso de atendimento (a própria profissional): nunca há dois agendamentos confirmados sobrepostos no mesmo tenant.
- Um agendamento é sempre de exatamente 1 serviço.
- Preço e duração de um agendamento são um **snapshot** do momento da criação — editar o serviço depois não afeta agendamentos futuros já confirmados.
- Inativar um serviço não cancela agendamentos futuros existentes; só remove a opção para novos agendamentos.
- Bloquear um dia (ou reduzir expediente) nunca cancela agendamentos existentes automaticamente — só afeta a geração de disponibilidade futura.
- Em conflito de concorrência (duas clientes confirmando o mesmo horário), quem confirma primeiro garante o agendamento; a segunda recebe erro e escolhe outro horário.
- Cancelamento (por cliente ou profissional) libera o horário imediatamente. Sem antecedência mínima exigida.
- Tenant inativo bloqueia publicamente tudo relacionado a ele: página pública, painel e links individuais de agendamento, sem exceção.

## 9. Fluxo completo de agendamento

1. Cliente acessa `<subdominio>.beautly.cloud`.
2. Vê dados do negócio (nome, logo, telefone, endereço, descrição) e lista de serviços ativos.
   - Se não houver serviços ativos: mostra estado vazio ("nenhum serviço disponível no momento").
3. Escolhe um serviço.
4. Escolhe uma data (dentro da janela de 30 dias a partir de hoje).
5. Vê horários disponíveis daquele dia (grade de 30 em 30 min, filtrada por expediente do dia da semana, duração do serviço e agendamentos/bloqueios existentes).
   - Se não houver horário disponível no dia: mostra estado vazio, cliente escolhe outra data.
6. Escolhe um horário.
7. Informa nome e telefone (telefone com máscara e validação de formato brasileiro).
8. Confirma.
   - Se o horário foi tomado por outra cliente nesse meio tempo: erro explícito, cliente volta ao passo 5.
9. Vê tela de confirmação com o link único do agendamento.

Cancelamento (a qualquer momento, via link): cliente reabre o link → cancela → horário liberado imediatamente.

## 10. Fluxo administrativo

1. Login (Supabase Auth; recuperação de senha nativa disponível).
2. Painel: lista cronológica de agendamentos (data, hora, cliente, serviço, status).
3. Cadastro/edição/ativação/desativação de serviços (nome, preço, duração).
4. Configuração de horário de funcionamento por dia da semana.
5. Bloqueio de dias inteiros.
6. Cancelamento de um agendamento pela profissional.
7. Configurações do negócio (nome, logo, telefone, endereço, descrição) — refletidas na página pública.

## 11. Modelo conceitual das entidades

- **Tenant/Profissional** *(entidade conflada — ver decisão registrada em `CONTEXT.md`)*: dados de login (Supabase Auth), nome do negócio, logo, telefone, endereço, descrição, subdomínio, ativo/inativo.
- **Service**: pertence a um tenant; nome, preço, duração, ativo/inativo.
- **WorkingHours**: pertence a um tenant; por dia da semana, horário de início/fim (ou "fechado").
- **BlockedDay**: pertence a um tenant; data bloqueada (dia inteiro).
- **Appointment**: pertence a um tenant; referência ao serviço (com snapshot de nome/preço/duração no momento da criação), nome e telefone da cliente, data, horário de início/fim, status, token do link único, timestamps de criação/cancelamento.

Não existe entidade "Cliente" própria — nome e telefone são dados embutidos em cada `Appointment`.

## 12. Estados possíveis de um agendamento

- **Confirmado** (estado inicial, criado no fluxo de agendamento)
- **Cancelado** (transição a partir de Confirmado, disparada pela cliente via link ou pela profissional via painel)

Não há estado de "no-show" nem "concluído" — um agendamento no passado é apenas exibido como tal com base na data/hora, sem mudança de estado armazenada.

## 13. Regras de disponibilidade

- Grade fixa de 30 em 30 minutos, não configurável.
- Um horário é oferecido se `[início, início + duração do serviço]` não colide com nenhum agendamento confirmado existente e cabe dentro do expediente do dia da semana.
- Expediente configurado por dia da semana.
- Sem antecedência mínima obrigatória.
- Janela máxima de 30 dias a partir de hoje.
- Sem buffer entre atendimentos (duração do serviço já deve incluir qualquer tempo de troca).
- Dias bloqueados removem o dia inteiro da disponibilidade.

## 14. Regras de cancelamento

- Cliente pode cancelar o próprio agendamento via link, sem aprovação da profissional.
- Profissional pode cancelar qualquer agendamento pelo painel.
- Sem janela mínima de antecedência para cancelar.
- Cancelamento libera o horário imediatamente na disponibilidade.
- Sem reagendamento — o fluxo é cancelar e criar um novo agendamento.

## 15. Regras de autenticação

- **Profissional**: Supabase Auth (e-mail + senha), com recuperação de senha nativa.
- **Cliente**: sem autenticação. Identificação por nome + telefone a cada agendamento. Acesso ao próprio agendamento via token único não adivinhável na URL.
- **Admin da plataforma**: sem autenticação própria no produto — acesso direto ao projeto Supabase (Table Editor), fora da aplicação.

## 16. Regras multi-tenant

- Isolamento total de dados entre tenants.
- Cada tenant acessível por subdomínio próprio (ex: `ana.beautly.cloud`).
- Criação de tenant é 100% manual pelo founder (sem self-signup).
- Cobrança (piloto grátis → R$30/mês) é controlada fora do sistema; o único estado no sistema é ativo/inativo.
- Tenant inativo bloqueia publicamente tudo relacionado a ele — página pública, painel e links individuais de agendamentos existentes — sem exceção. Nenhum dado é apagado.

## 17. Edge cases conhecidos

- Duas clientes tentando confirmar o mesmo horário simultaneamente → primeira garante, segunda recebe erro.
- Serviço inativado com agendamentos futuros confirmados → agendamentos mantidos (snapshot), serviço só some da lista para novos agendamentos.
- Dia bloqueado ou expediente reduzido com agendamentos futuros já confirmados nesse período → agendamentos mantidos intocados.
- Tenant desativado com links de agendamento ainda "vivos" → todos ficam inacessíveis, sem exceção.
- Tenant recém-criado sem serviços/horários configurados → página pública funciona, mostra estado vazio.
- Telefone da cliente em formato inválido → bloqueado pela máscara/validação antes de confirmar.
- Nenhum horário disponível nos próximos 30 dias → estado vazio, sem erro.
- Mesmo telefone usado em múltiplos agendamentos (cliente recorrente) → permitido, sem deduplicação ou entidade compartilhada.
- Link de agendamento acessado muito tempo depois (passado) → continua funcionando, mostra status real (não expira ativamente).

## 18. Critérios de aceite

- Uma cliente consegue completar o fluxo de agendamento ponta a ponta (serviço → data → horário → dados → confirmação) sem precisar criar conta.
- Uma cliente consegue cancelar um agendamento existente apenas com o link, sem precisar de login.
- A disponibilidade mostrada nunca inclui um horário que colida com um agendamento confirmado existente ou caia fora do expediente/dia bloqueado.
- Dois agendamentos nunca ficam confirmados e sobrepostos no mesmo tenant, mesmo sob tentativa simultânea.
- A profissional consegue logar, ver sua lista de agendamentos, cadastrar/editar/inativar serviços, configurar expediente por dia da semana e bloquear dias.
- A profissional recebe um e-mail a cada agendamento criado ou cancelado.
- Dados de um tenant nunca aparecem para outro tenant, em nenhuma tela ou API.
- Desativar um tenant (via Supabase Studio) derruba imediatamente sua página pública, painel e links de agendamento existentes.
- Editar um serviço não altera o preço/duração de agendamentos futuros já confirmados com a versão anterior.

## 19. Definition of Done da 1.0.0

- Todo o Escopo IN implementado e testado manualmente ponta a ponta (fluxo cliente e fluxo profissional).
- Isolamento multi-tenant verificado manualmente (dois tenants de teste, confirmando que um nunca vê dados do outro).
- Aplicação em produção (Vercel) com roteamento de subdomínio funcionando para pelo menos os 2 tenants piloto.
- Os 2 tenants piloto criados via Supabase Studio, com login funcional para as profissionais.
- Notificação por e-mail confirmada em criação e cancelamento de agendamento.
- `CONTEXT.md` e este documento mantidos como fonte de verdade no repositório.
- Nenhum bug crítico conhecido no fluxo de agendamento ou cancelamento.

## 20. Backlog inicial priorizado

Ordem sugerida de construção da 1.0.0 (não é backlog pós-lançamento — são as decisões de escopo já fechadas, apenas priorizadas para implementação):

1. Modelo de dados + isolamento multi-tenant (Tenant/Profissional, Service, WorkingHours, BlockedDay, Appointment).
2. Autenticação da profissional (Supabase Auth) + login do painel.
3. Cadastro de serviços (CRUD + ativo/inativo).
4. Configuração de horário de funcionamento por dia da semana + bloqueio de dias inteiros.
5. Motor de disponibilidade (grade de 30 min combinando serviço + expediente + agendamentos existentes + dias bloqueados).
6. Página pública: dados do negócio + lista de serviços + seleção de data e horário.
7. Fluxo de confirmação de agendamento (formulário nome/telefone com máscara, tratamento de concorrência).
8. Link único de agendamento (visualização + cancelamento pela cliente).
9. Painel: lista cronológica de agendamentos + cancelamento pela profissional.
10. Configurações do negócio (nome, logo, telefone, endereço, descrição) refletidas na página pública.
11. Notificação por e-mail em criação/cancelamento.
12. Deploy em produção com roteamento de subdomínio + criação manual dos 2 tenants piloto via Supabase Studio.

**Candidatos a versões futuras (hipóteses, não compromissos — só valem com evidência real de uso):** reagendamento como operação própria, calendário visual no painel, entidade Cliente com histórico, UI de admin da plataforma, lembretes automáticos.
