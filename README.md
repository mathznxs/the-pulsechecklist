# Centauro Pulso - Sistema de Execução Operacional

Sistema web completo para gestão operacional de lojas Centauro. O Pulso digitaliza e automatiza processos que antes eram manuais: checklist de tarefas, escalas de trabalho, calendário de eventos, gincanas de performance e dashboard de indicadores. Cada loja opera de forma isolada (multi-tenant) e os colaboradores acessam com suas contas corporativas Microsoft.

---

## Indice

1. [Visao Geral do Projeto](#1-visao-geral-do-projeto)
2. [Tecnologias Utilizadas](#2-tecnologias-utilizadas)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Pastas](#4-estrutura-de-pastas)
5. [Banco de Dados (Supabase)](#5-banco-de-dados-supabase)
6. [Autenticação e Seguranca](#6-autenticacao-e-seguranca)
7. [Funcionalidades Detalhadas](#7-funcionalidades-detalhadas)
8. [Fluxos de Usuário](#8-fluxos-de-usuario)
9. [Variáveis de Ambiente](#9-variaveis-de-ambiente)
10. [Como Instalar e Rodar](#10-como-instalar-e-rodar)
11. [Scripts de Migração do Banco](#11-scripts-de-migracao-do-banco)
12. [Deploy na Vercel](#12-deploy-na-vercel)
13. [Impacto no Dia a Dia da Operação](#13-impacto-no-dia-a-dia-da-operacao)

---

## 1. Visão Geral do Projeto

O **Centauro Pulso** e um sistema de execução operacional criado para resolver problemas reais do dia a dia de uma loja Centauro:

- **Tarefas esquecidas ou sem rastreabilidade** -> Checklist digital com prazos, atribuicao por colaborador, envio de evidências fotográficas e validação pela gerencia.
- **Escala de trabalho em papel ou planilha** -> Escala digital semanal por setor e turno, visível para todos, com possibilidade de ajustes provisórios (trocas de setor no dia).
- **Falta de visibilidade sobre performance** -> Dashboard com métricas em tempo real: percentual de execução, status por setor, gráfico semanal e tabela de performance individual.
- **Comunicação descentralizada** -> Banner de comunicados que aparece para todos os colaboradores da loja.
- **Eventos sem controle** -> Calendario mensal com tipos de eventos (visita, lançamento, folga, crítico).
- **Engajamento da equipe** -> Sistema de gincanas com ranking e pontuacao.

### Papeis no Sistema

| Cargo | Pode fazer |
|---|---|
| **Assistente** | Ver dashboard, executar tarefas atribuidas, enviar evidencias, ver sua escala, ver calendario e gincanas |
| **Gerente e supervisão** | Tudo do assistente + criar tarefas, validar evidencias, gerenciar escalas, criar eventos, gerenciar gincanas, acessar painel admin, cadastrar usuarios, definir avisos |

### Multi-tenant (Multi-loja)

Cada loja e isolada. Um gerente da CE71 só vê dados da CE71. Isso e garantido pelo campo `loja_id` presente em todas as tabelas e filtrado automaticamente em todas as server actions.

---

## 2. Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| **Next.js** | 16.1.6 | Framework React com App Router, Server Components, Server Actions |
| **React** | 19.2.3 | Biblioteca de UI com as últimas features (Activity, useEffectEvent) |
| **TypeScript** | 5.7.3 | Tipagem estática em todo o projeto |
| **Tailwind CSS** | 3.4.17 | Estilização utility-first |
| **shadcn/ui** | - | Componentes de UI (Button, Card, Dialog, Select, Tabs, Badge, etc.) |
| **Radix UI** | - | Primitivos acessiveis por trás do shadcn (Dialog, Tabs, Select, etc.) |
| **Lucide React** | 0.544.0 | Icones SVG |
| **Recharts** | 2.15.0 | Graficos e visualizações de dados |
| **Sonner** | 1.7.1 | Sistema de notificações toast |
| **date-fns** | 4.1.0 | Manipulação de datas |
| **Zod** | 3.24.1 | Validação de schemas |

### Backend e Infra
| Tecnologia | Função |
|---|---|
| **Supabase** | Banco de dados PostgreSQL, Storage para imagens, Row Level Security |
| **NextAuth v5** (Auth.js) | Autenticação via Microsoft Entra ID (SSO corporativo) |
| **Microsoft Entra ID** | Provedor OAuth2 para login corporativo |
| **Vercel** | Hospedagem, deploy automatico, edge functions |
| **Turbopack** | Bundler de desenvolvimento (default no Next.js 16) |

### Estrategia de Renderizacao

O projeto usa **React Server Components (RSC)** como padrão. As paginas são server components que fazem fetch de dados direto no servidor, sem expor chamadas de API ao cliente. Componentes interativos são marcados com `"use client"` apenas quando necessário (formulários, modais, abas).

---

## 3. Arquitetura do Sistema

```
[Navegador]
     |
     v
[Vercel Edge] -> middleware.ts (proteção de rotas, gate de onboarding)
     |
     v
[Next.js App Router]
     |
     ├── Server Components (RSC) -> Fetch de dados via Server Actions
     |     |
     |     v
     |   [lib/actions/*.ts] -> Server Actions ("use server")
     |     |
     |     v
     |   [lib/supabase/service.ts] -> Supabase Client (service role key)
     |     |
     |     v
     |   [Supabase PostgreSQL] -> Tabelas com loja_id para isolamento
     |
     ├── Client Components ("use client") -> Interação, formulários, modais
     |
     └── API Routes (/api/*) -> Upload de imagens, CRUD de usuários
           |
           v
         [Supabase Storage] -> Bucket "task-images"
```

### Fluxo de Dados

1. O **middleware** intercepta toda requisição. Verifica se o usuário está autenticado (via NextAuth JWT). Se não, redireciona para `/auth/login`. Se autenticado mas sem onboarding completo, redireciona para `/onboarding`.

2. As **paginas** (server components) chamam server actions para buscar dados. Cada server action:
   - Busca a sessão do usuario via `auth()`
   - Obtem o `loja_id` da sessão
   - Consulta o Supabase filtrando por `loja_id`
   - Retorna dados tipados

3. Os **componentes client** recebem dados como props dos server components. Ações do usuário (criar tarefa, validar evidência) chamam server actions que fazem `revalidatePath()` para atualizar a página.

4. **Upload de imagens** vai para o API Route `/api/upload`, que envia ao Supabase Storage e retorna a URL pública.

---

## 4. Banco de Dados (Supabase)

### Tabelas Principais

#### `profiles` - Colaboradores
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador único (auto-gerado) |
| microsoft_id | TEXT (UNIQUE) | ID do Microsoft Entra ID (vincula SSO ao perfil) |
| matricula | TEXT (UNIQUE) | Matrícula Centauro do colaborador |
| nome | TEXT | Nome completo |
| cargo | TEXT | `assistente`, `gerente` ou `supervisão` |
| setor_base | TEXT | Setor padrão do colaborador |
| loja_id | UUID (FK -> lojas) | Loja a qual pertence |
| onboarding_completo | BOOLEAN | Se completou o cadastro inicial |
| ativo | BOOLEAN | Se está ativo (gerente pode desativar) |
| criado_em | TIMESTAMPTZ | Data de criação |

#### `lojas` - Lojas (Multi-tenant)
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| numero_loja | TEXT (UNIQUE) | Número da loja (ex: "71") |
| nome | TEXT | Nome (ex: "CE71 - Shopping Bourbon") |
| ativo | BOOLEAN | Se a loja está ativa |

#### `setores` - Setores da Loja
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador único |
| nome | TEXT | Nome do setor (ex: "Calçados", "Vestuário") |
| cor | TEXT | Cor em hex para identificacao visual (#3B82F6) |
| ativo | BOOLEAN | Se o setor está ativo |

#### `tasks` - Tarefas do Checklist
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| titulo | TEXT | Titulo da tarefa |
| descricao | TEXT | Descricao opcional |
| imagem_padrao | TEXT | URL de imagem de referencia |
| prazo | TIMESTAMPTZ | Data e hora limite |
| status | TEXT | `pendente`, `aguardando`, `concluida`, `expirada`, `ressalva` |
| setor | TEXT | Setor alvo |
| criado_por | UUID (FK -> profiles) | Quem criou (gerente) |
| atribuido_para | UUID (FK -> profiles) | Quem executa (assistente) |
| loja_id | UUID (FK -> lojas) | Loja |

#### `task_submissions` - Evidencias de Execucao
| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| task_id | UUID (FK -> tasks) | Tarefa relacionada |
| comentario_assistente | TEXT | Comentario do assistente |
| imagem_assistente | TEXT | URL da foto de evidencia |
| status_validacao | TEXT | `pendente`, `aprovada`, `devolvida` |
| feedback_lideranca | TEXT | Feedback do gerente |
| validado_por | UUID (FK -> profiles) | Quem validou |
| validado_em | TIMESTAMPTZ | Quando validou |

#### `shifts` - Turnos de Trabalho
| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| nome | TEXT | Nome do turno (ex: "Manha", "Tarde") |
| hora_inicio | TIME | Horario de inicio |
| hora_fim | TIME | Horario de fim |

#### `scale_days` - Escala Semanal (modelo atual)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| profile_id | UUID (FK -> profiles) | Colaborador |
| dia_semana | SMALLINT | 0=Dom, 1=Seg, ..., 6=Sab |
| setor | TEXT | Setor naquele dia |
| turno_id | UUID (FK -> shifts) | Turno naquele dia |
| UNIQUE(profile_id, dia_semana) | | Um registro por dia por pessoa |

#### `fixed_schedule` - Escala Fixa (modelo legado, mantido para compatibilidade)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| user_id | UUID (FK -> profiles) | Colaborador |
| setor | TEXT | Setor |
| turno_id | UUID (FK -> shifts) | Turno |
| dias_semana | INTEGER[] | Array de dias (ex: [1,2,3,4,5]) |

#### `temporary_schedule` - Trocas Provisorias
| Coluna | Tipo | Descricao |
|---|---|---|
| user_id | UUID (FK -> profiles) | Colaborador |
| setor | TEXT | Setor temporario |
| data | DATE | Data da troca |
| turno_id | UUID (FK -> shifts) | Turno temporario |
| criado_por | UUID (FK -> profiles) | Quem criou a troca |

#### `calendar_events` - Eventos do Calendario
| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| titulo | TEXT | Titulo do evento |
| tipo | TEXT | `evento`, `visita`, `lancamento`, `folga`, `critico` |
| data_inicio | DATE | Data de inicio |
| data_fim | DATE | Data de fim (opcional) |

#### `challenges` - Gincanas
| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID (PK) | Identificador unico |
| nome | TEXT | Nome da gincana |
| ativa | BOOLEAN | Se esta ativa |
| data_inicio | DATE | Inicio (opcional) |
| data_fim | DATE | Fim (opcional) |
| descricao | TEXT | Descricao |

#### `challenge_scores` - Pontuacoes
| Coluna | Tipo | Descricao |
|---|---|---|
| challenge_id | UUID (FK -> challenges) | Gincana |
| user_id | UUID (FK -> profiles) | Colaborador |
| pontos | INTEGER | Pontos acumulados |
| UNIQUE(challenge_id, user_id) | | Um score por pessoa por gincana |

#### `announcements` - Comunicados
| Coluna | Tipo | Descricao |
|---|---|---|
| message | TEXT | Texto do comunicado |
| ativo | BOOLEAN | Se esta visivel |
| criado_por | UUID (FK -> profiles) | Quem criou |

### Supabase Storage

- **Bucket:** `task-images` (publico)
- **Estrutura:** `{profile_id}/{timestamp}.{ext}`
- **Tipos permitidos:** JPEG, PNG, WebP, HEIC
- **Tamanho maximo:** 5MB

---

## 6. Autenticacao e Seguranca

### Microsoft Entra ID (SSO Corporativo)

O sistema usa **NextAuth v5** com o provedor **Microsoft Entra ID** (antigo Azure AD). Isso significa que o login e feito com a conta corporativa Microsoft do colaborador -- nao existe cadastro com email/senha.

**Fluxo de autenticacao:**

1. Colaborador clica em "Entrar com Microsoft" na pagina `/auth/login`
2. NextAuth redireciona para o Microsoft Entra ID (OAuth2)
3. O colaborador faz login com sua conta corporativa (`@centauro.com.br`)
4. Microsoft retorna um token com o `oid` (Object ID) do usuario
5. O callback `signIn` do NextAuth verifica se existe um perfil com aquele `microsoft_id` no banco
   - Se existe e `ativo = false` -> redireciona para `/auth/blocked`
   - Se nao existe -> permite o login (sera redirecionado para onboarding)
6. O callback `jwt` enriquece o token com dados do perfil (cargo, loja_id, etc.)
7. O middleware verifica o token JWT em cada requisicao

### Middleware de Protecao

O arquivo `middleware.ts` protege todas as rotas:

- **Rotas publicas:** `/auth/login`, `/auth/error`, `/auth/blocked`
- **Rotas da API NextAuth:** `/api/auth/*` (sempre liberadas)
- **Gate de onboarding:** Se autenticado mas sem perfil completo, redireciona para `/onboarding`
- **Todas as outras rotas:** Requerem autenticacao

### Client Supabase (Service Role)

Como a autenticacao e feita pelo NextAuth (nao pelo Supabase Auth), o projeto usa o **service role key** do Supabase para acessar o banco. Isso significa que o Supabase nao sabe quem e o usuario -- o isolamento de dados e feito pela aplicacao, filtrando por `loja_id` em todas as queries.

```typescript
// lib/supabase/server.ts
export async function createClient() {
  return createServiceClient() // Usa SUPABASE_SERVICE_ROLE_KEY
}

// Em cada server action:
const lojaId = await getCurrentLojaId() // Pega loja_id da sessao NextAuth
let query = supabase.from("tasks").select("*")
if (lojaId) query = query.eq("loja_id", lojaId) // Filtra pela loja
```

---

## 7. Funcionalidades Detalhadas

### 7.1 Dashboard (`/`)

**Arquivo:** `app/page.tsx`
**Componentes:** `OperationalDay`, `StatusCards`, `SectorExecution`, `PerformanceChart`, `PerformanceTable`, `AnnouncementBanner`

O dashboard e a pagina inicial e exibe:

- **Status Operacional do Dia:** Calcula automaticamente baseado no percentual de tarefas concluidas (critico < 50%, atencao 50-70%, normal 70-90%, otimo > 90%)
- **Cards de Status:** Quantidade de tarefas concluidas, pendentes, com ressalva e expiradas
- **Execucao por Setor:** Barras de progresso mostrando o percentual de conclusao de cada setor
- **Grafico Semanal:** Grafico de barras (Recharts) com a performance dia a dia da semana atual
- **Tabela de Performance:** Ranking individual de cada colaborador com matricula, nome, setor, tarefas concluidas, pendentes, ressalvas e percentual
- **Banner de Comunicados:** Mensagem do gerente visivel para toda a equipe

**Server Actions usadas:** `getDashboardStats`, `getSectorStats`, `getOperationalStatus`, `getChecklistPercentage`, `getActiveAnnouncement`, `getWeeklyPerformance`, `getEmployeePerformance`

### 7.2 Execucao / Checklist (`/execucao`)

**Arquivo:** `app/execucao/page.tsx` + `components/pulso/execucao-content.tsx`

Sistema de checklist digital com ciclo completo:

**Para o Gerente (criacao):**
1. Clica em "Nova Tarefa"
2. Preenche: titulo, descricao, prazo, setor, colaborador atribuido
3. Opcionalmente, envia uma imagem de referencia (padrao visual esperado)
4. A tarefa aparece como "pendente" para o assistente

**Para o Assistente (execucao):**
1. Ve suas tarefas pendentes na lista
2. Clica em "Executar"
3. Escreve um comentario e envia uma foto da execucao (evidencia)
4. O status muda para "aguardando" (aguardando validacao)

**Para o Gerente (validacao):**
1. Ve tarefas com status "aguardando"
2. Visualiza a foto do assistente e o comentario
3. Aprova -> status vira "concluida"
4. Devolve com feedback -> status vira "ressalva" (assistente precisa refazer)

**Ciclo de status:**
```
pendente -> aguardando -> concluida
                       -> ressalva -> pendente (se reaberta)
pendente -> expirada (automatico, se passou do prazo)
```

**Filtros disponiveis:** Por setor, por status, por data, por colaborador

**Server Actions:** `getTasksForRole`, `createTask`, `submitTask`, `validateSubmission`, `updateTaskStatus`, `deleteTask`, `reopenTask`

### 7.3 Escala de Trabalho (`/escala`)

**Arquivo:** `app/escala/page.tsx` + `components/pulso/escala-content.tsx`

**Visao do Assistente:**
- Ve sua escala pessoal da semana inteira (domingo a sabado)
- Ve o setor e turno de cada dia
- Ve qual e o setor e turno de hoje em destaque

**Visao do Gerente (Escala Geral):**
- Ve a escala de todos os colaboradores da loja agrupada por setor
- Cada setor e exibido como um card com a cor cadastrada na tabela `setores`
- Dentro de cada setor, os colaboradores sao listados com nome, matricula e turno
- Pode criar escalas provisorias (trocas de setor/turno para um dia especifico)

**Prioridade de escalas:**
1. `temporary_schedule` (provisoria) -> tem prioridade absoluta
2. `scale_days` (modelo atual) -> escala semanal por dia
3. `fixed_schedule` (legado) -> fallback para escalas antigas

**Server Actions:** `getUserTodaySchedule`, `getUserWeekSchedule`, `getTodayAllSchedules`, `saveWeeklySchedule`, `createTemporarySchedule`

### 7.4 Calendario (`/calendario`)

**Arquivo:** `app/calendario/page.tsx` + `components/pulso/calendario-content.tsx`

- Visualizacao mensal com navegacao entre meses
- Tipos de eventos com cores:
  - `evento` (azul) - eventos gerais
  - `visita` (amarelo) - visitas de supervisao ou auditoria
  - `lancamento` (verde) - lancamentos de produtos/campanhas
  - `folga` (cinza) - folgas coletivas
  - `critico` (vermelho) - datas criticas
- Gerente pode criar e excluir eventos
- Assistente apenas visualiza

**Server Actions:** `getCalendarEvents`, `createCalendarEvent`, `deleteCalendarEvent`

### 7.5 Gincanas (`/gincanas`)

**Arquivo:** `app/gincanas/page.tsx` + `components/pulso/gincanas-content.tsx`

Sistema de gamificacao para engajamento:

- Gerente cria gincanas com nome, descricao e periodo
- Adiciona colaboradores e gerencia pontuacoes (incrementar, decrementar, editar valor)
- Ranking em tempo real com podio visual
- Gincanas podem ter data de inicio e fim (periodo de vigencia)
- Funcao `isChallengeEditable` impede edicao apos a data de fim

**Server Actions:** `getActiveChallenges`, `getChallengeScores`, `createChallenge`, `incrementScore`, `decrementScore`, `setScore`

### 7.6 Painel Admin (`/admin`)

**Arquivo:** `app/admin/page.tsx` + `components/pulso/admin-content.tsx`

Acesso restrito a gerentes. Dividido em abas:

**Aba Usuarios:**
- Lista todos os colaboradores da loja
- Criar novo colaborador (matricula, nome, cargo, setor base)
- Editar colaborador existente (nome, cargo, setor, status ativo/inativo)
- Desativar colaborador (impede login via tela `/auth/blocked`)

**Aba Escala Semanal:**
- Seleciona um colaborador
- Define setor e turno para cada dia da semana (Dom-Sab)
- Salva via upsert no `scale_days` (constraint unica profile_id + dia_semana)
- Pode criar escalas provisorias (troca de setor para um dia especifico)

**Aba Turnos:**
- Criar novos turnos (nome, hora inicio, hora fim)
- Lista turnos existentes

**Aba Comunicados:**
- Editar mensagem do banner de comunicados
- O comunicado anterior e desativado e o novo e criado

**Server Actions:** `getAllProfiles`, `getShifts`, `createShift`, `getSetores`, `getFixedSchedules`, `saveWeeklySchedule`, `createTemporarySchedule`, `updateAnnouncement`

**API Routes:** `POST /api/admin/users` (criar usuario), `PATCH /api/admin/users` (editar usuario)

### 7.7 Onboarding (`/onboarding`)

**Arquivo:** `app/onboarding/page.tsx` + `components/pulso/onboarding-form.tsx`

Fluxo de primeiro acesso:

1. Colaborador faz login com Microsoft pela primeira vez
2. Middleware detecta que nao tem perfil completo -> redireciona para `/onboarding`
3. Preenche: matricula, nome completo, cargo, setor base, numero da loja
4. A loja e validada contra a tabela `lojas`
5. A matricula e validada como unica
6. Perfil e criado/atualizado no banco com `onboarding_completo = true`
7. Middleware redireciona para o dashboard

**Server Actions:** `completeOnboarding`, `getLojas`, `getSetores`

---

## 8. Fluxos de Usuario

### Fluxo 1: Primeiro Acesso de um Novo Colaborador

```
1. Acessa centauro-pulso.vercel.app
2. Middleware detecta: nao autenticado -> redireciona /auth/login
3. Clica "Entrar com Microsoft"
4. Autentica com conta corporativa
5. NextAuth callback: nao existe perfil com esse microsoft_id
6. Middleware detecta: autenticado mas sem onboarding -> redireciona /onboarding
7. Preenche matricula, nome, cargo, setor, loja
8. completeOnboarding() cria o perfil no banco
9. Middleware detecta: onboarding completo -> permite acesso ao dashboard
```

### Fluxo 2: Ciclo Completo de uma Tarefa

```
1. [Gerente] Acessa /execucao -> clica "Nova Tarefa"
2. [Gerente] Preenche titulo, prazo, setor "Calcados", atribui para "Joao"
3. [Banco] Task criada com status "pendente", loja_id da sessao
4. [Assistente Joao] Acessa /execucao -> ve a tarefa pendente
5. [Assistente Joao] Clica "Executar" -> escreve comentario, tira foto, envia
6. [Banco] task_submission criada, task status -> "aguardando"
7. [Gerente] Ve tarefa "aguardando" -> abre e ve a foto do Joao
8. [Gerente] Aprova -> task status -> "concluida"
   OU
   [Gerente] Devolve com feedback -> task status -> "ressalva"
9. [Dashboard] Metricas atualizadas em tempo real
```

### Fluxo 3: Montagem da Escala

```
1. [Gerente] Acessa /admin -> aba "Escala Semanal"
2. Seleciona colaborador "Maria"
3. Define: Seg=Calcados/Manha, Ter=Vestuario/Tarde, ...
4. Salva -> scale_days upsertados (um registro por dia)
5. [Maria] Acessa /escala -> ve sua semana completa
6. [Gerente] Precisa trocar Maria de setor na Quarta
7. [Gerente] Cria escala provisoria: Maria, Quarta, Acessorios, Tarde
8. [Banco] temporary_schedule criado para aquela data
9. Na Quarta, o sistema usa a provisoria (prioridade sobre scale_days)
```

---

## 9. Variaveis de Ambiente

| Variavel | Descricao | Onde obter |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard -> Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase | Supabase Dashboard -> Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de servico do Supabase (admin) | Supabase Dashboard -> Settings -> API |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Client ID do app no Entra ID | Azure Portal -> App Registrations |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Client Secret do app no Entra ID | Azure Portal -> App Registrations -> Certificates |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Tenant ID da organizacao | Azure Portal -> App Registrations -> Overview |
| `AUTH_SECRET` | Secret para criptografia JWT do NextAuth | Gerar com `npx auth secret` |

---

## 10. Como Instalar e Rodar

### Pre-requisitos

- Node.js 18+
- npm (gerenciador de pacotes do projeto)
- Conta Supabase com projeto criado
- App registrado no Microsoft Entra ID (Azure AD)

### Passo a Passo

```bash
# 1. Clonar o repositorio
git clone https://github.com/mathznxs/pulso-checklist.git
cd pulso-checklist

# 2. Instalar dependencias
npm install

# 3. Configurar variaveis de ambiente
# Criar arquivo .env.local na raiz com as variaveis listadas na secao 9

# 4. Executar migracoes no Supabase
# Acesse o SQL Editor do Supabase Dashboard e execute os scripts
# da pasta /scripts na ordem numerica (001 a 016)

# 5. Rodar o servidor de desenvolvimento
npm run dev

# O app estara disponivel em http://localhost:3000
```

### Scripts disponiveis

| Comando | Funcao |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com Turbopack |
| `npm run build` | Gera a build de producao |
| `npm run start` | Inicia o servidor de producao |
| `npm run lint` | Executa o linter |

---

## 11. Scripts de Migracao do Banco

Os scripts na pasta `/scripts` devem ser executados **na ordem numerica** no SQL Editor do Supabase. Cada script e idempotente (usa `IF NOT EXISTS` e `ON CONFLICT DO NOTHING`).

| Script | O que faz |
|---|---|
| `001_create_profiles.sql` | Cria tabela `profiles` com RLS |
| `002_profile_trigger.sql` | Trigger para auto-criar perfil (legado, removido no 015) |
| `003_create_tasks.sql` | Cria tabelas `tasks` e `task_submissions` com RLS |
| `004_create_calendar_events.sql` | Cria tabela `calendar_events` |
| `005_create_challenges.sql` | Cria tabelas `challenges` e `challenge_scores` |
| `006_create_schedules.sql` | Cria `shifts`, `fixed_schedule`, `temporary_schedule`, `announcements` |
| `007_create_storage.sql` | Cria bucket `task-images` no Supabase Storage |
| `008_challenge_scores_constraint.sql` | Adiciona constraint UNIQUE em challenge_scores |
| `009_fix_tasks_rls.sql` | Correcoes nas politicas RLS de tasks |
| `010_fix_profiles_rls.sql` | Correcoes nas politicas RLS de profiles |
| `011_challenges_data_inicio_fim.sql` | Adiciona campos data_inicio e data_fim em challenges |
| `012_scale_days.sql` | Cria tabela `scale_days` (novo modelo de escala semanal) |
| `013_remove_cargos_lideranca_admin.sql` | Simplifica cargos, atualiza todas as politicas RLS |
| `014_create_lojas.sql` | Cria tabela `lojas` para multi-tenant |
| `015_restructure_profiles.sql` | Adiciona microsoft_id, loja_id, remove CPF, simplifica cargos para assistente/gerente |
| `016_add_loja_id_entities.sql` | Adiciona loja_id em todas as tabelas para isolamento por loja |

---

## 12. Deploy na Vercel

O projeto esta configurado para deploy na Vercel com integracao Git:

1. **Repositorio:** `mathznxs/pulso-checklist` no GitHub
2. **Branch de producao:** `main`
3. **Variaveis de ambiente:** Configuradas no painel da Vercel (Settings -> Environment Variables)
4. **Integracao Supabase:** Conectada via integracao nativa da Vercel (adiciona as env vars automaticamente)
5. **Deploy automatico:** Cada push no `main` gera um novo deploy

**Configuracoes importantes no `next.config.mjs`:**
- `typescript.ignoreBuildErrors: true` - Permite build mesmo com warnings de tipo
- `images.remotePatterns` - Permite carregar imagens do dominio Supabase (`*.supabase.co`)

---

## 13. Impacto no Dia a Dia da Operacao

### Antes do Pulso (processos manuais)

| Problema | Como era |
|---|---|
| Tarefas | Passadas verbalmente ou em grupo de WhatsApp, sem rastreio |
| Evidencias | Nenhuma, ou foto no WhatsApp sem organizacao |
| Escala | Planilha Excel ou papel na parede, desatualizada |
| Performance | Avaliacao subjetiva, sem dados |
| Comunicados | WhatsApp ou mural fisico |
| Eventos | Calendario de papel ou planilha |

### Com o Pulso (processos digitais)

| Solucao | Como ficou |
|---|---|
| **Tarefas rastreadas** | Cada tarefa tem titulo, prazo, responsavel, status. Nada se perde. |
| **Evidencias fotograficas** | Assistente envia foto da execucao, gerente valida. Historico completo. |
| **Escala digital** | Setor + turno por dia, visivel para todos. Trocas provisorias sem retrabalho. |
| **Performance com dados** | Dashboard com metricas reais: % de execucao, ranking, grafico semanal. |
| **Comunicados centralizados** | Banner no topo do app, todos veem. |
| **Calendario visual** | Eventos tipados com cores, navegacao mensal. |
| **Engajamento** | Gincanas com ranking e pontuacao incentivam a equipe. |
| **Multi-loja** | Cada loja tem seus proprios dados isolados. Sistema escalavel. |
| **Login corporativo** | Sem senhas adicionais. Login com a conta Microsoft da Centauro. |
| **Mobile-first** | Navegacao inferior no celular, responsivo. Funciona no chao de loja. |

### Metricas que o sistema fornece ao gestor

- **Percentual de execucao geral** (quantas tarefas foram concluidas vs total)
- **Execucao por setor** (qual setor esta atrasado)
- **Performance individual** (quem esta executando bem, quem precisa de apoio)
- **Tendencia semanal** (grafico de performance dia a dia)
- **Tarefas expiradas** (tarefas que passaram do prazo sem execucao)
- **Tarefas com ressalva** (tarefas devolvidas que precisam de atencao)

---

## Resumo Tecnico Final

O Centauro Pulso e uma aplicacao Next.js 16 com React 19, usando Server Components para performance e Server Actions para mutacoes de dados. A autenticacao e feita via Microsoft Entra ID (SSO corporativo) atraves do NextAuth v5, com tokens JWT enriquecidos com dados do perfil. O banco de dados PostgreSQL no Supabase armazena todas as entidades com isolamento multi-loja via `loja_id`. O frontend usa Tailwind CSS com design tokens customizados (cores da Centauro), shadcn/ui para componentes e Recharts para graficos. O deploy e feito na Vercel com CI/CD automatico via GitHub.
