import { STATUS_CONFIG } from '../lib/eventHelpers';

export function StatusPill({status}) {
  const c = STATUS_CONFIG[status];
  return <span style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:c.color,background:c.bg,border:`1px solid ${c.color}44`,borderRadius:"4px",padding:"3px 10px",whiteSpace:"nowrap"}}>{c.label}</span>;
}
