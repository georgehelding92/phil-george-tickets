import { Fragment } from 'react';
import { StatusPill } from './StatusPill';
import { AvailButton } from './AvailButton';
import { TEAM_CONFIG, getEventStatus, daysUntil, formatDate } from '../lib/eventHelpers';
import { useAuth } from '../lib/authContext';

export function EventCard({event, onUpdate, onClick}) {
  const {currentUser} = useAuth();
  const status = getEventStatus(event);
  const team = TEAM_CONFIG[event.team];
  const days = daysUntil(event.date);
  const isPast = days === "Past";
  const isToday = days === "TODAY";
  const isTomorrow = days === "Tomorrow";
  const countdownColor = isToday ? "#ff6b6b" : isTomorrow ? "#f59e0b" : "#555";

  const handleToggle = (e, field, value) => {
    e.stopPropagation();
    const current = event[field] ?? event[field==="philStatus"?"phil_status":"george_status"];
    onUpdate(event.id, field, current === value ? null : value);
  };

  return (
    <div
      className="ticket-card"
      onClick={() => onClick(event)}
      style={{
        background: isPast ? "#0d0d14" : `linear-gradient(135deg,#14142a 0%,#0f0f1e 100%)`,
        border: isToday ? `1px solid ${team.accent}88` : "1px solid #1e1e32",
        borderLeft: `4px solid ${isPast?"#2a2a3a":team.accent}`,
        borderRadius: "12px",
        marginBottom: "8px",
        cursor: "pointer",
        opacity: isPast ? 0.4 : 1,
        boxShadow: isToday ? `0 0 20px ${team.accent}22` : "none",
        overflow: "hidden",
      }}
    >
      {/* Game Day banner — solid, no animation */}
      {isToday && (
        <div style={{background:`linear-gradient(90deg,${team.accent},${team.secondAccent})`,padding:"4px 16px",textAlign:"center"}}>
          <span style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.2em",color:"#fff",fontFamily:"'Bebas Neue',cursive"}}>🎟 GAME DAY 🎟</span>
        </div>
      )}

      <div style={{padding:"12px 14px"}}>
        {/* Top row: title+venue left, date+countdown right */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px",gap:"8px"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:"8px",flex:1,minWidth:0}}>
            <span style={{fontSize:"20px",flexShrink:0,marginTop:"1px"}}>{team.emoji}</span>
            <div style={{minWidth:0}}>
              <div style={{fontSize:"17px",fontWeight:700,color:"#f0f0f8",fontFamily:"'Bebas Neue',cursive",letterSpacing:"0.04em",lineHeight:1.1}}>{event.title}</div>
              <div style={{fontSize:"11px",color:"#555",fontFamily:"'DM Sans',sans-serif",lineHeight:1.3,marginTop:"2px"}}>{event.venue || team.venue}</div>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:"13px",fontWeight:600,color:"#c0c0d8",fontFamily:"'DM Sans',sans-serif",lineHeight:1.2}}>{formatDate(event.date)}</div>
            <div style={{fontSize:"12px",color:"#a0a0b8",fontFamily:"'DM Sans',sans-serif"}}>{event.time}</div>
            {!isPast && <div style={{fontSize:"10px",color:countdownColor,fontFamily:"'Courier Prime',monospace",fontWeight:700,marginTop:"2px",letterSpacing:"0.05em"}}>{days}</div>}
          </div>
        </div>

        {/* Status */}
        <div style={{marginBottom:"10px"}}>
          <StatusPill status={status}/>
        </div>

        {/* Availability — clearer Phil/George separation */}
        <div style={{display:"flex",gap:"0",alignItems:"stretch",background:"#0d0d18",borderRadius:"8px",overflow:"hidden",border:"1px solid #252535"}} onClick={e=>e.stopPropagation()}>
          {[["PHIL","philStatus","phil_status","Phil"],["GEORGE","georgeStatus","george_status","George"]].map(([label,field,dbField,owner],i)=>(
            <Fragment key={field}>
              {i>0&&<div style={{width:"1px",background:"#252535",flexShrink:0}}/>}
              <div style={{flex:1,padding:"8px 6px 8px"}}>
                <div style={{fontSize:"10px",color:"#666",marginBottom:"4px",fontFamily:"'Courier Prime',monospace",fontWeight:700,letterSpacing:"0.1em",textAlign:"center"}}>{label}</div>
                <div style={{display:"flex",gap:"3px"}}>
                  {["in","maybe","out"].map(v=>(
                    <AvailButton key={v} value={v}
                      active={event[field]===v||event[dbField]===v}
                      onClick={(e)=>handleToggle(e,field,v)}
                      label={v==="in"?"In":v==="maybe"?"?":"Out"}
                      disabled={currentUser!==owner}
                    />
                  ))}
                </div>
              </div>
            </Fragment>
          ))}
        </div>

        {event.notes && (
          <div style={{marginTop:"8px",fontSize:"11px",color:"#555",fontFamily:"'Courier Prime',monospace",fontStyle:"italic"}}>📝 {event.notes}</div>
        )}
      </div>
    </div>
  );
}
