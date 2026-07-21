lucide.createIcons();
const $ = s => document.querySelector(s); const $$ = s => [...document.querySelectorAll(s)];
const toast = $('#toast'); let remaining = 4; let playing = false; let timer;
function note(message){ toast.querySelector('span').textContent=message; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2800); }
function updateCount(){ $('#issueCount').textContent=remaining; }
function selectFinding(row){ $$('.ledger-row').forEach(r=>r.classList.remove('selected')); row.classList.add('selected'); $('.inspect-head h2').textContent=row.dataset.name; $('.finding b').textContent=row.dataset.type; $('.scrub-label').textContent=`FRAME ANALYSIS · ${row.querySelector('.timecode').textContent}`; }
$$('.ledger-row').forEach(row=>row.addEventListener('click',()=>selectFinding(row)));
$$('.marker').forEach(marker=>marker.addEventListener('click',()=>note(`${marker.dataset.risk} selected on the timeline.`)));
$('.approve').addEventListener('click',()=>{ if(remaining>0) remaining--; updateCount(); $('.approve').innerHTML='<i data-lucide="check"></i> Tracked blur applied'; $('.approve').style.background='#a7cc5b'; $('.approve').disabled=true; lucide.createIcons(); note('Tracked blur applied. The original pixels remain in your vault.'); });
$('.ignore').addEventListener('click',()=>note('Marked intentionally visible. Veil will include this decision in the receipt.'));
$('#play').addEventListener('click',()=>{ playing=!playing; $('#play').innerHTML=playing?'<i data-lucide="pause"></i>':'<i data-lucide="play"></i>'; lucide.createIcons(); if(playing){let pos=43;timer=setInterval(()=>{pos=(pos+.6)%100;$('#playhead').style.left=pos+'%';$('#time').textContent=`00:${String(Math.floor(pos*.42)).padStart(2,'0')}.${Math.floor(pos*10)%10}`},120)}else clearInterval(timer);});
$('#openReceipt').addEventListener('click',()=>{ $('#receipt').classList.add('open');$('#receipt').setAttribute('aria-hidden','false'); }); $('.modal-close').addEventListener('click',()=>$('#receipt').classList.remove('open')); $('#receipt').addEventListener('click',e=>{if(e.target===$('#receipt'))$('#receipt').classList.remove('open')});
$('.export').addEventListener('click',()=>{const blob=new Blob(['VEIL REVIEW RECEIPT\nStatus: Safe to share\nReviewed findings: 4\nTracked transformations: 1'],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='veil-review-receipt.txt';a.click();URL.revokeObjectURL(a.href);note('Signed review receipt exported.');});
$('.new-scan').addEventListener('click',()=>note('Drop a recording here to start a privacy pre-flight.')); $('.review-all').addEventListener('click',()=>document.querySelector('.risk-list').scrollIntoView({behavior:'smooth'}));
$$('.nav').forEach(n=>n.addEventListener('click',()=>{$$('.nav').forEach(x=>x.classList.remove('active'));n.classList.add('active');note(`${n.textContent.trim()} opened.`)}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#receipt').classList.remove('open')});

const videoInput = $('#videoInput'); const userVideo = $('#userVideo'); const canvas = $('#frameCanvas');
function formatTime(seconds){ return `00:${String(Math.floor(seconds)).padStart(2,'0')}.${Math.floor((seconds%1)*10)}`; }
function waitFor(video, event){ return new Promise(resolve => video.addEventListener(event, resolve, {once:true})); }
function addRealFinding(label, kind, severity){
  const icons = { 'API key':'key-round', 'Email address':'at-sign', 'Phone number':'phone', 'Customer PII':'contact' };
  const color = severity === 'CRITICAL' ? 'red' : 'orange';
  const row = document.createElement('button'); row.className='ledger-row'; row.dataset.name=label; row.dataset.type=kind;
  row.innerHTML=`<span class="timecode">${formatTime(userVideo.currentTime)}</span><span class="risk-icon ${color}"><i data-lucide="${icons[kind]||'scan-search'}"></i></span><span><b>${label}</b><small>${kind} · local OCR match</small></span><span class="tag ${severity==='CRITICAL'?'critical':'high-tag'}">${severity}</span><i data-lucide="chevron-right"></i>`;
  row.addEventListener('click',()=>selectFinding(row)); $('#ledger').prepend(row); lucide.createIcons();
}
async function scanUploadedVideo(){
  if(!window.Tesseract){ note('OCR library could not load. Check your connection and try again.'); return; }
  const overlay=$('#analysisOverlay'), bar=$('#analysisBar'), title=$('#analysisTitle'), detail=$('#analysisDetail');
  overlay.classList.add('show'); $('.new-scan').classList.add('scanning'); $('.new-scan').disabled=true; $('#scanState').textContent='ANALYZING';
  const sampleTimes=[.1,.3,.5,.7,.9].map(f=>Math.max(.05,userVideo.duration*f)); const matches=new Set();
  try{
    for(let i=0;i<sampleTimes.length;i++){
      title.textContent=`Reading frame ${i+1} of ${sampleTimes.length} locally`; detail.textContent='OCR extracts visible text. Frames are never uploaded.'; bar.style.width=`${(i/sampleTimes.length)*88+8}%`;
      userVideo.currentTime=sampleTimes[i]; await waitFor(userVideo,'seeked');
      canvas.width=userVideo.videoWidth; canvas.height=userVideo.videoHeight; canvas.getContext('2d').drawImage(userVideo,0,0);
      const result=await Tesseract.recognize(canvas,'eng',{logger:m=>{if(m.status==='recognizing text') detail.textContent=`Reading visible text · ${Math.round(m.progress*100)}%`;}});
      const text=result.data.text;
      if(/(?:sk_live|sk_test|AKIA|ghp_|AIza)[A-Za-z0-9_\-]{8,}/.test(text)) matches.add('API key');
      if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) matches.add('Email address');
      if(/(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{3}\)?[ .-]?)\d{3}[ .-]?\d{4}/.test(text)) matches.add('Phone number');
    }
    overlay.classList.remove('show'); $('#scanState').textContent='SCAN COMPLETE'; bar.style.width='100%';
    if(matches.size){ matches.forEach(kind=>addRealFinding(`OCR detected ${kind}`,kind,kind==='API key'?'CRITICAL':'HIGH')); remaining+=matches.size; updateCount(); note(`${matches.size} real text risk${matches.size>1?'s':''} detected from sampled frames.`); }
    else note('Scan complete. No known credential, email, or phone patterns found in sampled frames.');
  }catch(error){ overlay.classList.remove('show'); $('#scanState').textContent='SCAN PAUSED'; note('Scan paused. Try a shorter recording or a clearer frame.'); console.error(error); }
  finally{ $('.new-scan').classList.remove('scanning'); $('.new-scan').disabled=false; }
}
videoInput.addEventListener('change',async event=>{
  const file=event.target.files[0]; if(!file) return; if(!file.type.startsWith('video/')){note('Choose a video file to start a pre-flight.');return;}
  $('#fileName').textContent=file.name; userVideo.src=URL.createObjectURL(file); $('.screen').classList.add('has-upload'); $('.fake-browser').style.display='none'; await waitFor(userVideo,'loadedmetadata'); $('#duration').textContent=formatTime(userVideo.duration); note('Video loaded locally. Starting frame analysis.'); scanUploadedVideo();
});
$('.new-scan').addEventListener('click',()=>videoInput.click());
