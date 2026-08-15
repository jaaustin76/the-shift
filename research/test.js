const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
  const errs = [];
  pg.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
  pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await pg.goto('file:///home/claude/the_shift.html');
  await pg.waitForTimeout(600);

  // start
  await pg.click('#go');
  await pg.waitForTimeout(400);

  // headless fast-forward: PASSIVE (never touch anything)
  const passive = await pg.evaluate(() => {
    const {startRun, step, C} = window.__sim;
    startRun();
    const S = window.__sim.S;
    S.running = true;
    let g = 0;
    while (S.running && g < 20000) { step(1/60); g++; }
    return { shipped:S.shipped, spawned:S.spawned, missed:S.missed, halted:+S.halted.toFixed(1) };
  });

  // SMART: pre-drain before departures + prioritise fullest
  const smart = await pg.evaluate(() => {
    const {startRun, step, C} = window.__sim;
    startRun();
    const S = window.__sim.S;
    S.running = true;
    let g = 0;
    while (S.running && g < 20000) {
      if (g % 15 === 0) {
        const urg = S.lanes.map((L,i) => {
          if (S.t < L.gapUntil) return -1;
          const nxt = L.departs.length ? L.departs[0] : 1e9;
          return L.count + ((nxt - S.t) < 25 ? 40 : 0);
        });
        const order = urg.map((u,i)=>[u,i]).sort((a,b)=>b[0]-a[0]);
        let left = C.WORKER_COUNT;
        S.lanes.forEach(L => L.workers = 0);
        for (const [u,i] of order) {
          if (u < 0 || left <= 0) continue;
          const take = Math.min(C.MAX_WORKERS_PER_LANE, left);
          S.lanes[i].workers = take; left -= take;
        }
        S.freeWorkers = left;
      }
      // clear exceptions instantly
      if (S.jam) { S.jam = null; S.excCleared++; }
      if (S.noread) { S.noread.noread = false; S.noread = null; S.excCleared++; }
      step(1/60); g++;
    }
    return { shipped:S.shipped, spawned:S.spawned, missed:S.missed, halted:+S.halted.toFixed(1) };
  });

  // verify report renders
  await pg.evaluate(() => { window.__sim.startRun(); const S = window.__sim.S; S.running=true;
    let g=0; while(S.running && g<20000){ window.__sim.step(1/60); g++; } });
  await pg.waitForTimeout(400);
  const repVisible = await pg.isVisible('#rep');
  const bigNum = await pg.textContent('#rBig');
  const sparks = await pg.$$eval('#rSparks .sparkrow', n => n.length);
  const bars = await pg.$$eval('#rSparks .spark i', n => n.length);

  await pg.screenshot({ path:'shot_report.png' });

  // gameplay screenshot mid-shift
  await pg.click('#again'); await pg.waitForTimeout(50);
  await pg.evaluate(() => { const S=window.__sim.S; S.lanes[0].workers=2; S.lanes[1].workers=1; S.freeWorkers=0;
    for(let i=0;i<3400;i++) window.__sim.step(1/60); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path:'shot_game.png' });

  console.log('CONSOLE ERRORS:', errs.length ? errs : 'none');
  console.log('PASSIVE:', JSON.stringify(passive));
  console.log('SMART  :', JSON.stringify(smart));
  console.log('skill gain: +' + Math.round(100*(smart.shipped-passive.shipped)/passive.shipped) + '%');
  console.log('report visible:', repVisible, '| headline:', bigNum, '| sparkrows:', sparks, '| bars:', bars);
  await b.close();
})();
