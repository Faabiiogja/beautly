# Beautly — Design Brief (protótipo v1)

> Insumo pra gerar um protótipo visual (Google Stitch). Não é identidade de marca fechada — cores/tipografia aqui são um ponto de partida plausível, trocável sem custo depois. O que é fixo são as decisões de UX que vêm do produto: ver `mvp-1.0.0.md` e `CONTEXT.md`.

## Duas experiências, dois tons

- **Página pública (cliente)**: mobile-first de verdade — o link chega por WhatsApp e abre na tela do celular. Um passo de cada vez, botões grandes, zero fricção, zero jargão. Ninguém aqui é "usuária" de um SaaS; é uma cliente marcando manicure.
- **Painel (profissional)**: utilitário, rápido de escanear, desktop-first mas responsivo. Sem gráfico, sem dashboard "bonito" — uma lista que ela consegue ler em 5 segundos entre um atendimento e outro.

Não desenhar as duas experiências com a mesma densidade de informação: a pública é rarefeita (uma decisão por tela), o painel é denso (lista, formulário, tabela).

## Direção visual

- **Paleta**: base neutra quente (off-white, grafite suave) + um accent em tom rosé/coral suave — remete a salão de beleza sem cair em "app infantil". Sugestão de partida: accent `#D97757`-ish (terracota suave) ou `#E8A0A0` (rosé), fundo `#FAF7F5`, texto `#2A2622`. Trocar livremente por qualquer paleta de marca real depois.
- **Tipografia**: sans-serif limpa e amigável, não geométrica-fria nem script-decorativa. Algo como Inter, Manrope ou Plus Jakarta Sans.
- **Forma**: cantos arredondados (8–12px), sombra suave, bastante espaço em branco. Cartões, não grades densas.
- **Toque**: alvos de toque grandes (mín. 44px) em qualquer elemento clicável da página pública — é majoritariamente usada com o polegar.

## Princípios de UX que restringem o design (não são "preferência de estilo", são regra de produto)

- Sem seleção de profissional (é sempre uma só por tenant) — nunca desenhar um passo "escolha o profissional".
- Sem grade de calendário visual em lugar nenhum (nem público, nem painel) — disponibilidade é lista de horários; agendamentos no painel é lista cronológica, não calendário mensal/semanal.
- Sem UI de pagamento (não existe pagamento online nesta versão).
- Sem opção de combinar múltiplos serviços num único agendamento — a seleção de serviço é sempre única.
- Telefone da cliente sempre com máscara de formato brasileiro visível no campo.
- A tela de confirmação e a tela de detalhe do agendamento (reaberta pelo link) são a mesma tela em estados diferentes: com um botão de cancelar visível e óbvio.
- Estados vazios são previstos, não acidentais: "nenhum serviço disponível" e "nenhum horário disponível nesse dia" precisam de tela própria, não um erro genérico.
- Existe uma tela de "indisponível" (tenant não existe ou está inativo) — tom neutro, sem parecer erro do sistema.

## Telas a desenhar

### Pública (mobile-first)

1. **Página do negócio** — nome, logo, telefone, endereço, descrição curta, lista de serviços ativos (nome, preço, duração) como cartões selecionáveis.
2. **Escolha de data** — aparece só depois de escolher o serviço; seletor de data simples (não grade de mês inteira), limitado aos próximos 30 dias.
3. **Escolha de horário** — grade de botões de horário (ex.: chips), aparece só depois da data escolhida; estado vazio próprio.
4. **Dados da cliente** — nome + telefone (com máscara), aparece só depois do horário escolhido.
5. **Confirmação** — resumo do agendamento (serviço, data, hora, negócio) + aviso de que o link pode ser reaberto.
6. **Detalhe do agendamento / cancelamento** — mesma estrutura da confirmação, com botão de cancelar; e uma variação de estado "cancelado".
7. **Indisponível** — tenant inativo ou subdomínio inexistente.

### Painel (desktop-first, responsivo)

8. **Login** — e-mail + senha, link "esqueci minha senha".
9. **Agendamentos** — lista cronológica (data, hora, cliente, serviço, status), sem calendário visual.
10. **Serviços** — lista com ativo/inativo + formulário de criar/editar (nome, preço, duração).
11. **Horários** — expediente por dia da semana (com "fechado" como opção) + lista/calendário simples de dias bloqueados.
12. **Configurações do negócio** — nome, logo, telefone, endereço, descrição (os mesmos campos que aparecem na página pública).

## Fora de escopo do protótipo

Tudo que está em "Escopo OUT" de `mvp-1.0.0.md` — em especial: nada de tela de pagamento, nada de seleção de profissional, nada de calendário visual, nada de tela de CRM/histórico de cliente, nada de onboarding multi-step de cadastro de tenant (isso é manual, fora do produto).
