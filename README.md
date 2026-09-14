# MedClinic API

API back-end para o gerenciamento de uma clínica médica de pequeno porte.

## Escopo desta etapa

Esta entrega implementa **exclusivamente a base de acesso do sistema**:

- cadastro de usuários com senha protegida por criptografia (hash);
- autenticação via login com emissão de token JWT;
- middleware de autenticação que valida o token nas rotas protegidas;
- autorização baseada em perfis (RBAC), com os perfis Administrador e Atendente;
- endpoints de verificação que demonstram a autenticação e a autorização;
- tratamento centralizado de erros com respostas JSON padronizadas.

As funcionalidades de domínio da clínica — especialidades, médicos, pacientes e consultas —
**não fazem parte desta etapa** e serão construídas sobre esta base em um projeto futuro. A
arquitetura em camadas já está preparada para recebê-las sem reestruturação.

## Tecnologias utilizadas

| Tecnologia | Versão | Função no projeto |
|---|---|---|
| Node.js | 20+ (desenvolvido na 25.9) | Ambiente de execução |
| TypeScript | 6.0.3 | Linguagem, com tipagem estática em todas as camadas |
| NestJS | 12.0.1 | Framework sobre Express.js; organiza a aplicação em camadas |
| Express.js | via `@nestjs/platform-express` | Servidor HTTP subjacente |
| TypeORM | 1.1.1 | ORM: entidades, repositórios e migrations |
| PostgreSQL | 13+ (testado na 17) | Banco de dados relacional |
| `@nestjs/jwt` | 12.0.1 | Geração e validação dos tokens JWT |
| `bcryptjs` | 3.0.3 | Hash das senhas |
| `class-validator` | 0.15.1 | Validação declarativa dos DTOs de entrada |

> **Por que TypeScript 6 e não 7:** o CLI do NestJS depende da API programática do compilador, que a
> versão 7.0 não publica — ela retorna apenas na 7.1. Com TypeScript 7 instalado, os comandos
> `nest build` e `nest start` não funcionam.

## Pré-requisitos

- Node.js 20 ou superior, com npm;
- PostgreSQL 13 ou superior, em execução e acessível;
- um usuário do PostgreSQL com permissão para criar bancos e extensões.

## Instalação

```bash
git clone https://github.com/jorge-lherrera/SCTEC-MINI-PROJECT-MODULE-2.git
cd SCTEC-MINI-PROJECT-MODULE-2
npm install
```

## Configuração do ambiente

Copie o arquivo de exemplo e preencha com os dados do seu PostgreSQL:

```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta em que a API escuta | `3000` |
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_USERNAME` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do usuário | `postgres` |
| `DB_NAME` | Nome do banco | `medclinic_db` |
| `JWT_SECRET` | Segredo usado para assinar os tokens | uma string longa e aleatória |
| `JWT_EXPIRES_IN` | Validade do token | `1h` |

O arquivo `.env` está no `.gitignore` e nunca é versionado: as credenciais do banco e o segredo do
JWT ficam fora do código-fonte.

Para gerar um segredo forte:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Se alguma variável obrigatória estiver ausente, a aplicação não sobe e informa no terminal qual
delas falta.

## Criação do banco de dados

Crie o banco vazio:

```bash
createdb -U postgres medclinic_db
```

Em seguida crie a estrutura por **uma** das duas vias abaixo.

**Via A — migration do TypeORM (recomendada):**

```bash
npm run migration:run
```

**Via B — script SQL:**

```bash
psql -U postgres -d medclinic_db -f src/database/schema.sql
```

> **Escolha apenas uma das duas.** Ambas produzem exatamente a mesma estrutura, com os mesmos nomes
> de constraint. Mas o script SQL não registra nada na tabela de controle `migrations`: executar a
> via B e depois a via A faz o TypeORM entender que a migration está pendente, tentar criar a tabela
> `users` novamente e falhar.

A estrutura criada é a tabela `users`:

| Coluna | Tipo | Observações |
|---|---|---|
| `id` | `uuid` | Chave primária, gerada automaticamente |
| `name` | `varchar(120)` | Obrigatório |
| `email` | `varchar(160)` | Obrigatório e único |
| `password` | `varchar(255)` | Hash bcrypt; nunca em texto puro |
| `role` | `users_role_enum` | `ADMINISTRADOR` ou `ATENDENTE`; padrão `ATENDENTE` |
| `created_at` | `timestamptz` | Preenchido automaticamente no cadastro |

## Execução

```bash
npm run dev     # desenvolvimento, com recarga automática
npm run build   # compila o TypeScript para dist/
npm start       # executa a build de produção
```

A API sobe em `http://localhost:3000`, ou na porta definida em `PORT`.

## Arquitetura do projeto

A aplicação segue uma arquitetura MVC organizada em camadas, com responsabilidades bem definidas e
sem lógica concentrada em um único arquivo.

```
src/
├── server.ts              inicializa a aplicação, o pipe de validação e o filtro de erros
├── app.module.ts          monta os módulos e registra os middlewares nas rotas
├── controllers/           recebem as requisições HTTP e acionam os serviços
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   └── admin.controller.ts
├── services/              regras de negócio e validações
│   ├── user.service.ts
│   └── auth.service.ts
├── repositories/          única camada que conversa com o PostgreSQL, via TypeORM
│   └── user.repository.ts
├── entities/              entidades mapeadas com os decorators do TypeORM
│   ├── user.entity.ts
│   └── user-role.enum.ts
├── middlewares/           autenticação, autorização e tratamento central de erros
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   └── all-exceptions.filter.ts
├── dtos/                  objetos de entrada e de saída
├── decorators/            decorator @CurrentUser()
├── types/                 interfaces e tipagem da requisição autenticada
├── utils/                 funções auxiliares: hash de senha, normalização de e-mail
├── modules/               declaração e ligação dos componentes
└── database/              DataSource, migrations e schema.sql
```

**Fluxo de uma requisição:**

```
Cliente HTTP → Middleware (Auth / RBAC) → Controller → Service → Repository → PostgreSQL
```

A pasta `src/` já comporta os módulos de domínio das próximas etapas — médicos, pacientes,
consultas e especialidades — sem necessidade de reestruturar nenhuma camada: cada um acrescenta sua
entidade, seu repositório, seu serviço e seu controller nas pastas que já existem.

### Equivalências entre o NestJS e as camadas do enunciado

O NestJS resolve algumas camadas de forma declarativa, e não com arquivos próprios:

- **Routes** — não existe uma pasta `routes/`. As rotas são declaradas com os decorators
  `@Controller('auth')` e `@Post('register')` sobre o próprio controller, e o NestJS monta a tabela
  de rotas a partir deles.
- **Middlewares** — `auth.middleware.ts` e `role.middleware.ts` são middlewares reais: implementam
  `NestMiddleware` e a assinatura `(req, res, next)`, e são aplicados por rota em `app.module.ts`.
  O NestJS ofereceria *Guards* para isso, mas os middlewares atendem ao enunciado de forma literal.
- **Tratamento central de erros** — implementado como `ExceptionFilter` global
  (`all-exceptions.filter.ts`), que é o mecanismo equivalente do NestJS ao middleware de erros do
  Express: intercepta toda exceção e devolve uma resposta JSON padronizada.

## Perfis de acesso

| Perfil | Descrição | Acesso |
|---|---|---|
| `ADMINISTRADOR` | Acesso completo às funcionalidades da API | Todos os endpoints |
| `ATENDENTE` | Acesso operacional, com permissões restritas | Todos, exceto os restritos ao Administrador |

O perfil é atribuído no cadastro e viaja dentro do token JWT. Quando não informado, o padrão é
`ATENDENTE`.

> **Simplificação desta etapa:** o cadastro é público e aceita o campo `role`, o que permite criar
> um Administrador diretamente e demonstrar o RBAC. Em um sistema em produção esse campo seria
> removido do endpoint público, e a promoção de perfil exigiria um usuário já autenticado como
> Administrador.

## Endpoints

Todas as respostas são JSON. Os endpoints protegidos exigem o cabeçalho
`Authorization: Bearer <token>`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Cadastra um novo usuário |
| `POST` | `/auth/login` | Público | Autentica e devolve o token JWT |
| `GET` | `/users/me` | Autenticado | Devolve os dados do usuário do token |
| `GET` | `/admin/ping` | Somente Administrador | Endpoint de verificação do RBAC |

---

### `POST /auth/register`

Cadastra um usuário. A senha nunca é armazenada nem devolvida em texto puro.

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `name` | string | Sim | 1 a 120 caracteres |
| `email` | string | Sim | Formato válido, até 160 caracteres, único na base |
| `password` | string | Sim | 8 a 64 caracteres |
| `role` | string | Não | `ADMINISTRADOR` ou `ATENDENTE` (padrão: `ATENDENTE`) |

**Requisição:**

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Ana Souza",
  "email": "ana.souza@medclinic.com",
  "password": "SenhaForte123",
  "role": "ADMINISTRADOR"
}
```

**Resposta `201 Created`:**

```json
{
  "id": "d34f912e-1bda-4a2e-b7f3-74d7e12b0039",
  "name": "Ana Souza",
  "email": "ana.souza@medclinic.com",
  "role": "ADMINISTRADOR",
  "createdAt": "2026-09-13T14:02:23.393Z"
}
```

**Erros:** `400` campos obrigatórios ausentes, e-mail inválido ou campo não previsto no corpo ·
`409` e-mail já cadastrado.

O e-mail é normalizado para minúsculas antes de ser gravado, de modo que
`Ana.Souza@MedClinic.com` e `ana.souza@medclinic.com` são o mesmo usuário.

---

### `POST /auth/login`

Valida as credenciais e devolve o token JWT.

| Campo | Tipo | Obrigatório |
|---|---|---|
| `email` | string | Sim |
| `password` | string | Sim |

**Requisição:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "ana.souza@medclinic.com",
  "password": "SenhaForte123"
}
```

**Resposta `200 OK`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "d34f912e-1bda-4a2e-b7f3-74d7e12b0039",
    "name": "Ana Souza",
    "email": "ana.souza@medclinic.com",
    "role": "ADMINISTRADOR",
    "createdAt": "2026-09-13T14:02:23.393Z"
  }
}
```

O token carrega o identificador do usuário (`sub`), o perfil (`role`) e a expiração definida em
`JWT_EXPIRES_IN`.

**Erros:** `400` campos ausentes ou e-mail inválido · `401` credenciais inválidas.

Por segurança, a resposta `401` é idêntica para senha incorreta e para e-mail inexistente: a API não
informa qual dos dois campos falhou, para não permitir descobrir quais e-mails estão cadastrados.

---

### `GET /users/me`

Devolve os dados do usuário autenticado, lidos do banco a partir do identificador contido no token.

**Requisição:**

```http
GET /users/me
Authorization: Bearer <token>
```

**Resposta `200 OK`:**

```json
{
  "id": "d34f912e-1bda-4a2e-b7f3-74d7e12b0039",
  "name": "Ana Souza",
  "email": "ana.souza@medclinic.com",
  "role": "ADMINISTRADOR",
  "createdAt": "2026-09-13T14:02:23.393Z"
}
```

**Erros:** `401` token ausente, inválido ou expirado · `404` o usuário do token não existe mais.

---

### `GET /admin/ping`

Endpoint protegido que demonstra o RBAC: responde apenas ao perfil Administrador.

**Requisição:**

```http
GET /admin/ping
Authorization: Bearer <token>
```

**Resposta `200 OK`:**

```json
{
  "status": "ok",
  "role": "ADMINISTRADOR",
  "checkedAt": "2026-09-13T14:42:08.801Z"
}
```

**Erros:** `401` token ausente, inválido ou expirado · `403` usuário autenticado com o perfil
Atendente.

## Tratamento de erros

Toda falha é interceptada por um filtro global e devolvida no mesmo formato:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "details": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "path": "/auth/register",
  "timestamp": "2026-09-13T17:23:11.651Z"
}
```

O campo `message` é sempre um texto único; `details` reúne as mensagens de validação quando há mais
de uma, e vem vazio nos demais casos.

| Código | Situação |
|---|---|
| `400` | Campos obrigatórios ausentes, formato inválido ou campo não previsto |
| `401` | Credenciais inválidas, ou token ausente, inválido ou expirado |
| `403` | Usuário autenticado sem permissão para o recurso |
| `404` | Recurso não encontrado |
| `409` | E-mail já cadastrado |
| `500` | Falha inesperada, incluindo indisponibilidade do banco |

Erros inesperados devolvem apenas `Internal server error`: o detalhe técnico é registrado no log do
servidor e nunca exposto ao cliente. Falhas de conexão com o banco não interrompem a execução — a
aplicação continua respondendo e volta ao normal assim que o banco é restabelecido.

## Segurança

- Senhas armazenadas com hash `bcrypt` (fator de custo 10) e salt individual por usuário; não há
  como recuperar a senha original a partir dos dados do banco.
- A coluna `password` é marcada com `select: false` no TypeORM, e só é lida no momento do login.
- As respostas usam DTOs de saída que expõem apenas os campos previstos, nunca a entidade completa.
- Tokens JWT com expiração obrigatória, assinados com o segredo definido no `.env`.
- Credenciais do banco e segredo do JWT mantidos fora do código-fonte.

## Versionamento

O desenvolvimento seguiu um fluxo baseado no GitFlow, com uma branch por etapa:

| Branch | Conteúdo |
|---|---|
| `main` | Versão estável |
| `develop` | Integração das etapas concluídas |
| `feat/setup-projeto` | Configuração do projeto, conexão com o banco e entidade de usuário |
| `feat/auth` | Repositório, DTOs, hash de senha, cadastro, login e middleware de autenticação |
| `feat/rbac` | Middleware de autorização e tratamento central de erros |
| `docs/readme` | Script SQL do banco e documentação |

Cada branch nasceu de `develop` e foi integrada de volta com merge, preservando o histórico da
bifurcação.
