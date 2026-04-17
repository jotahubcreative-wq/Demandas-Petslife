import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

/**
 * Envia WhatsApp de confirmação para o solicitante
 */
export async function enviarWhatsAppSolicitante(demanda) {
  const { nome, whatsapp, protocolo, titulo, prazo, prioridade, tipo } = demanda

  if (!whatsapp) return // WhatsApp é opcional

  // Formata número: remove tudo que não for dígito e adiciona +55 se necessário
  const numero = formatarNumero(whatsapp)
  if (!numero) return

  const prazoFormatado = prazo
    ? new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR')
    : '—'

  const mensagem = `🐾 *Petslife Marketing*

Olá, *${nome}*! Seu pedido foi registrado com sucesso.

*📋 Protocolo:* ${protocolo}
*📌 Tipo:* ${tipo}
*📝 Pedido:* ${titulo}
*📅 Prazo:* ${prazoFormatado}
*⚡ Prioridade:* ${prioridade}

O time de marketing foi notificado e entrará em contato em breve.

👉 Acompanhe seu pedido:
${process.env.NEXT_PUBLIC_SITE_URL || 'https://petslife-demandas.vercel.app'}/acompanhar?protocolo=${protocolo}

_Petslife · Central de Demandas de Marketing_`

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${numero}`,
    body: mensagem,
  })
}

/**
 * Envia alerta no WhatsApp do time de marketing
 */
export async function enviarWhatsAppMarketing(demanda) {
  const { nome, setor, protocolo, titulo, prazo, prioridade, tipo, estados } = demanda

  const prazoFormatado = prazo
    ? new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR')
    : '—'

  const estadosTexto = estados && estados.length
    ? `\n*📍 Estados:* ${estados.join(', ')}`
    : ''

  const mensagem = `🐾 *Nova demanda recebida!*

*📋 Protocolo:* ${protocolo}
*👤 Solicitante:* ${nome} (${setor})
*📌 Tipo:* ${tipo}
*📝 Pedido:* ${titulo}
*📅 Prazo:* ${prazoFormatado}
*⚡ Prioridade:* ${prioridade}${estadosTexto}

👉 Ver no painel:
${process.env.NEXT_PUBLIC_SITE_URL || 'https://petslife-demandas.vercel.app'}/painel`

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: process.env.TWILIO_WHATSAPP_TO,
    body: mensagem,
  })
}

/**
 * Formata número brasileiro para E.164 (+5551999998888)
 */
function formatarNumero(numero) {
  // Remove tudo que não for dígito
  const digits = numero.replace(/\D/g, '')

  // Já tem código do país
  if (digits.startsWith('55') && digits.length >= 12) {
    return '+' + digits
  }

  // Número nacional (10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return '+55' + digits
  }

  return null
}
