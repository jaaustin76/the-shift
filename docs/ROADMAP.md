# THE SHIFT — kernels

Not a feature list. Each kernel is **a game that works on its own.** Finish one, play it,
and only then start the next. The point is that progress is always playable, never a
half-built thing waiting on the next half.

Each kernel below states what it adds, and — more importantly — **what makes it playable
without the ones after it.**

---

## K0 — The shift ✅ DONE

One line, four chutes, three crew, three minutes. Break room hub with crew who react to
real telemetry. Problem solve puzzle built from your own mis-routes.

**Playable:** yes. Measured at passive ~70 shipped vs ~146 played well.

---

## K1 — The career becomes real ✅ DONE

**Adds:** persistence. Credits, upgrades, roster, morale, tables, seats, backlog and day
count all survive a reload.

**Why first:** nothing currently persists, which means **the meta-loop has never been
played by anyone.** Morale sliding across ten shifts, Dee handing her notice in, saving
three shifts for a walkway — all of it is built and none of it is reachable. This is the
smallest item on the list and it makes everything already built testable for the first time.

**Playable:** you can run a career of twenty shifts and find out whether the break room
loop actually works. That question was previously unanswerable — now it's open.

Saves intent (`META`), never derived state (`C`): buying an upgrade is persisted as
`META.built[id]`, and `C` is rebuilt from a `DEFAULTS` snapshot plus a replay of owned
upgrades' `apply()` on every load, so a tuning change always reaches existing careers.
`window.__sim.resetCareer()` is the storage-free reset every `research/` harness now
calls before a shift, so a stray save can never silently starve a benchmark of crew —
see THE TESTING TRAP in `CLAUDE.md`.

---

## K2 — The floor

**Adds:** a layout editor. Place belt and chutes from a **piece kit** (straight, curve,
chute, dock) on a grid. Live walk-time readouts as you move things. Assign destinations to
chutes, including **two chutes on one destination** for a high-volume lane.

**Why here:** this is where the depth is. Measured — structure swings throughput 79%.

**Playable:** design a floor, run a shift, see it fail, redesign. That loop alone is a game.

**Watch for:** the piece kit is deliberately chosen over free drawing. Countable pieces
beat continuous freedom on a small screen — the same reason the belt slot grid worked.

---

## K3 — Growth

**Adds:** the building expands. Buy floor space, dock doors, and additional lines. Start
at one line and one door.

**Playable:** the arc from a small cross-dock to a real facility, with every expansion
competing for the same credits.

---

## K4 — Delegation

**Adds:** hire specialists who take over your jobs — an engineer for jams, a floor manager
for crew allocation.

**Non-negotiable:** they are **worse at it than you.** See the rule in `GAME.md`. If a hire
is ever a straight upgrade, this kernel has failed.

**Playable:** you can run more floor than you can personally attend, and you feel the cost.

---

## K5 — Things break

**Adds:** disruption you have to plan around rather than react to. Late inbound trailers,
equipment down (not just jammed), unannounced volume spikes, absenteeism.

**Playable:** the same building, now with a reason to build slack into it.

---

## K6 — Non-conveyables

**Adds:** freight that can't ride the line — oversize, irregular, damaged. Needs its own
path through the building.

**Playable:** a second flow competing with the first for space and people.

**Note:** the one-package-one-slot rule stays. Shape differences live at the chute and in
handling, never on the belt.

---

## K7 — Peak

**Adds:** the seasonal volume curve. The test everything else has been preparing for.

**Playable:** an endgame with a date on it.

---

## K8 — Contention

**Adds:** intersections where two lines want the same square, yielding that propagates
backward as a stall. Then **multi-level belts** as the expensive fix you buy for a choked
crossing.

**Why last:** it's the deepest system and the hardest to render legibly on a phone. It also
doesn't need to exist for the game to be good — it makes it better.

**Playable:** layout stops being about placement and starts being about routing.

---

## Later

**Ladder logic** — writing your own diverter rules. The true endgame of the architect
stage, and possibly a product of its own. Researched: `docs/BACKLOG.md`.

---

## Design notes — taking shape, not yet scheduled

Not a kernel yet, and not a `BACKLOG.md` one-liner either — this is for ideas that have
been brainstormed out in enough detail to build from once their kernel comes up, so that
detail doesn't have to be reconstructed from chat history later. Add to it as design
conversations land somewhere real; don't build from it early.

### K8 — Contention: branching and the merge gate

From a brainstorm on what building a second line into an existing chute actually means
physically. Settles the shape of K8 well past its one-paragraph roadmap entry:

- **A branch is a second physical path to one chute**, built from the main line using the
  same piece kit as everything else in K2 (starts straight, curves added as needed). It
  carries packages of any size — this is about giving a chute a second door, not about
  sorting by package attribute. Separate idea, not this one: size-specific lanes at the
  *induction* point (storage / inbound trucks), which would exist upstream of all of this.
  Parked independently — see `BACKLOG.md`.
- **The merge point is a staging slot, not the chute itself.** One package, sitting right
  before the chute, fed by both the main line's divert and the branch. It drops into the
  chute automatically whenever the chute has room — this part is unchanged from how a
  divert works today. Upgradeable to hold up to 3, independent of the chute's own capacity
  (e.g. a 10-capacity chute might have a 1-, and later 3-, capacity staging slot in front
  of it).
- **The branch needs a manual release; the main line doesn't.** Admitting the *branch's*
  next package into the staging slot is a tap — that's the actual arbitration point,
  since two sources now feed one slot. The main line keeps auto-feeding as it always has.
  An upgrade later automates the branch's release too.
- **Where two lines actually cross** (not merging into a shared chute, but crossing paths
  outright), the default is strict alternation — A, B, A, B — one package at a time. It
  does not idle-wait on a turn that has nothing behind it: if only one side has a package
  ready, it goes, and alternation resumes once both sides have one waiting again.
- **Elevated / multi-level lines bypass a crossing entirely** — the expensive fix already
  named in K8's roadmap entry, for when strict alternation is costing more than it's worth.
  This is the *package* bypass. There's a separate, *worker* bypass, below.
- **A built conveyor blocks a worker's path, same as it would in a real building.** Once
  the floor is real 2D geometry (K2 step 1, done — see `index.html`'s `FLOOR`), a branch
  or crossing isn't just a line on a diagram, it's a physical thing standing between a
  crew member and wherever they're walking to. If nothing stops them walking straight
  through it, building a branch is free — no cost, no decision, and the whole reason
  distance-based crew travel exists (K0/K1's one measured skill: restraint) stops holding
  once there's anything on the floor besides one straight line.
- **Ladders / platforms are the fix — bought and built** (ties directly to the parked
  *Installation lead time* idea in `BACKLOG.md`; this is exactly the kind of purchase that
  idea was for), letting a worker cross *over* a conveyor instead of detouring around it.
  Without one, the walk to a crossing point is a real, possibly long, path through open
  floor — not a shortcut, an actual cost the player chose by where they built.
- **Consequence for later, not now:** crew walk time stops being straight-line distance
  between two chute X-positions (`travelTime()` today) and becomes a path through open
  floor space that a built conveyor can block and a ladder/platform can cross. Only bites
  once there's more than one line on the floor to be in the way — the first K2 slice
  (one straight line, no branches yet) doesn't need this, but whoever builds branches does.
- **Ladder logic, later still, replaces the fixed alternation rule** with something the
  player writes — e.g. let 3 through before yielding. This is the existing parked Ladder
  Logic idea, given its first concrete hook into a system that needs it.
- **Explicitly deferred, not part of this:** package weight/size affecting belt speed and
  jam rate. Territory of `K6 — Non-conveyables`; wait for that kernel rather than building
  it here.

---

## The rule about this document

**One kernel at a time. Finish it, play it, then move.** If a kernel isn't playable, it
isn't finished, and starting the next one is how a project becomes a pile of half-features
that never ships.

Ideas that arrive mid-kernel go to `BACKLOG.md`. They do not get built on sight.
