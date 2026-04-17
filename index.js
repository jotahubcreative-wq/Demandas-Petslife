import { useState } from 'react'
import Head from 'next/head'

const SETORES = [
  'Comercial','Eventos','Financeiro','Administração','Gente e Gestão',
  'Marketing','Televendas','Indústria','Cliente','Trade MKT e Demanda',
  'Agrofarm','T.I.','Suporte','Diretoria','Outros',
]

const TIPOS = [
  { value:'Posts Redes Sociais', icon:'📱' },
  { value:'Vídeos / Reels',      icon:'🎬' },
  { value:'Materiais Impressos', icon:'🖨️' },
  { value:'Apresentações',       icon:'📊' },
  { value:'E-mail Marketing',    icon:'📧' },
  { value:'Material Trade',      icon:'🏪' },
  { value:'Evento',              icon:'🐾' },
  { value:'Outros',              icon:'✨' },
]

const REGIOES = [
  { nome:'Norte',        estados:['AC','AM','AP','PA','RO','RR','TO'] },
  { nome:'Nordeste',     estados:['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
  { nome:'Centro-Oeste', estados:['DF','GO','MS','MT'] },
  { nome:'Sudeste',      estados:['ES','MG','RJ','SP'] },
  { nome:'Sul',          estados:['PR','RS','SC'] },
]

const FORMATO_CATS = [
  { id:'social', label:'📱 Redes Sociais', cols:2, items:[
    { id:'feed',      name:'Feed quadrado',   dim:'1080 × 1080px', desc:'Instagram / Facebook'   },
    { id:'stories',   name:'Stories / Reels', dim:'1080 × 1920px', desc:'Vertical 9:16'          },
    { id:'portrait',  name:'Feed retrato',    dim:'1080 × 1350px', desc:'Formato 4:5'            },
    { id:'landscape', name:'Feed paisagem',   dim:'1080 × 566px',  desc:'Formato 1.91:1'         },
    { id:'thumb',     name:'Thumbnail YT',   dim:'1280 × 720px',  desc:'YouTube / LinkedIn'     },
    { id:'cover',     name:'Capa Facebook',  dim:'820 × 312px',   desc:'Banner de perfil'       },
  ]},
  { id:'print', label:'🖨️ Impressos', cols:3, items:[
    { id:'a3',     name:'A3',     dim:'420 × 297mm', desc:'Dobrado = A4'     },
    { id:'a4',     name:'A4',     dim:'210 × 297mm', desc:'Folha padrão'     },
    { id:'a5',     name:'A5',     dim:'148 × 210mm', desc:'Metade do A4'     },
    { id:'a6',     name:'A6',     dim:'105 × 148mm', desc:'Cartão postal'    },
    { id:'oficio', name:'Ofício', dim:'216 × 330mm', desc:'Folha ofício'     },
    { id:'card',   name:'Cartão', dim:'90 × 50mm',   desc:'Cartão de visita' },
  ]},
  { id:'pdv', label:'🏪 PDV / Trade', cols:2, items:[
    { id:'banner_v',  name:'Banner vertical',   dim:'0,60 × 1,80m', desc:'Totem / porta'        },
    { id:'banner_h',  name:'Banner horizontal', dim:'1,00 × 0,50m', desc:'Balcão / vitrine'     },
    { id:'rollup',    name:'Roll-up',           dim:'0,80 × 2,00m', desc:'Display retrátil'     },
    { id:'wobbler',   name:'Wobbler',           dim:'10 × 15cm',    desc:'Ponto de venda'       },
    { id:'faixa',     name:'Faixa de gôndola',  dim:'10 × 150cm',   desc:'Linear de prateleira' },
    { id:'adesivo',   name:'Adesivo de chão',   dim:'50 × 50cm',    desc:'Sinalização de piso'  },
  ]},
  { id:'ppt', label:'📊 Apresentações', cols:2, items:[
    { id:'169',   name:'Widescreen 16:9', dim:'1920 × 1080px', desc:'PowerPoint / Google Slides' },
    { id:'43',    name:'Clássico 4:3',    dim:'1024 × 768px',  desc:'Formato antigo de slide'    },
    { id:'a4ppt', name:'A4 horizontal',   dim:'297 × 210mm',   desc:'Para impressão de slides'   },
  ]},
]

const SHAPES = {
  feed:{w:36,h:36}, stories:{w:20,h:36}, portrait:{w:27,h:36}, landscape:{w:36,h:19},
  thumb:{w:36,h:20}, cover:{w:36,h:14},
  a3:{w:36,h:25}, a4:{w:25,h:36}, a5:{w:18,h:26}, a6:{w:13,h:18}, oficio:{w:23,h:36}, card:{w:36,h:20},
  banner_v:{w:14,h:36}, banner_h:{w:36,h:18}, rollup:{w:14,h:36}, wobbler:{w:24,h:36}, faixa:{w:36,h:9}, adesivo:{w:36,h:36},
  '169':{w:36,h:20}, '43':{w:36,h:27}, a4ppt:{w:36,h:25},
}

const TIPO_CAT = {
  'Posts Redes Sociais':'social','Vídeos / Reels':'social',
  'Materiais Impressos':'print','Apresentações':'ppt','Material Trade':'pdv',
}

function ShapeIcon({ id }) {
  const s = SHAPES[id] || {w:32,h:32}
  const W=42, H=42
  const rx=(W-s.w)/2, ry=(H-s.h)/2
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={rx} y={ry} width={s.w} height={s.h} rx="1.5"
        fill="rgba(0,172,235,0.06)" stroke="rgba(0,172,235,0.45)" strokeWidth="1.5"/>
      <rect x={rx+s.w*0.15} y={ry+s.h*0.15} width={s.w*0.4} height={s.h*0.12}
        rx="1" fill="rgba(0,172,235,0.3)"/>
      <rect x={rx+s.w*0.15} y={ry+s.h*0.35} width={s.w*0.7} height={s.h*0.08}
        rx="1" fill="rgba(0,172,235,0.15)"/>
      <rect x={rx+s.w*0.15} y={ry+s.h*0.5} width={s.w*0.55} height={s.h*0.08}
        rx="1" fill="rgba(0,172,235,0.15)"/>
    </svg>
  )
}

export default function Formulario() {
  const [form, setForm] = useState({
    nome:'', email:'', whatsapp:'', setor:'',
    tipo:'', titulo:'', descricao:'',
    prazo:'', prioridade:'', observacoes:'',
  })
  const [estados, setEstados]   = useState([])
  const [fmtCat, setFmtCat]     = useState('social')
  const [formatos, setFormatos] = useState(new Set())
  const [loading, setLoading]   = useState(false)
  const [protocolo, setProtocolo] = useState(null)
  const [erro, setErro]         = useState('')

  const hoje = new Date().toISOString().split('T')[0]

  function upd(field, value) { setForm(f => ({...f,[field]:value})); setErro('') }

  function toggleEstado(uf) {
    setEstados(p => p.includes(uf) ? p.filter(e=>e!==uf) : [...p,uf])
  }

  function toggleFormato(id) {
    setFormatos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function onTipoChange(tipo) {
    upd('tipo', tipo)
    const cat = TIPO_CAT[tipo]
    if (cat) setFmtCat(cat)
  }

  function getFormatosLabel() {
    const all = FORMATO_CATS.flatMap(c=>c.items)
    return [...formatos].map(id => all.find(i=>i.id===id)).filter(Boolean)
      .map(it => `${it.name} (${it.dim})`).join(', ')
  }

  async function enviar() {
    const { nome, email, setor, tipo, titulo, descricao, prazo, prioridade } = form
    if (!nome||!email||!setor||!tipo||!titulo||!descricao||!prazo||!prioridade)
      return setErro('Preencha todos os campos obrigatórios.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setErro('Informe um e-mail válido.')
    if (setor==='Comercial' && !estados.length)
      return setErro('Selecione ao menos um estado para demandas do Comercial.')

    setLoading(true); setErro('')
    try {
      const formato = getFormatosLabel() || null
      const res = await fetch('/api/demandas', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          ...form,
          formato,
          estados: setor==='Comercial' ? estados : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar.')
      setProtocolo(data.protocolo)
    } catch(e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  function novo() {
    setForm({nome:'',email:'',whatsapp:'',setor:'',tipo:'',titulo:'',descricao:'',prazo:'',prioridade:'',observacoes:''})
    setEstados([]); setFormatos(new Set()); setProtocolo(null); setErro('')
    window.scrollTo({top:0,behavior:'smooth'})
  }

  /* ── SUCESSO ──────────────────────────────────── */
  if (protocolo) return (
    <>
      <Head><title>Pedido Enviado · Petslife</title></Head>
      <style>{css}</style>
      <div className="suc-bg">
        <div className="suc-box">
          <div className="suc-ico">🐾</div>
          <h2 className="suc-h2">Pedido Enviado!</h2>
          <div className="suc-proto">{protocolo}</div>
          <p className="suc-p">
            Sua demanda foi registrada com sucesso. Você receberá confirmação por e-mail
            {form.whatsapp ? ' e WhatsApp' : ''}.<br/>O time de marketing entrará em contato em breve.
          </p>
          <button className="btn-novo" onClick={novo}>Fazer novo pedido</button>
        </div>
      </div>
    </>
  )

  /* ── FORMULÁRIO ───────────────────────────────── */
  return (
    <>
      <Head>
        <title>Central de Demandas · Petslife</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      </Head>
      <style>{css}</style>

      <div className="orb orb-a"/><div className="orb orb-b"/>

      <div className="wrap">
        {/* HEADER */}
        <div className="header">
          <div className="badge"><div className="badge-dot"/><span>🐾 Marketing Petslife</span></div>
          <h1>Central de<br/>Demandas</h1>
          <p>Registre sua solicitação ao time de marketing.<br/>Quanto mais detalhes, mais assertiva será a entrega.</p>
        </div>

        {/* CARD 1 — SOLICITANTE */}
        <div className="card">
          <div className="sec">01 // Quem está solicitando</div>
          <div className="row">
            <div className="g">
              <label>Nome completo<span className="req">*</span></label>
              <input value={form.nome} onChange={e=>upd('nome',e.target.value)} placeholder="Seu nome"/>
            </div>
            <div className="g">
              <label>E-mail<span className="req">*</span></label>
              <input type="email" value={form.email} onChange={e=>upd('email',e.target.value)} placeholder="seu@petslife.vet.br"/>
            </div>
          </div>
          <div className="row" style={{marginBottom:0}}>
            <div className="g" style={{marginBottom:0}}>
              <label>Setor<span className="req">*</span></label>
              <select value={form.setor} onChange={e=>{upd('setor',e.target.value); if(e.target.value!=='Comercial')setEstados([])}}>
                <option value="" disabled>Selecione seu setor</option>
                {SETORES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="g" style={{marginBottom:0}}>
              <label>WhatsApp (com DDD)</label>
              <input type="tel" value={form.whatsapp} onChange={e=>upd('whatsapp',e.target.value)} placeholder="(51) 99999-9999"/>
            </div>
          </div>

          {/* ESTADOS */}
          {form.setor==='Comercial' && (
            <div className="estado-wrap">
              <div className="estado-header">
                <span className="estado-label">Estados de atuação<span className="req">*</span></span>
                <div className="estado-actions">
                  <button className="btn-sel-all" onClick={()=>setEstados(REGIOES.flatMap(r=>r.estados))}>Selecionar todos</button>
                  <button className="btn-des-all" onClick={()=>setEstados([])}>Limpar</button>
                </div>
              </div>
              <div className="estados-info" style={{color:estados.length?'var(--accent)':'var(--muted)'}}>
                {!estados.length ? 'Nenhum estado selecionado'
                  : estados.length===27 ? '🌎 Todos os estados selecionados'
                  : `${estados.length} estado${estados.length>1?'s':''} selecionado${estados.length>1?'s':''}: ${estados.join(', ')}`}
              </div>
              {REGIOES.map(r=>(
                <div className="regiao-bloco" key={r.nome}>
                  <div className="regiao-nome">{r.nome}</div>
                  <div className="estados-grid">
                    {r.estados.map(uf=>(
                      <label className="ec" key={uf}>
                        <input type="checkbox" checked={estados.includes(uf)} onChange={()=>toggleEstado(uf)}/>
                        <span className="ec-i">{uf}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD 2 — DEMANDA */}
        <div className="card">
          <div className="sec">02 // Sobre a demanda</div>
          <div className="g">
            <label>Tipo de demanda<span className="req">*</span></label>
            <div className="tgrid">
              {TIPOS.map(t=>(
                <label className="tc" key={t.value}>
                  <input type="radio" name="tipo" checked={form.tipo===t.value} onChange={()=>onTipoChange(t.value)}/>
                  <div className="tc-i"><span className="tc-ico">{t.icon}</span><span className="tc-lbl">{t.value}</span></div>
                </label>
              ))}
            </div>
          </div>
          <div className="g">
            <label>Título do pedido<span className="req">*</span></label>
            <input value={form.titulo} onChange={e=>upd('titulo',e.target.value)} placeholder="Ex: Post lançamento produto linha Pet Care"/>
          </div>
          <div className="g">
            <label>Briefing detalhado<span className="req">*</span></label>
            <textarea value={form.descricao} onChange={e=>upd('descricao',e.target.value)}
              placeholder="Objetivo, público-alvo, mensagem principal, referências visuais, textos obrigatórios..."/>
            <p className="hint">Quanto mais detalhes, mais assertiva será a entrega.</p>
          </div>

          {/* SELETOR VISUAL DE FORMATO */}
          <div className="g" style={{marginBottom:0}}>
            <label>Formato / Tamanho</label>
            <div className="fmt-wrap">
              <div className="fmt-tabs">
                {FORMATO_CATS.map(c=>(
                  <button key={c.id} className={`fmt-tab${fmtCat===c.id?' on':''}`} onClick={()=>setFmtCat(c.id)}>
                    {c.label}
                  </button>
                ))}
              </div>
              {FORMATO_CATS.filter(c=>c.id===fmtCat).map(cat=>(
                <div key={cat.id} className="fmt-grid" style={{gridTemplateColumns:`repeat(${cat.cols},1fr)`}}>
                  {cat.items.map(it=>(
                    <div key={it.id} className={`fmt-card${formatos.has(it.id)?' sel':''}`} onClick={()=>toggleFormato(it.id)}>
                      <div className="fmt-shape"><ShapeIcon id={it.id}/></div>
                      <div className="fmt-info">
                        <div className="fmt-name">{it.name}</div>
                        <div className="fmt-dim">{it.dim}</div>
                        <div className="fmt-desc">{it.desc}</div>
                      </div>
                      <div className="fmt-check">{formatos.has(it.id)?'✓':''}</div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="fmt-selected">
                {formatos.size===0
                  ? <span className="fmt-empty">Nenhum formato selecionado</span>
                  : [...formatos].map(id=>{
                      const it = FORMATO_CATS.flatMap(c=>c.items).find(i=>i.id===id)
                      if(!it) return null
                      return (
                        <span key={id} className="fmt-tag">
                          {it.name} <span className="fmt-tag-dim">{it.dim}</span>
                          <button className="fmt-tag-rm" onClick={e=>{e.stopPropagation();toggleFormato(id)}}>×</button>
                        </span>
                      )
                    })
                }
              </div>
            </div>
            <p className="hint" style={{marginTop:8}}>Pode selecionar múltiplos formatos. Deixe em branco se preferir detalhar no briefing.</p>
          </div>
        </div>

        {/* CARD 3 — PRAZO E PRIORIDADE */}
        <div className="card">
          <div className="sec">03 // Prazo e prioridade</div>
          <div className="row">
            <div className="g">
              <label>Prazo desejado<span className="req">*</span></label>
              <input type="date" min={hoje} value={form.prazo} onChange={e=>upd('prazo',e.target.value)}/>
            </div>
            <div className="g">
              <label>Nível de prioridade<span className="req">*</span></label>
              <div className="prow">
                {[['Urgente','U'],['Alta','A'],['Média','M'],['Baixa','B']].map(([v,c])=>(
                  <label className="pp" key={v}>
                    <input type="radio" name="prio" checked={form.prioridade===v} onChange={()=>upd('prioridade',v)}/>
                    <span className="pp-i"><span className={`pd ${c}`}/>{v}</span>
                  </label>
                ))}
              </div>
              <p className="hint">Urgente = 1 dia · Alta = 3 · Média = 5 · Baixa = 10 dias úteis</p>
            </div>
          </div>
          <div className="g" style={{marginBottom:20}}>
            <label>Observações adicionais</label>
            <textarea style={{minHeight:80}} value={form.observacoes} onChange={e=>upd('observacoes',e.target.value)}
              placeholder="Links de referência, textos obrigatórios, restrições..."/>
          </div>

          {erro && <div className="erro-msg">{erro}</div>}

          <button className={`btn-sub${loading?' loading':''}`} onClick={enviar} disabled={loading}>
            <span className="btxt">{loading ? 'Enviando...' : '🐾 Enviar Pedido'}</span>
            {loading && <div className="spin"/>}
          </button>
        </div>

        <p className="footer">PETSLIFE © 2026 · Marketing · <a href="https://www.jottahub.com.br" target="_blank" rel="noopener" style={{color:"var(--muted)",textDecoration:"none",transition:"color .2s"}} onMouseOver={e=>e.target.style.color="var(--accent)"} onMouseOut={e=>e.target.style.color="var(--muted)"}>Sistema desenvolvido por JottaHub</a></p>
      </div>
    </>
  )
}

/* ── CSS ────────────────────────────────────────────────── */
const css = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#03080F;--surface:#070E17;--surface2:#0C1520;--accent:#00ACEB;--accent2:#0070C0;--glow:rgba(0,172,235,.2);--text:#EFF6FF;--muted:#5E7A96;--border:#0F2133;--border2:#172840;--input:#040C15;--danger:#F86F6F}
html{scroll-behavior:smooth}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
.orb{position:fixed;border-radius:50%;filter:blur(140px);z-index:0;pointer-events:none;opacity:.12}
.orb-a{width:700px;height:700px;background:var(--accent);top:-280px;right:-180px;animation:drift 18s ease-in-out infinite alternate}
.orb-b{width:500px;height:500px;background:var(--accent2);bottom:-200px;left:-120px;animation:drift 22s ease-in-out infinite alternate-reverse}
@keyframes drift{from{transform:translate(0,0)}to{transform:translate(40px,50px)}}
.wrap{position:relative;z-index:1;max-width:700px;margin:0 auto;padding:52px 24px 80px}
.header{text-align:center;margin-bottom:52px}
.badge{display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:100px;background:rgba(0,172,235,.08);border:1px solid rgba(0,172,235,.22);margin-bottom:24px}
.badge-dot{width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.badge span{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--accent)}
.header h1{font-size:clamp(34px,6vw,52px);font-weight:800;letter-spacing:-2px;line-height:.95;background:linear-gradient(140deg,var(--text) 40%,#00ACEB);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px}
.header p{font-size:14px;color:var(--muted);font-weight:300;line-height:1.7}
.card{background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:36px 32px;margin-bottom:16px;position:relative;overflow:hidden;animation:cardIn .5s ease both}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(0,172,235,.5),rgba(0,112,192,.3),transparent)}
@keyframes cardIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.sec{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:26px;display:flex;align-items:center;gap:10px}
.sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--border),transparent)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.g{margin-bottom:20px}
.g label{display:block;font-size:13px;font-weight:500;color:var(--text);margin-bottom:8px}
.req{color:var(--accent);margin-left:2px}
.hint{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.5}
input,select,textarea{width:100%;padding:13px 15px;background:var(--input);border:1px solid var(--border);border-radius:11px;color:var(--text);font-family:'Outfit',sans-serif;font-size:14px;transition:border-color .2s,box-shadow .2s;outline:none;appearance:none}
input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--glow)}
select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%235E7A96' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;padding-right:40px}
input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(.4)}
textarea{min-height:115px;resize:vertical;line-height:1.6}
.tgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}
.tc{position:relative;cursor:pointer;display:block}
.tc input{position:absolute;opacity:0;width:0;height:0}
.tc-i{background:var(--input);border:1px solid var(--border);border-radius:13px;padding:15px 13px;transition:all .18s;display:flex;align-items:center;gap:11px;min-height:64px}
.tc:hover .tc-i{border-color:rgba(0,172,235,.4);transform:translateY(-1px)}
.tc input:checked+.tc-i{border-color:var(--accent);background:rgba(0,172,235,.07);box-shadow:0 0 0 2px var(--glow)}
.tc-ico{font-size:20px;flex-shrink:0}
.tc-lbl{font-size:13px;font-weight:500;line-height:1.3}
.prow{display:flex;flex-wrap:wrap;gap:9px;margin-top:4px}
.pp{position:relative;cursor:pointer}
.pp input{position:absolute;opacity:0;width:0;height:0}
.pp-i{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:var(--input);border:1px solid var(--border);border-radius:100px;font-size:13px;font-weight:500;transition:all .18s}
.pp input:checked+.pp-i{border-color:var(--accent);background:rgba(0,172,235,.08);box-shadow:0 0 0 2px var(--glow)}
.pd{width:7px;height:7px;border-radius:50%;display:inline-block}
.pd.U{background:#F86F6F}.pd.A{background:#F9A743}.pd.M{background:#F9D043}.pd.B{background:#4ade80}
.estado-wrap{margin-top:18px;animation:cardIn .3s ease}
.estado-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px}
.estado-label{font-size:13px;font-weight:500;color:var(--text)}
.estado-actions{display:flex;gap:8px}
.btn-sel-all,.btn-des-all{font-size:11px;font-weight:600;padding:4px 12px;border-radius:100px;border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s}
.btn-sel-all:hover{border-color:var(--accent);color:var(--accent)}
.btn-des-all:hover{border-color:var(--danger);color:var(--danger)}
.estados-info{font-size:11px;font-family:'Space Mono',monospace;margin-bottom:10px;transition:color .2s}
.regiao-bloco{margin-bottom:14px}
.regiao-nome{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:8px}
.regiao-nome::after{content:'';flex:1;height:1px;background:var(--border)}
.estados-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.ec{position:relative;cursor:pointer;display:block}
.ec input{position:absolute;opacity:0;width:0;height:0}
.ec-i{background:var(--input);border:1px solid var(--border);border-radius:8px;padding:8px 6px;text-align:center;font-size:12px;font-weight:700;transition:all .15s;color:var(--muted);display:block;position:relative}
.ec:hover .ec-i{border-color:rgba(0,172,235,.4);color:var(--text)}
.ec input:checked+.ec-i{border-color:var(--accent);background:rgba(0,172,235,.1);color:var(--accent);box-shadow:0 0 0 2px var(--glow)}
.ec input:checked+.ec-i::after{content:'✓';position:absolute;top:2px;right:4px;font-size:8px}
.fmt-wrap{background:var(--surface2);border:1px solid var(--border);border-radius:16px;padding:18px}
.fmt-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.fmt-tab{padding:5px 13px;border-radius:100px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;font-family:'Outfit',sans-serif}
.fmt-tab:hover{border-color:rgba(0,172,235,.4);color:var(--text)}
.fmt-tab.on{border-color:var(--accent);background:rgba(0,172,235,.1);color:var(--accent)}
.fmt-grid{display:grid;gap:7px}
.fmt-card{background:var(--input);border:1px solid var(--border);border-radius:11px;padding:11px 13px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:12px}
.fmt-card:hover{border-color:var(--border2)}
.fmt-card.sel{border-color:var(--accent);background:rgba(0,172,235,.07);box-shadow:0 0 0 2px var(--glow)}
.fmt-shape{flex-shrink:0;width:42px;height:42px;display:flex;align-items:center;justify-content:center}
.fmt-info{flex:1;min-width:0}
.fmt-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px}
.fmt-card.sel .fmt-name{color:var(--accent)}
.fmt-dim{font-size:11px;color:var(--accent);font-family:'Space Mono',monospace;margin-bottom:1px}
.fmt-desc{font-size:11px;color:var(--muted)}
.fmt-check{width:20px;height:20px;border-radius:50%;border:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:transparent;transition:all .15s}
.fmt-card.sel .fmt-check{background:var(--accent);border-color:var(--accent);color:#fff}
.fmt-selected{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;min-height:28px;align-items:center}
.fmt-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;background:rgba(0,172,235,.1);border:1px solid rgba(0,172,235,.3);border-radius:100px;font-size:12px;color:var(--accent);animation:pop .2s ease}
@keyframes pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
.fmt-tag-dim{font-family:'Space Mono',monospace;font-size:10px;opacity:.7}
.fmt-tag-rm{background:transparent;border:none;color:rgba(0,172,235,.6);cursor:pointer;font-size:15px;line-height:1;padding:0;transition:color .15s}
.fmt-tag-rm:hover{color:var(--danger)}
.fmt-empty{font-size:12px;color:var(--muted);font-style:italic}
.erro-msg{background:rgba(248,111,111,.08);border:1px solid rgba(248,111,111,.25);border-radius:10px;padding:12px 16px;font-size:13px;color:var(--danger);margin-bottom:12px}
.btn-sub{width:100%;padding:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:13px;color:#fff;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .22s;position:relative;overflow:hidden}
.btn-sub:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px var(--glow)}
.btn-sub:disabled{opacity:.55;cursor:not-allowed}
.btxt{transition:opacity .2s}
.btn-sub.loading .btxt{opacity:.4}
.spin{display:block;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .55s linear infinite;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
@keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
.footer{text-align:center;margin-top:36px;font-size:11px;color:var(--muted);font-family:'Space Mono',monospace;letter-spacing:1px}.footer a{color:var(--muted);text-decoration:none;border-bottom:1px solid rgba(0,172,235,.3);padding-bottom:1px;transition:color .2s,border-color .2s}.footer a:hover{color:var(--accent);border-color:var(--accent)}
.suc-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:32px}
.suc-box{text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px}
.suc-ico{width:72px;height:72px;border-radius:50%;background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);display:flex;align-items:center;justify-content:center;font-size:32px;animation:pop .5s cubic-bezier(.34,1.56,.64,1)}
.suc-h2{font-size:28px;font-weight:800;letter-spacing:-1px;color:var(--text)}
.suc-proto{font-family:'Space Mono',monospace;font-size:14px;color:#4ade80;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18);padding:8px 20px;border-radius:100px}
.suc-p{font-size:14px;color:var(--muted);max-width:340px;line-height:1.7}
.btn-novo{padding:12px 28px;background:transparent;border:1px solid var(--border);border-radius:11px;color:var(--muted);font-family:'Outfit',sans-serif;font-size:13px;cursor:pointer;transition:all .2s}
.btn-novo:hover{border-color:var(--accent);color:var(--accent)}
@media(max-width:600px){.card{padding:24px 18px}.row,.tgrid{grid-template-columns:1fr}.estados-grid{grid-template-columns:repeat(3,1fr)}.fmt-grid{grid-template-columns:1fr !important}}
`
