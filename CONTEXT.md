# Beautly — Contexto de Domínio

## Glossário

**Tenant**: profissional/negócio independente dentro da plataforma, com subdomínio próprio (ex: `ana.beautly.cloud`). Dados de um tenant nunca são visíveis a outro tenant.

**Profissional**: usuária autenticada, dona de um tenant. Gerencia serviços, horários de atendimento e agendamentos através do painel administrativo.

**Cliente**: pessoa que realiza um agendamento na página pública de um tenant. Não possui conta, senha ou verificação de identidade. É identificada apenas por **nome** e **telefone**, informados no momento do agendamento (sem validação de que o telefone pertence de fato a ela).

**Link de agendamento**: URL única gerada para cada agendamento (ex: `ana.beautly.cloud/agendamento/abc123`), que permite à cliente visualizar os detalhes e cancelar, sem necessidade de login. Não expira ativamente: continua acessível e mostra o status real (confirmado, cancelado ou já ocorrido) a qualquer momento, mesmo após o horário. Só deixa de abrir se o tenant estiver inativo.

**Agendamento**: reserva de um serviço, com um profissional, em uma data/horário específico, feita por uma cliente. Estados: **Confirmado**, **Cancelado**. Não existe (e não existirá) o estado "No-show" — decisão permanente, não é apenas escopo do MVP.

**Reagendamento**: não existe como operação própria na 1.0.0. O fluxo equivalente é cancelar o agendamento existente e criar um novo.

## Decisões de negócio (1.0.0)

- Cliente pode cancelar o próprio agendamento via link, sem necessidade de autorização da profissional.
- Cancelamento (por cliente ou profissional) libera o horário na agenda imediatamente.
- Não há janela mínima de antecedência exigida para cancelamento na 1.0.0.
- Não há reagendamento como funcionalidade — apenas cancelar + criar novo.
- Não há rastreamento de no-show em nenhuma versão futura definida até agora (decisão explícita do produto, não apenas adiada).
- Link de agendamento não expira ativamente: continua acessível e mostra o status real do agendamento (confirmado/cancelado/já ocorrido) a qualquer momento, mesmo após o horário. Nenhuma lógica de expiração é construída na 1.0.0.

## Regras de disponibilidade

- Horários oferecidos seguem grade fixa de 30 em 30 minutos (não configurável na 1.0.0). Um horário só é oferecido se `[início, início + duração do serviço]` não colidir com nenhum agendamento confirmado existente e couber dentro do expediente configurado para aquele dia.
- Horário de funcionamento é configurado **por dia da semana** (ex: seg-sex 9h–18h, sáb 9h–13h, dom fechado).
- Não há antecedência mínima obrigatória para agendar (cliente pode agendar para o próximo horário livre do dia, mesmo que seja em poucos minutos).
- Janela máxima de agendamento futuro: 30 dias a partir de hoje (fixo, não configurável na 1.0.0).
- Bloqueio de dia é sempre de **dia inteiro** (não há bloqueio parcial de horário dentro de um dia).
- Não há conceito de buffer/intervalo entre atendimentos — a duração cadastrada do serviço já deve incluir qualquer tempo de troca necessário.
- Cada tenant tem exatamente **um recurso de atendimento** (a própria profissional): dois agendamentos confirmados nunca podem se sobrepor em horário dentro do mesmo tenant, independente do serviço.
- Bloquear um dia (ou reduzir o expediente) **nunca cancela automaticamente** agendamentos já confirmados nesse período — o bloqueio/expediente novo só afeta a geração de disponibilidade para *novos* agendamentos. Agendamentos existentes permanecem intocados até serem cancelados manualmente.
- Editar um serviço (preço/duração) não afeta agendamentos futuros já confirmados: cada agendamento guarda um **snapshot** do preço e duração vigentes no momento em que foi criado.

## Notificações

- Ao criar ou cancelar um agendamento, a profissional recebe um e-mail transacional simples e automático (ex: "Novo agendamento: Maria, 14h, Manicure"). Não há WhatsApp, SMS ou lembretes automáticos na 1.0.0 — apenas esse alerta unidirecional por e-mail.

## Ciclo de vida do tenant

- Criação de tenant é 100% manual, feita pelo admin da plataforma (sem self-signup). O admin também cria o acesso inicial da profissional e repassa por fora do sistema.
- Cobrança (piloto grátis → R$30/mês) é controlada fora do sistema (ex: Pix). Não existe campo de plano, vencimento ou trial automático — apenas um estado ativo/inativo por tenant, alternado manualmente pelo admin.
- Tenant inativo: página pública fica indisponível (mensagem genérica) e o login do painel da profissional é bloqueado. Nenhum dado é apagado.

## Limite por telefone

- Uma mesma cliente (mesmo telefone) pode agendar várias vezes, mas no máximo **3 agendamentos futuros confirmados por vez** em cada tenant. Cancelados e já ocorridos não contam. O limite é imposto no banco (serializado por telefone, então pedidos simultâneos também respeitam) e existe para impedir que um script ocupe a agenda inteira de uma profissional. Para marcar um 4º, a cliente cancela um pelo link.

## Concorrência

- Se duas clientes tentam confirmar o mesmo horário simultaneamente, quem confirmar primeiro garante o agendamento; a segunda recebe erro e deve escolher outro horário. Nunca há sobrescrita silenciosa.

## Serviços

- Inativar um serviço não afeta agendamentos futuros já confirmados com ele (snapshot); o serviço apenas deixa de aparecer como opção para novos agendamentos.

## Página pública (campos)

- Nome do negócio/profissional, logo (opcional), telefone de contato, endereço/localização (texto livre, sem mapa/geolocalização), descrição curta/bio (opcional).
- Telefone da cliente exige validação de formato brasileiro (DDD + 8/9 dígitos) com **máscara de input** guiando o preenchimento.

## Fluxo de agendamento (cliente)

1. Escolher serviço
2. Escolher uma data
3. Ver e escolher um horário disponível daquele dia
4. Informar nome e telefone
5. Confirmar

- Não existe entidade **Cliente** reutilizável nem tela de clientes/histórico no painel. Cada agendamento carrega nome+telefone como dado próprio, autocontido. Não há CRM.
- Visualização de agendamentos no painel é uma **lista cronológica simples** (tabela: data, hora, cliente, serviço, status), não um calendário visual.
- Tenant recém-criado, sem serviços/horários configurados: página pública funciona normalmente e mostra estado vazio ("nenhum serviço disponível no momento"). Não há estado de "publicado/rascunho".
- Recuperação de senha do painel usa o fluxo nativo "esqueci minha senha" do Supabase Auth.

## Regra adicional de agendamento

- Um agendamento é sempre de exatamente **1 serviço**. Não há combinação de múltiplos serviços num único agendamento — a cliente que quiser dois serviços cria dois agendamentos separados.

## Administração da plataforma (revisão de escopo)

- Não há UI de admin da plataforma construída na 1.0.0. Cadastro/ativação/desativação de tenant é feito diretamente no Supabase Studio (Table Editor). Reavaliar quando o número de tenants tornar isso arriscado/lento.
- Tenant inativo bloqueia **tudo** publicamente relacionado a ele, incluindo links individuais de agendamentos já existentes — sem exceção.

## ICP (premissa central)

- A profissional-alvo já tem uma base de clientes ativa que hoje agenda por WhatsApp. O Beautly organiza esse relacionamento existente — não ajuda a conquistar clientes novas (sem marketing/divulgação como parte do produto).

## Modelo de entidades (nível conceitual)

- **Tenant** e **Profissional** são a mesma entidade/tabela (conflados): não existe um conceito de "negócio" separado da "conta da profissional que faz login". 1 login = 1 tenant, sempre.

## Fuso horário

- Toda a plataforma opera em um único fuso fixo: `America/Sao_Paulo`. Não há suporte a múltiplos fusos na 1.0.0.
