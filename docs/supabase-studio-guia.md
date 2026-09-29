# Guia: gerenciando tenants pelo Supabase Studio

> Este é um guia conceitual/genérico, para você se familiarizar com a ferramenta. Os nomes exatos de tabela e coluna vão ser ajustados quando o schema for implementado (isso é decisão de arquitetura, ainda não tomada) — a mecânica de uso do Studio, porém, é sempre a mesma.

## O que é o Supabase Studio

É o painel web que vem junto com todo projeto Supabase (`https://supabase.com/dashboard/project/<seu-projeto>`). É a interface visual do banco Postgres que vai guardar os dados do Beautly. Você não precisa saber SQL para o que vamos usar aqui — o **Table Editor** funciona como uma planilha.

Pense nele como o "banco de dados visual" por trás do produto: tudo que o Beautly grava (tenants, serviços, agendamentos) mora em tabelas que aparecem ali, e você pode ler/editar linhas diretamente, sem passar pelo produto.

## Acessando

1. Entre em [supabase.com](https://supabase.com) e faça login com a conta usada para criar o projeto do Beautly.
2. Selecione o projeto do Beautly na lista.
3. No menu lateral esquerdo, clique em **Table Editor**.

## Table Editor: a mecânica básica

O Table Editor mostra uma lista de tabelas à esquerda (uma pra cada "tipo de coisa" que o sistema guarda — quando o schema estiver pronto, você deve ver algo como `tenants`, `services`, `appointments`, etc.). Ao clicar em uma tabela, ela abre como uma planilha:

- **Cada linha** = um registro (ex: uma linha na tabela de tenants = um negócio/profissional cadastrado).
- **Cada coluna** = um campo daquele registro (ex: nome, subdomínio, ativo/inativo).
- Você pode **clicar em qualquer célula** para editar o valor diretamente, como numa planilha do Google.
- Existe um botão **"Insert row"** (geralmente no canto superior) para criar um novo registro do zero.
- Existe um menu de contexto (clique direito na linha, ou os "..." ao lado dela) com opção de **deletar a linha**.
- Há um campo de **filtro** no topo da tabela pra achar uma linha específica sem rolar tudo (ex: filtrar por subdomínio).

## O que você vai fazer, na prática, com o Beautly

Quando o schema estiver implementado, as operações que discutimos ficarem manuais serão assim (nomes ilustrativos — vamos confirmar os reais quando o banco existir):

### Cadastrar um novo tenant (profissional piloto)
1. Abra a tabela de tenants no Table Editor.
2. Clique em "Insert row".
3. Preencha os campos básicos (nome do negócio, subdomínio desejado, telefone, etc.) e marque o campo de "ativo" como verdadeiro.
4. Salve.
5. Separadamente, crie o acesso de login dela: no menu lateral, vá em **Authentication** → **Users** → **Add user**, informe o e-mail dela e uma senha inicial (ou dispare o convite, se o Supabase Auth estiver configurado para isso). Repasse essa credencial pra ela por fora do sistema (WhatsApp, e-mail).

### Ativar/desativar um tenant
1. Abra a tabela de tenants.
2. Localize a linha dela (use o filtro se precisar).
3. Clique na célula da coluna "ativo" e alterne o valor (verdadeiro/falso).
4. Pronto — o produto já foi desenhado pra reagir a essa mudança bloqueando (ou liberando) a página pública, o painel e os links de agendamento dela automaticamente.

### Visualizar tenants existentes
Só abrir a tabela de tenants — é a lista completa, sem precisar de nenhuma tela extra no produto.

## Cuidados

- **Não edite direto tabelas de agendamentos/serviços "no olho"** para corrigir dados de clientes reais, a menos que saiba exatamente o que está fazendo — prefira sempre operações que o próprio produto expõe (login da profissional) quando disponíveis. O uso direto do Studio, neste MVP, é reservado a operações de plataforma (criar/ativar/desativar tenant), não para operar o dia a dia de uma profissional.
- Toda edição manual no Table Editor é **imediata e sem confirmação extra** — não existe "desfazer" fácil como numa planilha. Confira o valor antes de salvar.
- Isso é uma ponte deliberadamente manual para os primeiros tenants. Quando o número de tenants crescer o suficiente para isso ficar arriscado ou lento (algo como 10-15 tenants), vale reavaliar construir uma tela de admin dedicada — mas não antes disso, sem evidência real de que vale o esforço.
