import { useState, useRef, useEffect } from 'react';
import { CUBS_2026 } from '../data/cubs2026';
import { formatMonth } from '../lib/eventHelpers';

export function SeasonOverview({onClose}) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [showPastMonths, setShowPastMonths] = useState(false);
  const scrollRef = useRef(null);
  const currentMonthRef = useRef(null);

  const philCount = CUBS_2026.filter(g=>g.assignee==="Phil").length;
  const davidCount = CUBS_2026.filter(g=>g.assignee==="David").length;

  const currentMonthStr = formatMonth(new Date().toLocaleDateString("en-CA"));

  const byMonth = {};
  CUBS_2026.forEach(g=>{
    const m = formatMonth(g.date);
    if(!byMonth[m]) byMonth[m]=[];
    byMonth[m].push(g);
  });

  const pastMonths = Object.entries(byMonth).filter(([m])=> new Date(m+"1") < new Date(currentMonthStr+"1") && m !== currentMonthStr);
  const currentAndFutureMonths = Object.entries(byMonth).filter(([m])=> {
    const mDate = new Date(m.replace(" ","1 "));
    const cDate = new Date(currentMonthStr.replace(" ","1 "));
    return mDate >= cDate;
  });
  const pastGamesCount = CUBS_2026.filter(g=>new Date(g.date+"T12:00:00")<today).length;

  const todayStr = new Date().toLocaleDateString("en-CA");
  const firstUpcomingDate = CUBS_2026.find(g => g.date >= todayStr)?.date;

  // Scroll to first upcoming game on open
  useEffect(()=>{
    if(scrollRef.current) {
      setTimeout(()=>{
        const target = scrollRef.current.querySelector(`[data-gameid="${firstUpcomingDate}"]`);
        if(target) target.scrollIntoView({behavior:"smooth", block:"center"});
        else if(currentMonthRef.current) currentMonthRef.current.scrollIntoView({behavior:"smooth", block:"start"});
      }, 150);
    }
  },[]);

  const renderGame = (g) => {
    const isPast = new Date(g.date+"T12:00:00")<today;
    const isPhil = g.assignee==="Phil";
    const isFirstUpcoming = g.date === firstUpcomingDate;
    const accentColor = isPast?"#2a2a3a":isPhil?"#CC3433":"#0E3386";
    return (
      <div key={g.id} data-gameid={g.date} style={{display:"flex",alignItems:"center",gap:"10px",padding:"7px 10px",borderRadius:"6px",marginBottom:"3px",borderLeft:`3px solid ${accentColor}`,background:isFirstUpcoming?"#1a1a2e":isPast?"#111118":"#13131f",outline:isFirstUpcoming?`1px solid #CC343344`:"none"}}>
        <div style={{width:"44px",flexShrink:0}}>
          <div style={{fontSize:"12px",fontWeight:600,color:isPast?"#888":"#ccc",fontFamily:"'DM Sans',sans-serif"}}>{new Date(g.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          <div style={{fontSize:"10px",color:isPast?"#555":"#666",fontFamily:"'Courier Prime',monospace"}}>{g.day}</div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"13px",fontWeight:600,color:isPast?"#888":"#ddd",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>vs {g.opponent}</div>
          <div style={{fontSize:"11px",color:isPast?"#555":"#666",fontFamily:"'Courier Prime',monospace"}}>{g.time}</div>
        </div>
        <div style={{flexShrink:0,fontSize:"10px",fontWeight:700,color:isPast?"#666":isPhil?"#CC3433":"#4472c4",background:isPast?"#1a1a2e":isPhil?"#CC343318":"#0E338618",border:`1px solid ${isPast?"#2a2a3a":isPhil?"#CC343444":"#0E338644"}`,borderRadius:"4px",padding:"2px 8px",fontFamily:"'Courier Prime',monospace"}}>{g.assignee}</div>
        {g.sheetNotes&&<div style={{fontSize:"9px",color:isPast?"#555":"#444",fontFamily:"'Courier Prime',monospace",flexShrink:0,maxWidth:"64px",textAlign:"right",lineHeight:1.3,fontStyle:"italic"}}>{g.sheetNotes}</div>}
      </div>
    );
  };

  const renderMonthHeader = (month, games) => (
    <div style={{position:"sticky",top:0,padding:"10px 4px 6px",background:"#0a0a0f",fontSize:"10px",fontWeight:700,color:"#555",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.1em",textTransform:"uppercase",zIndex:5,display:"flex",justifyContent:"space-between",borderBottom:"1px solid #1a1a2e",marginBottom:"6px"}}>
      <span style={{color:"#888"}}>{month}</span>
      <span>{games.length} games · <span style={{color:"#CC3433"}}>{games.filter(g=>g.assignee==="Phil").length}P</span> / <span style={{color:"#4472c4"}}>{games.filter(g=>g.assignee==="David").length}D</span></span>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"#000e",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{background:"#0a0a0f",flex:1,display:"flex",flexDirection:"column",width:"100%",maxWidth:"480px",overflow:"hidden"}}>
        <div style={{padding:"20px 20px 14px",borderBottom:"1px solid #1a1a2e",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
            <div>
              <h2 style={{margin:0,fontFamily:"'Bebas Neue',cursive",fontSize:"26px",color:"#f0f0f8",letterSpacing:"0.05em"}}>⚾ 2026 Season Overview</h2>
              <p style={{margin:"3px 0 0",fontSize:"11px",color:"#555",fontFamily:"'Courier Prime',monospace"}}>All 81 verified Cubs home games · Read only</p>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#666",fontSize:"28px",cursor:"pointer",padding:0,lineHeight:1}}>×</button>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            {[{label:"Phil",count:philCount,color:"#CC3433"},{label:"David",count:davidCount,color:"#0E3386"},{label:"Total",count:CUBS_2026.length,color:"#444"}].map(s=>(
              <div key={s.label} style={{flex:1,background:"#13131f",borderRadius:"8px",padding:"10px 12px",borderTop:`3px solid ${s.color}`}}>
                <div style={{fontSize:"26px",fontWeight:700,color:"#f0f0f8",fontFamily:"'Bebas Neue',cursive",lineHeight:1}}>{s.count}</div>
                <div style={{fontSize:"10px",color:"#666",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"3px"}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div ref={scrollRef} style={{overflowY:"auto",flex:1,padding:"0 16px 40px"}}>

          {/* Past months — collapsed by default */}
          {pastMonths.length > 0 && (
            <div style={{marginTop:"8px"}}>
              <button onClick={()=>setShowPastMonths(p=>!p)} style={{width:"100%",padding:"10px",background:"none",border:"none",color:"#444",fontFamily:"'Courier Prime',monospace",fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                <span style={{flex:1,height:"1px",background:"#1e1e32"}}/>
                <span>{showPastMonths?"▲":"▼"} {pastGamesCount} past games</span>
                <span style={{flex:1,height:"1px",background:"#1e1e32"}}/>
              </button>
              {showPastMonths && pastMonths.map(([month,games])=>(
                <div key={month}>
                  {renderMonthHeader(month, games)}
                  {games.map(renderGame)}
                </div>
              ))}
            </div>
          )}

          {/* Current month and future — always visible */}
          {currentAndFutureMonths.map(([month,games],i)=>(
            <div key={month} ref={i===0?currentMonthRef:null}>
              {renderMonthHeader(month, games)}
              {games.map(renderGame)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
