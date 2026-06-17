import { useState } from 'react';
import { AvailButton } from './AvailButton';
import { StatusPill } from './StatusPill';
import { supabase } from '../lib/supabase';
import { TEAM_CONFIG, getEventStatus, formatDate, formatDateLong } from '../lib/eventHelpers';

export function EventDetailModal({event, onClose, onUpdate, onDelete}) {
  const [aiLoading,setAiLoading]=useState(false);
  const [aiMessage,setAiMessage]=useState(null);
  const [editingNotes,setEditingNotes]=useState(false);
  const [notesVal,setNotesVal]=useState(event.notes||"");
  const status = getEventStatus(event);
  const team = TEAM_CONFIG[event.team];

  const handleToggle=(field,value)=>{
    const current=event[field]??event[field==="philStatus"?"phil_status":"george_status"];
    onUpdate(event.id,field,current===value?null:value);
  };

  const saveNotes=async()=>{
    setEditingNotes(false);
    onUpdate(event.id,"notes",notesVal);
    await supabase.from("events").update({notes:notesVal}).eq("id",event.id);
  };

  const generateMessage=async(type)=>{
    setAiLoading(true);setAiMessage(null);
    try {
      const sl={together:"both going together","phil-needs-plus":"Phil is going but George can't make it","george-needs-plus":"George is going but Phil can't make it",sell:"neither can go so tickets need to be sold or exchanged",undecided:"availability still undecided"};
      const prompts={
        text:`Short friendly text (2-4 sentences, casual) from Phil to George.\nEvent: ${event.title}\nDate: ${formatDate(event.date)} at ${event.time}\nStatus: ${sl[status]}\nKeep it natural like a real dad-son text.`,
        email:`Short friendly email (subject + 3-5 sentences) from Phil to George.\nEvent: ${event.title}\nDate: ${formatDate(event.date)}\nStatus: ${sl[status]}\nFormat:\nSUBJECT: ...\nBODY: ...`,
      };
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompts[type]}]})});
      const data=await res.json();
      setAiMessage({type,text:data.content?.find(b=>b.type==="text")?.text||""});
    } catch{setAiMessage({type:"error",text:"Couldn't generate. Try again."});}
    setAiLoading(false);
  };

  const shareEvent=()=>{
    const text=`${event.title}\n${formatDateLong(event.date)} at ${event.time}\n${event.venue||team.venue}`;
    if(navigator.share){navigator.share({title:event.title,text});}
    else{navigator.clipboard?.writeText(text);alert("Copied to clipboard!");}
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#000c",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#0d0d18",border:"1px solid #1e1e32",borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:"480px",maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
              <span style={{fontSize:"26px"}}>{team.emoji}</span>
              <h2 style={{margin:0,color:"#f0f0f8",fontFamily:"'Bebas Neue',cursive",fontSize:"24px",letterSpacing:"0.05em"}}>{event.title}</h2>
            </div>
            <div style={{fontSize:"14px",fontWeight:600,color:"#c0c0d8",fontFamily:"'DM Sans',sans-serif"}}>{formatDateLong(event.date)}</div>
            <div style={{fontSize:"13px",color:"#a0a0b8",fontFamily:"'DM Sans',sans-serif"}}>{event.time} · {event.venue||team.venue}</div>
            <div style={{fontSize:"12px",color:team.accent,fontFamily:"'Courier Prime',monospace",marginTop:"2px"}}>{team.section || event.section}</div>
          </div>
          <div style={{display:"flex",gap:"8px",alignItems:"center",flexShrink:0}}>
            <button onClick={shareEvent} style={{background:"#13131f",border:"1px solid #252535",borderRadius:"8px",color:"#888",fontSize:"16px",cursor:"pointer",padding:"6px 10px"}}>↗</button>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:"26px",cursor:"pointer",padding:0}}>×</button>
          </div>
        </div>

        <div style={{marginBottom:"16px"}}><StatusPill status={status}/></div>

        <div style={{marginBottom:"14px",background:"#13131f",borderRadius:"10px",padding:"14px"}}>
          <div style={{fontSize:"10px",color:"#555",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"12px"}}>Availability</div>
          {[["Phil","philStatus","phil_status"],["George","georgeStatus","george_status"]].map(([name,field,dbField])=>(
            <div key={field} style={{marginBottom:"10px"}}>
              <div style={{fontSize:"12px",color:"#888",fontFamily:"'DM Sans',sans-serif",marginBottom:"6px",fontWeight:600}}>{name}</div>
              <div style={{display:"flex",gap:"8px"}}>
                {["in","maybe","out"].map(v=><AvailButton key={v} value={v} active={event[field]===v||event[dbField]===v} onClick={()=>handleToggle(field,v)} label={v==="in"?"In ✓":v==="maybe"?"Maybe":"Out ✗"}/>)}
              </div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:"14px",background:"#13131f",borderRadius:"10px",padding:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <div style={{fontSize:"10px",color:"#555",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Notes</div>
            {!editingNotes
              ? <button onClick={()=>setEditingNotes(true)} style={{background:"none",border:"1px solid #252535",borderRadius:"6px",color:"#777",fontSize:"11px",cursor:"pointer",padding:"3px 10px",fontFamily:"'DM Sans',sans-serif"}}>Edit</button>
              : <button onClick={saveNotes} style={{background:"#22c55e18",border:"1px solid #22c55e44",borderRadius:"6px",color:"#22c55e",fontSize:"11px",cursor:"pointer",padding:"3px 10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Save</button>
            }
          </div>
          {editingNotes
            ? <textarea value={notesVal} onChange={e=>setNotesVal(e.target.value)} style={{width:"100%",background:"#0a0a0f",border:"1px solid #252535",borderRadius:"6px",padding:"8px",color:"#ddd",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",resize:"none",height:"64px",outline:"none"}}/>
            : <div style={{fontSize:"13px",color:notesVal?"#aaa":"#444",fontFamily:"'DM Sans',sans-serif",fontStyle:notesVal?"italic":"normal",minHeight:"20px"}}>{notesVal||"No notes — tap Edit to add"}</div>
          }
        </div>

        <div style={{background:"#13131f",borderRadius:"10px",padding:"14px",marginBottom:"14px"}}>
          <div style={{fontSize:"10px",color:"#555",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"10px"}}>✨ AI Draft Message</div>
          <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
            <button onClick={()=>generateMessage("text")} disabled={aiLoading} style={{flex:1,padding:"10px",borderRadius:"8px",background:"#0e1a2e",border:"1px solid #2563eb44",color:"#7ab3f5",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",opacity:aiLoading?0.6:1}}>💬 Draft Text</button>
            <button onClick={()=>generateMessage("email")} disabled={aiLoading} style={{flex:1,padding:"10px",borderRadius:"8px",background:"#120e24",border:"1px solid #7c3aed44",color:"#b39dfa",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",opacity:aiLoading?0.6:1}}>📧 Draft Email</button>
          </div>
          {aiLoading&&<div style={{textAlign:"center",color:"#555",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",padding:"8px"}}>Writing message...</div>}
          {aiMessage&&!aiLoading&&(
            <div style={{background:"#0a0a0f",borderRadius:"8px",padding:"12px",fontSize:"13px",color:"#ccc",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.6",whiteSpace:"pre-wrap"}}>
              {aiMessage.text}
              <button onClick={()=>navigator.clipboard?.writeText(aiMessage.text)} style={{display:"block",width:"100%",marginTop:"10px",padding:"8px",background:"#13131f",border:"1px solid #252535",borderRadius:"6px",color:"#777",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",cursor:"pointer"}}>📋 Copy</button>
            </div>
          )}
        </div>

        <button onClick={()=>{onDelete(event.id);onClose();}} style={{width:"100%",padding:"12px",background:"none",border:"1px solid #ef444433",borderRadius:"8px",color:"#ef4444",fontFamily:"'DM Sans',sans-serif",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Remove Event</button>
      </div>
    </div>
  );
}
