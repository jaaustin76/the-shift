// Final test of the travel idea: asymmetric floor geometry + strongly concentrated
// demand + distance travel. Does PRE-POSITIONING finally beat reacting?
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

    const MODES = {
      static: null,
      reactive: (S,i) => S.lanes[i].count,
      // pure pre-positioning: go where the NEXT trailer's freight is headed,
      // starting early enough to actually arrive before it lands
      preposition: (S,i) => {
        let walk = 0;
        for(const c of S.crew) walk = Math.max(walk, window.__sim.travelTime(c, i));
        const untilNext = S.wave ? Math.max(0, S.wave.until - S.t) : 99;
        const committed = untilNext <= walk + 2;      // must leave now to make it
        const soon = S.nextWave ? S.nextWave.weights[i] : 0.25;
        const now  = S.wave ? S.wave.weights[i] : 0.25;
        return S.lanes[i].count * 0.7 + (committed ? soon : now) * 30;
      },
    };

    function run(mode, react, walkSpeed, heavy, layout, seed){
      C.WALK_SPEED = walkSpeed; C.WAVE_ENABLED = true; C.MANIFEST_LEAD = true;
      C.WAVE_HEAVY = heavy; C.WAVE_SECOND = Math.min(0.2,(1-heavy)/2);
      window.__sim.setLayout(layout);
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
    const EVEN    = [148,218,288,358];        // current: evenly spaced
    const CLUSTER = [148,168,338,358];        // A,B together — C,D far away
    const CASES = [
      ['even  / mild  0.55', EVEN,    0.55, 21],
      ['even  / heavy 0.85', EVEN,    0.85, 21],
      ['clust / heavy 0.85', CLUSTER, 0.85, 21],
      ['clust / heavy 0.85', CLUSTER, 0.85, 12],
      ['clust / total 0.95', CLUSTER, 0.95, 12],
      ['clust / total 0.95', CLUSTER, 0.95, 8],
    ];
    for(const [label, layout, heavy, ws] of CASES){
      const row = {label, ws, cross:+(Math.abs(layout[3]-layout[0])/ws).toFixed(1)};
      for(const m of Object.keys(MODES)){
        let best=0;
        for(const react of [0.5,1.5,3.0]){
          let sum=0; for(let s=0;s<SEEDS;s++) sum+=run(m,react,ws,heavy,layout,1000+s*7919);
          best=Math.max(best,sum/SEEDS);
          if(m==='static') break;
        }
        row[m]=Math.round(best);
      }
      res.push(row);
    }
    Math.random=real; C.WALK_SPEED=0; C.WAVE_ENABLED=false;
    window.__sim.setLayout(EVEN);
    return res;
  });
  console.log('errors:', errs.length?errs:'none');
  console.log('\nLAYOUT / WAVE          CROSS  STATIC  REACTIVE  PREPOSITION   worth');
  for(const r of out){
    const w = r.preposition - r.reactive;
    console.log(r.label.padEnd(22), String(r.cross+'s').padStart(5),
      String(r.static).padStart(7), String(r.reactive).padStart(9),
      String(r.preposition).padStart(12),
      ('  '+(w>=0?'+':'')+w+' ('+(100*w/r.reactive).toFixed(1)+'%)').padStart(15));
  }
  await b.close();
})();
