import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Envia e-mail de confirmação para o solicitante
 */
export async function enviarEmailSolicitante(demanda) {
  const { nome, email, protocolo, tipo, titulo, prazo, prioridade, setor, estados, descricao } = demanda

  const prazoFormatado = prazo
    ? new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR')
    : '—'

  const estadosTexto = estados && estados.length
    ? estados.join(', ')
    : null

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `✅ Pedido recebido: ${titulo} · ${protocolo}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- HEADER -->
        <tr><td style="background:linear-gradient(135deg,#00ACEB,#0070C0);padding:36px 40px;text-align:center">
          <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-family:monospace">🐾 MARKETING PETSLIFE</p>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Pedido Recebido!</h1>
        </td></tr>

        <!-- BODY -->
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">
            Olá, <strong>${nome}</strong>! 👋<br>
            Seu pedido foi registrado com sucesso e o time de marketing já foi notificado.
          </p>

          <!-- PROTOCOLO -->
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px 20px;margin-bottom:24px;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;color:#0284c7;letter-spacing:2px;text-transform:uppercase;font-family:monospace">Número do Protocolo</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#0070C0;font-family:monospace;letter-spacing:2px">${protocolo}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#6b7280">Guarde este número para acompanhar sua solicitação</p>
          </div>

          <!-- DETALHES -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr>
              <td width="50%" style="padding:0 6px 12px 0">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px">
                  <p style="margin:0 0 3px;font-size:10px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase">Tipo de demanda</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${tipo}</p>
                </div>
              </td>
              <td width="50%" style="padding:0 0 12px 6px">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px">
                  <p style="margin:0 0 3px;font-size:10px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase">Setor</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${setor}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding:0 6px 12px 0">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px">
                  <p style="margin:0 0 3px;font-size:10px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase">Prazo desejado</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">📅 ${prazoFormatado}</p>
                </div>
              </td>
              <td width="50%" style="padding:0 0 12px 6px">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px">
                  <p style="margin:0 0 3px;font-size:10px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase">Prioridade</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${prioridade}</p>
                </div>
              </td>
            </tr>
            ${estadosTexto ? `
            <tr>
              <td colspan="2">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px">
                  <p style="margin:0 0 3px;font-size:10px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase">Estados</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">📍 ${estadosTexto}</p>
                </div>
              </td>
            </tr>` : ''}
          </table>

          <!-- TITULO -->
          <div style="background:#f0f9ff;border-left:3px solid #00ACEB;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:16px">
            <p style="margin:0 0 3px;font-size:10px;color:#0284c7;letter-spacing:1px;text-transform:uppercase">Título do pedido</p>
            <p style="margin:0;font-size:14px;font-weight:700;color:#0c4a6e">${titulo}</p>
          </div>

          <!-- ACOMPANHAR -->
          <div style="text-align:center;margin:28px 0">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://petslife-demandas.vercel.app'}/acompanhar?protocolo=${protocolo}"
               style="display:inline-block;background:linear-gradient(135deg,#00ACEB,#0070C0);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px">
              🔍 Acompanhar meu pedido
            </a>
          </div>

          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">
            O time de marketing entrará em contato em breve. Em caso de dúvidas, responda este e-mail ou acesse o link acima com seu protocolo.
          </p>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af;font-family:monospace;letter-spacing:1px">PETSLIFE © 2026 · Marketing</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

/**
 * Envia e-mail de alerta interno para o time de marketing
 */
export async function enviarEmailMarketing(demanda) {
  const { nome, email, protocolo, tipo, titulo, prazo, prioridade, setor, estados, descricao, observacoes, whatsapp } = demanda

  const prazoFormatado = prazo
    ? new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR')
    : '—'

  const estadosTexto = estados && estados.length ? estados.join(', ') : '—'

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_MARKETING, // marketing@grupoagrofarm.com.br
    subject: `🐾 Nova demanda [${prioridade}]: ${titulo}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#07070F;padding:28px 40px;text-align:center">
          <p style="margin:0 0 6px;font-size:11px;color:#00ACEB;letter-spacing:2px;text-transform:uppercase;font-family:monospace">🐾 MARKETING PETSLIFE · NOVA DEMANDA</p>
          <h2 style="margin:0;font-size:20px;font-weight:800;color:#ffffff">${titulo}</h2>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr>
              <td width="50%" style="padding:0 6px 10px 0">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Protocolo</p>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#0070C0;font-family:monospace">${protocolo}</p>
                </div>
              </td>
              <td width="50%" style="padding:0 0 10px 6px">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Prioridade</p>
                  <p style="margin:0;font-size:13px;font-weight:700;color:#111827">${prioridade}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 6px 10px 0">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Solicitante</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${nome}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#6b7280">${email}${whatsapp ? ' · ' + whatsapp : ''}</p>
                </div>
              </td>
              <td style="padding:0 0 10px 6px">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Setor</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${setor}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 6px 10px 0">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Tipo</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${tipo}</p>
                </div>
              </td>
              <td style="padding:0 0 10px 6px">
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                  <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Prazo</p>
                  <p style="margin:0;font-size:13px;font-weight:600;color:#111827">📅 ${prazoFormatado}</p>
                </div>
              </td>
            </tr>
            ${estados && estados.length ? `
            <tr><td colspan="2" style="padding:0 0 10px">
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
                <p style="margin:0 0 2px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Estados</p>
                <p style="margin:0;font-size:13px;font-weight:600;color:#111827">📍 ${estadosTexto}</p>
              </div>
            </td></tr>` : ''}
          </table>

          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin-bottom:12px">
            <p style="margin:0 0 6px;font-size:10px;color:#0284c7;text-transform:uppercase;letter-spacing:1px">Briefing</p>
            <p style="margin:0;font-size:13px;color:#0c4a6e;line-height:1.6;white-space:pre-wrap">${descricao}</p>
          </div>

          ${observacoes ? `
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:12px">
            <p style="margin:0 0 4px;font-size:10px;color:#b45309;text-transform:uppercase;letter-spacing:1px">Observações</p>
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6">${observacoes}</p>
          </div>` : ''}

          <div style="text-align:center;margin-top:24px">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://petslife-demandas.vercel.app'}/painel"
               style="display:inline-block;background:#07070F;color:#00ACEB;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:13px;font-weight:700;font-family:monospace;letter-spacing:1px;border:1px solid #00ACEB">
              → Abrir Painel de Demandas
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af;font-family:monospace">PETSLIFE © 2026 · Marketing</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
