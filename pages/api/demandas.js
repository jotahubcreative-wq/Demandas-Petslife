import { supabaseAdmin } from '../../lib/supabase'
import { enviarEmailSolicitante, enviarEmailMarketing } from '../../lib/resend'
import { enviarWhatsAppSolicitante, enviarWhatsAppMarketing } from '../../lib/twilio'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const {
      nome,
      email,
      whatsapp,
      setor,
      estados,      // array de strings ex: ['RS','SP','RJ']
      tipo,
      titulo,
      descricao,
      formato,
      prazo,
      prioridade,
      observacoes,
    } = req.body

    // ── Validação básica ──────────────────────────────────
    if (!nome || !email || !setor || !tipo || !titulo || !descricao || !prazo || !prioridade) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' })
    }

    if (setor === 'Comercial' && (!estados || !estados.length)) {
      return res.status(400).json({ error: 'Selecione ao menos um estado para demandas do Comercial.' })
    }

    // ── Gera protocolo ────────────────────────────────────
    const protocolo = 'PET-' + Date.now().toString(36).toUpperCase()

    // ── Monta payload ─────────────────────────────────────
    const payload = {
      protocolo,
      nome,
      email,
      whatsapp:    whatsapp || null,
      setor,
      estados:     estados || null,   // salvo como array no Supabase (tipo jsonb)
      tipo,
      titulo,
      descricao,
      formato:     formato || null,
      prazo,
      prioridade,
      observacoes: observacoes || null,
      status:      'Novo',
      criado_em:   new Date().toISOString(),
    }

    // ── Salva no Supabase ─────────────────────────────────
    const { data, error: dbError } = await supabaseAdmin
      .from('demandas')
      .insert([payload])
      .select()
      .single()

    if (dbError) {
      console.error('[Supabase Error]', dbError)
      return res.status(500).json({ error: 'Erro ao salvar demanda.' })
    }

    // ── Notificações (em paralelo, sem bloquear a resposta) ──
    const demanda = { ...payload, id: data.id }

    Promise.allSettled([
      enviarEmailSolicitante(demanda),
      enviarEmailMarketing(demanda),
      enviarWhatsAppSolicitante(demanda),
      enviarWhatsAppMarketing(demanda),
    ]).then(results => {
      results.forEach((r, i) => {
        const nomes = ['email-solicitante', 'email-marketing', 'whatsapp-solicitante', 'whatsapp-marketing']
        if (r.status === 'rejected') {
          console.error(`[Notificação falhou: ${nomes[i]}]`, r.reason)
        }
      })
    })

    // ── Responde com sucesso ──────────────────────────────
    return res.status(200).json({ protocolo, id: data.id })

  } catch (err) {
    console.error('[API Error]', err)
    return res.status(500).json({ error: 'Erro interno do servidor.' })
  }
}
