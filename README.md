# THE SHIFT

A warehouse sort-aisle game. You run a shift: packages come off a trailer, ride a slotted
belt, drop into chutes, and get loaded onto trailers before they depart. You have three
people and four lanes, so you are always one short.

**Play it:** open `index.html` in a browser. Phone-first, portrait, no build step, no
dependencies.

---

## Where the game is

Prototype. The core loop works and has been measured; the floor plan — the part the
evidence says carries the game — is not built yet.

| | Packages shipped |
|---|---|
| Never move anyone | ~70 |
| Playing well | ~146 |

The gap is the game.

**Read `docs/FINDINGS.md` first.** It documents a load-bearing negative result: the shift
loop has almost no strategic depth on its own, and no amount of tuning gives it any.
Structural choices — crew count, chute depth, dock doors, line length — swing throughput
**79%**, while how you play swings it **2%**. That finding redirected the whole project.

---

## What's here

```
index.html                  the game. one file, ~1900 lines, no dependencies
docs/FINDINGS.md            the strategy search. the most important document here
docs/shift_loop_spec.md     design spec + what changed once it was built
docs/BACKLOG.md             open bugs and parked ideas
docs/BUILD_LOG.md           decisions made autonomously, with reasoning
prototypes/                 the trailer-dispatch variant (tested, parked)
research/                   every harness used to measure the above
```

## The loop

**Break room** → **Shift** (3 min) → **Report** → back to the break room.

Between shifts you spend credits on the floor or the break room, and the crew tell you
what went wrong — every line is generated from that shift's telemetry, not scripted.
Neglect them and morale falls, then they quit. The dialogue *is* the morale gauge.

**Problem solve** is a sort puzzle built from the packages you personally mis-routed.
Clear it and they ship after all.

## Rules that matter

- **A chute with nobody on it loads nothing.** It just fills.
- **A full chute stops the line.** The package that can't drop sits on its divert and
  nothing behind it passes — the queue grows backward until it swallows upstream chutes.
- **Crew walk.** ~3s between neighbouring chutes, ~8s across the floor, loading nothing
  on the way. Chasing every full chute is the worst thing you can do.
- **One package, one slot,** whatever its shape. Capacity is the slot count you can see.

## Running the tests

```bash
npm i playwright && npx playwright install chromium
node research/verify.js          # benchmark: passive vs skilled
node research/strategy_search.js # 288 playstyles × 12 seeds
node research/layout_test.js     # structure vs policy — the decisive one
```

**One warning, learned the hard way.** `endShift()` settles crew morale, so a benchmark
that runs shifts back to back quietly starves itself of crew and later iterations measure
understaffing rather than the thing under test. Reset `META.roster` every run. Three
separate harnesses returned confidently wrong numbers before this was caught — see
`docs/BUILD_LOG.md`.

## Stack

Plain HTML + canvas, deliberately. The valuable part is the simulation and its measured
tuning, which is engine-agnostic; rendering and UI is the cheap half that any port
rewrites. The engine decision waits on a platform decision that hasn't been earned yet.
