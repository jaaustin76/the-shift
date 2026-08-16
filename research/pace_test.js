const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await pg.waitForTimeout(400);
  const out = await pg.evaluate(() => {
    const {startRun, step, setAlloc, C} = window.__sim;
    let _s=1; const srand=()=>{_s=(_s*1664525+1013904223)>>>0;return _s/4294967296;};
    const real=Math.random; Math.random=srand;
    function run(skilled, seed, a, b2, cap){
      // Reset first, then reapply this sweep's own C overrides — resetCareer()
      // rebuilds C from DEFAULTS, so it has to run before a/b2/cap are set,
      // not after. See THE TESTING TRAP in CLAUDE.md.
      window.__sim.resetCareer();
      C.SPAWN_INTERVAL_START=a; C.SPAWN_INTERVAL_END=b2; C.CHUTE_CAPACITY=cap;
      _s=seed>>>0; startRun();
      const S=window.__sim.S; S.running=true;
      let g=0,next=0,last=null;
      while(S.running && g<20000){
        if(skilled){
          if(S.t>=next){
            const o=[]; for(let i=0;i<C.LANE_COUNT;i++){ if(S.t<S.lanes[i].gapUntil)continue;
              o.push([S.lanes[i].count,i]); }
            o.sort((a,b)=>b[0]-a[0]); const ord=o.map(x=>x[1]);
            let commit=true;
            if(last){ const cur=last[0], top=ord[0];
              if(cur!==top) commit=(S.lanes[top].count-S.lanes[cur].count)>=3; }
            if(commit){ setAlloc(ord); last=ord; }
            next=S.t+1.0;
          }
          if(S.jam && S.jam.age>0.8){S.jam=null;S.excCleared++;}
          if(S.noread){S.noread.noread=false;S.noread=null;S.excCleared++;}
        }
        step(1/60); g++;
      }
      return {sh:S.shipped, in:S.spawned, blk:S.blockSec, hal:S.halted};
    }
    const SEEDS=14, res=[];
    const CASES = [
      [1.55,0.68,6],[1.35,0.55,6],[1.35,0.55,8],[1.20,0.48,8],[1.10,0.40,8],[1.10,0.40,10],
    ];
    for(const [a,b2,cap] of CASES){
      let p={sh:0,in:0,blk:0}, s={sh:0,in:0,blk:0};
      for(let k=0;k<SEEDS;k++){ const r=run(false,1000+k*7919,a,b2,cap); p.sh+=r.sh; p.in+=r.in; p.blk+=r.blk; }
      for(let k=0;k<SEEDS;k++){ const r=run(true,1000+k*7919,a,b2,cap); s.sh+=r.sh; s.in+=r.in; s.blk+=r.blk; }
      res.push({a,b:b2,cap, pass:Math.round(p.sh/SEEDS), skill:Math.round(s.sh/SEEDS),
        inb:Math.round(s.in/SEEDS), pblk:Math.round(p.blk/SEEDS), sblk:Math.round(s.blk/SEEDS)});
    }
    Math.random=real;
    return res;
  });
  console.log('errors:', errs.length?errs:'none');
  console.log('\nSPAWN        CHUTE  INBOUND  PASSIVE  SKILLED  gain   blocked p/s   skilled ships');
  for(const r of out) console.log(
    (r.a+'->'+r.b).padStart(11), String(r.cap).padStart(6), String(r.inb).padStart(8),
    String(r.pass).padStart(8), String(r.skill).padStart(8),
    ('+'+Math.round(100*(r.skill-r.pass)/r.pass)+'%').padStart(6),
    (r.pblk+'s / '+r.sblk+'s').padStart(13),
    (Math.round(100*r.skill/r.inb)+'%').padStart(14));
  await b.close();
})();
