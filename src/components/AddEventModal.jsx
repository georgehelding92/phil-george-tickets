import { useState } from 'react';
import { TEAM_CONFIG } from '../lib/eventHelpers';

export function AddEventModal({onAdd, onClose}) {
  const [form,setForm]=useState({title:"",team:"cubs",date:"",time:"7:05 PM",venue:"Wrigley Field",section:"Sec 111, Row 11, Seats 7 & 8",notes:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",background:"#13131f",border:"1px solid #252535",borderRadius:"8px",padding:"10px 12px",color:"#e0e0f0",fontFamily:"'DM Sans',sans-serif",fontSize:"14px",boxSizing:"border-box",outline:"none"};
  const lbl={display:"block",fontSize:"10px",color:"#666",marginBottom:"4px",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"};
  const handleTeamChange=(k)=>{
    const t=TEAM_CONFIG[k];
    set("team",k);
    if(t.venue) set("venue",t.venue);
    if(t.section) set("section",t.section);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000b",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#0d0d18",border:"1px solid #1e1e32",borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:"480px",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <h2 style={{margin:0,color:"#f0f0f8",fontFamily:"'Bebas Neue',cursive",fontSize:"28px",letterSpacing:"0.05em"}}>Add Event</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:"26px",cursor:"pointer",padding:0}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div><label style={lbl}>Event Name</label><input style={inp} placeholder="Cubs vs Cardinals" value={form.title} onChange={e=>set("title",e.target.value)}/></div>
          <div>
            <label style={lbl}>Category</label>
            <div style={{display:"flex",gap:"8px"}}>
              {Object.entries(TEAM_CONFIG).map(([k,v])=>(
                <button key={k} onClick={()=>handleTeamChange(k)} style={{flex:1,padding:"10px",borderRadius:"8px",border:form.team===k?`2px solid ${v.accent}`:"2px solid #252535",background:form.team===k?`${v.accent}18`:"#13131f",color:form.team===k?v.accent:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            <div style={{flex:1}}><label style={lbl}>Date</label><input style={inp} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
            <div style={{flex:1}}><label style={lbl}>Time</label><input style={inp} placeholder="7:05 PM" value={form.time} onChange={e=>set("time",e.target.value)}/></div>
          </div>
          <div><label style={lbl}>Venue</label><input style={inp} value={form.venue} onChange={e=>set("venue",e.target.value)}/></div>
          <div><label style={lbl}>Section / Seats</label><input style={inp} value={form.section} onChange={e=>set("section",e.target.value)}/></div>
          <div><label style={lbl}>Notes</label><input style={inp} placeholder="Optional notes..." value={form.notes} onChange={e=>set("notes",e.target.value)}/></div>
          <button onClick={()=>{if(!form.title||!form.date)return;onAdd({...form,tickets:2,phil_status:null,george_status:null,assignee:"Phil"});}} style={{width:"100%",padding:"14px",background:`linear-gradient(135deg,#CC3433,#0E3386)`,border:"none",borderRadius:"10px",color:"#fff",fontFamily:"'Bebas Neue',cursive",fontSize:"22px",letterSpacing:"0.08em",cursor:"pointer"}}>
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}
