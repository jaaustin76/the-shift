# THE SHIFT — project context

Single file, no dependencies. Open `index.html`.

> **Run a parcel distribution centre, and face what actually goes wrong in one.**

`docs/GAME.md` is the design. `docs/ROADMAP.md` is the order of work. Read both before
proposing anything.

---

## HOW WE WORK — read this every session

**1. Plan before code. Always.**
Never start implementing on the first ask. Respond with: here's what I understand, here's
the approach, here's what I think could go wrong — do you agree? Only implement after
agreement. This catches design problems while they're still sentences instead of bugs
spread across a file.

**2. One kernel at a time.**
`docs/ROADMAP.md` is a sequence of games, not features. Finish the current kernel, play it,
then start the next. If it isn't playable, it isn't finished.

**3. Ideas go to the backlog, not into the build.**
When a new idea arrives mid-kernel — and they will, constantly — write it in
`docs/BACKLOG.md` and keep going. Judge whether it's genuinely urgent or just interesting.
Most are interesting. Say which one you think it is.

**4. Measure before concluding.**
Several strongly-held design beliefs in this project were wrong and only fell to a harness.
When a result is surprising, **check the measurement before believing the finding** — it
has been the harness roughly half the time. See the testing trap below.

**5. Write code to be read by a non-developer.**
Every line gets read. Prefer obvious over clever, name things fully, and comment the *why*
rather than the *what*. If a block needs a paragraph to explain, it's probably wrong.

**6. Say when something is a bad idea.**
Including ideas that came from the user, and including ideas you suggested earlier. Being
agreeable is not being useful. Back it up with a measurement where one is possible.

---

## What the game is

You are the shift manager of a parcel distribution centre. Packages come off an inbound
trailer, ride a slotted belt past four chutes, and get loaded onto outbound trailers
before those trailers depart. **You have three people and four lanes, so you are always
one short**, and a chute with nobody on it loads nothing at all.

The full loop:

**Break room** → **Shift** (3 real minutes) → **Report** → back to the break room.

- **Break room** is the hub. Your crew sit at a table looking at you, and speech bubbles
  drift in and out. Every line is generated from the last shift's actual telemetry, never
  scripted — if Marcus walked 34 seconds he says so and asks for a walkway over the middle.
  Ignore them and morale slides: grumble, then warning, then they hand notice in, then they
  are gone. **The dialogue is the morale gauge** — there is no bar, by design.
- **Shift** is the active game. Move crew between chutes, clear jams, route unreadable
  labels. Crew walk, and walking loads nothing.
- **Design** spends credits on the floor (throughput) or the break room (morale). Break
  room seats gate hiring, so you cannot hire a fourth associate until you build a table.
- **Problem solve** is an untimed sort puzzle built from the packages *you* mis-routed.
  Clear it and they ship after all.

The tone is authentic rather than cartoonish. It came from someone who works in a real
DC, and the details — recirculation, no-reads at the scanner, trailer cutoff times,
problem solve — are the real job, not decoration.

**Reference points:** Kairosoft (Game Dev Story, Mega Mall Story) for the hub-and-loop
shape and charm; Parcel Simulator for proof the subject sells; Mini Motorways for the
principle that the simulation running is feedback, not gameplay.

## Where this is going

Current state: shift loop, break room and problem solve all work and are measured. The
floor plan does not exist yet, and **nothing persists across a reload** — so the meta-loop
has never actually been played.

`docs/ROADMAP.md` holds the kernel sequence. Next up is **K1 — persistence**, then
**K2 — the floor plan**. Do not skip ahead.

**Platform is deliberately undecided.** Plain HTML/canvas because the valuable part is the
simulation and its measured tuning, which ports anywhere; rendering and UI is the cheap
half any port rewrites. Evidence points at Steam over mobile for this genre, and a web
build reaches Steam via Electron cheaply. Do not propose an engine migration without a
platform decision behind it.

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
docs/GAME.md        the design. what the game is and why
docs/ROADMAP.md      the kernel sequence. what gets built and in what order
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
