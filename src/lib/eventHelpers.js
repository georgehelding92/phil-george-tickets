export function fromDb(row) {
  return { ...row, philStatus: row.phil_status, georgeStatus: row.george_status };
}

export function getEventStatus(ev) {
  const p = ev.philStatus ?? ev.phil_status;
  const g = ev.georgeStatus ?? ev.george_status;
  if (p==="in" && g==="in")   return "together";
  if (p==="in" && g==="out")  return "phil-needs-plus";
  if (p==="out" && g==="in")  return "george-needs-plus";
  if (p==="out" && g==="out") return "sell";
  return "undecided";
}

export const STATUS_CONFIG = {
  together:            { label:"Going Together", color:"#22c55e", bg:"#052e16" },
  "phil-needs-plus":   { label:"Phil + Guest",   color:"#f59e0b", bg:"#2d1a00" },
  "george-needs-plus": { label:"George + Guest", color:"#f59e0b", bg:"#2d1a00" },
  sell:                { label:"Needs Settling",  color:"#ef4444", bg:"#2d0a0a" },
  undecided:           { label:"Needs Decision",  color:"#888",    bg:"#1a1a2e" },
};

export const SETTLED_DISPOSITIONS = ["Sold", "Exchanged", "Gave Away"];

export const TEAM_CONFIG = {
  cubs:  { emoji:"⚾", accent:"#CC3433", secondAccent:"#0E3386", label:"Cubs",  venue:"Wrigley Field",  section:"Sec 111, Row 11, Seats 7 & 8" },
  bears: { emoji:"🏈", accent:"#F26522", secondAccent:"#0B1C3F", label:"Bears", venue:"Soldier Field",  section:"Sec 330, Row 14, Seats 14-15" },
  other: { emoji:"🎵", accent:"#a78bfa", secondAccent:"#4c1d95", label:"Other", venue:"",               section:"" },
};

export function daysUntil(ds) {
  const todayStr = new Date().toLocaleDateString("en-CA");
  if (ds === todayStr) return "TODAY";
  const today = new Date(todayStr);
  const d = new Date(ds);
  const diff = Math.round((d - today) / 864e5);
  if (diff < 0) return "Past";
  if (diff === 1) return "Tomorrow";
  return `${diff}d`;
}

export function formatDate(ds) {
  return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
}
export function formatDateLong(ds) {
  return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
}
export function formatMonth(ds) {
  return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{month:"long",year:"numeric"});
}

export function groupByMonth(events) {
  const groups = {};
  events.forEach(ev => {
    const m = formatMonth(ev.date);
    if (!groups[m]) groups[m] = [];
    groups[m].push(ev);
  });
  return groups;
}
