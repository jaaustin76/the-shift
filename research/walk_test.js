// Does DISTANCE-BASED travel (vs flat) restore the value of anticipation?
// Key ratio: time to cross the floor vs time for a chute to overflow (~10s at peak).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await pg.waitForTimeout(400);
  const out = await pg.evaluate(() => {
    const {startRun, step, setAlloc, commitCrewToException, C} = window.__sim;
    let _s=1; const srand=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
    const real=Math.random; Math.random=srand;
    const emptiest=S=>{let bi=0,bv=1e9;for(let i=0;i<C.LANE_COUNT;i++){
      if(S.t<S.lanes[i].gapUntil)continue; if(S.lanes[i].count<bv){bv=S.lanes[i].count;bi=i;}} return bi;};
    const depIn=(S,i)=>(S.lanes[i].departs.length?S.lanes[i].departs[0]:C.SHIFT_DURATION)-S.t;

    const MODES = {
      static: null,
      // reactive: fullest chute wins, distance ignored
      reactive: (S,i) => S.lanes[i].count,
      // reactive but distance-aware: discount lanes that are far from current crew
      nearest: (S,i) => {
        let best = 999;
        for(const c of S.crew) best = Math.min(best, window.__sim.travelTime(c, i));
        return S.lanes[i].count - best * 0.9;
      },
      // anticipatory: pre-position for the incoming wave and the next departure,
      // accounting for how long it will take to actually get there
      plan: (S,i) => {
        let walk = 999;
        for(const c of S.crew) walk = Math.min(walk, window.__sim.travelTime(c, i));
        const soon = S.nextWave ? S.nextWave.weights[i] : 0.25;
        const now  = S.wave ? S.wave.weights[i] : 0.25;
        const untilNext = S.wave ? Math.max(0, S.wave.until - S.t) : 99;
        // how full will this chute be by the time someone could arrive?
        const projected = S.lanes[i].count + (now * 1.6) * walk;
        const blend = untilNext < walk + 6 ? 0.7 : 0.15;
        const demand = now*(1-blend) + soon*blend;
        return projected * 0.9 + demand * 20 + Math.max(0, 20 - depIn(S,i)) * 1.3;
      },
    };

    function run(mode, react, walkSpeed, seed){
      window.__sim.resetCareer();   // see THE TESTING TRAP in CLAUDE.md
      C.WALK_SPEED = walkSpeed; C.WAVE_ENABLED = true; C.MANIFEST_LEAD = true;
      _s=seed>>>0; startRun();
      const S=window.__sim.S; S.running=true;
      const score=MODES[mode];
      let g=0,nextReact=0,jamSeen=null,nrSeen=null;
      while(S.running && g<20000){
        const t=S.t;
        if(S.jam){ if(jamSeen===null)jamSeen=t;
          if(t-jamSeen>=1.0 && commitCrewToException()){S.jam=null;S.excCleared++;jamSeen=null;} } else jamSeen=null;
        if(S.noread){ if(nrSeen===null)nrSeen=t;
          if(t-nrSeen>=1.0 && commitCrewToException()){S.noread.dest=emptiest(S);
            S.noread.noread=false;S.noread=null;S.excCleared++;nrSeen=null;} } else nrSeen=null;
        if(score && t>=nextReact){
          const o=[]; for(let i=0;i<C.LANE_COUNT;i++){ if(S.t<S.lanes[i].gapUntil)continue; o.push([score(S,i),i]); }
          o.sort((a,b)=>b[0]-a[0]); setAlloc(o.map(x=>x[1])); nextReact=t+react;
        }
        step(1/60); g++;
      }
      return S.shipped;
    }
    const SEEDS=16, res=[];
    // DROP_X spans 148..358 => 210 logical px across the floor
    for(const ws of [0, 210, 70, 35, 21, 14, 10]){
      const cross = ws===0 ? 0 : 210/ws;
      const row = {ws, cross:+cross.toFixed(1)};
      for(const m of Object.keys(MODES)){
        let best=0;
        for(const react of [0.5,1.5,3.0]){
          let sum=0; for(let s=0;s<SEEDS;s++) sum+=run(m,react,ws,1000+s*7919);
          best=Math.max(best,sum/SEEDS);
          if(m==='static') break;
        }
        row[m]=Math.round(best);
      }
      res.push(row);
    }
    Math.random=real; C.WALK_SPEED=0; C.WAVE_ENABLED=false;
    return res;
  });
  console.log('errors:', errs.length?errs:'none');
  console.log('\nchute overflows in ~10s at peak. compare that to cross-floor walk time.\n');
  console.log('CROSS-FLOOR  STATIC  REACTIVE  NEAREST  PLANNING   planning worth');
  for(const r of out){
    const w = r.plan - Math.max(r.reactive, r.nearest);
    console.log(
      String(r.cross===0?'off':r.cross+'s').padStart(11),
      String(r.static).padStart(7), String(r.reactive).padStart(9),
      String(r.nearest).padStart(8), String(r.plan).padStart(9),
      ('   '+(w>=0?'+':'')+w+' ('+(100*w/Math.max(r.reactive,r.nearest)).toFixed(1)+'%)').padStart(17));
  }
  require('fs').writeFileSync(path.join(__dirname, 'walk_results.json'), JSON.stringify(out,null,1));
  await b.close();
})();
