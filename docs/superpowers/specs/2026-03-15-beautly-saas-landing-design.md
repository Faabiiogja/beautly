# Beautly SaaS Landing — Design Spec

**Data:** 2026-03-15
**Status:** Aprovado
**Feature branch:** `main`

---

## 1. Visão Geral

A raiz pública do projeto (`beautly.vercel.app`) passa a ser uma landing page SaaS fixa da marca Beautly, em vez de cair no contexto tenant com fallback `demo`.

Essa landing deve seguir com alta fidelidade a tela `Beautly SaaS Landing Page` do projeto Stitch `Beautly Design System PRD` (`projects/4065108259203499740`, screen `d3ecb1c7960c419fad8fe2c9e6d91910`).

O fluxo multi-tenant continua existindo para subdomínios reais (`slug.beautly.com`) e para previews internos que não sejam o host público raiz.

---

## 2. Objetivo da Mudança

Hoje a raiz do app em [`app/page.tsx`](../../../../app/page.tsx) depende de `getCurrentTenant()` e renderiza uma landing de salão, enquanto o [`middleware.ts`](../../../../middleware.ts) e [`lib/tenant.ts`](../../../../lib/tenant.ts) tratam hosts `*.vercel.app` como preview tenant com fallback.

O novo comportamento desejado é:

- `https://beautly.vercel.app/` renderiza a landing SaaS da Beautly
- `admin.beautly.com` e `beautly-admin.vercel.app` continuam no contexto super-admin
- subdomínios de tenant continuam no contexto tenant
- previews tenant continuam funcionando, exceto o host público raiz `beautly.vercel.app`

---

## 3. Contexto de Hosts

| Host | Contexto | Comportamento |
|---|---|---|
| `beautly.vercel.app` | marketing | renderiza landing SaaS fixa |
| domínio raiz oficial futuro | marketing | renderiza a mesma landing SaaS |
| `admin.beautly.com` | super-admin | continua reescrevendo para `/super-admin/*` |
| `beautly-admin.vercel.app` | super-admin | continua reescrevendo para `/super-admin/*` |
| `slug.beautly.com` | tenant | continua resolvendo tenant por subdomínio |
| previews Vercel de branch | tenant preview | continuam usando fallback tenant |

### Regra principal

Hosts de marketing devem ser explicitamente reconhecidos e excluídos da resolução de tenant.

---

## 4. Estrutura da Landing

A raiz pública será uma página de marketing estática em React/Next/Tailwind, implementada com alta fidelidade à screen do Stitch.

### Estrutura esperada

- hero principal com headline, supporting copy e CTA visual
- seções sequenciais conforme a anatomia da tela do Stitch
- blocos de features, prova social, comparativos, pricing, FAQ ou equivalentes, se presentes na composição final da screen
- header/nav e footer conforme a direção visual da tela
- CTAs da v1 sem navegação funcional real

### Regras de CTA na v1

- CTAs podem existir visualmente
- CTAs não precisam levar para fluxo real
- preferir elementos neutros e acessíveis (`button`, `a` sem destino funcional, ou `href="#"` evitado se gerar salto ruim)
- não prometer login, trial ou demo ativos nesta versão

---

## 5. Estratégia de Fidelidade ao Stitch

O Stitch é a fonte visual da landing. A implementação não deve importar HTML cru da ferramenta para dentro do app como solução final.

### Abordagem

1. usar a screen `Beautly SaaS Landing Page` como referência visual principal
2. transcrever a anatomia da página para seções/componentes React
3. reproduzir tipografia, cores, fundos, sombras, bordas, ritmo vertical e hierarquia
4. manter a página responsiva sem descaracterizar a versão desktop

### Limite intencional

A fidelidade alta é visual e estrutural, não uma obrigação de copiar byte a byte o HTML do Stitch.

---

## 6. Arquitetura Proposta

### Roteamento e resolução de contexto

#### `middleware.ts`

- manter a lógica existente de super-admin
- introduzir reconhecimento explícito de hosts de marketing
- evitar tratar `beautly.vercel.app` como preview tenant
- preservar `x-context` coerente para debugging e futuras expansões

#### `lib/tenant.ts`

- ajustar `extractTenantSlug()` para retornar `null` em hosts de marketing
- manter fallback tenant para localhost e previews Vercel que não sejam o host público raiz
- preservar comportamento atual de subdomínios reais

### Página raiz

#### `app/page.tsx`

- substituir a landing atual do tenant por uma landing SaaS fixa
- remover dependência de `getCurrentTenant()` nesta rota
- remover query de serviços do tenant nesta rota
- manter como Server Component simples, sem necessidade de dados dinâmicos

### Componentes

Se a página ficar longa demais, é aceitável extrair seções para arquivos locais, por exemplo:

```text
app/
  _components/
    marketing/
      landing-hero.tsx
      landing-feature-grid.tsx
      landing-pricing.tsx
      landing-faq.tsx
```

Esse split é opcional e só deve acontecer se melhorar legibilidade.

---

## 7. Estado Atual Impactado

### Arquivos afetados

```text
middleware.ts
lib/tenant.ts
app/page.tsx
```

### Testes afetados

```text
__tests__/middleware.test.ts
__tests__/lib/tenant.test.ts
```

Se ainda não houver cobertura da landing raiz, criar testes direcionados para:

- host de marketing não usar fallback tenant
- host de preview continuar usando fallback tenant
- host super-admin continuar separado

---

## 8. Erros e Regressões a Evitar

### Regressão 1: quebrar preview tenant

Ao abrir a exceção para `beautly.vercel.app`, não se deve invalidar previews Vercel de branches ou ambientes internos que ainda dependem de fallback tenant.

### Regressão 2: quebrar tenant real

Subdomínios reais não podem passar a renderizar a landing SaaS por erro na extração do slug.

### Regressão 3: quebrar super-admin

`beautly-admin.vercel.app` e `admin.beautly.com` devem seguir funcionando como contexto super-admin.

### Regressão 4: CTA quebrado

Os CTAs da landing não devem abrir fluxo inexistente nem causar navegação confusa.

---

## 9. Validação

### Validação funcional

- `beautly.vercel.app/` renderiza a landing SaaS
- a rota raiz não depende mais de tenant ativo
- `beautly-admin.vercel.app/` continua no contexto super-admin
- hosts preview tenant continuam funcionando
- `slug.beautly.com` continua resolvendo o tenant correto

### Validação visual

- hero e seções principais batem com a hierarquia visual da screen do Stitch
- espaçamento, ritmo e direção de layout são coerentes com a referência
- comportamento mobile não degrada a leitura nem a navegação

### Validação de acessibilidade básica

- heading hierarchy coerente
- contraste mínimo aceitável
- elementos interativos com foco visível

---

## 10. Stack

- Next.js 15 App Router
- Tailwind CSS
- middleware por host já existente
- Stitch MCP como referência visual da landing

---

## 11. Fora de Escopo

- ligar CTAs a login, trial, demo ou checkout
- criar backend comercial ou formulário de captura
- mover o marketing para um projeto separado
- alterar o fluxo de booking além do necessário para preservar o roteamento

---

## 12. Observações de Implementação

- o alias atual em [`vercel.json`](../../../../vercel.json) cobre apenas `beautly-admin.vercel.app`; a necessidade de alias adicional para o host público deve ser confirmada no momento do deploy
- a screen do Stitch foi localizada com sucesso via MCP, mas o download direto do HTML no shell falhou por restrição de rede; durante a implementação a screen continuará sendo usada como referência por MCP
