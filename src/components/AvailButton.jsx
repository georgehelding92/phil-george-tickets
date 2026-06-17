export function AvailButton({value, active, onClick, label}) {
  const clr = {in:"#22c55e", out:"#ef4444", maybe:"#f59e0b"}[value];
  return (
    <button onClick={onClick} style={{flex:1,padding:"8px 4px",borderRadius:"6px",border:active?`2px solid ${clr}`:"2px solid #252535",background:active?`${clr}18`:"#12121e",color:active?clr:"#666",fontFamily:"'DM Sans',sans-serif",fontWeight:active?700:500,fontSize:"12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",minWidth:0,transition:"all 0.12s"}}>
      <span style={{fontSize:"14px"}}>{value==="in"?"✓":value==="out"?"✗":"~"}</span>
      <span>{label}</span>
    </button>
  );
}
