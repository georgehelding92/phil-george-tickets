export function MonthHeader({month}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",margin:"16px 0 8px",padding:"0 2px"}}>
      <div style={{flex:1,height:"1px",background:"#1e1e32"}}/>
      <span style={{fontSize:"11px",fontWeight:700,color:"#555",fontFamily:"'Courier Prime',monospace",letterSpacing:"0.12em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{month}</span>
      <div style={{flex:1,height:"1px",background:"#1e1e32"}}/>
    </div>
  );
}
