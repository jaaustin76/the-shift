const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const {startRun, step, C} = window.__sim;
    function run(smart){
      // endShift() settles morale, so a long benchmark quietly starves itself of
      // crew. Start each run from a clean, fully-staffed career via the
      // storage-free reset hook, or later iterations measure understaffing
      // instead of the thing under test. See THE TESTING TRAP in CLAUDE.md.
      window.__sim.resetCareer();
      startRun(); const S = window.__sim.S; S.running = true;
      let g=0;
      while(S.running && g<20000){
        if(smart){
          if(g%60===0){
            const urg=S.lanes.map((L,i)=>{ if(S.t<L.gapUntil) return -1;
              const n=L.departs.length?L.departs[0]:1e9; return L.count+((n-S.t)<25?40:0); });
            const ord=urg.map((u,i)=>[u,i]).sort((a,b)=>b[0]-a[0]);
            const order=ord.filter(([u])=>u>=0).map(([u,i])=>i);
            let commit=true;
            if(S._last){ const cur=S._last[0], top=order[0];
              if(cur!==top) commit = (S.lanes[top].count - S.lanes[cur].count) >= 4; }
            if(commit){ window.__sim.setAlloc(order); S._last=order; }
          }
          if(S.jam){S.jam=null;S.excCleared++;}
          if(S.noread){S.noread.noread=false;S.noread=null;S.excCleared++;}
        }
        step(1/60); g++;
      }
      return {s:S.shipped, h:S.halted, sp:S.spawned, rc:S.recirculated, dp:S.dumped};
    }
    const P=[],M=[];
    for(let i=0;i<7;i++) P.push(run(false));
    for(let i=0;i<7;i++) M.push(run(true));
    const avg=a=>Math.round(a.reduce((x,y)=>x+y,0)/a.length);
    return {
      pShip:avg(P.map(x=>x.s)), pHalt:avg(P.map(x=>x.h)), pRc:avg(P.map(x=>x.rc)), pDp:avg(P.map(x=>x.dp)),
      mShip:avg(M.map(x=>x.s)), mHalt:avg(M.map(x=>x.h)), mIn:avg(M.map(x=>x.sp)),
      pMin:Math.min(...P.map(x=>x.s)), pMax:Math.max(...P.map(x=>x.s)),
      mMin:Math.min(...M.map(x=>x.s)), mMax:Math.max(...M.map(x=>x.s)),
    };
  });
  console.log('errors:', errs.length?errs:'none');
  console.log(`PASSIVE  avg ${r.pShip} shipped (range ${r.pMin}-${r.pMax}) | halted ${r.pHalt}s | recirc ${r.pRc} | dumped ${r.pDp}`);
  console.log(`SKILLED  avg ${r.mShip} shipped (range ${r.mMin}-${r.mMax}) | halted ${r.mHalt}s | inbound ${r.mIn}`);
  console.log(`SKILL GAIN: +${Math.round(100*(r.mShip-r.pShip)/r.pShip)}%`);
  await b.close();
})();
