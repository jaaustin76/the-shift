// Walking punishes thrashing. Does "commitment" (only move when the gain clearly
// beats the walk) become a real skill the old game didn't have?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file:///home/claude/the_shift.html');
  await pg.waitForTimeout(400);
  const out = await pg.evaluate(() => {
    const {startRun, step, setAlloc, commitCrewToException, C} = window.__sim;
    let _s=1; const srand=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
    const real=Math.random; Math.random=srand;
    const emptiest=S=>{let bi=0,bv=1e9;for(let i=0;i<C.LANE_COUNT;i++){
      if(S.t<S.lanes[i].gapUntil)continue; if(S.lanes[i].count<bv){bv=S.lanes[i].count;bi=i;}} return bi;};

    function run(react, hyst, walkSpeed, seed){
      C.WALK_SPEED = walkSpeed;
      _s=seed>>>0; startRun();
      const S=window.__sim.S; S.running=true;
      let g=0,nextReact=0,jamSeen=null,nrSeen=null,lastOrder=null,moves=0;
      while(S.running && g<20000){
        const t=S.t;
        if(S.jam){ if(jamSeen===null)jamSeen=t;
          if(t-jamSeen>=1.0 && commitCrewToException()){S.jam=null;S.excCleared++;jamSeen=null;} } else jamSeen=null;
        if(S.noread){ if(nrSeen===null)nrSeen=t;
          if(t-nrSeen>=1.0 && commitCrewToException()){S.noread.dest=emptiest(S);
            S.noread.noread=false;S.noread=null;S.excCleared++;nrSeen=null;} } else nrSeen=null;
        if(t>=nextReact){
          const o=[]; for(let i=0;i<C.LANE_COUNT;i++){ if(S.t<S.lanes[i].gapUntil)continue;
            o.push([S.lanes[i].count,i]); }
          o.sort((a,b)=>b[0]-a[0]);
          const order=o.map(x=>x[1]);
          // hysteresis: only reshuffle if the top lane is clearly worse off than
          // where our crew already are — otherwise stay put and keep loading
          let commit = true;
          if(hyst > 0 && lastOrder){
            const cur = lastOrder[0], top = order[0];
            if(cur !== top){
              const gain = S.lanes[top].count - S.lanes[cur].count;
              commit = gain >= hyst;
            }
          }
          if(commit){ const before=S.crew.map(c=>c.lane); setAlloc(order);
            S.crew.forEach((c,k)=>{ if(c.lane!==before[k]) moves++; }); lastOrder = order; }
          nextReact=t+react;
        }
        step(1/60); g++;
      }
      return {shipped:S.shipped, moves};
    }
    const SEEDS=16, res=[];
    for(const ws of [0, 70, 35, 21]){
      const row={cross: ws===0?0:+(210/ws).toFixed(1)};
      for(const [label,react,hyst] of [['thrash',0.25,0],['steady',1.5,0],['commit',1.0,2],['patient',1.0,4]]){
        let sh=0,mv=0;
        for(let s=0;s<SEEDS;s++){ const r=run(react,hyst,ws,1000+s*7919); sh+=r.shipped; mv+=r.moves; }
        row[label]=Math.round(sh/SEEDS); row[label+'_mv']=Math.round(mv/SEEDS);
      }
      res.push(row);
    }
    Math.random=real; C.WALK_SPEED=35;
    return res;
  });
  console.log('errors:', errs.length?errs:'none');
  console.log('\nCROSS-FLOOR   THRASH(moves)  STEADY(moves)  COMMIT(moves)  PATIENT(moves)   best');
  for(const r of out){
    const opts=[['thrash',r.thrash],['steady',r.steady],['commit',r.commit],['patient',r.patient]];
    const best=opts.sort((a,b)=>b[1]-a[1])[0];
    console.log(
      String(r.cross===0?'off':r.cross+'s').padStart(11),
      (r.thrash+' ('+r.thrash_mv+')').padStart(14),
      (r.steady+' ('+r.steady_mv+')').padStart(14),
      (r.commit+' ('+r.commit_mv+')').padStart(14),
      (r.patient+' ('+r.patient_mv+')').padStart(15),
      ('   '+best[0]).padStart(10));
  }
  await b.close();
})();
