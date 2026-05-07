# Sistema de Gestão de Reembolsos 

### Tecnologias Utilizadas
Frontend: React, Tailwind CSS, Shadcn/UI, Lucide React.
Backend: Node.js, Prisma ORM, JWT (Autenticação).
Validação: Zod & React Hook Form.

## Como Executar o Projeto1. Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

O servidor iniciará  

## Frontend
cd frontend
npm install
npm run dev

Acesse em http://localhost:5173

## Testando a API (Postman)
Incluí na raiz do projeto uma pasta chamada /postman com o arquivo da Collection.
Como usar:Importe o arquivo postman_collection.json no seu Postman.

Em cada requisição, verifique se a URL está apontando para o seu localhost (ex: http://localhost:3333).
Para rotas protegidas:Realize o Login.
Copie o token recebido na resposta.
Na aba Authorization da requisição desejada, selecione Bearer Token e cole o código.
Usuários para Teste
Para facilitar a avaliação, utilize as credenciais abaixo (caso já tenha rodado o seed/cadastro):
Perfil E-mail Senha 
Colaboradorcolaborador@test.com pitang123
Gestor: gestor@empresa.com pitang123
Financeiro: financeiro@empresa.com pitang123
Admin: admin@test.com  pitang123
📂 Funcionalidades ImplementadasAutenticação: Login e Cadastro com perfis de acesso (RBAC).
Solicitações: Criação de reembolsos, edição de rascunhos e upload de comprovantes.
Gestão: Aprovação/Rejeição com justificativa e marcação de pagamento.
Admin: Cadastro e inativação de categorias de despesa.

## Observações:
O sistema bloqueia edições em solicitações que não estejam em status de Rascunho.