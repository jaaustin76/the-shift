const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  await pg.goto('file:///home/claude/the_shift.html');
  await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const {startRun, step} = window.__sim;
    startRun(); const S = window.__sim.S; S.running = true;
    S.lanes[0].workers=2; S.lanes[1].workers=1; S.freeWorkers=0;
    for(let i=0;i<3400;i++) step(1/60);
    return {
      t:+S.t.toFixed(1), belt:S.packages.length,
      jam:S.jam ? {x:+S.jam.x.toFixed(1), age:+S.jam.age.toFixed(1)} : null,
      noread: S.noread ? {x:+S.noread.x.toFixed(1), expire:+S.noread.expire.toFixed(1)} : null,
      chutes:S.lanes.map(l=>l.count), gaps:S.lanes.map(l=>+(l.gapUntil-S.t).toFixed(1)),
      pk:S.packages.slice(0,14).map(p=>({d:p.dest,x:+p.x.toFixed(1),r:p.recirc,n:p.noread,l:p.loops}))
    };
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
