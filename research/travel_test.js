// Does worker travel time restore the value of anticipation?
// Compares a purely reactive policy against an anticipatory one across travel costs.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await pg.waitForTimeout(400);

  const out = await pg.evaluate(() => {
    const { startRun, step, setAlloc, C } = window.__sim;
    let _s = 1;
    const srand = () => { _s = (_s * 1664525 + 1013904223) >>> 0; return _s / 4294967296; };
    const real = Math.random; Math.random = srand;

    const emptiest = S => {
      let bi = 0, bv = 1e9;
      for (let i = 0; i < C.LANE_COUNT; i++) {
        if (S.t < S.lanes[i].gapUntil) continue;
        if (S.lanes[i].count < bv) { bv = S.lanes[i].count; bi = i; }
      }
      return bi;
    };

    // scoring functions define the playstyle
    const MODES = {
      static:     null,
      fillGreedy: (S, i) => S.lanes[i].count,                    // ignores departures entirely
      // anticipatory: weights a lane by how soon its trailer leaves
      anticipate: (S, i) => {
        const d = (S.lanes[i].departs.length ? S.lanes[i].departs[0] : C.SHIFT_DURATION) - S.t;
        return S.lanes[i].count * 1.0 + Math.max(0, 20 - d) * 1.6;
      },
      // anticipatory + reads what's inbound on the belt for that lane
      beltAware:  (S, i) => {
        const d = (S.lanes[i].departs.length ? S.lanes[i].departs[0] : C.SHIFT_DURATION) - S.t;
        let incoming = 0;
        for (const p of S.packages) if (p.dest === i && !p.noread) incoming++;
        return S.lanes[i].count * 1.0 + incoming * 0.7 + Math.max(0, 20 - d) * 1.6;
      },
    };

    function run(modeName, react, travel, seed) {
      window.__sim.resetCareer();   // see THE TESTING TRAP in CLAUDE.md
      C.WORKER_TRAVEL_TIME = travel;
      _s = seed >>> 0;
      startRun();
      const S = window.__sim.S; S.running = true;
      const score = MODES[modeName];
      let g = 0, nextReact = 0, jamSeen = null, nrSeen = null;
      while (S.running && g < 20000) {
        const t = S.t;
        if (S.jam) { if (jamSeen === null) jamSeen = t;
          if (t - jamSeen >= 1.0) { S.jam = null; S.excCleared++; jamSeen = null; } } else jamSeen = null;
        if (S.noread) { if (nrSeen === null) nrSeen = t;
          if (t - nrSeen >= 1.0) { S.noread.dest = emptiest(S); S.noread.noread = false;
            S.noread = null; S.excCleared++; nrSeen = null; } } else nrSeen = null;

        if (score && t >= nextReact) {
          const order = [];
          for (let i = 0; i < C.LANE_COUNT; i++) {
            if (S.t < S.lanes[i].gapUntil) continue;
            order.push([score(S, i), i]);
          }
          order.sort((a, b) => b[0] - a[0]);
          setAlloc(order.map(o => o[1]));
          nextReact = t + react;
        }
        step(1 / 60); g++;
      }
      return S.shipped;
    }

    const SEEDS = 14, res = [];
    for (const [travel, heavy] of [[0,0.25],[0,0.55],[0,0.75],[1.5,0.55],[2.5,0.55],[2.5,0.75],[4.0,0.75]]) {
      C.WAVE_HEAVY = heavy; C.WAVE_SECOND = Math.min(0.25, (1-heavy)/2);
      const row = { travel, heavy };
      for (const m of ['static', 'fillGreedy', 'anticipate', 'beltAware']) {
        let best = 0, bestReact = null;
        for (const react of [0.5, 1.5, 3.0]) {
          let sum = 0;
          for (let s = 0; s < SEEDS; s++) sum += run(m, react, travel, 1000 + s * 7919);
          const mean = sum / SEEDS;
          if (mean > best) { best = mean; bestReact = react; }
          if (m === 'static') break;
        }
        row[m] = Math.round(best);
        row[m + '_react'] = bestReact;
      }
      res.push(row);
    }
    Math.random = real;
    C.WORKER_TRAVEL_TIME = 2.5;
    return res;
  });

  console.log('errors:', errs.length ? errs : 'none');
  console.log('\nTRAVEL  WAVE  STATIC  REACTIVE  ANTICIPATE  BELT-AWARE   belt-reading worth');
  for (const r of out) {
    const worth = r.beltAware - r.fillGreedy;
    console.log(
      String(r.travel + 's').padStart(6), String(r.heavy).padStart(5),
      String(r.static).padStart(8),
      String(r.fillGreedy).padStart(10),
      String(r.anticipate).padStart(12),
      String(r.beltAware).padStart(12),
      ('  ' + (worth >= 0 ? '+' : '') + worth + ' pkgs (' +
        (100 * worth / r.fillGreedy).toFixed(1) + '%)').padStart(22));
  }
  require('fs').writeFileSync(path.join(__dirname, 'travel_results.json'), JSON.stringify(out, null, 1));
  await b.close();
})();
