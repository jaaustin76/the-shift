// Decisive test: do STRUCTURAL choices (what a build phase controls) swing the
// outcome more than in-shift POLICY choices? If so, the depth lives in the build.
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

    function run(seed){                      // always the best known policy: greedy
      _s=seed>>>0; startRun();
      const S=window.__sim.S; S.running=true;
      let g=0,nextReact=0,jamSeen=null,nrSeen=null;
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
          o.sort((a,b)=>b[0]-a[0]); setAlloc(o.map(x=>x[1])); nextReact=t+1.0;
        }
        step(1/60); g++;
      }
      return S.shipped;
    }
    const SEEDS=16;
    const mean=()=>{let s=0;for(let i=0;i<SEEDS;i++)s+=run(1000+i*7919);return Math.round(s/SEEDS);};

    const base={CHUTE_CAPACITY:C.CHUTE_CAPACITY, LINE_CAPACITY:C.LINE_CAPACITY,
      WORKER_COUNT:C.WORKER_COUNT, LOAD_INTERVAL_STAFFED:C.LOAD_INTERVAL_STAFFED,
      DOCK_GAP_DURATION:C.DOCK_GAP_DURATION, MAX_WORKERS_PER_LANE:C.MAX_WORKERS_PER_LANE};
    const reset=()=>Object.assign(C,base);

    const res=[];
    reset(); res.push({name:'BASELINE (current layout)', v:mean()});
    // things a build phase would let you buy / arrange
    reset(); C.CHUTE_CAPACITY=12;              res.push({name:'deeper chutes (6→12)', v:mean()});
    reset(); C.CHUTE_CAPACITY=3;               res.push({name:'shallow chutes (6→3)', v:mean()});
    reset(); C.LINE_CAPACITY=24;               res.push({name:'longer belt (12→24)', v:mean()});
    reset(); C.LINE_CAPACITY=7;                res.push({name:'shorter belt (12→7)', v:mean()});
    reset(); C.WORKER_COUNT=4;                 res.push({name:'hire a 4th associate', v:mean()});
    reset(); C.WORKER_COUNT=2;                 res.push({name:'down to 2 associates', v:mean()});
    reset(); C.LOAD_INTERVAL_STAFFED=0.9;      res.push({name:'powered loader (1.4→0.9s)', v:mean()});
    reset(); C.DOCK_GAP_DURATION=8;            res.push({name:'2nd dock door (gap 18→8s)', v:mean()});
    reset(); C.MAX_WORKERS_PER_LANE=3;         res.push({name:'wider chute (2→3 crew)', v:mean()});
    reset(); C.CHUTE_CAPACITY=12; C.DOCK_GAP_DURATION=8;
                                               res.push({name:'deep chutes + 2nd door', v:mean()});
    reset();
    Math.random=real;
    return res;
  });
  console.log('errors:', errs.length?errs:'none');
  const base=out[0].v;
  console.log('\nSTRUCTURAL CHANGE                SHIPPED    vs baseline');
  for(const r of out) console.log(
    r.name.padEnd(32), String(r.v).padStart(6),
    ('   ' + (r.v-base>=0?'+':'') + (100*(r.v-base)/base).toFixed(0) + '%').padStart(12));
  const vals=out.map(r=>r.v);
  console.log(`\nSTRUCTURAL swing: ${Math.min(...vals)} → ${Math.max(...vals)}  = ${(100*(Math.max(...vals)-Math.min(...vals))/Math.min(...vals)).toFixed(0)}% spread`);
  console.log('IN-SHIFT POLICY swing (measured earlier): 228 → 233 = 2% spread');
  await b.close();
})();
