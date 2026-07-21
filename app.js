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
// Demo playback is initialized after the scene definitions below.
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

// Native fullscreen when available; reliable in-page fallback for local-file previews.
const preview = $('.screen');
const exitPreview = document.createElement('button');
exitPreview.className = 'exit-preview';
exitPreview.setAttribute('aria-label', 'Exit fullscreen preview');
exitPreview.innerHTML = '<i data-lucide="x"></i><span>Exit fullscreen</span>';
preview.appendChild(exitPreview);
function refreshFullscreenControl() {
  const expanded = Boolean(document.fullscreenElement) || preview.classList.contains('fallback-fullscreen');
  $('.expand').querySelector('i').setAttribute('data-lucide', expanded ? 'minimize-2' : 'maximize-2');
  $('.expand').setAttribute('aria-label', expanded ? 'Exit fullscreen preview' : 'Open recording preview in fullscreen');
  lucide.createIcons();
}
async function exitPreviewFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  preview.classList.remove('fallback-fullscreen');
  document.body.classList.remove('preview-open');
  refreshFullscreenControl();
}
$('.expand').addEventListener('click', async () => {
  if (preview.classList.contains('fallback-fullscreen')) { await exitPreviewFullscreen(); return; }
  preview.classList.add('fallback-fullscreen');
  document.body.classList.add('preview-open');
  note('Opened expanded preview. Press Escape or use the close button to exit.');
  refreshFullscreenControl();
});
exitPreview.addEventListener('click', exitPreviewFullscreen);
document.addEventListener('fullscreenchange', refreshFullscreenControl);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && preview.classList.contains('fallback-fullscreen')) exitPreviewFullscreen(); });

// Side navigation follows the review workflow instead of opening dead-end sections.
$$('[data-page]').forEach(item => item.addEventListener('click', () => {
  const destination = { scan: 'header', findings: '.risk-list', receipt: '.proof' }[item.dataset.page];
  if (destination) document.querySelector(destination).scrollIntoView({ behavior: 'smooth', block: 'start' });
}));

// A moving, realistic review scenario: each timeline marker lines up with the risky screen.
const demoBrowser = $('.fake-browser');
const demoScenes = [
  { time: '00:06.2', position: 12, risk: null, label: 'Project overview', html: `<div class="browser-bar"><i></i><i></i><i></i><span>app.mercury.dev/projects</span></div><div class="demo-shell"><div class="demo-nav"><i class="active"></i><i></i><i></i><i></i></div><div class="demo-main"><div class="demo-top"><h4>Projects</h4><span class="demo-chip">3 active</span></div><div class="demo-columns"><div class="demo-block"><b></b><div class="demo-lines"><span></span><span></span><span></span></div></div><div class="demo-block"><b></b><div class="demo-lines"><span></span><span></span></div></div></div><div class="demo-block" style="margin-top:10px"><b></b><div class="demo-lines"><span></span><span></span><span></span></div></div><span class="scene-caption">Normal product screen</span></div></div>` },
  { time: '00:18.4', position: 17, risk: 0, label: 'Developer console · API key visible', html: `<div class="browser-bar"><i></i><i></i><i></i><span>app.mercury.dev/settings/developer</span></div><div class="demo-shell"><div class="demo-nav"><i></i><i></i><i class="active"></i><i></i></div><div class="demo-main"><div class="demo-top"><h4>Developer settings</h4><span class="demo-chip">Production</span></div><div class="console">$ mercury env list<br><span class="warn">warning: secrets are visible in this output</span><br>STRIPE_SECRET_KEY=<span class="secret">sk_live_4e9Kx2Q…</span><br>WEBHOOK_ENDPOINT=/billing/events</div><span class="scene-caption">Finding: credential in console</span></div></div>` },
  { time: '00:25.7', position: 43, risk: 1, label: 'Customer workspace · personal data visible', html: `<div class="browser-bar"><i></i><i></i><i></i><span>app.mercury.dev/customers</span></div><div class="demo-shell"><div class="demo-nav"><i></i><i class="active"></i><i></i><i></i></div><div class="demo-main"><div class="demo-top"><h4>Customer workspace</h4><span class="demo-chip">Account owner</span></div><div class="customer-card"><span class="customer-avatar"></span><div><b class="customer-name">Amara Iqbal</b><small>Northwind Health · Enterprise plan</small></div></div><div class="demo-block" style="margin-top:10px"><b></b><div class="demo-lines"><span></span><span></span><span></span></div></div><span class="scene-caption">Finding: customer PII</span></div></div>` },
  { time: '00:31.2', position: 64, risk: 2, label: 'Slack message · private context visible', html: `<div class="browser-bar"><i></i><i></i><i></i><span>slack.com/client/mercury</span></div><div class="slack-layout"><div class="slack-left"><b>Mercury</b><span># product</span><span># launch</span><span>🔒 nina + sam</span></div><div class="slack-chat"><h4>nina + sam</h4><div class="message"><b>Sam · 10:24 AM</b>Are we still planning to hold the enterprise announcement?</div><div class="message private"><b>Nina · 10:26 AM</b>Yes. Legal asked us not to mention the customer name in the demo.</div></div></div>` }
];
let demoIndex = 0; let demoTimer;
function renderDemoScene(index) {
  const scene = demoScenes[index];
  demoBrowser.classList.add('demo-switch');
  setTimeout(() => {
    demoBrowser.innerHTML = scene.html;
    demoBrowser.classList.remove('demo-switch');
    $('#time').textContent = scene.time;
    $('#playhead').style.left = `${scene.position}%`;
    $('.scrub-label').textContent = `FRAME ANALYSIS · ${scene.time}`;
    $('.screen').classList.toggle('demo-safe', scene.risk === null);
    $$('.marker').forEach((marker, i) => marker.classList.toggle('active', i === scene.risk));
    if (scene.risk !== null) selectFinding($$('.ledger-row')[scene.risk]);
    $('.pin-one span').textContent = scene.risk === 0 ? 'API key' : scene.risk === 2 ? 'Private message' : 'Customer data';
    $('.pin-two').style.opacity = scene.risk === 0 || scene.risk === 2 ? '.3' : '1';
  }, 180);
}
function advanceDemo() { demoIndex = (demoIndex + 1) % demoScenes.length; renderDemoScene(demoIndex); }
function toggleDemoPlayback() {
  playing = !playing;
  $('#play').innerHTML = playing ? '<i data-lucide="pause"></i>' : '<i data-lucide="play"></i>';
  lucide.createIcons();
  clearInterval(demoTimer);
  if (playing) demoTimer = setInterval(advanceDemo, 3600);
}
$('#play').addEventListener('click', toggleDemoPlayback);
renderDemoScene(0);
demoTimer = setInterval(advanceDemo, 3600);
