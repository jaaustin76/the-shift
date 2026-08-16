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

## K1 — The career becomes real

**Adds:** persistence. Credits, upgrades, roster, morale, tables, seats, backlog and day
count all survive a reload.

**Why first:** nothing currently persists, which means **the meta-loop has never been
played by anyone.** Morale sliding across ten shifts, Dee handing her notice in, saving
three shifts for a walkway — all of it is built and none of it is reachable. This is the
smallest item on the list and it makes everything already built testable for the first time.

**Playable:** you can run a career of twenty shifts and find out whether the break room
loop actually works. That question is currently unanswerable.

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

## The rule about this document

**One kernel at a time. Finish it, play it, then move.** If a kernel isn't playable, it
isn't finished, and starting the next one is how a project becomes a pile of half-features
that never ships.

Ideas that arrive mid-kernel go to `BACKLOG.md`. They do not get built on sight.
