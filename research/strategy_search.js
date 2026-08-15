// Strategy-space search over THE SHIFT.
// Question: is there a simple dominant strategy that trivialises the game?
// Secondary: does execution speed matter, or only strategy?
const { chromium } = require('playwright');

const POLICIES = [];

// allocation modes
const MODES = ['static', 'fillGreedy', 'departOnly', 'balanced', 'roundRobin', 'oracle'];
// how early (sec) before a departure a lane starts getting priority
const LOOKAHEADS = [0, 10, 20, 30, 45];
// how often the player re-evaluates (models human reaction speed)
const REACTS = [0.25, 1.0, 2.0, 4.0];
// seconds before the player deals with an exception (Infinity = ignores)
const EXCS = [0.5, 3.0, 8.0, Infinity];

for (const mode of MODES)
  for (const look of LOOKAHEADS)
    for (const react of REACTS)
      for (const exc of EXCS) {
        // lookahead is meaningless for modes that don't use departures
        if ((mode === 'static' || mode === 'fillGreedy' || mode === 'roundRobin') && look !== 0) continue;
        POLICIES.push({ mode, look, react, exc });
      }

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/claude/the_shift.html');
  await pg.waitForTimeout(400);

  const SEEDS = 12;
  const out = await pg.evaluate(async ({ POLICIES, SEEDS }) => {
    const { startRun, step, C } = window.__sim;

    // deterministic RNG so every policy faces identical package streams
    let _s = 1;
    const srand = () => { _s = (_s * 1664525 + 1013904223) >>> 0; return _s / 4294967296; };
    const realRandom = Math.random;
    Math.random = srand;

    function emptiestOpenLane(S) {
      let best = 0, bv = 1e9;
      for (let i = 0; i < C.LANE_COUNT; i++) {
        if (S.t < S.lanes[i].gapUntil) continue;
        if (S.lanes[i].count < bv) { bv = S.lanes[i].count; best = i; }
      }
      return best;
    }

    function allocate(S, p, rrTick) {
      const L = S.lanes;
      const nextDep = i => {
        const d = L[i].departs.length ? L[i].departs[0] : C.SHIFT_DURATION;
        return d - S.t;
      };
      let score;
      switch (p.mode) {
        case 'static':     return null;                       // never move anyone
        case 'fillGreedy': score = i => L[i].count; break;
        case 'departOnly': score = i => -nextDep(i); break;
        case 'balanced':   score = i => L[i].count + (nextDep(i) < p.look ? 40 : 0); break;
        case 'roundRobin': return [rrTick % 4, (rrTick + 1) % 4];
        case 'oracle':     // fill + departure urgency + gap awareness, continuous
          score = i => L[i].count * 1.0
                     + Math.max(0, (p.look - nextDep(i))) * 1.5
                     + (L[i].count >= C.CHUTE_CAPACITY - 1 ? 12 : 0);
          break;
      }
      const order = [];
      for (let i = 0; i < C.LANE_COUNT; i++) {
        if (S.t < L[i].gapUntil) continue;                    // no trailer, pointless
        order.push([score(i), i]);
      }
      order.sort((a, b) => b[0] - a[0]);
      return order.map(o => o[1]);
    }

    function run(p, seed) {
      _s = seed >>> 0;
      startRun();
      const S = window.__sim.S;
      S.running = true;
      let g = 0, nextReact = 0, rr = 0;
      let jamSeen = null, nrSeen = null;

      while (S.running && g < 20000) {
        const t = S.t;

        // exception handling with latency
        if (S.jam) {
          if (jamSeen === null) jamSeen = t;
          if (t - jamSeen >= p.exc) { S.jam = null; S.excCleared++; jamSeen = null; }
        } else jamSeen = null;

        if (S.noread) {
          if (nrSeen === null) nrSeen = t;
          if (t - nrSeen >= p.exc) {
            S.noread.dest = emptiestOpenLane(S);
            S.noread.noread = false; S.noread = null; S.excCleared++; nrSeen = null;
          }
        } else nrSeen = null;

        // re-allocate crew at the policy's reaction cadence
        if (t >= nextReact) {
          const order = allocate(S, p, rr++);
          if (order) {
            let left = C.WORKER_COUNT;
            S.lanes.forEach(L => L.workers = 0);
            for (const i of order) {
              if (left <= 0) break;
              const take = Math.min(C.MAX_WORKERS_PER_LANE, left);
              S.lanes[i].workers = take; left -= take;
            }
            S.freeWorkers = left;
          }
          nextReact = t + p.react;
        }
        step(1 / 60); g++;
      }
      return { shipped: S.shipped, halted: S.halted, inbound: S.spawned,
               dumped: S.dumped, recirc: S.recirculated };
    }

    const results = [];
    for (const p of POLICIES) {
      let sh = 0, ha = 0, inb = 0, du = 0;
      const runs = [];
      for (let s = 0; s < SEEDS; s++) {
        const r = run(p, 1000 + s * 7919);
        sh += r.shipped; ha += r.halted; inb += r.inbound; du += r.dumped;
        runs.push(r.shipped);
      }
      const mean = sh / SEEDS;
      const sd = Math.sqrt(runs.reduce((a, v) => a + (v - mean) ** 2, 0) / SEEDS);
      results.push({
        ...p, exc: p.exc === Infinity ? 'never' : p.exc,
        shipped: Math.round(mean), sd: +sd.toFixed(1),
        halted: Math.round(ha / SEEDS), inbound: Math.round(inb / SEEDS),
        dumped: Math.round(du / SEEDS)
      });
    }
    Math.random = realRandom;
    return results;
  }, { POLICIES, SEEDS });

  console.log('errors:', errs.length ? errs : 'none');
  console.log('policies tested:', out.length, '| seeds each:', 12);
  require('fs').writeFileSync('/home/claude/strategy_results.json', JSON.stringify(out, null, 1));

  const byShip = [...out].sort((a, b) => b.shipped - a.shipped);
  console.log('\n=== TOP 12 ===');
  console.log('mode        look react  exc   shipped  sd  halt');
  for (const r of byShip.slice(0, 12))
    console.log(String(r.mode).padEnd(11), String(r.look).padStart(4), String(r.react).padStart(5),
      String(r.exc).padStart(6), String(r.shipped).padStart(7), String(r.sd).padStart(5), String(r.halted + 's').padStart(5));

  console.log('\n=== BOTTOM 6 ===');
  for (const r of byShip.slice(-6))
    console.log(String(r.mode).padEnd(11), String(r.look).padStart(4), String(r.react).padStart(5),
      String(r.exc).padStart(6), String(r.shipped).padStart(7), String(r.sd).padStart(5), String(r.halted + 's').padStart(5));

  await b.close();
})();
