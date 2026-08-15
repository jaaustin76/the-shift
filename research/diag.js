const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport:{width:390,height:844} });
  await pg.goto('file:///home/claude/the_shift.html');
  await pg.waitForTimeout(300);
  const tl = await pg.evaluate(() => {
    const {startRun, step, C} = window.__sim;
    C.LOAD_INTERVAL_UNSTAFFED = 3.0;
    startRun(); const S = window.__sim.S; S.running = true;
    const rows = []; let g = 0, nextLog = 0;
    while (S.running && g < 20000) {
      if (S.t >= nextLog) {
        rows.push([S.t.toFixed(0), S.packages.length, S.lanes.map(l=>l.count).join(''),
                   S.lanes.map(l=>l.workers).join(''), S.shipped, S.recirculated, S.dumped,
                   S.halted.toFixed(0), S.jam?'JAM':'', S.noread?'NR':'']);
        nextLog += 15;
      }
      step(1/60); g++;
    }
    return {rows, spawned:S.spawned, shipped:S.shipped, missed:S.missed, dumped:S.dumped, recirc:S.recirculated};
  });
  console.log('  t  belt chutes crew  shipped recirc dump halt');
  for (const r of tl.rows) console.log(
    String(r[0]).padStart(3), String(r[1]).padStart(4), r[2].padStart(6), r[3].padStart(5),
    String(r[4]).padStart(7), String(r[5]).padStart(6), String(r[6]).padStart(4), String(r[7]+'s').padStart(5), r[8], r[9]);
  console.log('TOTALS', JSON.stringify({spawned:tl.spawned,shipped:tl.shipped,missed:tl.missed,dumped:tl.dumped,recirc:tl.recirc}));
  await b.close();
})();
