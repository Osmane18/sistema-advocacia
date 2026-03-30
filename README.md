# Sistema de Advocacia

Sistema completo de gestao para escritorios de advocacia com React + Supabase.

## Funcionalidades

- **Clientes**: cadastro completo com CPF/CNPJ, contatos, endereco
- **Processos**: gestao por area do direito, status, advogado responsavel, historico de andamentos
- **Agenda**: calendario visual por mes, alertas de prazos, tipos de evento com cores
- **Financeiro**: honorarios, pagamentos e despesas com status e relatorios
- **Documentos**: upload/download de arquivos via Supabase Storage
- **Autenticacao**: login seguro via Supabase Auth

---

## Pre-requisitos

- Node.js 18+ instalado
- Conta gratuita no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (para deploy)

---

## 1. Configuracao do Supabase

### 1.1 Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e clique em **New Project**
2. Escolha um nome (ex: `sistema-advocacia`), defina uma senha forte e selecione a regiao mais proxima (ex: South America - Sao Paulo)
3. Aguarde a criacao (cerca de 2 minutos)

### 1.2 Criar as tabelas

1. No painel do Supabase, va em **SQL Editor**
2. Clique em **New Query**
3. Cole todo o conteudo do arquivo `supabase/schema.sql`
4. Clique em **Run** (ou Ctrl+Enter)

### 1.3 Criar o bucket de documentos

1. Va em **Storage** no menu lateral
2. Clique em **New bucket**
3. Nome: `documentos`
4. Desmarque "Public bucket" (mantenha privado)
5. Clique em **Create bucket**

Em seguida, configure as policies do Storage:

1. Va em **Storage > Policies**
2. Selecione o bucket `documentos`
3. Clique em **New Policy** para cada regra abaixo:

**Policy 1 - Upload:**
- Policy name: `Usuarios autenticados podem fazer upload`
- Allowed operation: INSERT
- Target roles: authenticated
- USING expression: `bucket_id = 'documentos'`

**Policy 2 - Download:**
- Policy name: `Usuarios autenticados podem ver arquivos`
- Allowed operation: SELECT
- Target roles: authenticated
- USING expression: `bucket_id = 'documentos'`

**Policy 3 - Excluir:**
- Policy name: `Usuarios autenticados podem excluir arquivos`
- Allowed operation: DELETE
- Target roles: authenticated
- USING expression: `bucket_id = 'documentos'`

### 1.4 Pegar as credenciais

1. Va em **Settings > API**
2. Copie:
   - **Project URL** (ex: `https://xyzabc.supabase.co`)
   - **anon public key** (chave publica, segura para usar no frontend)
   - **service_role key** (apenas para o backend — NUNCA exponha no frontend)
3. Va em **Settings > JWT** e copie o **JWT Secret** (para o backend)

---

## 2. Configuracao do Frontend

### 2.1 Criar o arquivo .env

Na pasta `frontend/`, crie um arquivo chamado `.env`:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

Substitua pelos valores copiados no passo 1.4.

### 2.2 Instalar dependencias e rodar

```bash
cd frontend
npm install
npm run dev
```

O sistema abrira em `http://localhost:3000`

---

## 3. Criar usuarios

O sistema usa o Supabase Auth para gerenciar usuarios. Para criar o primeiro usuario:

1. No painel do Supabase, va em **Authentication > Users**
2. Clique em **Invite user** ou **Add user**
3. Informe email e senha
4. O perfil sera criado automaticamente pela trigger `on_auth_user_created`

Para definir o papel do usuario (admin ou advogado):

1. Va em **Table Editor > user_profiles**
2. Encontre o usuario pelo ID
3. Edite o campo `role` para `admin` ou `advogado`
4. Preencha `full_name`, `oab` e `phone` conforme necessario

---

## 4. Deploy no Vercel

### 4.1 Preparar o repositorio

1. Crie um repositorio no GitHub e envie o codigo
2. O Vercel deve apontar para a pasta `frontend/`

### 4.2 Deploy

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**
2. Importe o repositorio do GitHub
3. Em **Root Directory**, defina `frontend`
4. Em **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua anon key
6. Clique em **Deploy**

O Vercel gerarar uma URL como `https://sistema-advocacia-xyz.vercel.app`

### 4.3 Configurar URL de redirect no Supabase

1. No Supabase, va em **Authentication > URL Configuration**
2. Em **Site URL**, coloque a URL do seu deploy no Vercel
3. Em **Redirect URLs**, adicione tambem `http://localhost:3000` para desenvolvimento

---

## 5. Backend Node.js (opcional)

O backend e opcional — o frontend se comunica diretamente com o Supabase. Use o backend se precisar de logica customizada, webhooks ou integracao com outros sistemas.

### 5.1 Configurar

```bash
cd backend
npm install
cp .env.example .env
```

Edite o `.env` com:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key
JWT_SECRET=seu-jwt-secret-do-supabase
PORT=3001
```

### 5.2 Rodar

```bash
npm run dev     # desenvolvimento com nodemon
npm start       # producao
```

### 5.3 Endpoints disponíveis

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/clients` | Listar clientes |
| POST | `/api/clients` | Criar cliente |
| PUT | `/api/clients/:id` | Atualizar cliente |
| DELETE | `/api/clients/:id` | Excluir cliente |
| GET | `/api/processes` | Listar processos |
| POST | `/api/processes` | Criar processo |
| POST | `/api/processes/:id/updates` | Adicionar andamento |
| GET | `/api/agenda` | Listar eventos |
| POST | `/api/agenda` | Criar evento |
| PATCH | `/api/agenda/:id/toggle` | Marcar concluido |
| GET | `/api/financial` | Listar lancamentos |
| POST | `/api/financial` | Criar lancamento |
| POST | `/api/documents/upload` | Enviar documento |
| GET | `/api/documents/:id/download` | Baixar documento |

Todos os endpoints requerem o header:
```
Authorization: Bearer <token-jwt-do-supabase>
```

---

## Estrutura do projeto

```
sistema-advocacia/
├── supabase/
│   └── schema.sql          # SQL completo das tabelas e policies
├── frontend/               # App React + Vite
│   ├── src/
│   │   ├── lib/supabase.js # Cliente Supabase
│   │   ├── context/        # AuthContext
│   │   ├── components/     # Layout, Sidebar, Header, Modal
│   │   └── pages/          # Dashboard, Clients, Processes, Agenda, Financial, Documents
│   └── package.json
├── backend/                # API Node.js + Express (opcional)
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── controllers/    # Logica de negocio
│   │   ├── middleware/     # Autenticacao JWT
│   │   └── config/         # Configuracao Supabase
│   └── package.json
└── README.md
```

---

## Tecnologias utilizadas

**Frontend:**
- React 18
- Vite 5
- React Router DOM 6
- Supabase JS Client
- React Hot Toast
- date-fns
- Inter (Google Fonts)

**Backend (opcional):**
- Node.js
- Express 4
- Supabase JS Client (service role)
- jsonwebtoken
- multer
- helmet + cors

**Banco de dados / Infra:**
- Supabase (PostgreSQL + Auth + Storage)
- Vercel (deploy frontend)

---

## Suporte

Em caso de duvidas sobre o Supabase, consulte a documentacao oficial: [supabase.com/docs](https://supabase.com/docs)
