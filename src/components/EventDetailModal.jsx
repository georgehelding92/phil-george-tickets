import { useState } from 'react';
import { AvailButton } from './AvailButton';
import { StatusPill } from './StatusPill';
import { TEAM_CONFIG, SETTLED_DISPOSITIONS, getEventStatus, formatDate, formatDateLong } from '../lib/eventHelpers';
import { useAuth } from '../lib/authContext';
import { PHIL_PHONE, GEORGE_PHONE } from '../lib/users';

function settledLabel(disposition, salePrice) {
  if (disposition === "Sold") return salePrice ? `Sold for $${salePrice}` : "Sold";
  return disposition;
}

export function EventDetailModal({event, onClose, onUpdate, onDelete}) {
  const {currentUser, isReadOnly} = useAuth();
  const [aiLoading,setAiLoading]=useState(false);
  const [aiMessage,setAiMessage]=useState(null);
  const [salePriceVal,setSalePriceVal]=useState(event.sale_price||"");
  const [plusOneVal,setPlusOneVal]=useState(event.plus_one_name||"");
  const [settleOpen,setSettleOpen]=useState(false);
  const status = getEventStatus(event);
  const team = TEAM_CONFIG[event.team];
  const disposition = event.disposition || "TBD";
  const isSettled = SETTLED_DISPOSITIONS.includes(disposition);
  const showGuestField = !isSettled && (status==="phil-needs-plus" || status==="george-needs-plus");
  const showSettlePicker = !isSettled && (settleOpen || status==="sell");

  const handleToggle=(field,value)=>{
    const current=event[field]??event[field==="philStatus"?"phil_status":"george_status"];
    onUpdate(event.id,field,current===value?null:value);
  };

  const handleDispositionChange=(value)=>{
    onUpdate(event.id,"disposition",value);
  };

  const saveSalePrice=()=>{
    onUpdate(event.id,"sale_price",salePriceVal);
  };

  const savePlusOne=()=>{
    onUpdate(event.id,"plus_one_name",plusOneVal);
  };

  const handleUndo=()=>{
    setSettleOpen(false);
    setSalePriceVal("");
    onUpdate(event.id,"sale_price","");
    handleDispositionChange("TBD");
  };

  const generateMessage=async()=>{
    setAiLoading(true);setAiMessage(null);
    try {
      const sl={together:"both going together","phil-needs-plus":"Phil is going but George can't make it","george-needs-plus":"George is going but Phil can't make it",sell:"neither can go so tickets need to be sold or exchanged",undecided:"availability still undecided"};
      const prompt=`Write a text message from Phil to George, 1-2 sentences maximum. State only the essential facts: game, date, status. No exclamation points, no sports puns, no warm filler phrases ("hey", "just wanted to", "let me know", etc). Write like someone communicating logistics quickly, not making conversation.\nEvent: ${event.title}\nDate: ${formatDate(event.date)} at ${event.time}\nStatus: ${sl[status]}`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      console.log("Anthropic API response:",{status:res.status,ok:res.ok,data});
      setAiMessage({text:data.content?.find(b=>b.type==="text")?.text||"",isError:false});
    } catch(err){
      console.error("Anthropic API call failed:",err);
      setAiMessage({text:"Couldn't generate. Try again.",isError:true});
    }
    setAiLoading(false);
  };

  const openInMessages=()=>{
    if(!aiMessage||aiMessage.isError) return;
    const targetPhone = currentUser==="Phil" ? GEORGE_PHONE : PHIL_PHONE;
    window.open(`sms:${targetPhone}&body=${encodeURIComponent(aiMessage.text)}`);
  };

  const inp={width:"100%",background:"#0a0a0f",border:"1px solid #252535",borderRadius:"6px",padding:"8px 10px",color:"#ddd",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",boxSizing:"border-box",outline:"none"};
  const lbl={display:"block",fontSize:"10px",color:"#666",marginBottom:"6px",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"};

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

            {!isReadOnly && <div style={{marginTop:"10px"}}>
              {isSettled ? (
                <div>
                  {disposition==="Sold" && (
                    <input style={{...inp,fontSize:"12px",padding:"6px 8px",marginBottom:"6px",maxWidth:"160px"}} value={salePriceVal} onChange={e=>setSalePriceVal(e.target.value)} onBlur={saveSalePrice} placeholder="Sold for $..."/>
                  )}
                  <button onClick={handleUndo} style={{display:"block",background:"none",border:"none",color:"#666",fontSize:"11px",textDecoration:"underline",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:0}}>Undo</button>
                </div>
              ) : (
                <div>
                  <button onClick={()=>setSettleOpen(true)} style={{padding:"6px 12px",borderRadius:"8px",background:showSettlePicker?"#ef4444":"#13131f",border:"1px solid #ef4444",color:showSettlePicker?"#fff":"#ef4444",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,cursor:"pointer"}}>Mark as Settled</button>
                  {showSettlePicker && (
                    <div style={{marginTop:"8px",background:"#13131f",borderRadius:"8px",padding:"10px",maxWidth:"260px"}}>
                      <div style={{display:"flex",gap:"6px"}}>
                        {SETTLED_DISPOSITIONS.map(opt=>(
                          <button key={opt} onClick={()=>handleDispositionChange(opt)} style={{flex:1,padding:"6px 4px",borderRadius:"6px",border:"1px solid #252535",background:"#0d0d18",color:"#aaa",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>{opt}</button>
                        ))}
                      </div>
                      {status!=="sell" && (
                        <button onClick={()=>setSettleOpen(false)} style={{display:"block",marginTop:"6px",background:"none",border:"none",color:"#555",fontSize:"10px",textDecoration:"underline",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:0}}>Cancel</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:"26px",cursor:"pointer",padding:0,flexShrink:0}}>×</button>
        </div>

        <div style={{marginBottom:"16px"}}>
          {isSettled
            ? <span style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#22c55e",background:"#052e16",border:"1px solid #22c55e44",borderRadius:"4px",padding:"3px 10px",whiteSpace:"nowrap"}}>✅ {settledLabel(disposition,salePriceVal)}</span>
            : <StatusPill status={status}/>
          }
        </div>

        <div style={{marginBottom:"14px",background:"#13131f",borderRadius:"10px",padding:"14px"}}>
          <div style={{fontSize:"10px",color:"#555",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"12px"}}>Availability</div>
          {[["Phil","philStatus","phil_status"],["George","georgeStatus","george_status"]].map(([name,field,dbField])=>(
            <div key={field} style={{marginBottom:"10px"}}>
              <div style={{fontSize:"12px",color:"#888",fontFamily:"'DM Sans',sans-serif",marginBottom:"6px",fontWeight:600}}>{name}</div>
              <div style={{display:"flex",gap:"8px"}}>
                {["in","maybe","out"].map(v=><AvailButton key={v} value={v} active={event[field]===v||event[dbField]===v} onClick={()=>handleToggle(field,v)} label={v==="in"?"In ✓":v==="maybe"?"Maybe":"Out ✗"} disabled={isReadOnly||isSettled||currentUser!==name}/>)}
              </div>
            </div>
          ))}
        </div>

        {showGuestField && (
          <div style={{marginBottom:"14px",background:"#13131f",borderRadius:"10px",padding:"14px"}}>
            <label style={lbl}>Guest:</label>
            <input style={inp} value={plusOneVal} onChange={e=>setPlusOneVal(e.target.value)} onBlur={savePlusOne} placeholder="Optional guest name"/>
          </div>
        )}

        {!isReadOnly && <div style={{background:"#13131f",borderRadius:"8px",padding:"10px",marginBottom:"14px"}}>
          <button onClick={generateMessage} disabled={aiLoading} style={{width:"100%",padding:"8px",borderRadius:"6px",background:"#0e1a2e",border:"1px solid #2563eb44",color:"#7ab3f5",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,cursor:"pointer",opacity:aiLoading?0.6:1}}>💬 Draft Text</button>
          {aiLoading&&<div style={{textAlign:"center",color:"#555",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",padding:"6px"}}>Writing message...</div>}
          {aiMessage&&!aiLoading&&(
            <div style={{background:"#0a0a0f",borderRadius:"6px",padding:"10px",marginTop:"8px",fontSize:"12px",color:"#ccc",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.5",whiteSpace:"pre-wrap"}}>
              {aiMessage.text}
              {!aiMessage.isError && (
                <div style={{display:"flex",gap:"6px",marginTop:"8px"}}>
                  <button onClick={()=>navigator.clipboard?.writeText(aiMessage.text)} style={{flex:1,padding:"6px",background:"#13131f",border:"1px solid #252535",borderRadius:"5px",color:"#777",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",cursor:"pointer"}}>📋 Copy</button>
                  <button onClick={openInMessages} style={{flex:1,padding:"6px",background:"#13131f",border:"1px solid #252535",borderRadius:"5px",color:"#777",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",cursor:"pointer"}}>💬 Messages</button>
                </div>
              )}
            </div>
          )}
        </div>}

        {!isReadOnly && <button onClick={()=>{onDelete(event.id);onClose();}} style={{width:"100%",padding:"12px",background:"none",border:"1px solid #ef444433",borderRadius:"8px",color:"#ef4444",fontFamily:"'DM Sans',sans-serif",fontSize:"14px",fontWeight:600,cursor:"pointer"}}>Remove Event</button>}
      </div>
    </div>
  );
}
