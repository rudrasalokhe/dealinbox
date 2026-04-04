async function loadDiscover(ai=false){
  const niche = document.getElementById('discover-niche')?.value || '';
  const eng = document.getElementById('discover-eng')?.value || 0;
  const rate = document.getElementById('discover-rate')?.value || 100000;
  const grid = document.getElementById('discover-grid');
  if(!grid) return;
  const rows = await fetch(`/api/brand/discover?niche=${encodeURIComponent(niche)}&min_engagement=${eng}&max_rate=${rate}`).then(r=>r.json()).catch(()=>[]);
  const top = ai ? rows.slice(0,5) : rows;
  grid.innerHTML = top.map(r => `<article class='brand-card discovery-card'><div class='brand-top'><div class='brand-avatar'>${(r.name||'C')[0]}</div><div><b>${r.name||''}</b><small>@${r.username||''}</small></div><span class='pill'>${r.tier||''}</span></div><div class='brand-stats'><div><b>${r.instagram_followers||0}</b><small>IG</small></div><div><b>${r.engagement||0}%</b><small>Eng</small></div><div><b>${r.youtube_subscribers||0}</b><small>YT</small></div><div><b>₹${r.base_rate_reel||0}</b><small>Reel</small></div></div><div class='tag-row'>${(r.notable_brands||[]).slice(0,3).map(t=>`<span>${t}</span>`).join('')}</div><div style='display:flex;gap:6px;margin-top:10px'><button class='btn btn-sm' onclick='addToCRM("${r.username||''}","${r.name||''}","${r.niche||''}")'>+ Add to CRM</button><a class='btn btn-sm' href='/brand/briefs/new?creator_username=${r.username||''}'>Send Brief →</a><button class='btn btn-sm' onclick='openSlide(${JSON.stringify(r).replace(/"/g,'&quot;')})'>View Profile</button></div>${ai?"<span class='pill' style='margin-top:8px;background:var(--blue-dim);color:var(--blue)'>AI Pick ✦</span>":''}</article>`).join('') || '<div class="card" style="padding:12px">No creators found.</div>';
}
function openSlide(raw){
  const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const panel = document.getElementById('profile-panel');
  const overlay = document.getElementById('profile-overlay');
  if(!panel || !overlay) return;
  panel.innerHTML = `<h2>${p.name||''}</h2><p style='color:var(--t2)'>@${p.username||''} · ${p.niche||''} · ${p.location||''}</p><div class='crm-stat-pills'><div class='crm-stat-pill'><b>${p.instagram_followers||0}</b><span>Followers</span></div><div class='crm-stat-pill'><b>${p.engagement||0}%</b><span>Engagement</span></div><div class='crm-stat-pill'><b>₹${p.base_rate_reel||0}</b><span>Reel Rate</span></div></div><div style='display:flex;gap:8px;margin-top:10px'><a class='btn btn-sm' href='/brand/briefs/new?creator_username=${p.username||''}'>Send Brief</a><button class='btn btn-sm' onclick='addToCRM("${p.username||''}","${p.name||''}","${p.niche||''}")'>Add to CRM</button></div>`;
  overlay.style.display='block'; panel.style.right='0';
}
function closeSlide(){ const panel=document.getElementById('profile-panel'); const overlay=document.getElementById('profile-overlay'); if(panel) panel.style.right='-500px'; if(overlay) overlay.style.display='none'; }
function addToCRM(username,name,niche){ window.location.href = `/crm/influencers/new?username=${encodeURIComponent(username)}&creator_name=${encodeURIComponent(name)}&niche=${encodeURIComponent(niche)}`; }

async function runMatch(){
  const brief = document.getElementById('match-brief')?.value || '';
  if(!brief) return;
  const progress = document.getElementById('match-progress');
  const results = document.getElementById('match-results');
  progress.innerHTML=''; results.innerHTML='';
  const res = await fetch('/api/brand/match', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({brief_text: brief})});
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf='';
  while(true){ const {done,value}=await reader.read(); if(done) break; buf += dec.decode(value,{stream:true}); const parts=buf.split('\n\n'); buf=parts.pop(); for(const p of parts){ if(!p.startsWith('data:')) continue; const d = p.slice(5).trim(); if(d==='[DONE]') return; try{ const obj=JSON.parse(d); if(obj.type==='progress'){ progress.innerHTML += `<div>✅ ${obj.message}</div>`; } if(obj.type==='results'){ results.innerHTML = (obj.items||[]).map(i=>`<article class='brand-card'><div class='brand-top'><b>${i.name}</b><span class='pill'>${i.fit_score}% fit</span></div><small>${i.reason}</small><div class='brand-stats'><div><b>${i.followers}</b><small>followers</small></div><div><b>${i.engagement}%</b><small>eng</small></div><div><b>₹${i.rate}</b><small>rate</small></div></div></article>`).join(''); } }catch(e){} } }
}

document.addEventListener('DOMContentLoaded', ()=>{ if(document.getElementById('discover-grid')) loadDiscover(); });
