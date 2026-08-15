// Does the dispatch verb create depth that allocation couldn't?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file:///home/claude/shift_dispatch.html');
  await pg.waitForTimeout(400);
  const out = await pg.evaluate(() => {
    const {startRun, step, setAlloc, dispatch, commitCrewToException, C} = window.__sim;
    let _s=1; const srand=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
    const real=Math.random; Math.random=srand;
    const emptiest=S=>{let bi=0,bv=1e9;for(let i=0;i<C.LANE_COUNT;i++){
      if(S.t<S.lanes[i].gapUntil)continue; if(S.lanes[i].count<bv){bv=S.lanes[i].count;bi=i;}} return bi;};

    // DISPATCH POLICIES — the new decision under test
    const DISPATCH = {
      never:    () => false,                                   // only hard cutoffs fire
      whenFull: (S,i) => S.lanes[i].loaded >= C.TRAILER_CAPACITY,   // greedy
      // anticipatory: send early if a surge to this lane is imminent, so the
      // dock gap completes BEFORE the surge lands rather than during it
      surgeAware: (S,i) => {
        const L=S.lanes[i];
        if(L.loaded >= C.TRAILER_CAPACITY) return true;
        const untilNext = S.wave ? Math.max(0,S.wave.until - S.t) : 99;
        const soon = S.nextWave ? S.nextWave.weights[i] : 0.25;
        // a heavy incoming share for this lane, landing just after a gap would end
        if(soon > 0.4 && untilNext < C.DOCK_GAP_DURATION + 4 && L.loaded > C.TRAILER_CAPACITY*0.45)
          return true;
        return false;
      },
    };
    const ALLOC = {
      reactive: (S,i) => S.lanes[i].count,
    };

    function run(allocName, dispName, seed){
      _s=seed>>>0; startRun();
      const S=window.__sim.S; S.running=true;
      const score=ALLOC[allocName], dis=DISPATCH[dispName];
      let g=0,nextReact=0,jamSeen=null,nrSeen=null;
      while(S.running && g<20000){
        const t=S.t;
        if(S.jam){ if(jamSeen===null)jamSeen=t;
          if(t-jamSeen>=1.0 && commitCrewToException()){S.jam=null;S.excCleared++;jamSeen=null;} } else jamSeen=null;
        if(S.noread){ if(nrSeen===null)nrSeen=t;
          if(t-nrSeen>=1.0 && commitCrewToException()){S.noread.dest=emptiest(S);
            S.noread.noread=false;S.noread=null;S.excCleared++;nrSeen=null;} } else nrSeen=null;
        for(let i=0;i<C.LANE_COUNT;i++) if(dis(S,i)) dispatch(i,false);
        if(t>=nextReact){
          const o=[]; for(let i=0;i<C.LANE_COUNT;i++){ if(S.t<S.lanes[i].gapUntil)continue; o.push([score(S,i),i]); }
          o.sort((a,b)=>b[0]-a[0]); setAlloc(o.map(x=>x[1])); nextReact=t+1.0;
        }
        step(1/60); g++;
      }
      const fill=S.trailerFill.length?S.trailerFill.reduce((a,b)=>a+b,0)/S.trailerFill.length:0;
      return {shipped:S.shipped, sent:S.trailersSent, fill, halted:S.halted};
    }
    const SEEDS=18, res=[];
    for(const d of Object.keys(DISPATCH)){
      let sh=0,se=0,fi=0,ha=0; const runs=[];
      for(let s=0;s<SEEDS;s++){ const r=run('reactive',d,1000+s*7919);
        sh+=r.shipped; se+=r.sent; fi+=r.fill; ha+=r.halted; runs.push(r.shipped); }
      const mean=sh/SEEDS;
      const sd=Math.sqrt(runs.reduce((a,v)=>a+(v-mean)**2,0)/SEEDS);
      res.push({dispatch:d, shipped:Math.round(mean), sd:+sd.toFixed(1),
                sent:+(se/SEEDS).toFixed(1), fill:+(100*fi/SEEDS).toFixed(0), halted:Math.round(ha/SEEDS)});
    }
    Math.random=real;
    return res;
  });
  console.log('errors:', errs.length?errs:'none');
  console.log('\nDISPATCH POLICY   SHIPPED   sd   trailers  avg fill  halt');
  for(const r of out) console.log(
    r.dispatch.padEnd(16), String(r.shipped).padStart(6), String(r.sd).padStart(5),
    String(r.sent).padStart(9), String(r.fill+'%').padStart(9), String(r.halted+'s').padStart(6));
  const base=out.find(r=>r.dispatch==='whenFull').shipped;
  const sa=out.find(r=>r.dispatch==='surgeAware').shipped;
  console.log(`\nanticipatory dispatch vs greedy dispatch: ${sa-base>=0?'+':''}${sa-base} pkgs (${(100*(sa-base)/base).toFixed(1)}%)`);
  await b.close();
})();
