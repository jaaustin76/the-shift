const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await pg.waitForTimeout(300);
  await pg.click('#go'); await pg.waitForTimeout(200);
  // build a busy, legible mid-shift state with BOTH exceptions live
  await pg.evaluate(() => {
    window.__sim.resetCareer();
    const S = window.__sim.S, C = window.__sim.C;
    for(let i=0;i<2600;i++) window.__sim.step(1/60);
    S.lanes[0].workers=2; S.lanes[1].workers=1; S.lanes[2].workers=0; S.lanes[3].workers=0; S.freeWorkers=0;
    S.lanes[1].count=6; S.lanes[2].count=3; S.lanes[3].count=5;
    S.jam = {x:250, hold:0, age:5};
    if(!S.noread){ const p=S.packages.find(q=>!q.noread); if(p){p.noread=true;p.expire=9;S.noread=p;} }
  });
  await pg.waitForTimeout(250);
  await pg.screenshot({path:'shot_game.png'});
  // report
  await pg.evaluate(()=>{ const S=window.__sim.S; let g=0; while(S.running&&g<20000){window.__sim.step(1/60);g++;} });
  await pg.waitForTimeout(300);
  await pg.screenshot({path:'shot_report.png', fullPage:true});
  console.log('errors:', errs.length?errs:'none');
  await b.close();
})();
