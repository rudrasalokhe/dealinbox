async function streamToTextarea(url, textareaId){
  const target = document.getElementById(textareaId);
  if(!target) return;
  target.value = '';
  const res = await fetch(url, {method:'POST'});
  if(res.status === 402){ alert('Feature limit reached. Please upgrade.'); return; }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while(true){
    const {done, value} = await reader.read();
    if(done) break;
    buf += decoder.decode(value, {stream:true});
    const events = buf.split('\n\n');
    buf = events.pop();
    for(const evt of events){
      if(!evt.startsWith('data:')) continue;
      const data = evt.slice(5).trim();
      if(data === '[DONE]') return;
      try{ const parsed = JSON.parse(data); target.value += parsed.chunk || ''; }catch(e){}
    }
  }
}
function generatePitch(id){ streamToTextarea(`/api/crm/brands/${id}/generate-pitch?tone=formal`, 'pitch-output'); }
function generateBrief(id){ streamToTextarea(`/api/crm/influencers/${id}/generate-brief`, 'brief-output'); }

(async function(){
  const suggest = document.getElementById('smartFollowups');
  if(suggest){
    const rows = await fetch('/api/crm/smart-followups').then(r=>r.json()).catch(()=>[]);
    suggest.innerHTML = rows.length ? `💡 ${rows.length} brands worth pinging today` : '💡 No urgent follow-ups today';
  }
  const b = document.getElementById('discover-brands');
  if(b){
    const rows = await fetch('/api/crm/brands/discover').then(r=>r.json()).catch(()=>[]);
    b.innerHTML = rows.map(r=>`<div class="crm-timeline-item"><b>${r.industry}</b><small>${r.budget_range} · ${r.created_at}</small></div>`).join('') || '<small style="color:var(--t3)">No active demand signals.</small>';
  }
  const c = document.getElementById('discover-creators');
  if(c){
    const rows = await fetch('/api/crm/influencers/discover').then(r=>r.json()).catch(()=>[]);
    c.innerHTML = rows.map(r=>`<a class="crm-timeline-item" href="/crm/influencers/new?creator_name=${encodeURIComponent(r.name||'')}&username=${encodeURIComponent(r.username||'')}&niche=${encodeURIComponent(r.niche||'')}"><b>${r.name}</b><small>${r.niche} · ${r.engagement}% · ₹${r.base_rate}</small></a>`).join('') || '<small style="color:var(--t3)">No creator matches yet.</small>';
  }
})();
