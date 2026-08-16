# THE SHIFT — project context

A warehouse sort-aisle game. Single file, no dependencies. Open `index.html`.

Read `docs/FINDINGS.md` before proposing design changes. It contains a measured negative
result that redirects most obvious ideas.

---

## The one thing to know first

**The shift loop has almost no strategic depth on its own, and tuning does not give it any.**

Measured over ~60,000 simulated shifts across 288 playstyles:

- How you play swings throughput about **2%**
- What the warehouse is *made of* swings it about **79%**

A purely reactive policy — "always staff the fullest chute" — scores 234 against a
ceiling of 236. Four separate attempts to add depth to the shift (worker travel cost,
bursty inbound, manifest foresight, a dispatch verb) all failed the same way.

**Consequence: do not add mechanics to the shift expecting depth.** The depth belongs in
the floor plan. The shift is the scoreboard that makes layout decisions legible.

The one intervention that *did* work was distance-based crew travel, and the skill it
created was **restraint** — patient play beats constant reshuffling by 20-34%, the
opposite of what the original design taught.

---

## Physics invariants — do not break these

- **One package occupies exactly one belt slot**, whatever its shape. Bag, box, oversize:
  same footprint. Shape differences belong at the chute, never on the belt.
- **Line capacity is the slot count.** `C.BELT_SLOTS` drives slot width, package size,
  chute positions and capacity. Change the length, everything follows.
- **Nothing may ever overlap.** Two packages must never be closer than one slot. This is
  enforced at spawn, at recirculation re-entry, and by no-overtaking during movement.
  There is a test for it — keep it passing.
- **A full chute stops the line.** The package that can't drop sits on its divert and
  nothing behind it passes. The queue grows backward until it swallows upstream chutes.
  This is deliberate; recirculation is a *purchase* that changes it, not a default.
- **A chute with no crew loads nothing.** Not slowly — nothing.

## Deliberate design decisions that look like bugs

- **Recirculation lowers your ceiling.** +9% on a sloppy shift, −13% on a clean one.
  A blocked line back-pressures the infeed; recirc removes that mercy so chutes stay
  fuller and more is lost at departure. It buys a floor, not a ceiling. Intended.
- **Jams auto-clear after 14s.** Without this, one ignored jam ends the shift.
- **Score is throughput, never on-time percentage.** Percentage rewards choking your own
  infeed: fewer packages arrive, so the denominator shrinks and a terrible run scores 82%.

---

## THE TESTING TRAP — read this before writing any benchmark

`endShift()` settles crew morale. A benchmark that runs shifts back to back with nobody
buying amenities **quietly starves itself of crew** — by later iterations `WORKER_COUNT`
is 1, not 3, and you are measuring understaffing rather than the thing under test.

Always reset the roster inside the run loop:

```js
META.roster = [1,2,3].map(n => ({name:'C'+n, morale:80, tenure:0, notice:false}));
META.quit = []; syncRoster();
```

Three separate harnesses returned confidently wrong numbers before this was found. The
failure is silent and the numbers look plausible. **If a benchmark moves sharply after a
refactor, suspect the harness before the game.**

Related: changing anything that alters how many packages spawn also shifts the seeded RNG
stream, so two conditions stop facing identical inputs. Comparisons across such a change
are invalid.

---

## Layout

```
index.html          the whole game (~1900 lines)
docs/FINDINGS.md    the strategy search. read first
docs/BACKLOG.md     open bugs and parked ideas. check before proposing work
docs/BUILD_LOG.md   decisions made autonomously, with reasoning
docs/shift_loop_spec.md   original spec + what changed once built
research/           16 measurement harnesses
prototypes/         dispatch variant (tested, parked)
```

Inside `index.html`, in order: config `C` → slot geometry → sim state → `step()` →
input → render → break room → problem solve → lab → main loop.

## Conventions

- **All tuning lives in `C` at the top.** Never hard-code a number in logic that belongs
  in config. `SLOT_H` was hard-coded once and silently drew packages under the dock.
- **Single file, zero dependencies, no build step.** Deliberate.
- **Anything derived from config must be a function, not a constant** — the lab mutates
  `C` live, so `slotW()` and `slotH()` recompute rather than cache.
- Debug hooks are exposed on `window.__sim` for the harnesses. Keep them.

## Testing

```bash
npm i playwright && npx playwright install chromium
node research/verify.js          # passive vs skilled benchmark
node research/layout_test.js     # structure vs policy — the decisive one
```

Current benchmark: passive ~70 shipped, played well ~146. Any change should be measured
against that, with the roster reset.

## Working style that has worked

Measure before concluding. Several strongly-held design beliefs in this project were
wrong and only fell to a harness. When a result is surprising, check the measurement
before believing the finding — it has been the harness roughly half the time.

Do not implement every idea on sight. `docs/BACKLOG.md` is the triage list; things move
off it deliberately.
