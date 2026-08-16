const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await pg.waitForTimeout(400);

  const out = await pg.evaluate(() => {
    const R = [];
    function playShift(){
      window.__sim.startRun();
      const S = window.__sim.S; S.running = true;
      let g=0, next=0;
      while(S.running && g<20000){                       // decent-but-not-perfect play
        if(S.t>=next){
          const o=[]; for(let i=0;i<window.__sim.C.LANE_COUNT;i++){
            if(S.t<S.lanes[i].gapUntil) continue; o.push([S.lanes[i].count,i]); }
          o.sort((a,b)=>b[0]-a[0]); window.__sim.setAlloc(o.map(x=>x[1])); next=S.t+1.5;
        }
        if(S.jam && S.jam.age>2) { S.jam=null; S.excCleared++; }
        window.__sim.step(1/60); g++;
      }
    }
    function scenario(buyAmenities){
      // Each scenario is deliberately 10 shifts run back to back, to watch
      // morale drift over a career — so the reset happens once here, at the
      // start of the scenario, not per shift.
      window.__sim.resetCareer();
      const log=[];
      for(let d=1;d<=10;d++){
        playShift();
        if(buyAmenities){
          for(const a of AMENITIES) if(!META.built[a.id] && META.credits>=a.cost){
            META.credits-=a.cost; META.built[a.id]=true; break; }
        }
        const lines = buildDialogue();
        log.push({day:d, morale:META.roster.map(r=>r.name+":"+Math.round(r.morale)).join(" "),
                  crew:META.roster.length,
                  says:lines.filter(l=>l.mood==="bad").map(l=>l.text.slice(0,44)).slice(0,2)});
      }
      return log;
    }
    R.push({name:"NEGLECTED (buy nothing)", log:scenario(false)});
    R.push({name:"CARED FOR (buy amenities)", log:scenario(true)});
    return R;
  });

  console.log('errors:', errs.length?errs:'none');
  for(const sc of out){
    console.log('\n=== ' + sc.name + ' ===');
    for(const r of sc.log){
      console.log('  shift '+String(r.day).padStart(2)+'  crew '+r.crew+'  '+r.morale.padEnd(34)
        + (r.says.length? '  << "'+r.says[0]+'..."' : ''));
    }
  }
  await b.close();
})();
