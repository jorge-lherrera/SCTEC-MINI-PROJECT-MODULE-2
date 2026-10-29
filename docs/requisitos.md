# Requisitos — Projeto Final Avaliativo, Módulo 02 (MedClinic API, Etapa 2)

Checklist de todos os requisitos do enunciado ("Projeto Final Avaliativo - Módulo 02 - Semana 11"),
copiados seção por seção. Marque cada item quando estiver implementado **e verificado**.

**Prazo:** 02/11/26, segunda, até às 22h. **Peso:** 60% da nota do Módulo 02.

---

## 1. Requisitos gerais (Seção 2 — Desafio)

- [ ] Aplicação desenvolvida obrigatoriamente em **TypeScript**, com tipagem estática consistente em todas as camadas (variáveis, parâmetros, retornos de função, entidades e DTOs).
- [ ] Sem JavaScript puro (nem em arquivos `.ts`) e sem uso indiscriminado de `any` para evitar a tipagem.
- [ ] **Contrato de API fixo (Seção 4.9)**: rotas, nomes de campo, códigos de status e códigos de erro são literais e verificados por bateria automatizada contra a API publicada.
- [ ] Base de autenticação e autorização (etapa 1) presente e funcionando (mesmo repositório ou repositório novo).
- [ ] Framework **Express** ou **NestJS** (livre).
- [ ] Rotas de autenticação sob o prefixo `/api/v1`: `POST /api/v1/auth/login` devolvendo `{ "accessToken": ... }` (e não `POST /auth/login` com `{ "token": ... }`).
- [ ] Perfis de acesso passam a ser **três**.

### Objetivo técnico — a API deve ser capaz de

- [ ] cadastrar pacientes, com CPF único e validado;
- [ ] cadastrar médicos, criando em uma única operação atômica o usuário de acesso e o registro profissional;
- [ ] registrar a escala de trabalho de cada médico, por dia da semana, turno e duração de consulta;
- [ ] devolver a agenda de um médico em um período, para o front-end montar os horários livres;
- [ ] criar agendamentos validando o horário contra a escala e contra os agendamentos já existentes;
- [ ] impedir que duas requisições simultâneas ocupem o mesmo horário do mesmo médico;
- [ ] controlar a transição de status do agendamento;
- [ ] registrar e consultar prontuário, restringindo o acesso ao médico que atendeu o paciente;
- [ ] tratar erros de forma centralizada, devolvendo um envelope de erro padronizado;
- [ ] ser coberta por testes unitários sobre a camada de regra de negócio, com limiar mínimo de cobertura;
- [ ] validar cada pull request automaticamente pelo GitHub Actions;
- [ ] ser publicada automaticamente na nuvem a cada incorporação na branch `main`;
- [ ] responder corretamente a uma bateria de testes de aceitação executada contra a URL pública.

---

## 2. Resultados esperados / entrega (Seção 3)

### Repositório público no GitHub, contendo

- [ ] código-fonte completo;
- [ ] histórico de desenvolvimento com branches e pull requests;
- [ ] migrations do banco;
- [ ] `Dockerfile`;
- [ ] arquivos de workflow em `.github/workflows/`;
- [ ] `README.md`.

### O `README.md` deve conter

- [ ] nome e descrição do sistema, e o escopo desta etapa;
- [ ] tecnologias utilizadas;
- [ ] pré-requisitos e instruções de execução local, incluindo o `docker compose` do banco;
- [ ] lista das variáveis de ambiente, com o papel de cada uma (espelhando o `.env.example`);
- [ ] comandos de migration, build, teste e execução;
- [ ] descrição da arquitetura e da estrutura de pastas, com a justificativa das decisões de modelagem e o padrão de nomes adotado (RNF06);
- [ ] o recorte da cobertura de testes (quais arquivos entram na conta e por quê);
- [ ] a URL pública da API publicada;
- [ ] resumo dos endpoints, com os perfis exigidos;
- [ ] link do board do projeto.

### Demais itens de entrega

- [ ] **API publicada e acessível na internet**, no **Render** ou no **Google Cloud Run**, conectada a um banco **PostgreSQL gerenciado**, respondendo no contrato da Seção 4.9.
- [ ] **Board de gestão do projeto** em GitHub Projects (preferencial) ou Trello, em modo **público**.
- [ ] **Credenciais do usuário administrador de avaliação**, para o professor autenticar na API publicada.

### Submissão no AVA — tarefa "Módulo 02 - Projeto Final Avaliativo"

- [ ] 1. Link do repositório **público** no GitHub.
- [ ] 2. **URL pública da API** (a raiz do serviço, ex.: `https://medclinic-seunome.onrender.com`).
- [ ] 3. Link do **board público** (GitHub Projects ou Trello).
- [ ] 4. **E-mail e senha do usuário administrador** de avaliação da API publicada.
- [ ] Entregue até 02/11/26, 22h.

### Disponibilidade e observações

- [ ] A API está no ar no momento da correção (serviço fora do ar, banco desligado ou credencial de admin incorreta reprovam todos os critérios automatizados).
- [ ] Se a plataforma suspende o serviço por inatividade, ele volta ao ar sozinho na primeira requisição (considerar a demora da primeira resposta).
- [ ] Nenhuma alteração depois de entregue (vale como data final a última atualização no repositório).
- [ ] Repositório permanece **público** de forma permanente (projeto de portfólio).
- [ ] Banco criado pelas **migrations** do projeto; não entregar apenas um banco previamente populado.
- [ ] Sem `synchronize: true` em produção.
- [ ] `.env` **não versionado** no repositório.
- [ ] `.env.example` obrigatório, listando **todas** as chaves necessárias, **sem valores reais**.
- [ ] Domínio técnico: compreender, adaptar e conseguir explicar todo o código entregue (sem plágio nem cópia integral).
- [ ] Sem plágio de soluções da internet ou de outros colegas (projeto desconsiderado e nota 0).

---

## 3. Requisitos de negócio — RN (Seção 4.1)

> A modelagem é livre (nome de entidade/coluna, tipo de PK, tabelas, FK ou `jsonb`). O único contrato rígido é a fronteira da API (DTOs da Seção 4.9). Defender as escolhas de modelagem no README.

### Conceitos e perfis

- [ ] Perfis com estes nomes exatos, em minúsculas: `admin` (administração: cria usuários, médicos e escalas; enxerga tudo), `secretary` (cadastra pacientes e agendamentos), `doctor` (consulta a própria agenda, conduz o atendimento, escreve o prontuário).
- [ ] Um usuário pode ter mais de um perfil.
- [ ] O campo `roles` das respostas da API é sempre um **array de strings** (perfil pode continuar como coluna `enum` se for o caso da etapa 1).
- [ ] Seis conceitos: usuário/perfil, paciente (identificado por CPF), médico (identificado por CRM e também usuário), escala de trabalho (conjunto de turnos), agendamento (liga paciente a médico num período, com status), prontuário (registros de texto sobre um paciente, cada um com o médico que o escreveu).

### Regras

- [ ] **RN01** — Cada perfil executa só as operações do seu papel; operação fora do papel é recusada. Paciente não acessa o sistema; quem marca consulta é a secretária.
- [ ] **RN02** — Paciente identificado por CPF com 11 dígitos, sem pontuação. Dois pacientes não podem ter o mesmo CPF; CPF repetido é recusado e não cria segundo registro.
- [ ] **RN03** — Médico tem CRM; dois médicos não podem ter o mesmo CRM. Todo médico é também usuário com perfil `doctor`. Sem meio cadastro: se o cadastro falha por qualquer motivo, nada é criado.
- [ ] **RN04** — A escala é uma lista de turnos; cada turno tem dia da semana, hora de início, hora de fim e **duração da consulta naquele turno** (a duração é por turno). Um médico pode ter mais de um turno no mesmo dia da semana.
- [ ] **RN05** — Dois turnos do mesmo médico no mesmo dia da semana não se sobrepõem. Turnos encostados (um termina quando o outro começa) são válidos.
- [ ] **RN06** — O horário do turno é hora de relógio local da clínica (`America/Sao_Paulo`), sem data e sem fuso; vale para todo aquele dia da semana.
- [ ] **RN07** — Um horário é válido quando, ao mesmo tempo: (1) cai dentro de algum turno da escala naquele dia da semana; (2) está alinhado à grade do turno (começa num múltiplo da duração contado do início do turno); (3) a consulta inteira cabe no turno (termina no fim do turno ou antes). Horário que falha em qualquer uma **não existe** naquela agenda.
- [ ] **RN08** — Duas consultas ativas do mesmo médico não se sobrepõem: `sobrepõe(a, b) ⇔ a.início < b.fim e b.início < a.fim`. Comparação estrita: consultas encostadas não conflitam. Conflito é interseção de períodos, não igualdade de início.
- [ ] **RN09** — Duas consultas ativas do mesmo paciente não se sobrepõem, mesmo com médicos diferentes.
- [ ] **RN10** — Duas tentativas simultâneas para o mesmo horário: só uma é gravada; a que falha recebe erro de horário recém-ocupado (não erro genérico nem confirmação falsa).
- [ ] **RN11** — Ciclo de vida: nasce **agendada** → **em andamento** → **concluída**. Pode ser **cancelada** enquanto não estiver concluída. Concluída e cancelada são estados finais.
- [ ] **RN12** — Autoridade por transição: o médico da consulta (ou a administração) coloca em andamento e conclui. Cancelar: administração e o próprio médico em qualquer estado cancelável; secretaria cancela consulta agendada, mas não em andamento (tabela da Seção 4.9.7).
- [ ] **RN13** — Cancelar libera o horário, que volta a estar disponível e pode receber outra consulta.
- [ ] **RN14** — Prontuário: acesso pelo **vínculo** com o atendimento (existe ao menos uma consulta entre médico e paciente `in_progress` ou `done`). Médico com vínculo escreve e lê; médico sem vínculo não escreve nem lê; administração só lê (auditoria); secretaria não escreve nem lê.
- [ ] **RN15** — Mudar a escala não altera consulta já marcada: consultas mantêm o período que tinham; o sistema não apaga nem move consulta sozinho. Recomendação: guardar na consulta o próprio instante de fim, calculado ao agendar.

---

## 4. Requisitos funcionais — RF (Seção 4.2)

- [ ] **RF01** — Autenticar por e-mail e senha e devolver token com expiração que identifica o usuário e os perfis. Toda rota, exceto as públicas, exige o token; perfil sem permissão é recusado. Rotas sob `/api/v1`; campo do token no login: `accessToken`. (Rotas `/auth/login`, `/users/me`; caso mínimo 6.)
- [ ] **RF02** — Cadastrar paciente com validação de CPF (11 dígitos numéricos) e recusa de CPF repetido; consultar por identificador, alterar dados e remover. (Rota `/patients`.)
- [ ] **RF03** — Criar na mesma operação o registro profissional e o usuário `doctor`. Falha por CRM ou e-mail duplicado não deixa estado parcial; duas gravações ficam na **mesma transação**. (Rotas `POST /doctors`, `GET /doctors`.)
- [ ] **RF04** — Registrar a escala completa (turnos por dia da semana, horário e duração) e devolvê-la quando consultada. O registro **substitui a escala inteira**; lista vazia deixa o médico sem escala. Turnos sobrepostos no mesmo dia recusados; encostados aceitos. (Rota `/doctors/{id}/work-schedule`; caso mínimo 3.)
- [ ] **RF05** — Devolver, para um médico e um intervalo de datas, a escala e as consultas ativas do período (cancelada não aparece). O sistema **não gera** a lista de horários livres. (Rota `/doctors/{id}/calendar`.)
- [ ] **RF06** — Criar consulta a partir de médico, paciente e instante de início; o **fim é calculado pelo sistema** (início + duração do turno); o cliente não informa o fim. Verificar nesta ordem: (1) médico e paciente existem; (2) horário existe na escala (RN07); (3) médico livre (RN08); (4) paciente livre (RN09). Cada falha produz um erro diferente. (Rota `POST /appointments`; casos mínimos 1 e 2.)
- [ ] **RF07** — Duas requisições simultâneas para o mesmo médico e horário resultam em exatamente uma consulta gravada; a que perde recebe `HORARIO_INDISPONIVEL`. Abordagem recomendada (e cobrada pelo critério 5 e pela 4.9.7): transação com bloqueio pessimista na linha do **médico**, envolvendo verificação e gravação.
  - [ ] O bloqueio só vale com transação aberta (fora dela o TypeORM lança `PessimisticLockTransactionRequiredError`).
  - [ ] Travar a linha do **médico**, não as linhas de consulta (agenda vazia não teria o que travar).
  - [ ] Dentro do callback da transação, **todas** as consultas ao banco passam pelo `EntityManager` da transação (nunca o repositório injetado).
  - [ ] Todo caminho que grava consulta usa o bloqueio (remarcação, se existir, também). Cancelar não precisa.
- [ ] **RF08** — Mudar o status obedecendo ao ciclo de vida (RN11) e à autoridade de cada perfil (RN12), com dois tipos de recusa: transição não permitida e perfil sem autoridade. Cancelada libera o horário. (Rota `PATCH /appointments/{id}/status`; caso mínimo 4.)
- [ ] **RF09** — Escrita e leitura de prontuário conforme RN14. O autor é **sempre o médico autenticado** (do token), nunca um id vindo do corpo. (Rota `/patients/{id}/medical-records`; caso mínimo 5.)
- [ ] **RF10** — Toda listagem é paginada e devolve dados + metadados (total, página atual, tamanho da página, total de páginas) no formato da 4.9.1.
  - [ ] Listagens de paciente e de médico aceitam busca parcial por nome.
  - [ ] Listagem de consultas aceita filtro por médico, paciente, status e intervalo de datas, combináveis.
  - [ ] Usuário `doctor` ao listar consultas enxerga **apenas as próprias**, independentemente do filtro.
- [ ] **RF11** — Todo erro, de 400 a 500, responde no envelope padronizado da 4.9.1, com um código do catálogo.
- [ ] **RF12** — Validar todo corpo, parâmetro de rota e parâmetro de query antes da regra de negócio; fora do formato → `DADOS_INVALIDOS` (validação manual, `class-validator` ou `zod`).
- [ ] **RF13** — Nenhum caminho público cria ou eleva um administrador; criar usuário exige admin autenticado; nenhuma rota aberta concede perfil. Primeiro admin conforme RP07. (Rota `POST /users`.)

---

## 5. Requisitos não funcionais — RNF (Seção 4.3)

- [ ] **RNF01** — Senha armazenada só como hash e ausente de todas as respostas. Segredos (credenciais do banco, segredo do JWT, senha do admin) lidos de variáveis de ambiente e fora do repositório.
- [ ] **RNF02** — Todo acesso ao banco usa consulta parametrizada; ordenação ou filtro dinâmico passa por lista de permissão; nenhuma SQL por concatenação de entrada.
- [ ] **RNF03** — Nenhuma entrada inválida encerra o processo; nenhuma resposta de erro contém `stack trace`.
- [ ] **RNF04** — Nenhum controller ou rota contém regra de negócio nem importa `typeorm`. Regra nos services; acesso ao banco nos repositórios.
- [ ] **RNF05** — `tsconfig.json` com `strict: true`; sem `any` explícito para fugir da tipagem; `tsc` sem erros.
- [ ] **RNF06** — Padrão de nomes de arquivos, classes, funções, rotas e pastas declarado no README e aplicado sem exceção.
- [ ] **RNF07** — Cobertura ≥ 80% em `lines`, `branches`, `functions` e `statements` sobre os arquivos de regra de negócio; nenhum teste depende de banco, rede ou variável de ambiente; verificado por `npm run test:cov` no workflow do PR.
- [ ] **RNF08** — Nenhum valor de ambiente fixo no código; `.env` no `.gitignore`; `.env.example` versionado com todas as chaves e sem valores reais.
- [ ] **RNF09** — A API publicada responde `GET /api/v1/health` com 200 durante a correção; se suspensa por inatividade, volta sozinha na primeira requisição.
- [ ] **RNF10** — Com a API ativa, cada rota responde em até 5 segundos.
- [ ] Baixo acoplamento, ausência de duplicação e funções com responsabilidade única (avaliados no critério 3).

---

## 6. Organização arquitetural e restrições de projeto (Seção 4.4)

### Restrições de projeto (RP)

- [ ] **RP01** — TypeScript com tipagem estática em todas as camadas; sem JavaScript puro; framework Express ou NestJS.
- [ ] **RP02** — Camadas ligadas por injeção de dependência pelo construtor.
- [ ] **RP03** — Tratamento de erro num único ponto (middleware de erro no Express, exception filter no NestJS). Erros de domínio lançados na regra de negócio são traduzidos para HTTP nessa borda; a regra de negócio não conhece código de status.
- [ ] **RP04** — Unicidade de e-mail de usuário, CPF de paciente e CRM de médico garantida por **restrição no banco**, e não só verificada em código.
- [ ] **RP05** — Instantes guardados com fuso (`timestamptz`).
- [ ] **RP06** — Toda a estrutura do banco criada por migrations do TypeORM versionadas; `synchronize: true` proibido no ambiente publicado; migrations rodam em produção como passo declarado da publicação ou na inicialização da aplicação.
- [ ] **RP07** — Primeiro usuário `admin` criado por migration de seed ou script de seed, com credenciais lidas de **variáveis de ambiente**.
- [ ] **RP08** — Banco de produção é um PostgreSQL gerenciado (Neon, Render PostgreSQL, Cloud SQL ou equivalente), com **SSL habilitado no `DataSource` por variável de ambiente**.
- [ ] **RP09** — `Dockerfile` multi-stage (etapa de build e etapa de execução) e `.dockerignore`. A imagem final executa o código compilado (`node dist/...`), sem dependências de desenvolvimento.
- [ ] **RP10** — A aplicação escuta na porta de `PORT` e no endereço `0.0.0.0` (não `localhost`).

### Organização em camadas

- [ ] Aplicação organizada em camadas com responsabilidades separadas; não concentrada em poucos arquivos.
- [ ] **Bootstrap/Main**: inicia a aplicação, conecta ao banco, registra middlewares, filtros e rotas, lê a porta do ambiente.
- [ ] **Rotas/Controllers**: recebem a requisição, extraem corpo/parâmetros/query, acionam a regra de negócio e devolvem a resposta; sem regra de negócio.
- [ ] **Middlewares/Guards/Filters**: autenticação, autorização por perfil, validação de entrada e tratamento centralizado de erros.
- [ ] **Services/Use Cases**: regra de negócio (validação do horário contra a escala, detecção de conflito, transição de status, regra de posse do prontuário). É a camada avaliada pela cobertura.
- [ ] **Repositories**: acesso ao banco pelo TypeORM, sem regra de negócio.
- [ ] **Entities**: classes decoradas do TypeORM, com atributos, tipos e relacionamentos.
- [ ] **DTOs**: contratos de entrada e de saída; a entidade do TypeORM **não** é a resposta da API.
- [ ] **Database**: configuração do `DataSource` e migrations.
- [ ] Fluxo da requisição: guard de autenticação (JWT) → guard de autorização (perfil) → validação do corpo (DTO) → controller → service → repository → PostgreSQL.
- [ ] Erro lançado em qualquer ponto sobe até o tratamento centralizado e é traduzido para o envelope de erro da 4.9.
- [ ] Nomenclatura de pastas e arquivos livre, mas separação em camadas clara e consistente.

---

## 7. Testes automatizados e cobertura (Seção 4.5)

### Escopo

- [ ] Testes **unitários sobre a camada de regra de negócio**, com dublês construídos sobre a porta de repositório.
- [ ] Nenhum teste depende de banco em execução, de rede ou de variável de ambiente.
- [ ] (Não exigidos: testes de integração HTTP nem ponta a ponta.)

### Casos mínimos

- [ ] **1. Sobreposição de períodos** — os cinco cenários:
  - [ ] um antes do outro;
  - [ ] um depois do outro;
  - [ ] encostados (não conflita);
  - [ ] um dentro do outro;
  - [ ] cruzando a borda.
- [ ] **2. Criação de agendamento**:
  - [ ] caminho que dá certo;
  - [ ] horário fora de qualquer turno;
  - [ ] horário desalinhado da grade;
  - [ ] consulta que não cabe no fim do turno;
  - [ ] conflito com agendamento existente do médico;
  - [ ] conflito com agendamento existente do paciente.
- [ ] **3. Validação da escala**:
  - [ ] turnos sobrepostos no mesmo dia da semana rejeitados;
  - [ ] turnos encostados aceitos.
- [ ] **4. Transição de status**: ao menos uma transição válida e uma inválida.
- [ ] **5. Prontuário**: médico com vínculo escreve; médico sem vínculo recebe erro de acesso.
- [ ] **6. Login**: credencial inválida produz erro de autenticação; a senha é comparada pelo hash.

### Executor e configuração

- [ ] Executor Vitest (ou Jest, com o mesmo recorte e limiar).
- [ ] Limiar de **80%** em `lines`, `branches`, `functions` e `statements`, aplicado **apenas** sobre os arquivos de regra de negócio.
- [ ] Recorte da cobertura delimitado na configuração (ex.: por sufixo `.service.ts`) e declarado no `README.md`.
- [ ] Recorte não inclui controller, entidade, módulo nem migration (recorte frouxo = cobertura não cumprida).
- [ ] 80% em `branches` cobrindo os caminhos de erro (409, 422, 403), não só o caminho feliz.
- [ ] `package.json` expõe `"test": "vitest run"` e `"test:cov": "vitest run --coverage"`.

---

## 8. Integração contínua e publicação (Seção 4.6)

Dois workflows em `.github/workflows/` (ponto de partida: `pr-workflow.yml` e `deploy.yml` construídos na Semana 10).

### 4.6.1 Workflow de validação do PR — `.github/workflows/pr-workflow.yml`

- [ ] Gatilho `on: pull_request` com `branches: [main]`.
- [ ] Um job em `ubuntu-latest`, com `actions/checkout` e `actions/setup-node` na versão **22**.
- [ ] `npm ci` (e não `npm install`).
- [ ] Passo de build, antes dos testes (se não compila, não adianta testar).
- [ ] Passo de testes com cobertura que **reprova o job abaixo de 80%** no recorte da Seção 4.5.
- [ ] Nome do job estável (vira o check obrigatório).

### 4.6.2 Proteção da branch `main`

- [ ] Regra de proteção para `main` em `Settings > Branches`.
- [ ] **Require a pull request before merging** marcado.
- [ ] **Require status checks to pass before merging** marcado, com o check do workflow de validação adicionado.
- [ ] Proteção **ativa no repositório entregue**.

### 4.6.3 Workflow de publicação — `.github/workflows/deploy.yml`

- [ ] Gatilho `on: push` com `branches: [main]`; **sem** gatilho de `pull_request`.
- [ ] Build da imagem a partir do `Dockerfile` e publicação num registro (GHCR ou Artifact Registry).
- [ ] Disparo da publicação: **Render** via `curl` ao Deploy Hook com URL no segredo `RENDER_DEPLOY_HOOK_URL`, **ou** **Cloud Run** via `google-github-actions/deploy-cloudrun` com chave de service account em segredo.
- [ ] Nenhuma variável de ambiente da aplicação (`JWT_SECRET`, `DB_HOST`, senha do admin) escrita no workflow nem no repositório; configuradas no painel da plataforma (tempo de execução, não de build).

### 4.6.4 Evidência

- [ ] Pull requests fechados com o check verde.
- [ ] Execuções do workflow de publicação na aba Actions.
- [ ] Não ter um histórico com todos os commits direto na `main` e os workflows adicionados no último commit (não cumpre o critério, ainda que os arquivos estejam lá).

---

## 9. Versionamento com GitHub (Seção 4.7)

- [ ] Fluxo: branch a partir da `main` por funcionalidade → commits semânticos e pequenos → pull request para a `main` → check verde → merge (dispara a publicação).
- [ ] Branches: `main` + uma branch por funcionalidade (ex.: `feat/paciente`, `feat/medico`, `feat/escala`, `feat/agendamento`, `feat/prontuario`, `test/agendamento`, `ci/pr-workflow`, `ci/deploy`, `docs/readme`). As branches não precisam ser removidas depois do merge.
- [ ] Mínimo de **10 commits** com conteúdo real, distribuídos ao longo do desenvolvimento (criação do projeto e README não contam); mensagens no imperativo descrevendo o que a alteração faz.
- [ ] Mínimo de **3 pull requests** fechados na `main`, cada um com check verde, título que diz o que entrega e descrição de uma ou duas linhas.
- [ ] Para nota plena no critério 2: **mínimo de 20 commits e 6 pull requests** fechados com check verde.

---

## 10. Gestão do projeto no board (Seção 4.8)

- [ ] Board em **GitHub Projects** (preferencial) ou Trello, **público**.
- [ ] Colunas de fluxo Kanban (ex.: Backlog, A fazer, Em andamento, Em revisão, Concluído).
- [ ] Um card por funcionalidade ou tarefa técnica, com granularidade de **um card por pull request**.
- [ ] Cada card descreve o que precisa ser feito e o critério de aceitação (pode apontar para a Seção 4.9), como um item do Product Backlog do Scrum Guide — não apenas um título genérico.
- [ ] Cards movidos pelas colunas ao longo do desenvolvimento (não todos em "Concluído" no último dia).
- [ ] No GitHub Projects, card vinculado ao pull request correspondente.
- [ ] Link do board no `README.md` e na submissão do AVA.

---

## 11. Contrato da API (Seção 4.9)

> Conformidade literal: nome de campo, caixa, estrutura e código de status. Campos **adicionais** na resposta são tolerados.

### 4.9.1 Convenções gerais

- [ ] Toda rota sob **`/api/v1`**.
- [ ] Requisição e resposta em JSON (`Content-Type: application/json`), campos em `camelCase`.
- [ ] Exceto rotas públicas, toda rota exige `Authorization: Bearer <accessToken>`.
- [ ] Token ausente, malformado, inválido ou expirado → **401**.
- [ ] Instantes (`startsAt`, `endsAt`, `createdAt`) aceitos em ISO 8601 **com fuso explícito** (`-03:00` ou `Z`) e **sempre devolvidos em UTC com sufixo `Z`**.
- [ ] Horas da escala (`startTime`, `endTime`) em `HH:MM` 24h, sem fuso, no horário local da clínica (`America/Sao_Paulo`).
- [ ] Datas puras (`from`, `to`) em `YYYY-MM-DD`.
- [ ] Envelope de erro em toda resposta de 400 a 500: `{ "statusCode": 409, "error": "HORARIO_INDISPONIVEL", "message": "..." }` (verificados `statusCode` e `error`; `message` em português, livre).
- [ ] Catálogo — únicos valores aceitos em `error`:
  - [ ] `DADOS_INVALIDOS` — 400 — corpo, parâmetro ou query fora do formato;
  - [ ] `NAO_AUTENTICADO` — 401 — token ausente, inválido ou expirado;
  - [ ] `CREDENCIAIS_INVALIDAS` — 401 — e-mail ou senha incorretos no login;
  - [ ] `ACESSO_NEGADO` — 403 — autenticado, sem permissão para o recurso;
  - [ ] `RECURSO_NAO_ENCONTRADO` — 404 — recurso referenciado não existe;
  - [ ] `EMAIL_JA_CADASTRADO` — 409 — e-mail já em uso;
  - [ ] `CPF_JA_CADASTRADO` — 409 — CPF já em uso;
  - [ ] `CRM_JA_CADASTRADO` — 409 — CRM já em uso;
  - [ ] `HORARIO_INDISPONIVEL` — 409 — médico já tem agendamento ativo sobrepondo o período;
  - [ ] `PACIENTE_INDISPONIVEL` — 409 — paciente já tem agendamento ativo sobrepondo o período;
  - [ ] `HORARIO_FORA_DA_ESCALA` — 422 — horário não existe na escala do médico;
  - [ ] `TRANSICAO_INVALIDA` — 422 — mudança de status não permitida.
- [ ] Envelope de listagem: `{ "data": [...], "meta": { "total", "page", "pageSize", "totalPages" } }`.
- [ ] Listagens aceitam `?page=` (padrão 1) e `?pageSize=` (padrão 20, máximo 100); valor inválido → 400 `DADOS_INVALIDOS`.

### 4.9.2 Saúde e autenticação

**`GET /api/v1/health`** · público
- [ ] 200 `{ "status": "ok" }`.

**`POST /api/v1/auth/login`** · público
- [ ] Corpo `{ "email", "password" }` → 200 `{ "accessToken": "..." }`.
- [ ] Token carrega o id do usuário e os perfis, com prazo de expiração definido.
- [ ] E-mail ou senha incorretos → 401 `CREDENCIAIS_INVALIDAS` (mesma resposta para e-mail inexistente e senha errada).
- [ ] Corpo sem `email` ou sem `password` → 400 `DADOS_INVALIDOS`.

**`GET /api/v1/users/me`** · autenticado
- [ ] 200 `{ "id", "name", "email", "roles": [...] }`.
- [ ] O campo `password` nunca aparece em nenhuma resposta da API.

**`POST /api/v1/users`** · perfil `admin`
- [ ] Corpo `{ "name", "email", "password", "roles": ["secretary"] }` → 201 `{ "id", "name", "email", "roles" }`.
- [ ] E-mail já cadastrado → 409 `EMAIL_JA_CADASTRADO`.
- [ ] Perfil inexistente em `roles` → 400 `DADOS_INVALIDOS`.
- [ ] Autenticado não `admin` → 403 `ACESSO_NEGADO`.
- [ ] Sem token → 401 `NAO_AUTENTICADO`.
- [ ] Nenhuma rota pública cria usuário `admin` nem eleva perfil de usuário existente.
- [ ] Primeiro admin criado por migration ou seed executado no ambiente publicado, com credenciais de variáveis de ambiente (são as submetidas no AVA).

### 4.9.3 Pacientes

**`POST /api/v1/patients`** · `admin`, `secretary`
- [ ] Corpo `{ "name", "cpf" }` → 201 `{ "id", "name", "cpf", "createdAt" }`.
- [ ] CPF já cadastrado → 409 `CPF_JA_CADASTRADO`.
- [ ] `cpf` com tamanho ≠ 11 ou caractere não numérico → 400 `DADOS_INVALIDOS`.
- [ ] `name` ausente ou vazio → 400 `DADOS_INVALIDOS`.
- [ ] Perfil `doctor` → 403 `ACESSO_NEGADO`.

**`GET /api/v1/patients`** · autenticado (qualquer perfil)
- [ ] Query opcional `page`, `pageSize`, `name` (busca parcial, sem diferenciar maiúsculas).
- [ ] 200 com envelope de listagem, itens no formato do `POST`.

**`GET /api/v1/patients/{id}`** · autenticado
- [ ] 200 com o paciente, ou 404 `RECURSO_NAO_ENCONTRADO`.

**`PATCH /api/v1/patients/{id}`** · `admin`, `secretary`
- [ ] Corpo com campos a alterar (`name`) → 200 com o paciente atualizado, ou 404.

**`DELETE /api/v1/patients/{id}`** · `admin`
- [ ] 204 sem corpo; inexistente → 404.
- [ ] Se a remoção for lógica (`deletedAt`), o paciente removido some das listagens e da busca por id.

### 4.9.4 Médicos

**`POST /api/v1/doctors`** · `admin`
- [ ] Cria numa única operação atômica o usuário (perfil `doctor`) e o registro profissional.
- [ ] Corpo `{ "name", "email", "password", "crm" }` → 201 `{ "id", "crm", "user": { "id", "name", "email", "roles": ["doctor"] } }`.
- [ ] E-mail já cadastrado → 409 `EMAIL_JA_CADASTRADO`.
- [ ] CRM já cadastrado → 409 `CRM_JA_CADASTRADO`.
- [ ] Campo obrigatório ausente → 400 `DADOS_INVALIDOS`.
- [ ] Autenticado não `admin` → 403 `ACESSO_NEGADO`.
- [ ] Atomicidade: criar médico; criar segundo com e-mail novo e mesmo CRM → 409; login com o e-mail novo → **401** (usuário não pode ter sido criado).
- [ ] Depois de criado, o médico autentica em `POST /api/v1/auth/login` com o e-mail e a senha informados.

**`GET /api/v1/doctors`** · autenticado
- [ ] Query opcional `page`, `pageSize`, `name`; 200 com envelope, itens no formato do `POST`.

**`GET /api/v1/doctors/{id}`** · autenticado
- [ ] 200 com o médico, ou 404 `RECURSO_NAO_ENCONTRADO`.

### 4.9.5 Escala de trabalho

**`PUT /api/v1/doctors/{doctorId}/work-schedule`** · `admin` (o resumo 4.9.9 lista `admin`, `doctor`)
- [ ] Substitui a escala inteira; `"shifts": []` apaga a escala.
- [ ] Corpo `{ "shifts": [ { "weekDay", "startTime", "endTime", "slotDurationMinutes" } ] }` → 200 com o mesmo formato do corpo.
- [ ] `weekDay` de 0 (domingo) a 6 (sábado), convenção de `Date.getDay()`.
- [ ] `weekDay` fora de 0 a 6 → 400 `DADOS_INVALIDOS`.
- [ ] Hora fora do formato `HH:MM` → 400 `DADOS_INVALIDOS`.
- [ ] `startTime` ≥ `endTime` → 400 `DADOS_INVALIDOS`.
- [ ] `slotDurationMinutes` ≤ 0 → 400 `DADOS_INVALIDOS`.
- [ ] Dois turnos do mesmo `weekDay` se sobrepõem → 400 `DADOS_INVALIDOS`.
- [ ] Médico inexistente → 404 `RECURSO_NAO_ENCONTRADO`.
- [ ] Autenticado não `admin` → 403 `ACESSO_NEGADO`.
- [ ] Turnos encostados (`08:00–12:00` e `12:00–18:00`) aceitos.

**`GET /api/v1/doctors/{doctorId}/work-schedule`** · autenticado
- [ ] 200 `{ "shifts": [ ... ] }`.
- [ ] Médico sem escala → 200 com `"shifts": []` (não 404).

### 4.9.6 Agenda do médico

**`GET /api/v1/doctors/{doctorId}/calendar?from=&to=`** · autenticado
- [ ] 200 `{ "workSchedule": { "shifts": [...] }, "appointments": [ { "id", "patientId", "startsAt", "endsAt", "status" } ] }`.
- [ ] A API não gera slots.
- [ ] Agendamentos `cancelled` não aparecem.
- [ ] Período inclusivo nas duas pontas, dia inteiro no horário local da clínica.
- [ ] `from`/`to` fora de `YYYY-MM-DD`, `from` posterior a `to`, ou intervalo maior que 31 dias → 400 `DADOS_INVALIDOS`.
- [ ] Médico inexistente → 404 `RECURSO_NAO_ENCONTRADO`.

### 4.9.7 Agendamentos

**`POST /api/v1/appointments`** · `admin`, `secretary`
- [ ] Corpo `{ "doctorId", "patientId", "startsAt" }`; o cliente envia só o início.
- [ ] `endsAt` calculado pelo backend: `startsAt` + `slotDurationMinutes` do turno em que o horário cai.
- [ ] 201 `{ "id", "doctorId", "patientId", "startsAt", "endsAt", "status": "scheduled" }`.
- [ ] Validações, nesta ordem:
  - [ ] 1. médico e paciente existem → senão 404 `RECURSO_NAO_ENCONTRADO`;
  - [ ] 2. `startsAt`, convertido para o horário local da clínica, cai dentro de algum turno daquele dia da semana → senão 422 `HORARIO_FORA_DA_ESCALA`;
  - [ ] 3. alinhado à grade: `(minutos desde startTime) % slotDurationMinutes === 0` → senão 422 `HORARIO_FORA_DA_ESCALA`;
  - [ ] 4. cabe no turno: `startsAt + slotDurationMinutes <= endTime` → senão 422 `HORARIO_FORA_DA_ESCALA`;
  - [ ] 5. nenhum agendamento ativo do **mesmo médico** sobrepõe `[startsAt, endsAt)` → senão 409 `HORARIO_INDISPONIVEL`;
  - [ ] 6. nenhum agendamento ativo do **mesmo paciente** sobrepõe `[startsAt, endsAt)` → senão 409 `PACIENTE_INDISPONIVEL`.
- [ ] Agendamento ativo = status diferente de `cancelled`.
- [ ] Sobreposição: `a.startsAt < b.endsAt && b.startsAt < a.endsAt` (estrita; encostados não conflitam). Índice único em `(doctorId, startsAt)` não resolve.
- [ ] Concorrência: duas requisições simultâneas, mesmo médico, mesmo horário, pacientes diferentes → exatamente uma **201** e outra **409** `HORARIO_INDISPONIVEL`. Transação com bloqueio pessimista na linha do médico (`SELECT ... FOR UPDATE`) envolvendo verificação e gravação; todo caminho que grava agendamento usa o bloqueio.

**`GET /api/v1/appointments`** · autenticado (filtrado por perfil)
- [ ] Query opcional `doctorId`, `patientId`, `status`, `from` (`YYYY-MM-DD`), `to` (`YYYY-MM-DD`), `page`, `pageSize`.
- [ ] 200 com envelope de listagem, itens no formato do `POST`.
- [ ] Usuário `doctor` (sem `admin`) só enxerga os próprios agendamentos; `?doctorId=` de outro médico → 200 com lista vazia ou só os dele, nunca os alheios.

**`GET /api/v1/appointments/{id}`** · autenticado (com posse)
- [ ] 200 com o agendamento, ou 404 `RECURSO_NAO_ENCONTRADO`.
- [ ] `doctor` que não é o médico do agendamento → 403 `ACESSO_NEGADO`.

**`PATCH /api/v1/appointments/{id}/status`** · conforme a transição
- [ ] Corpo `{ "status": "in_progress" }` → 200 com o agendamento atualizado.
- [ ] Transições permitidas:
  - [ ] `scheduled` → `in_progress`: o `doctor` do agendamento, ou `admin`;
  - [ ] `scheduled` → `cancelled`: `admin`, `secretary`, ou o `doctor` do agendamento;
  - [ ] `in_progress` → `done`: o `doctor` do agendamento, ou `admin`;
  - [ ] `in_progress` → `cancelled`: `admin`, ou o `doctor` do agendamento.
- [ ] Transição não listada → 422 `TRANSICAO_INVALIDA`.
- [ ] Status fora do enum → 400 `DADOS_INVALIDOS`.
- [ ] Perfil sem permissão para a transição → 403 `ACESSO_NEGADO`.
- [ ] Agendamento inexistente → 404 `RECURSO_NAO_ENCONTRADO`.
- [ ] Depois de `cancelled`, o mesmo horário pode ser agendado de novo → **201**.

### 4.9.8 Prontuário

- [ ] Controle de acesso **por posse**, não só por perfil. Vínculo: existe ao menos um agendamento entre médico e paciente com status `in_progress` ou `done`.

**`POST /api/v1/patients/{patientId}/medical-records`** · `doctor` com vínculo
- [ ] Corpo `{ "text" }` → 201 `{ "id", "patientId", "doctorId", "text", "createdAt" }`.
- [ ] `doctorId` vem do usuário autenticado, nunca do corpo; se o corpo trouxer `doctorId`, é ignorado.
- [ ] Médico sem vínculo → 403 `ACESSO_NEGADO`.
- [ ] Perfil `admin` ou `secretary` → 403 `ACESSO_NEGADO`.
- [ ] `text` ausente ou vazio → 400 `DADOS_INVALIDOS`.
- [ ] Paciente inexistente → 404 `RECURSO_NAO_ENCONTRADO`.

**`GET /api/v1/patients/{patientId}/medical-records`** · `doctor` com vínculo, ou `admin`
- [ ] 200 com envelope de listagem, em ordem decrescente de `createdAt`.
- [ ] `doctor` sem vínculo → 403 `ACESSO_NEGADO`.
- [ ] `secretary` → 403 `ACESSO_NEGADO`.
- [ ] Paciente inexistente → 404 `RECURSO_NAO_ENCONTRADO`.

### 4.9.9 Resumo do contrato (rota sob `/api/v1` · perfis)

- [ ] `GET /health` · público
- [ ] `POST /auth/login` · público
- [ ] `GET /users/me` · autenticado
- [ ] `POST /users` · `admin`
- [ ] `POST /patients` · `admin`, `secretary`
- [ ] `GET /patients` · autenticado
- [ ] `GET /patients/{id}` · autenticado
- [ ] `PATCH /patients/{id}` · `admin`, `secretary`
- [ ] `DELETE /patients/{id}` · `admin`
- [ ] `POST /doctors` · `admin`
- [ ] `GET /doctors` · autenticado
- [ ] `GET /doctors/{id}` · autenticado
- [ ] `PUT /doctors/{id}/work-schedule` · `admin`, `doctor` (divergência: a 4.9.5 diz só `admin`)
- [ ] `GET /doctors/{id}/work-schedule` · autenticado
- [ ] `GET /doctors/{id}/calendar` · autenticado
- [ ] `POST /appointments` · `admin`, `secretary`
- [ ] `GET /appointments` · autenticado (filtrado por perfil)
- [ ] `GET /appointments/{id}` · autenticado (com posse)
- [ ] `PATCH /appointments/{id}/status` · conforme a transição
- [ ] `POST /patients/{id}/medical-records` · `doctor` com vínculo
- [ ] `GET /patients/{id}/medical-records` · `doctor` com vínculo, `admin`

---

## 12. Critérios de avaliação (Seção 5) — "atende plenamente"

> Critérios 5 e 8: execução automatizada contra a API publicada. Critérios 4, 6 e 7: repositório e aba Actions. Critérios 1, 2 e 3: avaliação manual do professor.
> API fora do ar na correção (ou credencial de admin incorreta) zera os critérios 5, 6 e 8 (4,50 dos 10 pontos). Conferir a URL e as credenciais submetidas antes do prazo.
> "Não atende" vale 0; "atende parcialmente" vale metade, exceto o critério 8 (faixas próprias). Plágio = nota 0.

- [ ] **1. Board (1,00)** — um card por funcionalidade, com descrição, movimentados ao longo do desenvolvimento.
- [ ] **2. Versionamento e documentação (1,00)** — mínimo de 20 commits e 6 PRs fechados com check verde, branch por funcionalidade, README completo conforme a Seção 3.
- [ ] **3. Qualidade de código e arquitetura (1,00)** — camadas bem definidas, DI por construtor, tipagem consistente, erros de domínio separados do HTTP, nomenclatura padronizada.
- [ ] **4. Workflow de validação do PR (1,00)** — dispara em todo PR para a `main`, roda build e testes, reprova abaixo de 80% de cobertura, check obrigatório na proteção da branch.
- [ ] **5. Regra de negócio sob concorrência (1,00)** — as seis validações com os códigos corretos, e a transação com bloqueio garante exatamente um 201 e um 409 em requisições simultâneas.
- [ ] **6. Publicação na nuvem e workflow de deploy (1,50)** — API publicada e acessível, `Dockerfile` multi-stage, PostgreSQL gerenciado, workflow que publica a cada incorporação na `main`, segredos fora do repositório.
- [ ] **7. Cobertura de testes (1,50)** — ≥ 80% em `lines`, `branches`, `functions` e `statements` sobre a regra de negócio, recorte declarado no README, casos mínimos presentes, dublês sobre a porta de repositório.
- [ ] **8. Contrato da API na bateria de aceitação (2,00)** — 90% ou mais dos casos aprovados, incluindo controle de acesso e prontuário (faixa intermediária: 50% a 89%; não atende: menos de 25%, ou autenticação que não funciona e impede a bateria de começar).
