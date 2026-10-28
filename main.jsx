import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ShieldCheck, ScanLine, Building2, CalendarDays, ClipboardCheck, CloudSun, BookOpen, HardHat, Upload, ArrowUpRight, Activity, Clock3, CheckCircle2, AlertTriangle, LoaderCircle, Menu } from "lucide-react";
import "./styles.css";

const API = "http://127.0.0.1:8000";
const modules = [
  {id:"safety", label:"Site safety", desc:"Review visible site hazards", icon:ShieldCheck, image:true},
  {id:"crack", label:"Crack inspection", desc:"Review visible cracks or defects", icon:ScanLine, image:true},
  {id:"valuation", label:"Property valuation", desc:"Illustrative property estimate", icon:Building2},
  {id:"planning", label:"Project planner", desc:"Build a practical execution outline", icon:CalendarDays},
  {id:"daily", label:"Daily site assistant", desc:"Daily priorities and checklists", icon:ClipboardCheck},
  {id:"weather", label:"Weather advisory", desc:"Weather-aware work guidance", icon:CloudSun},
  {id:"knowledge", label:"Knowledge assistant", desc:"Ask a construction question", icon:BookOpen}
];
function App(){
  const [active,setActive] = useState("safety");
  const [prompt,setPrompt] = useState("");
  const [image,setImage] = useState(null);
  const [area,setArea] = useState("1200");
  const [rate,setRate] = useState("3500");
  const [weather,setWeather] = useState("Hot and dry; 36°C; moderate wind");
  const [project,setProject] = useState("G+2 residential building, 1800 sq ft floor plate, 8-month target");
  const [busy,setBusy] = useState(false);
  const [result,setResult] = useState(null);
  const [error,setError] = useState("");
  const [history,setHistory] = useState([]);
  const [provider,setProvider] = useState("demo");
  const selected = modules.find(m=>m.id===active);
  useEffect(()=>{fetch(`${API}/api/health`).then(r=>r.json()).then(d=>setProvider(d.provider)).catch(()=>setProvider("offline")); loadHistory();},[]);
  async function loadHistory(){try{const r=await fetch(`${API}/api/history`);const d=await r.json();setHistory(d.items||[])}catch{}}
  function choose(id){setActive(id);setResult(null);setError("");setImage(null);setPrompt("");}
  async function submit(e){
    e.preventDefault();setBusy(true);setError("");setResult(null);
    const fd=new FormData();fd.append("feature",active);fd.append("prompt",prompt);
    const data={};
    if(active==="valuation"){data.area_sqft=area;data.rate_per_sqft=rate}
    if(active==="weather")data.weather=weather;
    if(active==="planning")data.project_description=project;
    fd.append("data",JSON.stringify(data));if(image)fd.append("image",image);
    try{const response=await fetch(`${API}/api/analyze`,{method:"POST",body:fd});const body=await response.json();if(!response.ok)throw new Error(body.detail||"Request failed");setResult(body);setProvider(body.mode);loadHistory()}
    catch(err){setError(`${err.message}. Check that the FastAPI backend is running at ${API}.`)}
    finally{setBusy(false)}
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><HardHat size={23}/></div><div><strong>BuildSense</strong><span>CONSTRUCTION INTELLIGENCE</span></div></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{modules.map(m=>{const Icon=m.icon;return <button key={m.id} className={`nav-item ${active===m.id?"selected":""}`} onClick={()=>choose(m.id)}><Icon size={18}/><span>{m.label}</span>{active===m.id&&<span className="nav-dot"/>}</button>})}</nav>
      <div className="sidebar-bottom"><div className="status-light"/><div><b>System status</b><span>{provider==="offline"?"Backend disconnected":provider==="demo"?"Demo mode active":"AI provider connected"}</span></div></div>
      <div className="sidebar-footer">BUILDSENSE · MVP 1.0</div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>{selected.label}</b></div><div className="top-right"><span className={`mode-pill ${provider==="demo"?"demo":""}`}><span/> {provider==="offline"?"API offline":provider==="demo"?"Demo environment":"AI enabled"}</span><div className="avatar">BS</div></div></header>
      <section className="welcome"><div><div className="eyebrow"><span className="eyebrow-line"/> INTELLIGENCE WORKSPACE</div><h1>Build with <em>better insight.</em></h1><p>Turn site observations and project context into structured, actionable guidance.</p></div><div className="welcome-art"><div className="art-grid"/><div className="art-building"><div/><div/><div/><div/><div/><div/></div><div className="art-sun"/></div></section>
      <section className="metrics">
        <div className="metric"><div className="metric-icon blue"><Activity size={18}/></div><div><span>AI WORKFLOWS</span><strong>07</strong><small>Available modules</small></div></div>
        <div className="metric"><div className="metric-icon green"><CheckCircle2 size={18}/></div><div><span>API STATUS</span><strong>{provider==="offline"?"Offline":"Connected"}</strong><small>{provider==="demo"?"Simulated responses":"Backend responding"}</small></div></div>
        <div className="metric"><div className="metric-icon amber"><Clock3 size={18}/></div><div><span>RECENT RUNS</span><strong>{history.length.toString().padStart(2,"0")}</strong><small>Latest activity on this session</small></div></div>
      </section>
      <div className="content-grid">
        <section className="panel form-panel">
          <div className="panel-heading"><div><span className="section-kicker">WORKFLOW INPUT</span><h2>{selected.label}</h2><p>{selected.desc}. Add context to get started.</p></div><div className="panel-icon"><selected.icon size={21}/></div></div>
          <form onSubmit={submit}>
            {active==="valuation"&&<div className="field-row"><label>Built-up area <span>(sq ft)</span><input type="number" min="1" value={area} onChange={e=>setArea(e.target.value)} required/></label><label>Comparable rate <span>(per sq ft)</span><input type="number" min="1" value={rate} onChange={e=>setRate(e.target.value)} required/></label></div>}
            {active==="weather"&&<label className="field-label">Weather conditions<textarea value={weather} onChange={e=>setWeather(e.target.value)} rows="3" /></label>}
            {active==="planning"&&<label className="field-label">Project overview<textarea value={project} onChange={e=>setProject(e.target.value)} rows="3"/></label>}
            <label className="field-label">{active==="knowledge"?"Your question":"Additional context"}<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows="4" placeholder={active==="safety"?"e.g. Workers are using a ladder near an open edge...":active==="crack"?"e.g. Diagonal crack near a window opening, first noticed yesterday...":active==="knowledge"?"Ask about concrete curing, PPE, sequencing, materials...":"Describe the site, constraints, goals, or concerns..."}/></label>
            {selected.image&&<div className="field-label">Site image <span className="optional">OPTIONAL</span><label className="upload-box"><input type="file" accept="image/*" onChange={e=>setImage(e.target.files?.[0]||null)}/><div className="upload-icon"><Upload size={20}/></div><div><b>{image?image.name:"Upload a site photo"}</b><span>{image?`${(image.size/1024/1024).toFixed(2)} MB · Selected`:"PNG, JPG or WEBP · max 10 MB"}</span></div><span className="browse">Browse</span></label></div>}
            <div className="form-foot"><span><ShieldCheck size={15}/> Structured JSON output</span><button className="primary-btn" disabled={busy}>{busy?<><LoaderCircle className="spin" size={17}/> Analyzing…</>:<>Generate insights <ArrowUpRight size={17}/></>}</button></div>
          </form>
          {error&&<div className="error-box"><AlertTriangle size={18}/><span>{error}</span></div>}
        </section>
        <section className="panel results-panel">
          <div className="panel-heading result-heading"><div><span className="section-kicker">DECISION SUPPORT</span><h2>Analysis report</h2><p>Your results will appear here.</p></div><div className="report-symbol"><Activity size={21}/></div></div>
          {!result&&!busy&&<div className="empty-state"><div className="empty-illustration"><div className="empty-paper"><span/><span/><span/><i/></div><div className="empty-magnify"><ScanLine size={25}/></div></div><h3>Ready when you are</h3><p>Complete the workflow form and generate insights to see findings, recommendations, and limitations.</p><div className="empty-tags"><span>Context-aware</span><span>Structured output</span><span>Safety-first</span></div></div>}
          {busy&&<div className="loading-state"><div className="loading-ring"><LoaderCircle size={30}/></div><h3>Reviewing your inputs</h3><p>Preparing structured decision-support output…</p></div>}
          {result&&<div className="report-content">
            <div className={`report-mode ${result.mode==="demo"?"warning":""}`}>{result.mode==="demo"?"DEMO OUTPUT — NOT AI IMAGE ANALYSIS":"MODEL-ASSISTED OUTPUT"}</div>
            <h3>{result.result.title}</h3><p className="report-summary">{result.result.summary}</p>
            <div className="risk-row"><span>Risk indicator</span><b className={`risk ${result.result.risk_level}`}>{result.result.risk_level}</b></div>
            <div className="report-section"><h4>Key findings</h4><ul>{(result.result.findings||[]).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            <div className="report-section"><h4>Recommended actions</h4><ul>{(result.result.recommendations||[]).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            <div className="limitations"><AlertTriangle size={17}/><div><b>Limitations</b>{(result.result.limitations||[]).map((x,i)=><p key={i}>{x}</p>)}</div></div>
            <button className="secondary-btn" onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(result.result,null,2))}}>Copy JSON report</button>
          </div>}
        </section>
      </div>
      <section className="activity-panel panel"><div className="activity-head"><div><span className="section-kicker">SESSION LOG</span><h2>Recent activity</h2></div><button className="text-btn" onClick={loadHistory}>Refresh <Activity size={15}/></button></div>
        {history.length===0?<div className="no-activity">No analyses yet. Your completed workflows will appear here.</div>:<div className="history-list">{history.slice(0,5).map(item=><div className="history-item" key={item.id}><div className="history-check"><CheckCircle2 size={17}/></div><div className="history-main"><b>{item.title}</b><span>{item.feature} · {new Date(item.created_at).toLocaleString()}</span></div><span className={`history-mode ${item.mode}`}>{item.mode}</span></div>)}</div>}
      </section>
      <footer>BUILDSENSE INTELLIGENCE <span>Decision support, not a substitute for professional inspection.</span></footer>
    </main>
  </div>
}
createRoot(document.getElementById("root")).render(<App/>);
