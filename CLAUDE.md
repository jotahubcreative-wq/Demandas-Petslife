# Petslife — Central de Demandas de Marketing

Sistema interno de solicitações de marketing pra equipe da Petslife / Grupo Agrofarm.
3 páginas (formulário público, painel restrito, consulta por protocolo) + 1 API route
que salva no Supabase e dispara notificações por email e WhatsApp.

## Stack

- **Next.js 14.2.3** — Pages Router (não App Router), JS puro (sem TypeScript)
- **Supabase** — banco PostgreSQL + Auth + Realtime
- **Resend** — envio de email transacional
- **Twilio** — envio de WhatsApp transacional
- **Deploy** — Vercel (time `marketing-petslifes-projects`, projeto `demandas-petslife`)
- **Estilo** — sem framework CSS; componentes usam estilos inline / CSS-in-JSX

## Estrutura

```
pages/
  index.js        → formulário público de solicitação (/)
  painel.js       → painel restrito de marketing (/painel)
  acompanhar.js   → consulta de pedido por protocolo (/acompanhar)
  _app.js         → wrapper mínimo (sem layout)
  api/
    demandas.js   → POST: salva no Supabase + dispara email + WhatsApp em paralelo

lib/
  supabase.js     → clientes Supabase (público + admin com service_role)
  resend.js       → enviarEmailSolicitante() + enviarEmailMarketing()
  twilio.js       → enviarWhatsAppSolicitante() + enviarWhatsAppMarketing()

supabase-setup.sql → DDL inicial (tabela `demandas` + RLS)
```

## Comandos

```bash
npm run dev     # next dev → http://localhost:3000
npm run build   # next build (gera .next/)
npm run start   # next start (serve build de produção)
```

## Variáveis de ambiente (.env.local)

Baixadas da Vercel via `npx vercel env pull .env.local --environment=production`. **Não commitar** (ignorado pelo `.gitignore`).

| Variável | Origem | Onde é usada |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `lib/supabase.js` (público + admin) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem | `lib/supabase.js` (cliente público) |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (⚠️ secreta) | `lib/supabase.js` (admin, server-side) |
| `RESEND_API_KEY` | Resend → API Keys | `lib/resend.js` |
| `EMAIL_FROM` | configurada manual | remetente dos emails |
| `EMAIL_MARKETING` | configurada manual | destinatário do alerta de marketing |
| `NEXT_PUBLIC_SITE_URL` | configurada manual | URL pública (usada nos links dos emails/WhatsApp) |
| `TWILIO_ACCOUNT_SID` | Twilio Console | `lib/twilio.js` (**não configurada na Vercel — WhatsApp não funciona em prod**) |
| `TWILIO_AUTH_TOKEN` | idem | `lib/twilio.js` |
| `TWILIO_WHATSAPP_FROM` | idem | `whatsapp:+14155238886` (sandbox) |
| `TWILIO_WHATSAPP_TO` | configurada manual | número do time de marketing (`whatsapp:+55...`) |

## Pontos de atenção

- **Twilio não está configurado em produção.** As variáveis `TWILIO_*` não estão na Vercel. As notificações de WhatsApp falham silenciosamente porque [pages/api/demandas.js:72-84](pages/api/demandas.js#L72-L84) usa `Promise.allSettled` (apenas loga falhas, não retorna erro pro cliente). Por isso o submit "funciona" mesmo com WhatsApp quebrado.
- **Next 14.2.3 tem CVE de segurança** ([release notes](https://nextjs.org/blog/security-update-2025-12-11)). `npm audit fix --force` resolve, mas valida tudo antes (pode quebrar coisas).
- **Aviso no console:** `pages/index.js` adiciona stylesheet via `next/head` em vez de `_document` — Next reclama em dev. Cosmético, não quebra.

## Deploy

- Push pra `main` no GitHub (`jotahubcreative-wq/Demandas-Petslife`) → Vercel auto-deploy
- URL produção: https://demandas-petslife.vercel.app/
- Envs de produção configuradas direto pelo dashboard Vercel
- Pra baixar envs novas localmente: `npx vercel env pull .env.local --environment=production`

## Banco de dados

Tabela `demandas` (definida em [supabase-setup.sql](supabase-setup.sql)). Campos principais:
`protocolo` (PK lógica gerada via `'PET-' + Date.now().toString(36)`), `nome`, `email`,
`whatsapp`, `setor`, `estados` (jsonb array), `tipo`, `titulo`, `descricao`, `formato`,
`prazo`, `prioridade`, `observacoes`, `status` (default `'Novo'`), `criado_em`.
