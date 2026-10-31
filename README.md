# MedClinic API

API back-end para a gestão de uma clínica médica de pequeno porte: pacientes, médicos, escala de
trabalho, agendamento de consultas e prontuário, com autenticação JWT e controle de acesso por perfil.

- **API publicada:** https://medclinic-api-za8l.onrender.com (rotas sob `/api/v1`; saúde em
  [`/api/v1/health`](https://medclinic-api-za8l.onrender.com/api/v1/health))
- **Board do projeto:** https://github.com/users/jorge-lherrera/projects/2
- **Repositório:** https://github.com/jorge-lherrera/SCTEC-MINI-PROJECT-MODULE-2

> Se o serviço tiver sido suspenso por inatividade, a primeira requisição o reativa sozinha e pode
> levar cerca de um minuto para responder.

## Escopo desta etapa

A etapa 1 entregou a base de acesso (usuários, login JWT, perfis e tratamento central de erros).
Esta etapa constrói o domínio da clínica sobre essa base, no contrato fixo da Seção 4.9 do enunciado:

- três perfis — `admin`, `secretary` e `doctor` —, sendo que um usuário pode ter mais de um;
- cadastro de pacientes com CPF único e validado;
- cadastro atômico de médicos (usuário de acesso e registro profissional na mesma transação);
- escala de trabalho por turno, com a duração da consulta definida em cada turno;
- agenda do médico num período, para o front-end montar os horários livres;
- agendamento validado contra a escala e contra conflitos de médico e de paciente, seguro sob
  concorrência;
- ciclo de vida da consulta, com autoridade por transição;
- prontuário com acesso restrito ao médico que atendeu o paciente;
- testes unitários da regra de negócio com limiar de cobertura, validação de pull request e
  publicação automática na nuvem.

A rota pública de cadastro e o `GET /admin/ping` da etapa 1 foram removidos: usuários são criados
apenas por um `admin` autenticado, e o perfil `admin` nunca é concedido por rota pública (RF13).

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 22 (imagem Docker e CI) | Ambiente de execução |
| TypeScript | 6.0 | Linguagem, com `strict: true` |
| NestJS | 12 | Framework HTTP (sobre Express), injeção de dependência, guards e pipes |
| TypeORM | 1.1 | Entidades, repositórios, transações e migrations |
| PostgreSQL | 18 local · gerenciado no Render | Banco relacional, com a extensão `btree_gist` |
| `@nestjs/jwt` | 12 | Emissão e validação do token |
| `bcryptjs` | 3 | Hash das senhas |
| `class-validator` / `class-transformer` | 0.15 / 0.5 | Validação e normalização dos DTOs |
| Vitest + `@vitest/coverage-v8` | 4.1 | Testes unitários e cobertura |
| Docker | — | Banco local (`docker compose`) e imagem multi-stage da aplicação |
| GitHub Actions · GHCR · Render | — | Validação do PR, registro da imagem e publicação |

## Pré-requisitos

- Node.js 22 ou superior, com npm;
- Docker com o plugin `docker compose`, para o banco local.

## Execução local

```bash
git clone https://github.com/jorge-lherrera/SCTEC-MINI-PROJECT-MODULE-2.git
cd SCTEC-MINI-PROJECT-MODULE-2
npm ci
cp .env.example .env        # preencha as variáveis (veja a tabela abaixo)
docker compose up -d        # sobe o PostgreSQL 18 no container medclinic-db
npm run dev                 # sobe a API com recarga automática
```

O `docker compose` lê `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` e `DB_PORT` do mesmo `.env`, então o
banco nasce com as credenciais que a API vai usar.

Ao subir, a aplicação:

1. **executa as migrations pendentes** (`migrationsRun: true`), criando toda a estrutura num banco
   vazio — não há `synchronize`;
2. **cria o primeiro administrador** a partir de `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`, se
   esse e-mail ainda não existir (seed idempotente).

A API responde em `http://localhost:<PORT>/api/v1`. Para conferir: `GET /api/v1/health`.

## Variáveis de ambiente

Todas as chaves estão no [`.env.example`](.env.example), sem valores reais. O `.env` está no
`.gitignore`. Se uma variável obrigatória faltar, a aplicação não sobe e informa qual é.

| Variável | Papel |
|---|---|
| `PORT` | Porta HTTP. A API escuta em `0.0.0.0`, como exige o Render |
| `DB_HOST` | Host do PostgreSQL |
| `DB_PORT` | Porta do PostgreSQL (também a porta publicada pelo `docker compose`) |
| `DB_USERNAME` | Usuário do banco |
| `DB_PASSWORD` | Senha do usuário do banco |
| `DB_NAME` | Nome do banco |
| `DB_SSL` | `true` liga o SSL na conexão (obrigatório no banco gerenciado); `false` no banco local |
| `JWT_SECRET` | Segredo que assina os tokens. Gere com `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `1h`) |
| `ADMIN_NAME` | Nome do administrador criado pelo seed |
| `ADMIN_EMAIL` | E-mail do administrador criado pelo seed |
| `ADMIN_PASSWORD` | Senha do administrador criado pelo seed |

Em produção, os valores ficam nas variáveis de ambiente do serviço no Render; o workflow de deploy
usa só o segredo `RENDER_DEPLOY_HOOK_URL`, guardado nos *secrets* do GitHub.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em modo de desenvolvimento, com recarga |
| `npm run build` | Compila para `dist/` |
| `npm start` | Executa a build (`node dist/server.js`) |
| `npm run typecheck` | Checagem de tipos com `tsc --noEmit` |
| `npm test` | Roda a suíte unitária |
| `npm run test:cov` | Roda a suíte com cobertura e aplica o limiar de 80% |
| `npm run migration:run` | Aplica as migrations pendentes (a aplicação também faz isso ao subir) |
| `npm run migration:revert` | Desfaz a última migration |
| `npm run migration:generate -- src/database/migrations/<Nome>` | Gera uma migration a partir da diferença entre as entidades e o banco |

Imagem de produção: `docker build -t medclinic-api .`. O `Dockerfile` é multi-stage: o primeiro
estágio instala tudo e compila; o segundo leva só o `dist/` e as dependências de produção, e roda com
o usuário `node`, sem privilégios de root. As variáveis de ambiente são passadas ao container na
execução, nunca copiadas para a imagem.

## Integração contínua e publicação

- **`PR validation`** (`.github/workflows/pr-workflow.yml`) — roda em todo pull request para a
  `main`: `npm ci`, `npm run build` e `npm run test:cov`. Cobertura abaixo de 80% reprova o check.
- **Proteção da `main`** — merge só por pull request, com o check `build-and-test` obrigatório.
- **`Deploy`** (`.github/workflows/deploy.yml`) — a cada push na `main`, constrói a imagem, publica
  no GitHub Container Registry com a tag do commit e aciona o deploy hook do Render apontando para
  essa imagem. As migrations rodam na subida do novo container.

## Arquitetura

Monólito em camadas sobre o NestJS. Cada camada tem uma responsabilidade, e a regra de negócio vive
só nos services.

```
Requisição HTTP
  → JwtAuthGuard     valida o token (exceto rotas @Public)
  → RolesGuard       confere o perfil exigido pela rota (@Roles)
  → ValidationPipe   valida e normaliza o corpo, os parâmetros e a query (DTOs)
  → Controller       extrai a entrada e chama o service
  → Service          regra de negócio
  → Repository       TypeORM
  → PostgreSQL
```

Qualquer erro sobe até o `AllExceptionsFilter`, o único ponto que traduz erros para HTTP. Os services
lançam `DomainError` com um código do catálogo (`ErrorCode`), sem conhecer status HTTP; o filtro faz
o mapeamento código → status e devolve o envelope do contrato. Erro inesperado vira `500` com
mensagem genérica, e o detalhe vai só para o log.

```
src/
├── server.ts           bootstrap: prefixo /api/v1, ValidationPipe, filtro global, porta
├── app.module.ts       compõe os módulos e registra os guards globais
├── controllers/        rotas HTTP; sem regra de negócio
├── services/           regra de negócio (camada coberta pelos testes)
├── repositories/       único acesso ao TypeORM; traduz violação de constraint em erro de domínio
├── entities/           entidades do TypeORM e enums persistidos
├── dtos/               contratos de entrada (validação) e de saída (resposta)
├── guards/             autenticação JWT e autorização por perfil
├── filters/            tratamento centralizado de erros
├── pipes/              validação de identificadores de rota
├── decorators/         @Public, @Roles, @CurrentUser e validadores reutilizáveis
├── errors/             DomainError e catálogo de códigos
├── types/              tipos do usuário autenticado e do payload do JWT
├── utils/              funções auxiliares: período, hora da clínica, hash, paginação, ambiente
├── modules/            módulos do NestJS que ligam controller, service e repository
└── database/           DataSource, TransactionRunner e migrations
```

As dependências entram sempre pelo construtor. Os services dependem dos repositórios do projeto (a
porta de acesso a dados), e não do TypeORM, o que permite testá-los com dublês.

### Modelagem

| Tabela | Conteúdo | Decisões |
|---|---|---|
| `users` | Usuários de acesso | `roles` é um array do enum `user_role` (`admin`, `secretary`, `doctor`), com `CHECK` de não vazio: um usuário pode acumular perfis sem tabela associativa. E-mail único; senha em hash, fora dos `SELECT` por padrão |
| `patients` | Pacientes | CPF `char(11)` com `CHECK` de 11 dígitos. Remoção lógica (`deleted_at`) para preservar consultas e prontuário; o CPF é único por índice parcial só entre os não removidos |
| `doctors` | Registro profissional | Relação 1:1 com `users` e CRM único. O nome e o e-mail ficam no usuário, sem duplicação |
| `work_shifts` | Escala | Uma linha por turno (dia da semana, início, fim e duração da consulta), com `CHECK`s de faixa e de ordem. A escala é substituída inteira a cada `PUT` |
| `appointments` | Consultas | Guarda `starts_at` e `ends_at`: o fim é calculado ao agendar, então mudar a escala depois não altera consultas marcadas (RN15). Duas *exclusion constraints* com `btree_gist` impedem, no próprio banco, sobreposição de consultas ativas do mesmo médico e do mesmo paciente |
| `medical_records` | Prontuário | Cada registro tem o paciente e o médico autor; texto não vazio por `CHECK` |

- Chaves primárias são `integer` com `GENERATED ALWAYS AS IDENTITY`, porque o contrato usa ids
  numéricos.
- Todo instante é `timestamptz` (RP05). Horas de turno são `time`, na hora local da clínica
  (`America/Sao_Paulo`), e a conversão entre as duas é centralizada em `clinic-time.util.ts`.
- A unicidade é garantida pelo banco (RP04). O service faz a checagem prévia para responder rápido, e
  o repositório traduz a violação de constraint no `409` correto quando duas requisições disputam o
  mesmo e-mail, CPF ou CRM.
- As chaves estrangeiras são `RESTRICT`, exceto turno → médico (`CASCADE`).

### Concorrência

A criação de consulta roda numa transação que trava com `SELECT … FOR UPDATE` a linha do **médico**
e a do **paciente** antes de verificar a escala e os conflitos, e grava na mesma transação. Duas
requisições para o mesmo médico ficam em fila: a segunda só verifica depois que a primeira gravou, e
recebe `409 HORARIO_INDISPONIVEL`. Travar o paciente cobre o mesmo cenário entre médicos diferentes
(`409 PACIENTE_INDISPONIVEL`). As *exclusion constraints* são a segunda barreira: se algum caminho
escapasse do bloqueio, o banco recusaria a gravação, e o repositório a traduziria no mesmo `409`.

A substituição da escala trava o médico, e a mudança de status trava a consulta, pelo mesmo motivo.

## Padrão de nomes (RNF06)

Código, nomes de arquivo, pastas e banco em inglês; mensagens e códigos de erro em português, como
define o contrato.

- **Pastas:** uma por camada, em minúsculas e no plural (`controllers/`, `services/`, `guards/`).
- **Arquivos:** `kebab-case` seguido do papel, `<nome>.<papel>.ts` — `appointment.service.ts`,
  `create-appointment.dto.ts`, `roles.guard.ts`, `parse-id.pipe.ts`, `user-role.enum.ts`,
  `domain.error.ts`, `clinic-time.util.ts`, `jwt-payload.interface.ts`. Os testes terminam em
  `.spec.ts` e ficam na pasta do que testam. Fora dessa regra, só o bootstrap (`server.ts`), a
  infraestrutura do banco (`data-source.ts`, `transaction-runner.ts`) e a extensão de tipos do
  Express (`express.d.ts`), nomeados pelo que são.
- **Migrations:** `<timestamp>-<AçãoEmPascalCase>.ts` (`1793734000000-CreateMedicalRecordsTable.ts`).
- **Classes:** `PascalCase` com o papel como sufixo (`AppointmentService`, `CreateAppointmentDto`,
  `RolesGuard`); entidades no singular e sem sufixo (`Appointment`).
- **Funções e métodos:** `camelCase`. Os métodos públicos de services e repositórios começam por
  verbo (`create`, `findPage`, `changeStatus`, `lockById`, `existsByCpf`); as funções utilitárias
  puras são nomeadas pelo que devolvem (`calendarDaysBetween`, `startOfClinicDay`, `periodsOverlap`).
- **Constantes:** `UPPER_SNAKE_CASE` (`MAX_CALENDAR_DAYS`, `STATUS_TRANSITIONS`); membros de enum
  também, com os valores do contrato (`AppointmentStatus.IN_PROGRESS = 'in_progress'`).
- **Rotas:** substantivos no plural, em `kebab-case`, com sub-recursos aninhados
  (`/doctors/{doctorId}/work-schedule`, `/patients/{patientId}/medical-records`); campos JSON em
  `camelCase`.
- **Banco:** tabelas no plural e colunas em `snake_case`; constraints com prefixo do tipo,
  `<PREFIXO>_<tabela>_<campos>` — `PK_`, `FK_`, `UQ_`, `IDX_`, `CHK_` e `EXC_`.

## Testes e cobertura

```bash
npm test          # 271 testes
npm run test:cov  # cobertura com limiar
```

**Recorte:** a cobertura conta **apenas `src/**/*.service.ts`**, com limiar de 80% em `lines`,
`branches`, `functions` e `statements` (`vitest.config.mts`). Os services são a camada onde mora a
regra de negócio — validação do horário contra a escala, conflito, transição de status, posse da
consulta e vínculo do prontuário —, e todo arquivo dessa camada termina em `.service.ts`, então um
service novo entra na conta sem mudar a configuração. Controllers, entidades, módulos, DTOs e
migrations ficam fora porque não têm regra de negócio e só inflariam o número. Hoje a cobertura do
recorte é de 100% nas quatro métricas.

Os testes também cobrem, fora do recorte, as funções puras de que os services dependem
(sobreposição de períodos, hora da clínica, formato de CRM) e a validação dos DTOs.

Os services são testados com dublês dos repositórios e do `TransactionRunner`, sem banco, sem rede
e sem variável de ambiente. Casos mínimos da Seção 4.5:

| Caso | Onde |
|---|---|
| Sobreposição: antes, depois, encostados, um dentro do outro, cruzando a borda | `utils/period.util.spec.ts` |
| Agendamento: sucesso, fora do turno, desalinhado, não cabe no fim do turno, conflito do médico, conflito do paciente | `services/appointment.service.spec.ts` |
| Escala: sobrepostos recusados, encostados aceitos | `services/work-schedule.service.spec.ts` |
| Status: transições válidas e inválidas | `services/appointment.service.spec.ts` |
| Prontuário: com vínculo escreve, sem vínculo recebe `ACESSO_NEGADO` | `services/medical-record.service.spec.ts` |
| Login: credencial inválida e comparação pelo hash | `services/auth.service.spec.ts` |

## Endpoints

Todas as rotas ficam sob `/api/v1` e, exceto as públicas, exigem `Authorization: Bearer <accessToken>`.
O contrato completo — corpos, respostas e erros — é o da Seção 4.9 do enunciado.

| Método | Rota | Perfis |
|---|---|---|
| `GET` | `/health` | público |
| `POST` | `/auth/login` | público |
| `GET` | `/users/me` | autenticado |
| `POST` | `/users` | `admin` |
| `POST` | `/patients` | `admin`, `secretary` |
| `GET` | `/patients?name=` | autenticado |
| `GET` | `/patients/{id}` | autenticado |
| `PATCH` | `/patients/{id}` | `admin`, `secretary` |
| `DELETE` | `/patients/{id}` | `admin` |
| `POST` | `/doctors` | `admin` |
| `GET` | `/doctors?name=` | autenticado |
| `GET` | `/doctors/{id}` | autenticado |
| `PUT` | `/doctors/{doctorId}/work-schedule` | `admin` |
| `GET` | `/doctors/{doctorId}/work-schedule` | autenticado |
| `GET` | `/doctors/{doctorId}/calendar?from=&to=` | autenticado |
| `POST` | `/appointments` | `admin`, `secretary` |
| `GET` | `/appointments?doctorId=&patientId=&status=&from=&to=` | autenticado; quem é só `doctor` vê apenas as próprias |
| `GET` | `/appointments/{id}` | autenticado; quem é só `doctor` acessa apenas as próprias |
| `PATCH` | `/appointments/{id}/status` | conforme a transição (tabela abaixo) |
| `POST` | `/patients/{patientId}/medical-records` | `doctor` com vínculo com o paciente |
| `GET` | `/patients/{patientId}/medical-records` | `doctor` com vínculo, ou `admin` |

Listagens são paginadas com `?page=` (padrão 1) e `?pageSize=` (padrão 20, máximo 100), e devolvem
`{ "data": [...], "meta": { "total", "page", "pageSize", "totalPages" } }`.

**Transições de status:**

| De → para | Quem pode |
|---|---|
| `scheduled` → `in_progress` | médico da consulta, `admin` |
| `in_progress` → `done` | médico da consulta, `admin` |
| `scheduled` → `cancelled` | médico da consulta, `admin`, `secretary` |
| `in_progress` → `cancelled` | médico da consulta, `admin` |

Qualquer outra transição devolve `422 TRANSICAO_INVALIDA`; perfil sem autoridade para uma transição
permitida, `403 ACESSO_NEGADO`. Uma consulta cancelada deixa de contar nos conflitos, e o horário
volta a ficar livre.

**Envelope de erro**, em toda resposta de 400 a 500:

```json
{
  "statusCode": 409,
  "error": "HORARIO_INDISPONIVEL",
  "message": "O médico já tem consulta nesse horário.",
  "details": []
}
```

`error` é sempre um código do catálogo do contrato (`DADOS_INVALIDOS`, `NAO_AUTENTICADO`,
`CREDENCIAIS_INVALIDAS`, `ACESSO_NEGADO`, `RECURSO_NAO_ENCONTRADO`, `EMAIL_JA_CADASTRADO`,
`CPF_JA_CADASTRADO`, `CRM_JA_CADASTRADO`, `HORARIO_INDISPONIVEL`, `PACIENTE_INDISPONIVEL`,
`HORARIO_FORA_DA_ESCALA`, `TRANSICAO_INVALIDA`). `details` traz as mensagens de validação quando
houver.

## Decisões de implementação

Pontos em que o enunciado deixa margem, e a escolha feita:

- **CPF validado só no formato.** Exatamente 11 dígitos, sem pontuação; os dígitos verificadores não
  são conferidos. O contrato só define `400` para tamanho ou caractere inválido, e o próprio exemplo
  do enunciado (`12345678901`) tem dígito verificador inválido: conferi-lo recusaria o exemplo do
  contrato e derrubaria em cascata os testes que cadastram pacientes.
- **`PUT` da escala só para `admin`.** O resumo da 4.9.9 cita `admin, doctor`, mas a seção 4.9.5 —
  a especificação detalhada da rota — define `perfil admin` e lista `403` para quem não é `admin`, e
  a RN dá à administração a criação das escalas. Prevaleceu a especificação detalhada.
- **Agenda visível a qualquer usuário autenticado**, inclusive a de outro médico, porque o contrato
  não restringe a rota e a secretaria precisa dela para marcar consultas. O período é inclusivo nas
  duas pontas e cobre no máximo 31 dias; `from` posterior a `to` devolve `400`. Os dias são contados
  na hora local da clínica.
- **Perfis acumulados.** Quem é `doctor` e também `secretary` ou `admin` age com o perfil mais amplo:
  vê todas as consultas, não só as próprias.
- **Ordem das recusas na mudança de status.** O médico que não é o da consulta recebe `403` antes de
  qualquer `422`: a API não revela o estado de uma consulta a quem não pode vê-la.
- **Vínculo do prontuário** = existe ao menos uma consulta `in_progress` ou `done` entre o médico e o
  paciente. Consulta só agendada não dá vínculo, e se a única consulta em andamento for cancelada o
  vínculo deixa de existir. O médico com vínculo lê o prontuário inteiro do paciente, inclusive os
  registros de outros médicos.
- **Autor do prontuário vem do token.** Um `doctorId` no corpo é aceito e ignorado, como prevê o
  contrato; qualquer outro campo não previsto devolve `400`. O texto é aparado nas pontas e tem no
  máximo 10.000 caracteres. `admin` e `secretary` recebem `403` ao escrever.
- **Remoção de paciente é lógica.** O paciente removido some das listagens e devolve `404`, mas suas
  consultas e seu prontuário continuam no banco, e o CPF pode ser cadastrado de novo.

## Segurança

- Senhas com hash `bcrypt` e salt por usuário; a coluna de senha nunca sai nas respostas.
- Login com credencial errada devolve a mesma resposta para e-mail inexistente e senha incorreta.
- Token JWT com expiração, assinado com o segredo do ambiente; o payload leva o id e os perfis.
- Toda rota é protegida por padrão pelos guards globais; as públicas são marcadas explicitamente
  com `@Public()`.
- Respostas montadas por DTOs de saída, nunca pela entidade.
- Consultas ao banco sempre parametrizadas pelo TypeORM; a busca por nome escapa os curingas do
  `LIKE`.
- Nenhum segredo no repositório: `.env` ignorado, valores de produção no Render e no GitHub Secrets.

As credenciais do administrador de avaliação são entregues no AVA, e não neste repositório público.

## Versionamento

Uma branch por funcionalidade a partir da `main` (`feat/…`, `test/…`, `docs/…`, `ci/…`, `chore/…`),
integrada por pull request com o check `build-and-test` verde. Commits no padrão Conventional
Commits. Cada pull request fecha o card correspondente do board.
