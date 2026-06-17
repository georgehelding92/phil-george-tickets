import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { fromDb, getEventStatus, groupByMonth } from './lib/eventHelpers';
import { EventCard } from './components/EventCard';
import { MonthHeader } from './components/MonthHeader';
import { SeasonOverview } from './components/SeasonOverview';
import { AddEventModal } from './components/AddEventModal';
import { EventDetailModal } from './components/EventDetailModal';

function App() {
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [dbError,setDbError]=useState(null);
  const [filter,setFilter]=useState("all");
  const [teamFilter,setTeamFilter]=useState("all");
  const [showAdd,setShowAdd]=useState(false);
  const [selectedEvent,setSelectedEvent]=useState(null);
  const [showPast,setShowPast]=useState(false);
  const [showOverview,setShowOverview]=useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const {data,error}=await supabase.from("events").select("*").order("date",{ascending:true});
        if(error) throw error;
        setEvents((data||[]).map(fromDb));
      } catch(err){setDbError(err.message);}
      setLoading(false);
    })();
  },[]);

  const updateEvent=useCallback(async(id,field,value)=>{
    if(field==="notes"){
      setEvents(es=>es.map(e=>e.id===id?{...e,notes:value}:e));
      setSelectedEvent(ev=>ev?.id===id?{...ev,notes:value}:ev);
      return;
    }
    const dbField=field==="philStatus"?"phil_status":field==="georgeStatus"?"george_status":field;
    setEvents(es=>es.map(e=>e.id===id?{...e,[field]:value,[dbField]:value}:e));
    setSelectedEvent(ev=>ev?.id===id?{...ev,[field]:value,[dbField]:value}:ev);
    await supabase.from("events").update({[dbField]:value}).eq("id",id);
  },[]);

  const addEvent=useCallback(async(ev)=>{
    const toInsert={title:ev.title,team:ev.team,date:ev.date,time:ev.time,venue:ev.venue,section:ev.section||"",notes:ev.notes||"",phil_status:null,george_status:null,assignee:"Phil"};
    const {data,error}=await supabase.from("events").insert([toInsert]).select();
    if(!error&&data) setEvents(es=>[...es,...data.map(fromDb)]);
    setShowAdd(false);
  },[]);

  const deleteEvent=useCallback(async(id)=>{
    setEvents(es=>es.filter(e=>e.id!==id));
    await supabase.from("events").delete().eq("id",id);
  },[]);

  const today=new Date(); today.setHours(0,0,0,0);
  const upcoming=events.filter(e=>new Date(e.date+"T12:00:00")>=today);
  const past=events.filter(e=>new Date(e.date+"T12:00:00")<today);

  const filteredUpcoming=upcoming
    .filter(e=>filter==="all"||getEventStatus(e)===filter)
    .filter(e=>teamFilter==="all"||e.team===teamFilter)
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const filteredPast=past
    .filter(e=>filter==="all"||getEventStatus(e)===filter)
    .filter(e=>teamFilter==="all"||e.team===teamFilter)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));

  const upcomingByMonth=groupByMonth(filteredUpcoming);
  const pastByMonth=groupByMonth(filteredPast);

  if(loading) return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"}}>
      <div style={{fontSize:"48px"}}>🎟</div>
      <div style={{color:"#888",fontFamily:"'Bebas Neue',cursive",fontSize:"24px",letterSpacing:"0.1em"}}>Loading Tickets...</div>
    </div>
  );

  if(dbError) return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"12px",padding:"24px"}}>
      <div style={{fontSize:"40px"}}>⚠️</div>
      <div style={{color:"#ef4444",fontFamily:"'Bebas Neue',cursive",fontSize:"24px"}}>Database Error</div>
      <div style={{color:"#555",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",textAlign:"center",maxWidth:"320px"}}>{dbError}</div>
    </div>
  );

  // Bottom nav tabs
  const navTabs = [
    {key:"all",   label:"All",   emoji:"🎟"},
    {key:"cubs",  label:"Cubs",  emoji:"⚾"},
    {key:"bears", label:"Bears", emoji:"🏈"},
    {key:"other", label:"Other", emoji:"🎵"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",maxWidth:"480px",margin:"0 auto",position:"relative"}}>

      {/* Header + status filters — all sticky together */}
      <div style={{background:"#0a0a0f",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(12px)",borderBottom:"1px solid #1a1a2e"}}>
        <div style={{padding:"16px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h1 style={{margin:0,fontFamily:"'Bebas Neue',cursive",fontSize:"28px",color:"#f0f0f8",letterSpacing:"0.05em",lineHeight:1}}>Phil & George Tickets</h1>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <button onClick={()=>setShowOverview(true)} style={{width:"36px",height:"36px",borderRadius:"8px",background:"#13131f",border:"1px solid #252535",color:"#888",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>📅</button>
            <button onClick={()=>setShowAdd(true)} style={{width:"36px",height:"36px",borderRadius:"8px",background:"linear-gradient(135deg,#CC3433,#0E3386)",border:"none",color:"#fff",fontSize:"20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px #CC343344"}}>+</button>
          </div>
        </div>
        {/* Status filter bar — permanent, no scroll */}
        <div style={{display:"flex",borderTop:"1px solid #1a1a2e"}}>
          {[["all","All","#aaa"],["together","Together","#22c55e"],["undecided","Undecided","#aaa"],["sell","Sell","#ef4444"]].map(([key,label,color])=>(
            <button key={key} onClick={()=>setFilter(key)} style={{flex:1,padding:"10px 4px",background:"none",border:"none",borderBottom:filter===key?`2px solid ${color}`:"2px solid transparent",color:filter===key?color:"#555",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:filter===key?700:500,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{padding:"4px 12px 160px"}}>
        {/* Upcoming */}
        {filteredUpcoming.length===0?(
          <div style={{textAlign:"center",padding:"48px 20px",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontSize:"36px",marginBottom:"10px"}}>🎟</div>
            <div style={{fontSize:"15px",fontWeight:600,color:"#555"}}>No upcoming events</div>
          </div>
        ):Object.entries(upcomingByMonth).map(([month,evs])=>(
          <div key={month}>
            <MonthHeader month={month}/>
            {evs.map(ev=><EventCard key={ev.id} event={ev} onUpdate={updateEvent} onClick={setSelectedEvent}/>)}
          </div>
        ))}

        {/* Past toggle */}
        <div style={{borderTop:"1px solid #1a1a2e",marginTop:"8px"}}>
          <button
            onClick={()=>setShowPast(p=>!p)}
            style={{width:"100%",padding:"14px",background:"none",border:"none",color:"#444",fontFamily:"'Courier Prime',monospace",fontSize:"11px",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}
          >
            <span style={{flex:1,height:"1px",background:"#1e1e32"}}/>
            <span>{showPast?"▲":"▼"} Past Events ({past.length})</span>
            <span style={{flex:1,height:"1px",background:"#1e1e32"}}/>
          </button>
          {showPast&&(
            filteredPast.length===0
              ? <div style={{textAlign:"center",padding:"24px",color:"#444",fontFamily:"'DM Sans',sans-serif",fontSize:"13px"}}>No past events</div>
              : Object.entries(pastByMonth).map(([month,evs])=>(
                <div key={month}>
                  <MonthHeader month={month}/>
                  {evs.map(ev=><EventCard key={ev.id} event={ev} onUpdate={updateEvent} onClick={setSelectedEvent}/>)}
                </div>
              ))
          )}
        </div>
      </div>

      {/* Bottom nav bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",background:"#0d0d18",borderTop:"1px solid #1e1e32",display:"flex",zIndex:20,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {navTabs.map(tab=>{
          const isActive = teamFilter===tab.key;
          const accentColor = tab.key==="cubs"?"#CC3433":tab.key==="bears"?"#F26522":tab.key==="other"?"#a78bfa":"#888";
          return (
            <button
              key={tab.key}
              onClick={()=>setTeamFilter(tab.key)}
              style={{flex:1,padding:"10px 4px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",borderTop:isActive?`2px solid ${accentColor}`:"2px solid transparent",transition:"all 0.15s"}}
            >
              <span style={{fontSize:"22px",lineHeight:1}}>{tab.emoji}</span>
              <span style={{fontSize:"10px",fontWeight:isActive?700:500,color:isActive?accentColor:"#444",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.03em"}}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {showOverview&&<SeasonOverview onClose={()=>setShowOverview(false)}/>}
      {showAdd&&<AddEventModal onAdd={addEvent} onClose={()=>setShowAdd(false)}/>}
      {selectedEvent&&<EventDetailModal event={selectedEvent} onClose={()=>setSelectedEvent(null)} onUpdate={updateEvent} onDelete={deleteEvent}/>}
    </div>
  );
}

export default App;
