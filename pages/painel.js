import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

const COLS = ['Novo','Em andamento','Em revisão','Entregue','Cancelado']
const TIPO_ICO = {'Posts Redes Sociais':'📱','Vídeos / Reels':'🎬','Materiais Impressos':'🖨️','Apresentações':'📊','E-mail Marketing':'📧','Material Trade':'🏪','Evento':'🐾','Outros':'✨'}
const BAR_COLOR = {Novo:'var(--info)','Em andamento':'var(--accent)','Em revisão':'var(--warn)',Entregue:'var(--success)',Cancelado:'var(--muted)'}

const SETORES = ['Comercial','Eventos','Financeiro','Administração','Gente e Gestão','Marketing','Televendas','Indústria','Cliente','Trade MKT e Demanda','Agrofarm','T.I.','Suporte','Diretoria','Outros']
const TIPOS   = ['Posts Redes Sociais','Vídeos / Reels','Materiais Impressos','Apresentações','E-mail Marketing','Material Trade','Evento','Outros']

export default function Painel() {
  const [tema, setTema]       = useState('light')
  const [user, setUser]       = useState(null)
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [demandas, setDemandas] = useState([])
  const [view, setView]       = useState('kanban')
  const [filtroStat, setFiltroStat] = useState('todos')
  const [busca, setBusca]     = useState('')
  const [fPrio, setFPrio]     = useState('')
  const [fTipo, setFTipo]     = useState('')
  const [detId, setDetId]     = useState(null)
  const [dragId, setDragId]   = useState(null)
  const [modalEnt, setModalEnt] = useState(null)
  const [entrega, setEntrega] = useState({data:'',tempo:'',canal:'',aprovador:'',obs:''})
  const [modalEdit, setModalEdit] = useState(null)
  const [editData, setEditData] = useState({})
  const [linkInput, setLinkInput] = useState('')
  const [cmtInput, setCmtInput]  = useState('')
  const [toast, setToast]     = useState({msg:'',tipo:'',show:false})
  const [showRel, setShowRel] = useState(false)
  const [relMes, setRelMes]   = useState('')

  /* ── AUTH ───────────────────────────────────── */
  useEffect(() => {
    const saved = localStorage.getItem('pet-tema') || 'light'
    setTema(saved)
    supabase.auth.getSession().then(({data}) => {
      if (data?.session?.user) iniciar(data.session.user)
    })
  }, [])

  function toggleTema() {
    const novo = tema === 'light' ? 'dark' : 'light'
    setTema(novo)
    localStorage.setItem('pet-tema', novo)
  }

  async function login() {
    setLoginErr('')
    const {data,error} = await supabase.auth.signInWithPassword({email,password:senha})
    if (error) return setLoginErr('E-mail ou senha incorretos.')
    iniciar(data.user)
  }

  async function logout() { await supabase.auth.signOut(); setUser(null); setDemandas([]) }

  function iniciar(u) { setUser(u); carregar(); inscreverRealtime() }

  /* ── DATA ───────────────────────────────────── */
  async function carregar() {
    const {data} = await supabase.from('demandas').select('*').order('criado_em',{ascending:false})
    setDemandas(data || [])
  }

  function inscreverRealtime() {
    supabase.channel('demandas-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'demandas'}, payload => {
        setDemandas(prev => {
          if (payload.eventType==='INSERT') return [payload.new, ...prev]
          if (payload.eventType==='UPDATE') return prev.map(d=>d.id===payload.new.id?payload.new:d)
          if (payload.eventType==='DELETE') return prev.filter(d=>d.id!==payload.old.id)
          return prev
        })
        if (payload.eventType==='INSERT') showToast('Nova demanda: '+payload.new.titulo,'ok')
      })
      .subscribe()
  }

  /* ── FILTROS ────────────────────────────────── */
  function getFiltradas() {
    let list = [...demandas]
    if (filtroStat==='urg') list=list.filter(d=>d.prioridade==='Urgente'&&d.status!=='Entregue')
    else if (filtroStat!=='todos') list=list.filter(d=>d.status===filtroStat)
    if (busca) list=list.filter(d=>(d.titulo+d.nome+d.setor+d.tipo).toLowerCase().includes(busca.toLowerCase()))
    if (fPrio) list=list.filter(d=>d.prioridade===fPrio)
    if (fTipo) list=list.filter(d=>d.tipo===fTipo)
    return list
  }

  /* ── STATUS ─────────────────────────────────── */
  async function setStatus(id, status) {
    if (status==='Entregue') { setModalEnt(id); return }
    await supabase.from('demandas').update({status}).eq('id',id)
    showToast('Status → '+status,'ok')
  }

  /* ── ENTREGA ────────────────────────────────── */
  async function confirmarEntrega() {
    const {data:d,tempo,canal,aprovador,obs} = entrega
    const dt = entrega.data
    if (!dt||!tempo||!canal||!aprovador) return showToast('Preencha todos os campos.','err')
    await supabase.from('demandas').update({status:'Entregue',entrega:{data:dt,tempo,canal,aprovador,obs}}).eq('id',modalEnt)
    setModalEnt(null); setEntrega({data:'',tempo:'',canal:'',aprovador:'',obs:''})
    showToast('Entrega registrada! 🐾','ok')
  }

  /* ── EDITAR ─────────────────────────────────── */
  function abrirEditar(d) {
    setEditData({titulo:d.titulo,descricao:d.descricao,tipo:d.tipo,setor:d.setor,prazo:d.prazo,prioridade:d.prioridade,formato:d.formato||'',observacoes:d.observacoes||''})
    setModalEdit(d.id)
  }

  async function salvarEdicao() {
    if (!editData.titulo||!editData.descricao) return showToast('Título e briefing obrigatórios.','err')
    await supabase.from('demandas').update(editData).eq('id',modalEdit)
    setModalEdit(null); showToast('Demanda atualizada!','ok')
  }

  async function excluir() {
    if (!confirm('Excluir esta demanda? Não pode ser desfeito.')) return
    const idParaExcluir = modalEdit
    setModalEdit(null); setDetId(null)
    const { error } = await supabase.from('demandas').delete().eq('id', idParaExcluir)
    if (error) { showToast('Erro ao excluir. Tente novamente.','err'); return }
    setDemandas(prev => prev.filter(d => d.id !== idParaExcluir))
    showToast('Demanda excluída.','ok')
  }

  /* ── LINK ───────────────────────────────────── */
  async function salvarLink(id) {
    if (!linkInput.trim()) return
    await supabase.from('demandas').update({link_arquivo:linkInput.trim()}).eq('id',id)
    setLinkInput(''); showToast('Link salvo!','ok')
  }
  async function removerLink(id) {
    await supabase.from('demandas').update({link_arquivo:null}).eq('id',id)
    showToast('Link removido.','ok')
  }

  /* ── COMENTÁRIOS ────────────────────────────── */
  async function addCmt(id, cmts) {
    if (!cmtInput.trim()) return
    const novo = {texto:cmtInput.trim(),autor:user?.email,data:new Date().toISOString()}
    await supabase.from('demandas').update({comentarios:[...(cmts||[]),novo]}).eq('id',id)
    setCmtInput(''); showToast('Comentário adicionado!','ok')
  }

  /* ── DRAG & DROP ────────────────────────────── */
  async function onDrop(novoStatus) {
    if (!dragId) return
    const d = demandas.find(x=>x.id===dragId)
    if (!d||d.status===novoStatus) { setDragId(null); return }
    if (novoStatus==='Entregue') { setModalEnt(dragId); setDragId(null); return }
    await supabase.from('demandas').update({status:novoStatus}).eq('id',dragId)
    setDragId(null); showToast(`→ ${novoStatus}`,'ok')
  }

  /* ── UTILS ──────────────────────────────────── */
  function showToast(msg,tipo='ok') {
    setToast({msg,tipo,show:true})
    setTimeout(()=>setToast(t=>({...t,show:false})),3500)
  }
  function fmt(d) { if(!d)return '-'; const[y,m,day]=d.split('-'); return `${day}/${m}/${y}` }
  function fmtDH(d) { if(!d)return '-'; const dt=new Date(d); return dt.toLocaleDateString('pt-BR')+' '+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) }
  function iniciais(nome) { return (nome||'?').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase() }

  const detDemanda = demandas.find(d=>d.id===detId)
  const filtered   = getFiltradas()
  const stats = {
    all:demandas.length,
    novo:demandas.filter(d=>d.status==='Novo').length,
    and:demandas.filter(d=>d.status==='Em andamento').length,
    rev:demandas.filter(d=>d.status==='Em revisão').length,
    ent:demandas.filter(d=>d.status==='Entregue').length,
    urg:demandas.filter(d=>d.prioridade==='Urgente'&&d.status!=='Entregue'&&d.status!=='Cancelado').length,
    can:demandas.filter(d=>d.status==='Cancelado').length,
  }

  /* ── RELATÓRIO ──────────────────────────────── */
  const mesesDisp = [...new Set(demandas.map(d=>d.criado_em?.substring(0,7)))].filter(Boolean).sort().reverse()
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  function nomeMes(m) { if(!m)return ''; const[y,mo]=m.split('-'); return MESES[+mo-1]+' '+y }
  const doMes = demandas.filter(d=>relMes&&d.criado_em?.startsWith(relMes))
  const entreguesDoMes = demandas.filter(d=>relMes&&d.status==='Entregue'&&d.entrega?.data?.startsWith(relMes))
  const totalHoras = entreguesDoMes.reduce((a,d)=>a+(parseFloat(d.entrega?.tempo)||0),0)
  const sla = doMes.length ? Math.round((entreguesDoMes.length/doMes.length)*100) : 0
  const porTipo = doMes.reduce((acc,d)=>{acc[d.tipo]=(acc[d.tipo]||0)+1;return acc},{})
  const porSetor = Object.entries(doMes.reduce((acc,d)=>{acc[d.setor]=(acc[d.setor]||0)+1;return acc},{})).sort((a,b)=>b[1]-a[1])
  const maxTipo = Math.max(...Object.values(porTipo),1)
  const maxSetor = Math.max(...porSetor.map(s=>s[1]),1)

  /* ── LOGIN ──────────────────────────────────── */
  if (!user) return (
    <>
      <Head><title>Painel · Petslife Marketing</title></Head>
      <style>{tema==='dark'?cssDark:css}</style>
      <div className="login-bg">
        <div className="login-box">
          <div className="login-badge"><div className="badge-dot"/><span>🐾 Marketing Petslife</span></div>
          <h2 className="login-h2">Painel de Demandas</h2>
          <p className="login-sub">Acesso restrito ao time de marketing.</p>
          {loginErr && <div className="login-err">{loginErr}</div>}
          <label className="login-label">E-mail</label>
          <input className="login-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@petslife.vet.br" onKeyDown={e=>e.key==='Enter'&&login()}/>
          <label className="login-label">Senha</label>
          <input className="login-input" type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&login()}/>
          <button className="login-btn" onClick={login}>Entrar</button>
        </div>
      </div>
    </>
  )

  /* ── APP ────────────────────────────────────── */
  return (
    <>
      <Head><title>Painel · Petslife Marketing</title></Head>
      <style>{tema==='dark'?cssDark:css}</style>

      <div className="shell">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-logo">PETSLIFE <span>·</span> Marketing</div>
          <span className="topbar-user">{user?.email}</span>
          <button className="btn-rel" onClick={()=>{setRelMes(mesesDisp[0]||'');setShowRel(true)}}>📊 Relatório</button>
          <button onClick={toggleTema} style={{background:'transparent',border:'1px solid var(--border)',borderRadius:'100px',padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',color:'var(--muted)',fontFamily:"'Outfit',sans-serif",display:'flex',alignItems:'center',gap:6}}>
            {tema==='light'?'🌙 Escuro':'☀️ Claro'}
          </button>
          <button className="btn-sair" onClick={logout}>Sair</button>
        </div>

        {/* STATSBAR */}
        <div className="statsbar">
          {[['todos','all','Total',stats.all,'s-all'],['Novo','novo','Novos',stats.novo,'s-novo'],['Em andamento','and','Em Andamento',stats.and,'s-and'],['Em revisão','rev','Em Revisão',stats.rev,'s-rev'],['Entregue','ent','Entregues',stats.ent,'s-ent'],['urg','urg','Urgentes',stats.urg,'s-urg'],['Cancelado','can','Cancelados',stats.can,'s-can']].map(([f,_,l,n,cls])=>(
            <div key={f} className={`stat ${cls}${filtroStat===f?' active':''}`} onClick={()=>setFiltroStat(f)}>
              <div className="stat-n">{n}</div><div className="stat-l">{l}</div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <button className={`vbtn${view==='lista'?' on':''}`} onClick={()=>setView('lista')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>Lista
          </button>
          <button className={`vbtn${view==='kanban'?' on':''}`} onClick={()=>setView('kanban')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="11" rx="1"/></svg>Kanban
          </button>
          <div className="tb-sep"/>
          <input className="fsearch" placeholder="🔍 Buscar..." value={busca} onChange={e=>setBusca(e.target.value)}/>
          <select className="fsel" value={fPrio} onChange={e=>setFPrio(e.target.value)}>
            <option value="">Todas as prioridades</option>
            {['Urgente','Alta','Média','Baixa'].map(p=><option key={p}>{p}</option>)}
          </select>
          <select className="fsel" value={fTipo} onChange={e=>setFTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            {TIPOS.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="workspace">
          {/* ── LISTA ── */}
          {view==='lista' && (
            <div className="list-view">
              {!filtered.length ? (
                <div className="empty"><div className="empty-ico">🐾</div><div>Nenhuma demanda encontrada</div></div>
              ) : filtered.map((d,i)=>(
                <div key={d.id} className={`dc${detId===d.id?' sel':''}`} style={{animationDelay:i*.04+'s'}} onClick={()=>setDetId(d.id)}>
                  <div className="dc-main">
                    <div className="dc-bar" style={{background:BAR_COLOR[d.status]||'var(--muted)'}}/>
                    <div className="dc-body">
                      <div className="dc-titulo">{d.titulo}</div>
                      <div className="dc-meta">
                        <span className="dc-tag">{d.setor}</span><span className="dc-sep">·</span>
                        <span className="dc-tag">{d.tipo}</span>
                        {d.estados?.length ? <><span className="dc-sep">·</span><span className="dc-tag">📍 {d.estados.join(', ')}</span></> : null}
                        <span className="dc-sep">·</span><span className="dc-tag">Prazo: {fmt(d.prazo)}</span>
                      </div>
                    </div>
                    <div className="dc-right">
                      <span className={`badge b-${d.status?.replace(/ /g,'-')}`}>{d.status}</span>
                      <div className={`pdot p-${d.prioridade}`} title={d.prioridade}/>
                    </div>
                  </div>
                  {d.status==='Entregue'&&d.entrega&&(
                    <div className="dc-entrega">
                      <span className="dc-ei"><strong>✅ {fmt(d.entrega.data)}</strong></span>
                      <span className="dc-ei">⏱ {d.entrega.tempo}</span>
                      <span className="dc-ei">📡 {d.entrega.canal}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── KANBAN ── */}
          {view==='kanban' && (
            <div className="kanban-view">
              {COLS.map(col=>{
                const cards = filtered.filter(d=>d.status===col)
                const clsMap = {Novo:'kb-c-novo','Em andamento':'kb-c-and','Em revisão':'kb-c-rev',Entregue:'kb-c-ent',Cancelado:'kb-c-can'}
                const emoMap = {Novo:'📥','Em andamento':'⚡','Em revisão':'🔍',Entregue:'✅',Cancelado:'🚫'}
                return (
                  <div key={col} className={`kb-col ${clsMap[col]}`}
                    onDragOver={e=>{e.preventDefault();e.currentTarget.querySelector('.kb-cards').classList.add('drag-over')}}
                    onDragLeave={e=>e.currentTarget.querySelector('.kb-cards').classList.remove('drag-over')}
                    onDrop={e=>{e.currentTarget.querySelector('.kb-cards').classList.remove('drag-over');onDrop(col)}}>
                    <div className="kb-head">
                      <div className="kb-head-top">
                        <span className="kb-title">{emoMap[col]} {col}</span>
                        <span className="kb-count">{cards.length}</span>
                      </div>
                      <div className="kb-bar"/>
                    </div>
                    <div className="kb-cards">
                      {!cards.length && <div className="kb-empty"><div>🐾</div>Nenhuma demanda</div>}
                      {cards.map((d,i)=>{
                        const hoje=new Date(); hoje.setHours(0,0,0,0)
                        const venc=d.prazo&&new Date(d.prazo+'T00:00:00')<hoje&&d.status!=='Entregue'
                        return (
                          <div key={d.id} className="kb-card" draggable
                            style={{animationDelay:i*.05+'s'}}
                            onDragStart={()=>setDragId(d.id)}
                            onDragEnd={()=>setDragId(null)}
                            onClick={()=>setDetId(d.id)}>
                            <div className="kb-card-tipo">{d.tipo}</div>
                            <div className="kb-card-title">{d.titulo}</div>
                            <div className="kb-card-desc">{d.descricao}</div>
                            <div className="kb-card-footer">
                              <div className="kb-card-left">
                                <span className={`prio-pill pr-${d.prioridade}`}><span className={`pdot p-${d.prioridade}`}/>{d.prioridade}</span>
                                <span className={`prazo-tag${venc?' venc':''}`}>📅 {fmt(d.prazo)}{venc?' ⚠️':''}</span>
                                <span className="setor-tag">{d.setor}{d.estados?.length?` · 📍${d.estados.slice(0,2).join(',')}${d.estados.length>2?'…':''}`:''}</span>
                              </div>
                              <div className="kb-avatar" title={d.nome}>{iniciais(d.nome)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── DETALHE ── */}
          {detDemanda && (
            <div className="det">
              <div className="det-head">
                <button className="det-close" onClick={()=>setDetId(null)}>✕</button>
                <div className="det-tipo">{detDemanda.tipo}</div>
                <div className="det-titulo">{detDemanda.titulo}</div>
                <div className="det-badges">
                  <span className={`badge b-${detDemanda.status?.replace(/ /g,'-')}`}>{detDemanda.status}</span>
                  <div className={`pdot p-${detDemanda.prioridade}`} style={{width:9,height:9}}/>
                  <span style={{fontSize:12,color:'var(--muted)'}}>{detDemanda.prioridade}</span>
                </div>
                <div className="det-info">
                  {[['Solicitante',detDemanda.nome],['Setor',detDemanda.setor],['Prazo',fmt(detDemanda.prazo)],['E-mail',detDemanda.email],['Protocolo',detDemanda.protocolo],['Recebido em',fmtDH(detDemanda.criado_em)],...(detDemanda.estados?.length?[['Estados',detDemanda.estados.join(', ')]]:[]),...(detDemanda.whatsapp?[['WhatsApp',detDemanda.whatsapp]]:[]),...(detDemanda.formato?[['Formato',detDemanda.formato]]:[])].map(([l,v])=>(
                    <div key={l} className="ic"><div className="ic-l">{l}</div><div className="ic-v">{v||'—'}</div></div>
                  ))}
                </div>
              </div>
              <div className="det-body">
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:4}}>
                  <button className="btn-edit" onClick={()=>abrirEditar(detDemanda)}>✏️ Editar</button>
                </div>
                <div className="sh">Briefing</div>
                <div className="brifbox">{detDemanda.descricao}</div>
                {detDemanda.observacoes&&<div className="obs-box">💬 {detDemanda.observacoes}</div>}
                <div className="sh">Entrega</div>
                {detDemanda.status==='Entregue'&&detDemanda.entrega ? (
                  <div className="entrega-box">
                    <div className="entrega-grid">
                      {[['Data','📅 '+fmt(detDemanda.entrega.data)],['Tempo','⏱ '+detDemanda.entrega.tempo],['Canal','📡 '+detDemanda.entrega.canal],['Aprovado por','👤 '+detDemanda.entrega.aprovador]].map(([l,v])=>(
                        <div key={l} className="eic"><div className="eic-l">{l}</div><div className="eic-v">{v}</div></div>
                      ))}
                    </div>
                    {detDemanda.entrega.obs&&<div className="entrega-obs">💬 {detDemanda.entrega.obs}</div>}
                  </div>
                ) : <p style={{fontSize:12,color:'var(--muted)'}}>Marque como "Entregue" para registrar os dados de conclusão.</p>}
                <div className="sh">Status</div>
                <div className="st-grid">
                  {['Novo','Em andamento','Em revisão','Entregue','Cancelado'].map(s=>(
                    <button key={s} className={`stb${detDemanda.status===s?' on-'+s.replace(/ /g,'-'):''}`} onClick={()=>setStatus(detDemanda.id,s)}>{s}</button>
                  ))}
                </div>
                <div className="sh">Arquivo Final</div>
                {detDemanda.link_arquivo ? (
                  <div className="link-saved">
                    <a href={detDemanda.link_arquivo} target="_blank" rel="noopener">{detDemanda.link_arquivo}</a>
                    <button className="btn-rm" onClick={()=>removerLink(detDemanda.id)}>✕</button>
                  </div>
                ) : (
                  <div className="link-wrap">
                    <input value={linkInput} onChange={e=>setLinkInput(e.target.value)} placeholder="Cole o link (Drive, Figma...)"/>
                    <button className="btn-lk" onClick={()=>salvarLink(detDemanda.id)}>Salvar</button>
                  </div>
                )}
                <div className="sh">Comentários Internos</div>
                {!(detDemanda.comentarios?.length) && <p style={{fontSize:12,color:'var(--muted)',marginBottom:12}}>Nenhum comentário ainda.</p>}
                {(detDemanda.comentarios||[]).map((c,i)=>(
                  <div key={i} className="cmt">
                    <div className="cmt-meta"><span>{c.autor}</span><span>{fmtDH(c.data)}</span></div>
                    <div className="cmt-txt">{c.texto}</div>
                  </div>
                ))}
                <textarea className="cmt-input" value={cmtInput} onChange={e=>setCmtInput(e.target.value)} placeholder="Adicionar observação interna..."/>
                <button className="btn-cmt" onClick={()=>addCmt(detDemanda.id,detDemanda.comentarios)}>Adicionar comentário</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ENTREGA ── */}
      {modalEnt && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setModalEnt(null)}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-ico" style={{background:'rgba(74,222,128,.1)'}}>✅</div>
              <div><h3>Registrar Entrega</h3><p>{demandas.find(d=>d.id===modalEnt)?.titulo}</p></div>
              <button className="modal-close" onClick={()=>setModalEnt(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="mrow">
                <div className="mg"><label>Data de entrega</label><input type="date" value={entrega.data} onChange={e=>setEntrega(v=>({...v,data:e.target.value}))}/></div>
                <div className="mg"><label>Tempo gasto</label><input value={entrega.tempo} onChange={e=>setEntrega(v=>({...v,tempo:e.target.value}))} placeholder="Ex: 4h, 2 dias"/></div>
              </div>
              <div className="mrow">
                <div className="mg"><label>Canal de publicação</label>
                  <select value={entrega.canal} onChange={e=>setEntrega(v=>({...v,canal:e.target.value}))}>
                    <option value="">Selecione...</option>
                    {['Instagram','LinkedIn','Facebook','TikTok','YouTube','WhatsApp','E-mail','Impresso','Apresentação ao vivo','Google Drive','Figma','Outro'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mg"><label>Aprovado por</label><input value={entrega.aprovador} onChange={e=>setEntrega(v=>({...v,aprovador:e.target.value}))} placeholder="Nome"/></div>
              </div>
              <div className="mg"><label>Observação de entrega</label><textarea value={entrega.obs} onChange={e=>setEntrega(v=>({...v,obs:e.target.value}))} placeholder="O que foi entregue, links, ajustes..."/></div>
              <button className="btn-confirm" onClick={confirmarEntrega}>Confirmar Entrega</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ── */}
      {modalEdit && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setModalEdit(null)}>
          <div className="modal" style={{maxWidth:520}}>
            <div className="modal-head">
              <div className="modal-ico" style={{background:'rgba(0,172,235,.1)'}}>✏️</div>
              <div><h3>Editar Demanda</h3></div>
              <button className="modal-close" onClick={()=>setModalEdit(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="mg"><label>Título</label><input value={editData.titulo||''} onChange={e=>setEditData(v=>({...v,titulo:e.target.value}))}/></div>
              <div className="mg"><label>Briefing</label><textarea style={{minHeight:80}} value={editData.descricao||''} onChange={e=>setEditData(v=>({...v,descricao:e.target.value}))}/></div>
              <div className="mrow">
                <div className="mg"><label>Tipo</label><select value={editData.tipo||''} onChange={e=>setEditData(v=>({...v,tipo:e.target.value}))}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
                <div className="mg"><label>Setor</label><select value={editData.setor||''} onChange={e=>setEditData(v=>({...v,setor:e.target.value}))}>{SETORES.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="mrow">
                <div className="mg"><label>Prazo</label><input type="date" value={editData.prazo||''} onChange={e=>setEditData(v=>({...v,prazo:e.target.value}))}/></div>
                <div className="mg"><label>Prioridade</label><select value={editData.prioridade||''} onChange={e=>setEditData(v=>({...v,prioridade:e.target.value}))}>{['Urgente','Alta','Média','Baixa'].map(p=><option key={p}>{p}</option>)}</select></div>
              </div>
              <div className="mg"><label>Observações</label><textarea style={{minHeight:60}} value={editData.observacoes||''} onChange={e=>setEditData(v=>({...v,observacoes:e.target.value}))}/></div>
              <button className="btn-save" onClick={salvarEdicao}>Salvar alterações</button>
              <button className="btn-danger" onClick={excluir}>🗑 Excluir esta demanda</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RELATÓRIO ── */}
      {showRel && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowRel(false)}>
          <div className="modal rel-modal">
            <div className="rel-top">
              <h3>📊 Relatório Mensal</h3>
              <select className="rel-mes-sel" value={relMes} onChange={e=>setRelMes(e.target.value)}>
                {mesesDisp.map(m=><option key={m} value={m}>{nomeMes(m)}</option>)}
              </select>
              <button className="btn-pdf" onClick={()=>window.print()}>⬇ Exportar PDF</button>
              <button className="modal-close" onClick={()=>setShowRel(false)}>✕</button>
            </div>
            <div className="rel-body">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:18,flexWrap:'wrap',gap:8}}>
                <div><div style={{fontFamily:'Space Mono,monospace',fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'var(--accent)',marginBottom:4}}>Período</div><div style={{fontSize:20,fontWeight:700}}>{nomeMes(relMes)}</div></div>
                <div style={{fontSize:11,color:'var(--muted)',textAlign:'right'}}>Gerado em {fmtDH(new Date().toISOString())}<br/>Marketing Petslife</div>
              </div>
              <div className="kpi-grid">
                {[['k-tot',doMes.length,'Demandas'],['k-ent',entreguesDoMes.length,'Entregues'],['k-hrs',totalHoras||'—','Horas'],['k-sla',sla+'%','Taxa Entrega']].map(([cls,n,l])=>(
                  <div key={l} className={`kpi ${cls}`}><div className="kpi-n">{n}</div><div className="kpi-l">{l}</div></div>
                ))}
              </div>
              <div className="rel-section">Distribuição por Tipo</div>
              <div className="tipo-grid">
                {Object.entries(porTipo).map(([tipo,cnt])=>(
                  <div key={tipo} className="tipo-row">
                    <span className="tipo-ico">{TIPO_ICO[tipo]||'📋'}</span>
                    <div className="tipo-info"><div className="tipo-nome">{tipo}</div><div className="tipo-cnt">{cnt} demanda{cnt>1?'s':''}</div></div>
                    <div className="tipo-bar-wrap"><div className="tipo-bar-bg"><div className="tipo-bar-fill" style={{width:Math.round(cnt/maxTipo*100)+'%'}}/></div></div>
                  </div>
                ))}
              </div>
              <div className="rel-section">Demandas por Setor</div>
              <div className="setor-list">
                {porSetor.map(([s,cnt])=>(
                  <div key={s} className="setor-row">
                    <div className="setor-nome">{s}</div>
                    <div className="setor-bar-wrap"><div className="setor-bar-bg"><div className="setor-bar-fill" style={{width:Math.round(cnt/maxSetor*100)+'%'}}/></div></div>
                    <div className="setor-cnt">{cnt}</div>
                  </div>
                ))}
              </div>
              <div className="rel-section">Entregas do Mês</div>
              {!entreguesDoMes.length ? <p style={{fontSize:13,color:'var(--muted)',textAlign:'center',padding:'24px 0'}}>Nenhuma entrega registrada neste mês.</p>
                : entreguesDoMes.map(d=>(
                  <div key={d.id} className="eli">
                    <div className="eli-titulo">{d.titulo}</div>
                    <div className="eli-grid">
                      {[['Setor',d.setor],['Entrega',fmt(d.entrega?.data)],['Tempo',d.entrega?.tempo],['Canal',d.entrega?.canal],['Aprovado por',d.entrega?.aprovador],['Protocolo',d.protocolo]].map(([l,v])=>(
                        <div key={l} className="eli-field"><strong>{l}</strong>{v||'—'}</div>
                      ))}
                    </div>
                    {d.entrega?.obs&&<div className="eli-obs">💬 {d.entrega.obs}</div>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{textAlign:"center",padding:"10px 0 6px",fontSize:11,color:"var(--muted)",fontFamily:"Space Mono,monospace",letterSpacing:1,borderTop:"1px solid var(--border)",background:"var(--s1)",flexShrink:0}}>PETSLIFE © 2026 · Marketing · <a href="https://www.jottahub.com.br" target="_blank" rel="noopener" style={{color:"var(--muted)",textDecoration:"none",borderBottom:"1px solid rgba(0,172,235,.3)",paddingBottom:1}}>Sistema desenvolvido por JottaHub</a></div>

      {/* TOAST */}
      <div className={`toast${toast.show?' show':''} t${toast.tipo}`}>{toast.msg}</div>
    </>
  )
}

const cssDark = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#03080F;--s1:#070E17;--s2:#0C1520;--s3:#111C2B;--accent:#00ACEB;--accent2:#0070C0;--glow:rgba(0,172,235,.18);--text:#EFF6FF;--muted:#5E7A96;--border:#0F2133;--border2:#172840;--success:#4ade80;--danger:#F86F6F;--warn:#F9A743;--info:#60a5fa}
html,body{height:100%}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text)}
`

const css = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#F5F7FA;--s1:#FFFFFF;--s2:#F0F4F8;--s3:#E8EFF7;--accent:#0070C0;--accent2:#005A9E;--glow:rgba(0,112,192,.15);--text:#0F1C2E;--muted:#6B7C93;--border:#D8E2EE;--border2:#C4D2E3;--success:#16a34a;--danger:#DC2626;--warn:#D97706;--info:#2563EB}
html,body{height:100%}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--text)}
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
.login-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#EEF2FF 0%,#F5F7FA 50%,#E8F4FD 100%);padding:24px}
.login-box{width:100%;max-width:400px;background:var(--s1);border:1px solid var(--border);border-radius:22px;padding:40px 36px;position:relative;box-shadow:0 8px 40px rgba(0,112,192,.12)}
.login-box::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:22px 22px 0 0}
.login-badge{display:flex;align-items:center;gap:8px;margin-bottom:28px;justify-content:center;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--accent)}
.badge-dot{width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.login-h2{font-size:26px;font-weight:800;letter-spacing:-1px;margin-bottom:6px;text-align:center}
.login-sub{font-size:13px;color:var(--muted);text-align:center;margin-bottom:28px;line-height:1.6}
.login-err{font-size:12px;color:var(--danger);background:rgba(248,111,111,.07);border:1px solid rgba(248,111,111,.2);border-radius:8px;padding:9px 13px;margin-bottom:14px}
.login-label{display:block;font-size:12px;font-weight:500;color:var(--text);margin-bottom:7px}
.login-input{width:100%;padding:13px 15px;background:var(--s2);border:1px solid var(--border);border-radius:11px;color:var(--text);font-family:'Outfit',sans-serif;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s;margin-bottom:16px;appearance:none}
.login-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--glow)}
.login-btn{width:100%;padding:15px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:12px;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
.login-btn:hover{transform:translateY(-1px);box-shadow:0 10px 28px var(--glow)}
.shell{display:flex;flex-direction:column;height:100%}
.topbar{height:52px;background:var(--s1);border-bottom:1px solid var(--border);box-shadow:0 1px 4px rgba(0,0,0,.06);display:flex;align-items:center;padding:0 20px;gap:12px;flex-shrink:0}
.topbar-logo{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;letter-spacing:1px;color:var(--text);flex:1}
.topbar-logo span{color:var(--accent)}
.topbar-user{font-size:12px;color:var(--muted)}
.btn-rel{padding:7px 16px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:9px;color:#fff;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
.btn-rel:hover{transform:translateY(-1px);box-shadow:0 6px 20px var(--glow)}
.btn-sair{padding:7px 14px;background:transparent;border:1px solid var(--border2);border-radius:9px;color:var(--muted);font-family:'Outfit',sans-serif;font-size:12px;cursor:pointer}
.statsbar{display:flex;border-bottom:1px solid var(--border);background:var(--s1);flex-shrink:0;overflow-x:auto;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.statsbar::-webkit-scrollbar{display:none}
.stat{flex:0 0 auto;padding:10px 20px;border-right:1px solid var(--border);cursor:pointer;transition:background .15s;position:relative}
.stat:hover,.stat.active{background:var(--s2)}
.stat::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:transparent;transition:background .2s}
.stat.active::after{background:var(--accent)}
.stat-n{font-family:'Space Mono',monospace;font-size:22px;font-weight:700;line-height:1;margin-bottom:2px}
.stat-l{font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
.s-all .stat-n{color:var(--text)}.s-novo .stat-n{color:var(--info)}.s-and .stat-n{color:var(--accent)}.s-rev .stat-n{color:var(--warn)}.s-ent .stat-n{color:var(--success)}.s-urg .stat-n{color:var(--danger)}.s-can .stat-n{color:var(--muted)}
.toolbar{display:flex;align-items:center;gap:8px;padding:8px 16px;background:var(--s1);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap}
.vbtn{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--muted);font-family:'Outfit',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s}
.vbtn:hover{background:var(--s2);color:var(--text)}
.vbtn.on{background:rgba(0,172,235,.1);border-color:rgba(0,172,235,.25);color:var(--accent)}
.tb-sep{width:1px;height:20px;background:var(--border);flex-shrink:0}
.fsearch{padding:6px 12px;background:var(--s1);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'Outfit',sans-serif;font-size:12px;outline:none;width:170px;transition:border-color .2s}
.fsearch:focus{border-color:var(--accent)}
.fsel{padding:6px 28px 6px 10px;background:var(--s1);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'Outfit',sans-serif;font-size:12px;outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%236B7C93' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 7px center}
.workspace{flex:1;display:flex;overflow:hidden;min-height:0}
.list-view{flex:1;overflow-y:auto;padding:20px}
.list-view::-webkit-scrollbar{width:4px}
.list-view::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.empty{text-align:center;padding:60px 20px;color:var(--muted)}
.empty-ico{font-size:36px;margin-bottom:12px;opacity:.5}
.dc{background:var(--s1);border:1px solid var(--border);border-radius:14px;margin-bottom:10px;overflow:hidden;cursor:pointer;transition:all .15s;animation:cardIn .3s ease both}
@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.dc:hover{border-color:var(--border2);background:var(--s2)}
.dc.sel{border-color:var(--accent);box-shadow:0 0 0 2px var(--glow)}
.dc-main{display:flex;align-items:flex-start;gap:12px;padding:14px 16px}
.dc-bar{width:3px;flex-shrink:0;align-self:stretch;border-radius:2px;min-height:40px}
.dc-body{flex:1;min-width:0}
.dc-titulo{font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dc-tag{font-size:11px;color:var(--muted)}
.dc-sep{font-size:10px;color:var(--border2)}
.dc-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0}
.dc-entrega{padding:7px 16px 10px 31px;border-top:1px solid var(--border);display:flex;gap:14px;flex-wrap:wrap}
.dc-ei{font-size:11px;color:var(--muted)}
.dc-ei strong{color:var(--success);font-weight:600}
.badge{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 8px;border-radius:20px;white-space:nowrap}
.b-Novo{background:rgba(96,165,250,.1);color:var(--info);border:1px solid rgba(96,165,250,.2)}
.b-Em-andamento{background:rgba(0,172,235,.1);color:var(--accent);border:1px solid rgba(0,172,235,.2)}
.b-Em-revisão{background:rgba(249,167,67,.1);color:var(--warn);border:1px solid rgba(249,167,67,.2)}
.b-Entregue{background:rgba(74,222,128,.1);color:var(--success);border:1px solid rgba(74,222,128,.2)}
.b-Cancelado{background:rgba(94,122,150,.1);color:var(--muted);border:1px solid var(--border)}
.pdot{width:7px;height:7px;border-radius:50%;flex-shrink:0;display:inline-block}
.p-Urgente{background:var(--danger)}.p-Alta{background:var(--warn)}.p-Média{background:#F9D043}.p-Baixa{background:var(--success)}
.kanban-view{flex:1;overflow-x:auto;overflow-y:hidden;padding:16px 20px;display:flex;gap:14px}
.kanban-view::-webkit-scrollbar{height:5px}
.kanban-view::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
.kb-col{flex:0 0 272px;display:flex;flex-direction:column;background:var(--s1);border:1px solid var(--border);border-radius:16px;overflow:hidden;min-height:0;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.kb-head{padding:14px 16px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.kb-head-top{display:flex;align-items:center;justify-content:space-between}
.kb-title{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700}
.kb-count{font-family:'Space Mono',monospace;font-size:11px;color:var(--muted);background:var(--s2);padding:2px 8px;border-radius:100px;border:1px solid var(--border)}
.kb-bar{height:2px;border-radius:1px;margin-top:11px}
.kb-c-novo .kb-title{color:var(--info)}.kb-c-novo .kb-bar{background:var(--info)}
.kb-c-and .kb-title{color:var(--accent)}.kb-c-and .kb-bar{background:var(--accent)}
.kb-c-rev .kb-title{color:var(--warn)}.kb-c-rev .kb-bar{background:var(--warn)}
.kb-c-ent .kb-title{color:var(--success)}.kb-c-ent .kb-bar{background:var(--success)}.kb-c-can .kb-title{color:var(--muted)}.kb-c-can .kb-bar{background:var(--muted)}
.kb-cards{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;min-height:60px;transition:background .15s}
.kb-cards::-webkit-scrollbar{width:3px}
.kb-cards::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.kb-cards.drag-over{background:rgba(0,172,235,.05);border-radius:10px;outline:2px dashed rgba(0,172,235,.3)}
.kb-card{background:var(--s1);border:1px solid var(--border);border-radius:12px;padding:13px;cursor:grab;transition:border-color .15s,transform .15s,box-shadow .15s;animation:cardIn .25s ease both;user-select:none;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.kb-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,112,192,.15)}
.kb-card-tipo{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.kb-card-title{font-size:13px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:7px}
.kb-card-desc{font-size:11px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px}
.kb-card-footer{display:flex;align-items:center;justify-content:space-between;gap:6px}
.kb-card-left{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}
.prio-pill{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:600;padding:2px 8px;border-radius:100px;width:fit-content}
.pr-Urgente{background:rgba(248,111,111,.12);color:var(--danger);border:1px solid rgba(248,111,111,.2)}
.pr-Alta{background:rgba(249,167,67,.12);color:var(--warn);border:1px solid rgba(249,167,67,.2)}
.pr-Média{background:rgba(249,208,67,.12);color:#F9D043;border:1px solid rgba(249,208,67,.2)}
.pr-Baixa{background:rgba(74,222,128,.12);color:var(--success);border:1px solid rgba(74,222,128,.2)}
.prazo-tag{font-size:10px;color:var(--muted)}
.prazo-tag.venc{color:var(--danger)}
.setor-tag{font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kb-avatar{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;border:2px solid var(--s1)}
.kb-empty{text-align:center;padding:28px 12px;color:var(--muted);font-size:12px;opacity:.5}
.det{width:400px;flex-shrink:0;background:var(--s1);border-left:1px solid var(--border);overflow-y:auto;display:block;height:100%;box-shadow:-4px 0 16px rgba(0,0,0,.06)}
.det::-webkit-scrollbar{width:4px}
.det::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
.det-head{padding:20px 20px 0;border-bottom:1px solid var(--border);flex-shrink:0}
.det-close{float:right;background:transparent;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:2px 6px;line-height:1}
.det-tipo{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.det-titulo{font-size:18px;font-weight:700;letter-spacing:-.5px;line-height:1.2;margin-bottom:14px}
.det-badges{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.det-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:16px 0}
.ic{background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:11px 13px}
.ic-l{font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.ic-v{font-size:13px;font-weight:500;color:var(--text);word-break:break-word}
.det-body{padding:0 20px 24px}
.sh{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:18px 0 10px;display:flex;align-items:center;gap:8px}
.sh::after{content:'';flex:1;height:1px;background:var(--border)}
.brifbox{background:var(--s2);border:1px solid var(--border);border-radius:11px;padding:14px;font-size:13px;color:var(--text);line-height:1.7;white-space:pre-wrap;word-break:break-word}
.obs-box{background:rgba(249,167,67,.04);border:1px solid rgba(249,167,67,.15);border-radius:11px;padding:12px 14px;font-size:12px;color:var(--muted);line-height:1.6;margin-top:8px}
.entrega-box{background:rgba(74,222,128,.05);border:1px solid rgba(74,222,128,.2);border-radius:12px;padding:14px;margin-top:2px}
.entrega-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.eic{background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.12);border-radius:8px;padding:9px 11px}
.eic-l{font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--success);opacity:.7;margin-bottom:3px}
.eic-v{font-size:12px;font-weight:600;color:var(--success)}
.entrega-obs{font-size:12px;color:var(--muted);line-height:1.6;margin-top:8px;padding-top:10px;border-top:1px solid rgba(74,222,128,.12)}
.btn-edit{padding:7px 16px;background:rgba(0,172,235,.1);border:1px solid rgba(0,172,235,.25);border-radius:9px;color:var(--accent);font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}
.btn-edit:hover{background:rgba(0,172,235,.2)}
.st-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.stb{padding:10px;border-radius:10px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--s2);color:var(--muted);transition:all .15s}
.stb:hover{border-color:var(--accent);color:var(--accent)}
.stb.on-Novo{border-color:var(--info);background:rgba(96,165,250,.08);color:var(--info)}
.stb.on-Em-andamento{border-color:var(--accent);background:rgba(0,172,235,.08);color:var(--accent)}
.stb.on-Em-revisão{border-color:var(--warn);background:rgba(249,167,67,.08);color:var(--warn)}
.stb.on-Entregue{border-color:var(--success);background:rgba(74,222,128,.08);color:var(--success)}
.link-wrap{display:flex;gap:8px}
.link-wrap input{flex:1;padding:11px 14px;background:var(--s2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:'Outfit',sans-serif;font-size:13px;outline:none;transition:border-color .2s}
.link-wrap input:focus{border-color:var(--accent)}
.btn-lk{padding:11px 16px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer}
.link-saved{display:flex;align-items:center;gap:8px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.18);border-radius:10px;padding:11px 14px}
.link-saved a{font-size:13px;color:var(--success);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.btn-rm{background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:2px;transition:color .15s}
.btn-rm:hover{color:var(--danger)}
.cmt{background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px}
.cmt-meta{font-size:11px;color:var(--muted);margin-bottom:6px;display:flex;justify-content:space-between;gap:8px}
.cmt-txt{font-size:13px;color:var(--text);line-height:1.6;white-space:pre-wrap}
.cmt-input{width:100%;padding:11px 14px;background:var(--s2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:'Outfit',sans-serif;font-size:13px;outline:none;resize:vertical;min-height:70px;line-height:1.5;transition:border-color .2s}
.cmt-input:focus{border-color:var(--accent)}
.btn-cmt{margin-top:8px;padding:10px 18px;background:var(--accent);border:none;border-radius:9px;color:#fff;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer}
.modal-bg{position:fixed;inset:0;z-index:500;background:rgba(15,28,46,.6);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
.modal{background:var(--s1);border:1px solid var(--border2);border-radius:20px;width:100%;max-width:480px;position:relative;overflow:hidden}
.modal::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.modal-head{padding:22px 24px 0;display:flex;align-items:flex-start;gap:12px;margin-bottom:18px}
.modal-ico{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.modal-head h3{font-size:16px;font-weight:700;margin-bottom:3px}
.modal-head p{font-size:12px;color:var(--muted);line-height:1.5}
.modal-close{background:transparent;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:4px;line-height:1;margin-left:auto;flex-shrink:0}
.modal-body{padding:0 24px 24px}
.mrow{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.mg{margin-bottom:14px}
.mg label{display:block;font-size:12px;font-weight:500;color:var(--text);margin-bottom:7px}
.mg input,.mg select,.mg textarea{width:100%;padding:11px 13px;background:var(--s2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:'Outfit',sans-serif;font-size:13px;outline:none;transition:border-color .2s;appearance:none}
.mg input:focus,.mg select:focus,.mg textarea:focus{border-color:var(--accent)}
.mg textarea{min-height:80px;resize:vertical;line-height:1.5}
.mg select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%236B7C93' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px}
.mg input[type="date"]::-webkit-calendar-picker-indicator{filter:none;opacity:.5}
.btn-confirm{width:100%;padding:13px;background:linear-gradient(135deg,var(--success),#22c55e);border:none;border-radius:11px;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
.btn-confirm:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(74,222,128,.2)}
.btn-save{width:100%;padding:13px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:11px;color:#fff;font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:4px}
.btn-save:hover{transform:translateY(-1px);box-shadow:0 8px 24px var(--glow)}
.btn-danger{width:100%;padding:12px;background:transparent;border:1px solid rgba(248,111,111,.3);border-radius:11px;color:var(--danger);font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:8px}
.btn-danger:hover{background:rgba(248,111,111,.08)}
.rel-modal{max-width:680px;max-height:90vh;display:flex;flex-direction:column}
.rel-top{display:flex;align-items:center;gap:10px;padding:18px 24px;border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap}
.rel-top h3{font-size:16px;font-weight:700;flex:1}
.rel-mes-sel{padding:7px 30px 7px 12px;background:var(--s2);border:1px solid var(--border);border-radius:9px;color:var(--text);font-family:'Outfit',sans-serif;font-size:13px;outline:none;cursor:pointer;appearance:none}
.btn-pdf{padding:7px 14px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:9px;color:#fff;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer}
.rel-body{overflow-y:auto;padding:22px 24px;flex:1;background:var(--s2)}
.rel-section{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin:18px 0 12px;display:flex;align-items:center;gap:8px}
.rel-section::after{content:'';flex:1;height:1px;background:var(--border)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px}
.kpi{background:var(--s2);border:1px solid var(--border);border-radius:12px;padding:14px 16px}
.kpi-n{font-family:'Space Mono',monospace;font-size:24px;font-weight:700;margin-bottom:4px}
.kpi-l{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.k-tot .kpi-n{color:var(--text)}.k-ent .kpi-n{color:var(--success)}.k-hrs .kpi-n{color:var(--accent)}.k-sla .kpi-n{color:var(--warn)}
.tipo-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.tipo-row{background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:11px 14px;display:flex;align-items:center;gap:10px}
.tipo-ico{font-size:18px;flex-shrink:0}
.tipo-info{flex:1;min-width:0}
.tipo-nome{font-size:13px;font-weight:500;color:var(--text);margin-bottom:2px}
.tipo-cnt{font-size:11px;color:var(--muted)}
.tipo-bar-wrap{width:50px;flex-shrink:0}
.tipo-bar-bg{height:4px;background:var(--border2);border-radius:2px;overflow:hidden}
.tipo-bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.setor-list{margin-bottom:8px}
.setor-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)}
.setor-row:last-child{border-bottom:none}
.setor-nome{font-size:13px;color:var(--text);flex:1}
.setor-bar-wrap{width:120px;flex-shrink:0}
.setor-bar-bg{height:5px;background:var(--border2);border-radius:3px;overflow:hidden}
.setor-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.setor-cnt{font-family:'Space Mono',monospace;font-size:11px;color:var(--muted);width:20px;text-align:right;flex-shrink:0}
.eli{background:var(--s2);border:1px solid var(--border);border-radius:11px;padding:14px;margin-bottom:10px}
.eli-titulo{font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px}
.eli-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px}
.eli-field{font-size:11px;color:var(--muted);line-height:1.5}
.eli-field strong{display:block;font-size:12px;color:var(--text);font-weight:500;margin-bottom:1px}
.eli-obs{font-size:12px;color:var(--muted);padding-top:8px;border-top:1px solid var(--border);line-height:1.6}
.toast{position:fixed;bottom:22px;right:22px;transform:translateY(120px);padding:11px 18px;border-radius:12px;font-size:13px;font-weight:500;z-index:9999;transition:transform .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 30px rgba(0,0,0,.15);background:var(--s1);border:1px solid var(--border);color:var(--text);max-width:300px}
.toast.show{transform:translateY(0)}.toast.tok{border-color:rgba(74,222,128,.3);color:var(--success)}.toast.terr{border-color:rgba(248,111,111,.3);color:var(--danger)}
@media(max-width:900px){.det{width:100%;position:fixed;inset:0;z-index:200;border:none;border-top:1px solid var(--border)}.kpi-grid{grid-template-columns:repeat(2,1fr)}.kb-col{flex:0 0 240px}}
@media(max-width:580px){.tipo-grid,.mrow{grid-template-columns:1fr}}
`
