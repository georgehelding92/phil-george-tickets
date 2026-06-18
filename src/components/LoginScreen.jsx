import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  const sendLink = async () => {
    if (!email || status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    const {error} = await supabase.auth.signInWithOtp({
      email,
      options: {emailRedirectTo: window.location.origin},
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  const inp={width:"100%",background:"#13131f",border:"1px solid #252535",borderRadius:"8px",padding:"12px 14px",color:"#e0e0f0",fontFamily:"'DM Sans',sans-serif",fontSize:"14px",boxSizing:"border-box",outline:"none"};

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",gap:"28px"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:"48px",marginBottom:"8px"}}>🎟</div>
        <h1 style={{margin:0,fontFamily:"'Bebas Neue',cursive",fontSize:"32px",color:"#f0f0f8",letterSpacing:"0.05em"}}>Phil & George Tickets</h1>
      </div>

      {status === "sent" ? (
        <div style={{textAlign:"center",maxWidth:"320px"}}>
          <div style={{fontSize:"32px",marginBottom:"10px"}}>📬</div>
          <div style={{fontSize:"14px",color:"#aaa",fontFamily:"'DM Sans',sans-serif",lineHeight:1.6}}>
            Check your email — we sent a magic link to <strong style={{color:"#f0f0f8"}}>{email}</strong>.
          </div>
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:"320px",display:"flex",flexDirection:"column",gap:"12px"}}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter") sendLink();}}
            style={inp}
          />
          <button
            onClick={sendLink}
            disabled={status==="sending"||!email}
            style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#CC3433,#0E3386)",border:"none",borderRadius:"10px",color:"#fff",fontFamily:"'Bebas Neue',cursive",fontSize:"20px",letterSpacing:"0.08em",cursor:"pointer",opacity:status==="sending"||!email?0.6:1}}
          >
            {status==="sending"?"Sending...":"Send Magic Link"}
          </button>
          {status==="error" && <div style={{color:"#ef4444",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}>{errorMsg}</div>}
        </div>
      )}
    </div>
  );
}
