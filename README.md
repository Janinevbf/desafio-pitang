# Sistema de Gestao de Reembolsos

Sistema completo para gerenciamento de reembolsos com autenticacao JWT, upload de comprovantes e controle de perfis (Colaborador, Gestor, Financeiro, Admin).

## Tecnologias Utilizadas

### Frontend
- **React 19** com **TypeScript**
- **Vite** (bundler)
- **Tailwind CSS** (estilizacao)
- **Shadcn/UI + Radix UI** (componentes)
- **React Router DOM** (roteamento)
- **React Hook Form + Zod** (formularios e validacao)
- **Axios** (HTTP client)
- **Sonner** (notificacoes)

### Backend
- **Node.js** com **Express**
- **TypeScript**
- **Prisma ORM** + **SQLite**
- **JWT** (autenticacao)
- **Multer** (upload de arquivos)
- **Zod** (validacao)

## Requisitos


- npm ou Bun

## Como Executar o Projeto

### 1. Backend

cd backend
npm install
npx prisma migrate dev
npm run dev


O servidor iniciara em `http://localhost:3000`.

### 2. Frontend


cd frontend
npm install
npm run dev


Acesse em `http://localhost:5173`.

### 3. Uploads

Crie a pasta `backend/uploads` manualmente antes de rodar o projeto:

mkdir backend/uploads


## Credenciais para Teste

| Perfil       | E-mail                    | Senha     |
|--------------|---------------------------|-----------|
| Colaborador  | colaborador@test.com      | pitang123 |
| Gestor       | gestor@empresa.com        | pitang123 |
| Financeiro   | financeiro@empresa.com    | pitang123 |
| Admin        | admin@test.com            | pitang123 |

## Funcionalidades

- **Autenticacao**: Login e cadastro com controle de perfis (RBAC)
- **Solicitacoes**: Criacao, edicao de rascunhos e upload de comprovantes
- **Gestao**: Aprovacao/rejeicao com justificativa e marcacao de pagamento
- **Admin**: Cadastro e inativacao de categorias de despesa
- **Upload**: Anexo de imagens e PDFs aos reembolsos

## Testando a API (Postman)

Na raiz do projeto existe a pasta `/postman` com a collection do Postman.

1. Importe o arquivo `postman_collection.json` no Postman
2. Verifique se a URL esta apontando para `http://localhost:3000`
3. Para rotas protegidas:
   - Realize o login
   - Copie o token recebido
   - Na aba **Authorization**, selecione **Bearer Token** e cole o token

## Testes Manuais Executados
[x] Fluxo de autenticação e expiração de token.
[x] Bloqueio de rotas baseado no perfil (RBAC).
[x] Upload de múltiplos formatos (JPG, PNG, PDF).
[x] Validação de campos obrigatórios com Zod.


## Testes

### Backend (Jest - 32 testes passando)

```bash
cd backend
npm install
npx jest
```

## Observacoes

- O sistema bloqueia edicoes em solicitacoes que nao estejam em status de **Rascunho**
- Certifique-se de criar a pasta `backend/uploads` antes de iniciar
- O arquivo `.env` esta no `.gitignore`. Crie `backend/.env` com:

```
DATABASE_URL="file:./dev.db"
```
