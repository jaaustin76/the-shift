# THE SHIFT — Backlog

Running list. Nothing here gets built without you saying so.

---

## OPEN BUGS

**Mis-sorts are invisible — now with a real fix in mind, not just a cosmetic one.** Routing a no-read to the wrong chute works — the counter increments, it shows on the report — but nothing tells you in the moment, and choosing wrong has no in-shift consequence beyond the number. The original fix (keep the package's true colour, let it sit visibly foreign in the wrong chute) is superseded by a fuller idea from a K2-planning brainstorm:

A mis-picked "?" package rides off the end of the main line into a **holding chute — no trailer, not one of the four destinations.** It sits there until a worker is assigned to it, and clearing it is manual and slow on purpose: the worker walks over, picks up **one package at a time**, and carries it to its correct chute — competing for the same three people as every other lane, not a free background action. Anything still in the holding chute at shift end takes a **monetary penalty**, same shape as `missed at departure` today. This turns "invisible" into a real cost that trades against the core three-people-four-lanes tension instead of just a bigger number on the report.

Relationship to Problem Solve: this is the *in-shift* chance to catch a mis-pick before it becomes backlog. Whatever's still sitting in the holding chute at shift end is what actually becomes Problem Solve material — the two systems aren't duplicating each other, they're the same failure at two different times.

**Not part of K2.** This is a shift-mechanic change, not a floor-plan one — it doesn't touch the piece kit or the grid. Logging it here rather than building it now so it doesn't get lost, and so it doesn't turn into two kernels going at once.

---

## NEXT UP (my read, not decided)

**The floor plan.** ~~The measured finding still stands...~~ **This is K2, now underway** — see `ROADMAP.md`.

**Feel pass.** Still zero audio and no impact feedback. I skipped it overnight because the loop hadn't proven itself; it has now, across ten shifts played across ten separate sessions during K1. Package thunk, chute weight, departure whoosh, counter tick, shake on a jam.

---

## PARKED — your ideas, waiting

**Package shapes with real behaviour.** Box, bag, small, flat and oversize currently render differently but behave identically. The one-slot rule is locked in, so giving oversize its own handling at the chute won't need belt changes.

**Full-line overview / camera.** Needed before a genuinely long line is playable. Currently the belt shrinks its slots to fit the screen, which works to ~30 slots and then stops being readable. **Directly relevant to K2 now** — you want the whole line visible until it outgrows the screen, then a scroll, with upcoming packages still readable as the line grows so there's something to plan around. Worth measuring rather than assuming once it exists: `FINDINGS.md` §3 already found belt-reading foresight worth −1% to +1% on the *current* short line, because transit time is shorter than reaction time — a real camera raises transit time a lot, so that conclusion may not hold once lines are actually long. Check before believing either way.

**Capacity derived from belt length.** The physically honest model. Measured: at current scale only ~7 packages fit between chute A and chute D, so any backup swallows every upstream divert at once and the shift sits blocked 120-180s out of 180. The fixed cap acts as back-pressure. *Blocked on:* a longer line, which is blocked on the camera. Reasoning is in a comment at the declaration so it isn't rediscovered the hard way.

**Escalation — shifts 2 to 5.** Rising volume plus one new constraint each: oversize that won't fit standard chutes, a cold-chain lane, a second inbound door. Tests whether the design has legs past ten minutes.

**Ladder logic / PLC puzzle.** Researched: exactly one real attempt on Steam (*Automation*, 45 reviews). The genre it belongs to — Zachtronics — is proven. Dual market as a game and a training tool, against PLC simulator subscriptions at $12-29/month. Strongest as a late-game layer inside this game — programming your own diverter logic — rather than a separate title.

**Trailer dispatch verb.** You choose when to send each trailer instead of fixed departures. Built and tested in `shift_dispatch.html`; the decision didn't bind at the tuning I tried (trailers rarely filled before cutoff). Not exhausted — smaller trailers would make it matter.

**More break room dialogue.** `buildDialogue()`'s candidate pool is currently a few dozen lines covering the telemetry that exists today. As new systems land (K5's disruptions, K6's non-conveyables, whatever K2's floor plan surfaces), each one is a natural source of new candidate lines — the pattern's already proven, it's just a small pool right now. Interesting, not urgent: the mechanism doesn't need to change, only its content, and it grows for free as a side effect of building other kernels rather than needing its own effort.

**Crew demeanor tied to morale.** Right now morale is legible through what the crew *say*, never how they look — `drawPerson()` already reads `morale` (it slumps the figure below the warning threshold) but there's no distinct sprite state for grumbling vs. content vs. about to walk. You've flagged this is a sprite-art dependency — flat rectangles don't have much of a face to change — so it waits for the art pass rather than the current placeholder rendering. Parking it here rather than in NEXT UP since it's blocked on an asset decision, not on design.

**Installation lead time for purchases.** Everything bought today applies instantly (`u.apply()` fires the moment you spend the credits). Your idea: a new conveyor section or a vending machine should take real build time — sized to what it is, so a vending machine lands same-shift and a new line takes a couple of shifts before it's live. Explicitly flagged as not-now. It fits the operate→supervise→architect arc in `GAME.md` — instant gratification suits the operator stage you're in now; a real capital-project queue suits the architect stage once there's an actual facility to manage, which is K3 territory (buying floor space, doors, lines) more than K2 (arranging what you've already got).

---

## DONE

Hard blocking with the cascade · recirculation as a purchase with a measured tradeoff · crew walking with distance-based travel · break room hub with telemetry-driven dialogue · morale, attrition and the seat gate · problem solve sort puzzle · slot grid with the collision invariant proven · one-tap crew control · career persistence (K1) — credits, roster, morale, upgrades and backlog survive a reload
