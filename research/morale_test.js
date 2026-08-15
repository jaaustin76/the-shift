const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file:///home/claude/the_shift.html');
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
      // reset
      META.day=1; META.credits=0; META.built={}; META.asked={}; META.thanked={};
      META.tables=1; META.seats=3; META.quit=[]; META.last=null;
      META.roster=[{name:"MARCUS",morale:78,tenure:0,notice:false},
                   {name:"DEE",morale:74,tenure:0,notice:false},
                   {name:"RAY",morale:80,tenure:0,notice:false}];
      syncRoster();
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
