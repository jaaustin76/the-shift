# THE SHIFT — Backlog

Running list. Nothing here gets built without you saying so.

---

## OPEN BUGS

**Mis-sorts are invisible.** Routing a no-read to the wrong chute works — the counter increments, it shows on the report — but nothing tells you in the moment. Cause: I set the package's destination to your choice, which repaints it the new colour and erases the evidence. It should keep its true colour and sit visibly foreign in the wrong chute.
*Fix requires:* chute contents as a list rather than a count. Contained change, ~30 min. **Deferred at your request.**

---

## NEXT UP (my read, not decided)

**The floor plan.** The measured finding still stands: structure swings throughput 79%, in-shift play 2%. DESIGN is currently a list of upgrades, not a layout you arrange. Section 5 of FINDINGS is effectively its design doc — every row is a decision with a non-obvious answer.

**Feel pass.** Still zero audio and no impact feedback. I skipped it overnight because the loop hadn't proven itself; it has now. Package thunk, chute weight, departure whoosh, counter tick, shake on a jam.

---

## PARKED — your ideas, waiting

**Package shapes with real behaviour.** Box, bag, small, flat and oversize currently render differently but behave identically. The one-slot rule is locked in, so giving oversize its own handling at the chute won't need belt changes.

**Full-line overview / camera.** Needed before a genuinely long line is playable. Currently the belt shrinks its slots to fit the screen, which works to ~30 slots and then stops being readable.

**Capacity derived from belt length.** The physically honest model. Measured: at current scale only ~7 packages fit between chute A and chute D, so any backup swallows every upstream divert at once and the shift sits blocked 120-180s out of 180. The fixed cap acts as back-pressure. *Blocked on:* a longer line, which is blocked on the camera. Reasoning is in a comment at the declaration so it isn't rediscovered the hard way.

**Escalation — shifts 2 to 5.** Rising volume plus one new constraint each: oversize that won't fit standard chutes, a cold-chain lane, a second inbound door. Tests whether the design has legs past ten minutes.

**Ladder logic / PLC puzzle.** Researched: exactly one real attempt on Steam (*Automation*, 45 reviews). The genre it belongs to — Zachtronics — is proven. Dual market as a game and a training tool, against PLC simulator subscriptions at $12-29/month. Strongest as a late-game layer inside this game — programming your own diverter logic — rather than a separate title.

**Trailer dispatch verb.** You choose when to send each trailer instead of fixed departures. Built and tested in `shift_dispatch.html`; the decision didn't bind at the tuning I tried (trailers rarely filled before cutoff). Not exhausted — smaller trailers would make it matter.

**More break room dialogue.** `buildDialogue()`'s candidate pool is currently a few dozen lines covering the telemetry that exists today. As new systems land (K5's disruptions, K6's non-conveyables, whatever K2's floor plan surfaces), each one is a natural source of new candidate lines — the pattern's already proven, it's just a small pool right now. Interesting, not urgent: the mechanism doesn't need to change, only its content, and it grows for free as a side effect of building other kernels rather than needing its own effort.

**Crew demeanor tied to morale.** Right now morale is legible through what the crew *say*, never how they look — `drawPerson()` already reads `morale` (it slumps the figure below the warning threshold) but there's no distinct sprite state for grumbling vs. content vs. about to walk. You've flagged this is a sprite-art dependency — flat rectangles don't have much of a face to change — so it waits for the art pass rather than the current placeholder rendering. Parking it here rather than in NEXT UP since it's blocked on an asset decision, not on design.

---

## DONE

Hard blocking with the cascade · recirculation as a purchase with a measured tradeoff · crew walking with distance-based travel · break room hub with telemetry-driven dialogue · morale, attrition and the seat gate · problem solve sort puzzle · slot grid with the collision invariant proven · one-tap crew control · career persistence (K1) — credits, roster, morale, upgrades and backlog survive a reload
