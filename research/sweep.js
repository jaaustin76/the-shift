const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  await pg.goto('file:///home/claude/the_shift.html');
  await pg.waitForTimeout(400);

  const res = await pg.evaluate(() => {
    const {startRun, step, C} = window.__sim;
    const out = [];
    function run(smart){
      startRun(); const S = window.__sim.S; S.running = true;
      let g = 0;
      while (S.running && g < 20000) {
        if (smart) {
          if (g % 15 === 0) {
            const urg = S.lanes.map((L,i)=>{
              if (S.t < L.gapUntil) return -1;
              const nxt = L.departs.length ? L.departs[0] : 1e9;
              return L.count + ((nxt - S.t) < 25 ? 40 : 0);
            });
            const order = urg.map((u,i)=>[u,i]).sort((a,b)=>b[0]-a[0]);
            let left = C.WORKER_COUNT; S.lanes.forEach(L=>L.workers=0);
            for (const [u,i] of order){ if(u<0||left<=0) continue;
              const t = Math.min(C.MAX_WORKERS_PER_LANE,left); S.lanes[i].workers=t; left-=t; }
            S.freeWorkers = left;
          }
          if (S.jam){ S.jam=null; S.excCleared++; }
          if (S.noread){ S.noread.noread=false; S.noread=null; S.excCleared++; }
        }
        step(1/60); g++;
      }
      return { shipped:S.shipped, halted:+S.halted.toFixed(0) };
    }
    for (const un of [9,6,4.5,3.5,3,2.5]){
      for (const cap of [6,8]){
        C.LOAD_INTERVAL_UNSTAFFED = un; C.CHUTE_CAPACITY = cap;
        // average 3 runs each to smooth randomness
        let p=0,ph=0,s=0;
        for(let k=0;k<3;k++){ const a=run(false); p+=a.shipped; ph+=a.halted; }
        for(let k=0;k<3;k++){ const a=run(true);  s+=a.shipped; }
        out.push({un, cap, passive:Math.round(p/3), halt:Math.round(ph/3), smart:Math.round(s/3),
                  gain: Math.round(100*((s/3)-(p/3))/(p/3))});
      }
    }
    return out;
  });
  console.log('UNSTAFF  CHUTE  PASSIVE  HALT   SKILLED  GAIN');
  for(const r of res)
    console.log(String(r.un).padStart(6), String(r.cap).padStart(6), String(r.passive).padStart(8),
                String(r.halt+'s').padStart(6), String(r.smart).padStart(8), ('+'+r.gain+'%').padStart(7));
  await b.close();
})();
