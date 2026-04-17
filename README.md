# 🐾 Petslife — Central de Demandas de Marketing

Sistema completo de solicitações de marketing com Kanban, notificações por e-mail (Resend) e WhatsApp (Twilio).

---

## 🗂 Estrutura do projeto

```
petslife-demandas/
├── pages/
│   ├── index.js          → Formulário de solicitação (público)
│   ├── painel.js         → Painel do time de marketing (restrito)
│   ├── acompanhar.js     → Consulta de pedido por protocolo (público)
│   ├── _app.js
│   └── api/
│       └── demandas.js   → API Route: salva no Supabase + dispara notificações
├── lib/
│   ├── supabase.js       → Clientes Supabase (público + admin)
│   ├── resend.js         → Envio de e-mails (confirmação + alerta marketing)
│   └── twilio.js         → Envio de WhatsApp (confirmação + alerta marketing)
├── supabase-setup.sql    → SQL para criar a tabela e políticas de segurança
├── .env.example          → Modelo das variáveis de ambiente
└── package.json
```

---

## ⚙️ PASSO A PASSO DE CONFIGURAÇÃO

### 1. SUPABASE

1. Acesse [supabase.com](https://supabase.com) e crie uma conta/projeto
2. No menu lateral, vá em **SQL Editor → New Query**
3. Cole o conteúdo do arquivo `supabase-setup.sql` e clique em **Run**
4. Vá em **Settings → API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ nunca expor no frontend
5. Vá em **Authentication → Users → Add user** e crie o login do time de marketing

---

### 2. RESEND (E-mail)

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Vá em **Domains → Add Domain** e adicione `grupoagrofarm.com.br`
3. Configure os registros DNS conforme instruído (MX, SPF, DKIM) — peça pro pessoal de TI ou acesse o painel DNS do domínio
4. Vá em **API Keys → Create API Key** e copie a chave
5. Preencha no `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=Marketing Petslife <noreply@grupoagrofarm.com.br>
   EMAIL_MARKETING=marketing@grupoagrofarm.com.br
   ```

---

### 3. TWILIO (WhatsApp)

1. Acesse [console.twilio.com](https://console.twilio.com) e crie uma conta
2. Vá em **Messaging → Try it out → Send a WhatsApp message**
3. Siga as instruções para conectar seu número ao sandbox do Twilio
4. Copie o **Account SID** e **Auth Token** da página principal do Console
5. O número do sandbox é `+14155238886` (formato: `whatsapp:+14155238886`)
6. Preencha no `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   TWILIO_WHATSAPP_TO=whatsapp:+5551999998888   ← número do time de marketing
   ```

> **Produção:** Para usar um número próprio no WhatsApp Business, solicite o upgrade para número dedicado no Twilio.

---

### 4. VARIÁVEIS DE AMBIENTE

Crie o arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Preencha todos os valores conforme os passos anteriores.

---

### 5. RODAR LOCALMENTE

```bash
npm install
npm run dev
```

Acesse:
- `http://localhost:3000` → Formulário
- `http://localhost:3000/painel` → Painel de marketing
- `http://localhost:3000/acompanhar` → Consultar pedido

---

### 6. DEPLOY NO VERCEL

1. Suba o projeto para o **GitHub** (o `.gitignore` já ignora `.env.local`)
2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório
3. Antes de fazer o deploy, vá em **Environment Variables** e adicione todas as variáveis do `.env.local`
4. Clique em **Deploy**
5. Após o deploy, copie a URL gerada (ex: `petslife-demandas.vercel.app`) e adicione como variável:
   ```
   NEXT_PUBLIC_SITE_URL=https://petslife-demandas.vercel.app
   ```
6. Faça um novo deploy para aplicar

---

## 🔗 URLs finais

| Página | URL |
|--------|-----|
| Formulário (público) | `https://petslife-demandas.vercel.app/` |
| Painel de marketing (restrito) | `https://petslife-demandas.vercel.app/painel` |
| Acompanhar pedido (público) | `https://petslife-demandas.vercel.app/acompanhar` |

---

## 🧱 Tecnologias

| Função | Tecnologia |
|--------|-----------|
| Frontend + Backend | Next.js 14 |
| Banco de dados | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Autenticação | Supabase Auth |
| E-mail | Resend |
| WhatsApp | Twilio |
| Deploy | Vercel |
