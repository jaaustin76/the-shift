# THE SHIFT — Prototype Spec v0.1

**Scope:** the 3-minute shift loop only. No building, no economy, no progression.
**Purpose:** find out whether managing a sort shift is fun before anything else gets built.
**Target build time:** 2 weeks part-time to playable, 2-4 weeks tuning after.

---

# PART 1 — DESIGN

## What we're testing

One question: **is three minutes of running a sort aisle fun enough that you press Retry?**

Everything else in the game — the grid, the conveyors, the upgrades, the idle accrual, the peak season — is a multiplier on this loop. If the loop is flat, the multipliers make a bigger flat thing. So the loop gets built alone, first, ugly.

## The fantasy

You are not a package handler. You are the person who decides where the bodies go.

The sim runs itself. Belts move, packages route, trailers load. Your job is the same one a real sort manager has: watch where pressure is building, move people to it before it becomes a problem, and clear the exceptions the automation can't handle. You never touch a package directly.

## The core tension

**Three associates. Four lanes.** You are permanently one person short. That's not a difficulty setting, it's the whole design. Every second you are choosing which lane to neglect, and the correct answer changes as departure times approach.

## The skill being learned

A new player reacts: they see a chute filling and send someone.

A skilled player **anticipates**. They watch the departure clock, and 20 seconds before a trailer leaves they stack two people on that lane and drain the chute to near-empty — because once the trailer pulls out, that dock is dead for 18 seconds and anything arriving has nowhere to go. Drain it early and the gap costs nothing. React late and the chute overflows onto the main line, the main line backs up to the infeed, and your entire warehouse stops.

**That's the game.** Pre-drain before the gap. Everything else is texture.

The failure is a cascade, and cascades are what make this genre feel good — one ignored lane doesn't cost you one lane, it costs you the building.

## Validated: the skill gap is real

Measured in the actual build, averaged over 7 runs each, with two strategies: a passive player who never moves anyone, and a skilled player who pre-drains before departures and clears exceptions on sight.

| | Packages shipped | Infeed halted |
|---|---|---|
| Passive | 120  (range 113-126) | 59 sec |
| Skilled | 232  (range 228-238) | 0 sec |

**A skilled player ships 93% more than a passive one on identical inputs.** Steep enough to feel mastery, shallow enough that a first run isn't humiliating.

Note the range: skilled play is tightly clustered (228-238) while passive is noisier. That's the right shape — skill should reduce variance, not just raise the mean.

## One important finding: score throughput, not percentage

My first pass scored on-time percentage. It's the wrong metric and it nearly hid a bug in the design.

When a passive player chokes their own infeed, packages stop *arriving*. The denominator shrinks. They halt the building for 45 seconds and still score 82% — the score rewards them for jamming the line.

**Score on total packages shipped.** It's unfakeable, it's what a real DC is actually measured on, and it makes the cascade failure show up in the number where the player can feel it.

## What failure looks like

Never a number. Always a picture.

A chute at capacity means packages physically stop entering it and start riding past on the main line. The main line visibly fills. When it fills completely, the infeed stops and the trailer being unloaded just sits there. The screen goes still — and stillness in a game about movement reads instantly as *wrong*, with no tutorial required.

Nothing is ever unrecoverable. Missed packages are simply not shipped. There's no game over, no restart-forced state. You just ship less, and the number at the end tells you.

## What we are deliberately NOT building

Write this list somewhere you'll see it. Every one of these is a thing you will want to add in week two, and every one will cost you the prototype.

- No grid, no placement, no building anything
- No conveyor construction or routing — belt layout is hardcoded
- No money, no upgrades, no unlocks, no progression
- No idle accrual, no offline anything
- No save system
- No menus beyond Start Shift → Shift → Report → Retry
- No tutorial
- No sound, or one placeholder loop
- No art. Colored rectangles. Genuinely.
- No multiple warehouses, package types, cold chain, oversize, returns

## Success criteria

After the build, run it yourself 10 times, then hand it to 3 people who have never worked in a DC. Judge on:

1. **Do you press Retry without deciding to?** The involuntary retry is the only real signal.
2. **Does your strategy on run 5 differ from run 1?** If not, there's no skill to learn and the loop is dead.
3. **Does a non-warehouse person understand what's going wrong within 30 seconds of watching?** If they can't see the cascade, the visuals failed, not the design.

If 1 or 2 fail, **do not add features.** Retune, or change the verbs. Adding a build phase on top of a boring shift produces a boring game with a build phase.

---

# PART 2 — BUILD SPEC

Hand this section to the AI you're building with.

## Screen layout

Single screen, portrait, no scrolling. Top to bottom:

```
┌─────────────────────────────────┐
│  CLOCK 11:42am    SHIPPED 84    │   HUD
├─────────────────────────────────┤
│  [TRAILER] ──> infeed           │   inbound
│  ═══════════════════════════    │   MAIN LINE (left to right)
│    │      │      │      │       │   4 drop points
│  ┌─┴─┐  ┌─┴─┐  ┌─┴─┐  ┌─┴─┐    │   CHUTES (fill meter, 0-6)
│  │ A │  │ B │  │ C │  │ D │    │
│  └───┘  └───┘  └───┘  └───┘    │
│  DOCK1  DOCK2  DOCK3  DOCK4     │   trailer + countdown to departure
│  12:00   1:00   2:00   3:00     │
├─────────────────────────────────┤
│   [👤] [👤] [👤]   drag to lane  │   3 associates
└─────────────────────────────────┘
```

## Entities

**Package**
- `destination`: int 0-3
- `state`: ON_LINE → IN_CHUTE → LOADED | MISSED
- Rendered as a colored square matching its destination lane

**Lane** (4 instances)
- `chute_count`: int, 0 to CHUTE_CAP
- `workers`: int, 0 to MAX_PER_LANE
- `dock_state`: OPEN | GAP
- `dock_open_at`: float, timestamp when GAP ends
- `departures`: list of timestamps

**MainLine**
- `queue`: list of packages, max LINE_CAP
- When full, infeed halts (no spawning) until space frees

**Associate** (3 instances)
- `assigned_lane`: int 0-3 or null
- Draggable. Dropping on a lane at MAX_PER_LANE is rejected.

## Tunable constants — START HERE

These are simulation-validated. Put them in one config file and change nothing else while tuning.

```
SHIFT_DURATION      = 180.0   # real seconds
CLOCK_START         = 8:00    # displayed
CLOCK_END           = 17:00   # 1 real sec = 3 game min

SPAWN_INTERVAL_START = 1.10   # sec between packages at t=0
SPAWN_INTERVAL_END   = 0.40   # sec between packages at t=180
                              # linear interpolation, ~250 packages total

LANE_COUNT          = 4
CHUTE_CAPACITY      = 6
LINE_CAPACITY       = 15

WORKER_COUNT        = 3
MAX_WORKERS_PER_LANE = 2
LOAD_INTERVAL_STAFFED   = 1.40   # sec per package PER WORKER
LOAD_INTERVAL_UNSTAFFED = 9.00   # sec per package

DOCK_GAP_DURATION   = 18.0    # sec dock unavailable after departure
MAX_RECIRC          = 2       # belt passes before a package is pulled off
JAM_AUTO_CLEAR      = 14.0    # sec until maintenance clears a jam you ignored

DEPARTURES = {
  laneA: [50, 150],
  laneB: [75],
  laneC: [100],
  laneD: [125],
}
# plus: at t=180 all lanes depart with whatever they hold
```

**Do not change these individually while playtesting.** Change one, play 5 runs, change it back if unsure. The interactions are non-obvious — `LOAD_INTERVAL_UNSTAFFED` in particular swings difficulty far more than it looks like it should, because it drives the cascade.

## Simulation rules

Fixed timestep, 0.1s. Order per tick:

1. **Spawn.** If `t >= next_spawn` and `len(line.queue) < LINE_CAPACITY`: create package with random destination 0-3, push to line, set `next_spawn = t + lerp(SPAWN_INTERVAL_START, SPAWN_INTERVAL_END, t/SHIFT_DURATION)`. If line is full, do not spawn and accumulate `halted_seconds`.

2. **Route.** When a package reaches its destination chute: if `chute_count < CHUTE_CAPACITY`, it drops in. If the chute is full, it **recirculates** — it rides to the end of the line and loops back to the infeed to try again. After `MAX_RECIRC` passes it is pulled off to problem solve and counts as MISSED.

   Packages never overtake each other, so anything genuinely stopped (a jam, a no-read at the scanner) blocks everything behind it. *Recirculation is what keeps failure gradual instead of terminal — see "What changed when we built it" below. Do not replace it with hard blocking.*

3. **Load.** For each lane where `dock_state == OPEN`:
   - rate = `workers / LOAD_INTERVAL_STAFFED` if workers > 0, else `1 / LOAD_INTERVAL_UNSTAFFED`
   - accumulate `rate * dt`; each whole unit removes 1 package from chute, increments `shipped`

4. **Departures.** At each departure timestamp for a lane: any packages still in that chute become MISSED and are removed. Set `dock_state = GAP`, `dock_open_at = t + DOCK_GAP_DURATION`. During GAP the lane loads nothing but still receives packages.

5. **Exceptions.** See below.

6. **End.** At `t == SHIFT_DURATION`, all remaining chute contents count as MISSED. Show report.

## The two verbs

**VERB 1 — ALLOCATION**
Drag an associate onto a lane. Takes effect immediately, no travel time (add travel time only if the game feels too easy later — it's a difficulty lever, not a v1 feature). Max 2 per lane, enforced on drop.

**VERB 2 — TRIAGE**
Two exception types in v1:

*JAM*
- Spawns on a random main-line segment every 30-45s (random)
- That segment's throughput → 0. Packages behind it queue and do not pass.
- Player holds on the jam marker for 1.5s to clear
- **Auto-clears after `JAM_AUTO_CLEAR` (14s) whether or not the player acts.** Maintenance gets there eventually; clearing it yourself just buys back the stall time. That is exactly what the tap should be worth — meaningful, not existential.

*NO-READ*
- Spawns every 20-30s (random). A package arrives with an unreadable label and stops at the scanner, blocking the line behind it.
- Player taps it → 4 lane buttons appear → tap one to route it
- Not resolved within 15s, it is discarded as MISSED and the line resumes

Maximum **one jam and one no-read active at a time** in v1. Two simultaneous exceptions plus allocation is too much for a first build and will make the loop feel unfair before it's tuned.

*MIS-SORT — stretch goal, build only if the loop already feels good.* A package lands in the wrong chute. Blocks nothing. If it ships, −2 from score. Player can tap to pull it. This is the "expert has spare attention" layer.

## Post-shift report

One screen. No animation budget.

```
SHIFT COMPLETE          5:00 PM

PACKAGES SHIPPED             216      <- headline, largest element
Inbound                      248
Missed                        32

Infeed halted            0:00
Exceptions cleared       11 / 13

LANE FILL OVER SHIFT
A  ▁▂▃▅█▅▂▁▁▂▃▄▂▁▁▁
B  ▁▁▂▂▃▃▄▅▆▇█▆▃▁▁▁
C  ▁▁▁▂▂▂▃▃▃▄▄▅▅▄▃▂
D  ▁▂▂▃▃▄▄▄▅▅▆▆▇███      <- ends full = you missed a lot

WORST MOMENT
2:14 PM — Lane D at capacity, main line backed up 11
```

The sparkline per lane is the most valuable element on this screen. It shows the player *when* and *where* they lost, not just that they lost. Sample chute_count every 10 seconds into an array; render as 18 blocks.

Buttons: **RETRY** and nothing else in v1.

## Build order

Each step must run before you start the next. Do not build ahead.

1. **Days 1-2.** Packages spawn on a line and move left to right into 4 chutes. Rectangles. No capacity limits, no workers, no clock. Just flow.
2. **Days 3-4.** Chute capacity and blocking. Line capacity and infeed halt. *Watch the cascade happen with no player input.* If this doesn't look alarming on screen, fix the visuals now — everything downstream depends on it reading clearly.
3. **Days 5-6.** Three associates, drag to assign, load rates.
4. **Days 7-8.** Shift clock, departure timestamps, dock gaps, missed packages.
5. **Days 9-10.** Jam and no-read.
6. **Days 11-12.** Report screen.
7. **Then tune.** Expect this to take longer than the build. It is the actual work.

## Reference benchmarks

After step 6, verify:

- Never moving a worker ships **~120** packages, halts **~59s**
- Playing well ships **~232**, halts **0s**
- Total inbound on a clean run is **~256**

If your numbers are wildly off, check step 2 (routing/recirculation) first — that rule drives everything else.

---

# PART 3 — WHAT CHANGED WHEN WE BUILT IT

Two rules in v0.1 were wrong, and both only showed up once the thing was running. Recording them because they're the kind of mistake that's easy to make again.

### 1. Hard blocking made the game binary

v0.1 said a package that can't enter a full chute sits at the drop point and blocks the line. That's realistic, and it destroyed the game.

An unstaffed lane drains slower than its share of inbound, so its chute fills and *never* empties. Every package for that lane then sits at the drop point forever. The belt saturates, the infeed halts, and throughput goes to zero for the rest of the shift. Passive play shipped **27** packages against a skilled **230** — a 750% gap. That's not a difficulty curve, it's a cliff. There was no middle regime where a mediocre player does mediocre.

The fix was the thing real sorters actually do: **recirculate**. A package that can't divert rides around and tries again, and after two passes it's pulled to problem solve. Congestion still builds — recirculating packages eat the belt capacity new ones need — but it degrades smoothly instead of locking solid.

Lesson: *a realistic rule and a playable rule aren't the same thing, and the fix was more realistic, not less.*

### 2. An ignored jam ended the shift

v0.1 said a jam has no timeout — "the backup is the penalty." In practice a single jam at t=45 that the player didn't tap blocked the belt for the remaining 135 seconds. Every passive run was decided by one event in the first minute.

Fixed by auto-clearing jams after 14 seconds. The player's tap now buys back up to ~12 seconds of stall — worth doing, not fatal to miss.

Lesson: *any state the player can fail to resolve needs a path out that doesn't require them.*

### Also worth knowing

- **`LOAD_INTERVAL_UNSTAFFED` barely matters.** Sweeping it from 9.0s to 2.5s moved passive throughput by single digits. Difficulty lives in the dock gaps and the exceptions, not the staffing rate. Don't waste tuning time there.
- **Scoring on-time percentage rewards jamming your own line.** Choking the infeed means packages never arrive, so the denominator shrinks and a terrible run scores 82%. Throughput is the only honest metric here.

---

*Spec v0.2 — constants now measured in the running build, not modelled. They'll change again once a human plays it, which is the point.*
