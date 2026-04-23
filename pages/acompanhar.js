import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

export default function Acompanhar() {
  const [tema, setTema]         = useState('light')
  const [proto, setProto]       = useState('')
  const [demanda, setDemanda]   = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('pet-tema') || 'light'
    setTema(saved)
    const params = new URLSearchParams(window.location.search)
    const p = params.get('protocolo')
    if (p) { setProto(p.toUpperCase()); buscar(p.toUpperCase()) }
  }, [])

  function toggleTema() {
    const novo = tema === 'light' ? 'dark' : 'light'
    setTema(novo)
    localStorage.setItem('pet-tema', novo)
  }

  async function buscar(p) {
    const q = (p || proto).trim().toUpperCase()
    if (!q) return
    setLoading(true); setDemanda(null); setNotFound(false)
    const {data,error} = await supabase.from('demandas').select('*').eq('protocolo',q).single()
    setLoading(false)
    if (error||!data) { setNotFound(true); return }
    setDemanda(data)
  }

  function fmt(d) { if(!d)return '—'; const[y,m,day]=d.split('-'); return `${day}/${m}/${y}` }
  function fmtDH(d) { if(!d)return '—'; const dt=new Date(d); return dt.toLocaleDateString('pt-BR')+' '+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }

  const STATUSES = ['Novo','Em andamento','Entregue']

  return (
    <>
      <Head>
        <title>Acompanhar Pedido · Petslife</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      </Head>
      <style>{css}{tema==='dark'?cssDark:''}</style>

      <div className="orb orb-a"/><div className="orb orb-b"/>

      <div className="wrap">
        <div className="header" style={{position:'relative'}}>
          <button onClick={toggleTema} style={{position:'absolute',top:0,right:0,background:'transparent',border:'1px solid var(--border)',borderRadius:'100px',padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',color:'var(--muted)',fontFamily:"'Outfit',sans-serif",transition:'all .2s',display:'flex',alignItems:'center',gap:6}}>
            {tema==='light'?'🌙 Escuro':'☀️ Claro'}
          </button>
          <div className="badge"><div className="badge-dot"/><span>🐾 Marketing Petslife</span></div>
          <h1>Acompanhar<br/>Pedido</h1>
          <p>Digite o protocolo recebido por e-mail ou WhatsApp<br/>para consultar o status da sua solicitação.</p>
        </div>

        <div className="search-card">
          <label className="search-label">Número do protocolo</label>
          <div className="search-row">
            <input className="search-input" value={proto} onChange={e=>setProto(e.target.value.toUpperCase())}
              placeholder="Ex: PET-M3X7K2" onKeyDown={e=>e.key==='Enter'&&buscar()}/>
            <button className="btn-buscar" onClick={()=>buscar()} disabled={loading}>
              {loading ? 'Buscando...' : 'Consultar'}
            </button>
          </div>
        </div>

        {notFound && (
          <div className="res-card">
            <div className="not-found">
              <div className="not-found-ico">🔍</div>
              <div className="not-found-txt">Protocolo não encontrado</div>
              <div className="not-found-sub">Verifique se digitou corretamente:<br/><strong style={{color:'var(--accent)'}}>{proto}</strong></div>
            </div>
          </div>
        )}

        {demanda && (
          <div className="res-card" style={{animation:'fadeIn .4s ease'}}>
            <div className="res-head">
              <div className="res-tipo">{demanda.tipo}</div>
              <div className="res-titulo">{demanda.titulo}</div>
              <div className="res-badges">
                <span className={`badge-status bs-${demanda.status?.replace(/ /g,'-')}`}>{demanda.status}</span>
                <div className={`pdot p-${demanda.prioridade}`} title={demanda.prioridade}/>
                <span style={{fontSize:12,color:'var(--muted)'}}>{demanda.prioridade}</span>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="timeline">
              <div className="tl-title">Progresso</div>
              <div className="tl-steps">
                {demanda.status==='Cancelado' ? (
                  <>
                    <div className="tl-step">
                      <div className="tl-dot done">✓</div>
                      <div className="tl-lbl done">Recebido</div>
                    </div>
                    <div className="tl-step">
                      <div className="tl-dot cancel">✕</div>
                      <div className="tl-lbl cancel">Cancelado</div>
                    </div>
                  </>
                ) : STATUSES.map(s => {
                  const idx = STATUSES.indexOf(s)
                  const curIdx = STATUSES.indexOf(demanda.status)
                  const done = idx < curIdx
                  const active = idx === curIdx
                  return (
                    <div key={s} className="tl-step">
                      <div className={`tl-dot${done?' done':active?' active':''}`}>{done?'✓':active?'●':'○'}</div>
                      <div className={`tl-lbl${done?' done':active?' active':''}`}>{s}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* PROTOCOLO */}
            <div className="proto-box">
              <div className="proto-ico">🐾</div>
              <div>
                <div className="proto-txt">Número do protocolo</div>
                <div className="proto-val">{demanda.protocolo}</div>
              </div>
            </div>

            {/* INFO */}
            <div className="info-grid">
              {[['Solicitante',demanda.nome],['Setor',demanda.setor],['Prazo desejado',fmt(demanda.prazo)],['Recebido em',fmtDH(demanda.criado_em)],...(demanda.estados?.length?[['Estados','📍 '+demanda.estados.join(', ')]]:[])] .map(([l,v])=>(
                <div key={l} className="ic"><div className="ic-l">{l}</div><div className="ic-v">{v||'—'}</div></div>
              ))}
            </div>

            {/* ENTREGA */}
            {demanda.status==='Entregue'&&demanda.entrega && (
              <div className="entrega-box">
                <div className="entrega-title">Dados de entrega</div>
                <div className="entrega-grid">
                  {[['Data','📅 '+fmt(demanda.entrega.data)],['Canal','📡 '+demanda.entrega.canal],['Tempo','⏱ '+demanda.entrega.tempo],['Aprovado por','👤 '+demanda.entrega.aprovador]].map(([l,v])=>(
                    <div key={l} className="eic"><div className="eic-l">{l}</div><div className="eic-v">{v}</div></div>
                  ))}
                </div>
                {demanda.entrega.obs && <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(74,222,128,.15)',fontSize:12,color:'var(--muted)',lineHeight:1.6}}>💬 {demanda.entrega.obs}</div>}
              </div>
            )}

            {/* BRIEFING */}
            <div className="briefing-wrap">
              <div className="sh">Descrição do pedido</div>
              <div className="briefing-box">{demanda.descricao}</div>
              {demanda.formato && <p style={{fontSize:12,color:'var(--muted)',marginTop:8}}>📐 Formato: {demanda.formato}</p>}
              {demanda.observacoes && <div style={{marginTop:10,background:'rgba(249,167,67,.04)',border:'1px solid rgba(249,167,67,.15)',borderRadius:10,padding:12,fontSize:12,color:'var(--muted)',lineHeight:1.6}}>💬 {demanda.observacoes}</div>}
            </div>

            {/* LINK ARQUIVO */}
            {demanda.link_arquivo && (
              <div style={{padding:'0 24px 24px'}}>
                <div className="sh">Arquivo final</div>
                <a href={demanda.link_arquivo} target="_blank" rel="noopener"
                  style={{display:'inline-flex',alignItems:'center',gap:8,padding:'11px 16px',background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.2)',borderRadius:10,fontSize:13,color:'var(--success)',textDecoration:'none',wordBreak:'break-all'}}>
                  🔗 Ver arquivo entregue
                </a>
              </div>
            )}
          </div>
        )}

        <p className="footer">PETSLIFE © 2026 · Marketing · <a href="https://www.jottahub.com.br" target="_blank" rel="noopener" style={{color:"var(--muted)",textDecoration:"none",transition:"color .2s"}} onMouseOver={e=>e.target.style.color="var(--accent)"} onMouseOut={e=>e.target.style.color="var(--muted)"}>Sistema desenvolvido por JottaHub</a></p>
      </div>
    </>
  )
}

const cssDark = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#03080F;--s1:#070E17;--s2:#0C1520;--accent:#00ACEB;--accent2:#0070C0;--glow:rgba(0,172,235,.2);--text:#EFF6FF;--muted:#5E7A96;--border:#0F2133;--success:#4ade80;--danger:#F86F6F;--warn:#F9A743;--info:#60a5fa}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
`

const css = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#F5F7FA;--s1:#FFFFFF;--s2:#F0F4F8;--accent:#0070C0;--accent2:#005A9E;--glow:rgba(0,112,192,.15);--text:#0F1C2E;--muted:#6B7C93;--border:#D8E2EE;--success:#16a34a;--danger:#DC2626;--warn:#D97706;--info:#2563EB}
html{scroll-behavior:smooth}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.orb{position:fixed;border-radius:50%;filter:blur(140px);z-index:0;pointer-events:none;opacity:.03}
.orb-a{width:600px;height:600px;background:var(--accent);top:-200px;right:-150px}
.orb-b{width:500px;height:500px;background:var(--accent2);bottom:-150px;left:-100px}
.wrap{position:relative;z-index:1;max-width:640px;margin:0 auto;padding:52px 24px 80px}
.header{text-align:center;margin-bottom:48px}
.badge{display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:100px;background:rgba(0,112,192,.08);border:1px solid rgba(0,112,192,.2);margin-bottom:24px}
.badge-dot{width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.badge span{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--accent)}
.header h1{font-size:clamp(28px,5vw,40px);font-weight:800;letter-spacing:-1.5px;line-height:1;background:linear-gradient(140deg,var(--text) 40%,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px}
.header p{font-size:14px;color:var(--muted);line-height:1.7}
.search-card{background:var(--s1);border:1px solid var(--border);border-radius:20px;padding:32px 28px;margin-bottom:20px;position:relative;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.search-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:20px 20px 0 0}
.search-label{font-size:13px;font-weight:500;color:var(--text);margin-bottom:10px;display:block}
.search-row{display:flex;gap:10px}
.search-input{flex:1;padding:13px 16px;background:var(--s2);border:1px solid var(--border);border-radius:11px;color:var(--text);font-family:'Space Mono',monospace;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s;letter-spacing:1px;text-transform:uppercase}
.search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--glow)}
.btn-buscar{padding:13px 22px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:11px;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
.btn-buscar:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px var(--glow)}
.btn-buscar:disabled{opacity:.5;cursor:not-allowed}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.res-card{background:var(--s1);border:1px solid var(--border);border-radius:20px;overflow:hidden;position:relative;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.res-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.res-head{padding:24px 24px 20px;border-bottom:1px solid var(--border)}
.res-tipo{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.res-titulo{font-size:20px;font-weight:700;letter-spacing:-.5px;margin-bottom:14px;line-height:1.2}
.res-badges{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.timeline{padding:24px}
.tl-title{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:18px}
.tl-steps{display:flex;position:relative}
.tl-steps::before{content:'';position:absolute;top:18px;left:18px;right:18px;height:2px;background:var(--border);z-index:0}
.tl-step{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;z-index:1}
.tl-dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid var(--border);background:var(--s1);transition:all .3s}
.tl-dot.done{background:var(--success);border-color:var(--success)}
.tl-dot.active{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 4px var(--glow)}
.tl-dot.cancel{background:var(--danger);border-color:var(--danger)}
.tl-lbl{font-size:10px;font-weight:600;color:var(--muted);text-align:center}
.tl-lbl.done{color:var(--success)}.tl-lbl.active{color:var(--accent)}.tl-lbl.cancel{color:var(--danger)}
.proto-box{background:rgba(0,172,235,.06);border:1px solid rgba(0,172,235,.2);border-radius:12px;padding:14px 18px;margin:0 24px 24px;display:flex;align-items:center;gap:12px}
.proto-ico{font-size:20px}
.proto-txt{font-size:11px;color:var(--muted);margin-bottom:3px}
.proto-val{font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--accent);letter-spacing:1px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 24px 24px}
.ic{background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px 14px}
.ic-l{font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.ic-v{font-size:13px;font-weight:500;color:var(--text)}
.entrega-box{margin:0 24px 24px;background:rgba(74,222,128,.05);border:1px solid rgba(74,222,128,.2);border-radius:12px;padding:16px}
.entrega-title{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--success);margin-bottom:12px}
.entrega-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.eic{background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.12);border-radius:8px;padding:10px 12px}
.eic-l{font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--success);opacity:.7;margin-bottom:3px}
.eic-v{font-size:12px;font-weight:600;color:var(--success)}
.briefing-wrap{padding:0 24px 24px}
.sh{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.sh::after{content:'';flex:1;height:1px;background:var(--border)}
.briefing-box{background:var(--s2);border:1px solid var(--border);border-radius:11px;padding:14px;font-size:13px;color:var(--text);line-height:1.7;white-space:pre-wrap;word-break:break-word}
.badge-status{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:4px 10px;border-radius:20px}
.bs-Novo{background:rgba(96,165,250,.1);color:var(--info);border:1px solid rgba(96,165,250,.2)}
.bs-Em-andamento{background:rgba(0,172,235,.1);color:var(--accent);border:1px solid rgba(0,172,235,.2)}
.bs-Em-revisão{background:rgba(249,167,67,.1);color:var(--warn);border:1px solid rgba(249,167,67,.2)}
.bs-Entregue{background:rgba(74,222,128,.1);color:var(--success);border:1px solid rgba(74,222,128,.2)}
.bs-Cancelado{background:rgba(94,122,150,.1);color:var(--muted);border:1px solid var(--border)}
.pdot{width:8px;height:8px;border-radius:50%;display:inline-block}
.p-Urgente{background:var(--danger)}.p-Alta{background:var(--warn)}.p-Média{background:#F9D043}.p-Baixa{background:var(--success)}
.not-found{text-align:center;padding:40px 20px}
.not-found-ico{font-size:40px;margin-bottom:12px;opacity:.5}
.not-found-txt{font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px}
.not-found-sub{font-size:13px;color:var(--muted)}
.footer{text-align:center;margin-top:36px;font-size:11px;color:var(--muted);font-family:'Space Mono',monospace;letter-spacing:1px}.footer a{color:var(--muted);text-decoration:none;border-bottom:1px solid rgba(0,172,235,.3);padding-bottom:1px;transition:color .2s,border-color .2s}.footer a:hover{color:var(--accent);border-color:var(--accent)}
@media(max-width:500px){.search-row{flex-direction:column}.info-grid,.entrega-grid{grid-template-columns:1fr}}
`
