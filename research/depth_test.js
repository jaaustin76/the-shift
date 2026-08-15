// Do manifest foresight + crew-consuming exceptions create real strategic depth?
// Depth = a policy that uses information beyond current queue state beats greedy.
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/claude/the_shift.html');
  await pg.waitForTimeout(400);

  const out = await pg.evaluate(() => {
    const { startRun, step, setAlloc, commitCrewToException, C } = window.__sim;
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
    const depIn = (S, i) =>
      (S.lanes[i].departs.length ? S.lanes[i].departs[0] : C.SHIFT_DURATION) - S.t;

    const MODES = {
      static: null,
      // pure greedy: only looks at what's already in the chute
      reactive: (S, i) => S.lanes[i].count,
      // greedy + departure clock
      departAware: (S, i) => S.lanes[i].count + Math.max(0, 20 - depIn(S, i)) * 1.6,
      // uses the manifest: pre-positions for the NEXT trailer's skew
      manifest: (S, i) => {
        const now = S.wave ? S.wave.weights[i] : 0.25;
        const soon = S.nextWave ? S.nextWave.weights[i] : 0.25;
        const untilNext = S.wave ? Math.max(0, S.wave.until - S.t) : 99;
        // blend toward the incoming trailer as it approaches
        const blend = untilNext < 12 ? 0.75 : untilNext < 25 ? 0.4 : 0.05;
        const demand = now * (1 - blend) + soon * blend;
        return S.lanes[i].count * 0.8 + demand * 22 + Math.max(0, 18 - depIn(S, i)) * 1.2;
      },
    };

    function run(modeName, react, seed, excCrew, travel) {
      C.EXCEPTION_NEEDS_CREW = excCrew;
      C.WORKER_TRAVEL_TIME = travel;
      _s = seed >>> 0;
      startRun();
      const S = window.__sim.S; S.running = true;
      const score = MODES[modeName];
      let g = 0, nextReact = 0, jamSeen = null, nrSeen = null;
      while (S.running && g < 20000) {
        const t = S.t;
        if (S.jam) {
          if (jamSeen === null) jamSeen = t;
          if (t - jamSeen >= 1.0 && commitCrewToException()) {
            S.jam = null; S.excCleared++; jamSeen = null;
          }
        } else jamSeen = null;
        if (S.noread) {
          if (nrSeen === null) nrSeen = t;
          if (t - nrSeen >= 1.0 && commitCrewToException()) {
            S.noread.dest = emptiest(S); S.noread.noread = false;
            S.noread = null; S.excCleared++; nrSeen = null;
          }
        } else nrSeen = null;

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

    const SEEDS = 16, res = [];
    const CONFIGS = [
      { excCrew: false, travel: 0,   label: 'baseline (free exc, no travel)' },
      { excCrew: false, travel: 2.5, label: 'travel only' },
      { excCrew: true,  travel: 0,   label: 'crew-cost exc only' },
      { excCrew: true,  travel: 2.5, label: 'both' },
      { excCrew: true,  travel: 4.0, label: 'both, slow travel' },
    ];
    for (const cfg of CONFIGS) {
      const row = { label: cfg.label };
      for (const m of Object.keys(MODES)) {
        let best = 0;
        for (const react of [0.5, 1.5, 3.0]) {
          let sum = 0;
          for (let s = 0; s < SEEDS; s++) sum += run(m, react, 1000 + s * 7919, cfg.excCrew, cfg.travel);
          best = Math.max(best, sum / SEEDS);
          if (m === 'static') break;
        }
        row[m] = Math.round(best);
      }
      res.push(row);
    }
    Math.random = real;
    return res;
  });

  console.log('errors:', errs.length ? errs : 'none');
  console.log('\nCONFIG                          STATIC  REACTIVE  DEPART  MANIFEST   foresight worth');
  for (const r of out) {
    const worth = r.manifest - r.reactive;
    console.log(
      r.label.padEnd(32),
      String(r.static).padStart(5),
      String(r.reactive).padStart(9),
      String(r.departAware).padStart(7),
      String(r.manifest).padStart(9),
      ('   ' + (worth >= 0 ? '+' : '') + worth + ' (' + (100 * worth / r.reactive).toFixed(1) + '%)').padStart(18));
  }
  require('fs').writeFileSync('/home/claude/depth_results.json', JSON.stringify(out, null, 1));
  await b.close();
})();
