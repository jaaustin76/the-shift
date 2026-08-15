# THE SHIFT — Strategy Search Findings

**Short version: the shift loop has no strategic depth, and no amount of tuning gives it any. The depth is in the build phase. I was wrong to tell you to build the shift first.**

Everything below is measured, not argued. Roughly 60,000 simulated shifts across 288 distinct playstyles, seeded so every strategy faced identical package streams.

---

## 1. What I set out to find

A *degenerate dominant strategy* — a simple, boring policy that scores as well as a sophisticated one. If it exists, the game is solved and there's nothing to master.

It exists. It's "always send crew to the fullest chute."

---

## 2. The core result

| Playstyle | Packages shipped |
|---|---|
| Never move anyone | 192 |
| **Reactive: staff the fullest chute, ignore everything else** | **234** |
| Departure-aware: pre-drain before trailers leave | 235 |
| Full oracle: fill + departures + gap awareness | 236 |

**Anticipation is worth 2 packages out of 236 — under 1%.**

The entire design thesis — *"the real skill is pre-draining a chute before its departure"* — is worth less than one percent. A player who has never noticed the departure clock scores 234.

The reason is that **fill level already encodes departure pressure.** A lane approaching its departure has been accumulating, so it's the fullest, so the reactive player goes there anyway. The departure clock is redundant information.

### Execution speed doesn't matter either

| Re-decides every | Shipped |
|---|---|
| 0.25s | 236 |
| 1.0s | 235 |
| 2.0s | 233 |
| 4.0s | 231 |

A player making a decision every 4 seconds scores 98% of one making 16 decisions in the same time. **There is no execution skill, only the single strategic insight — and that insight is trivial.**

### The only thing that matters is whether you touch exceptions at all

| Exception response | Shipped |
|---|---|
| Within 0.5s | 212 |
| Within 3.0s | 212 |
| Within 8.0s | 197 |
| Never | 141 |

Note 0.5s and 3.0s are *identical*. Even here there's no speed component — just a binary "do you tap the thing."

---

## 3. Four attempted fixes, all failed

I didn't accept the result until I'd tried to engineer around it.

### Fix 1 — Worker travel time
Make moving crew cost 2.5s of productivity, so greedy chasing is expensive.

| Travel cost | Do nothing | Reactive | Anticipatory |
|---|---|---|---|
| 0s | 192 | **234** | 234 |
| 2.5s | 192 | **206** | 186 |
| 4.0s | **192** | 186 | 164 |

**Made it worse.** Anticipatory policies move crew *more*, so they pay more travel cost. And at 4s, *doing literally nothing* (192) beats both. The design space became: cheap movement → chasing wins; expensive movement → standing still wins. Neither contains skill.

### Fix 2 — Bursty inbound (waves)
Uniform-random destinations make all four lanes statistically identical. Real trailers are loaded by origin, so their freight skews. I made inbound arrive in waves, 55-75% concentrated on one lane.

Reactive still won everywhere. Belt-reading was worth **−1% to −4%**.

Why: belt transit is ~3 seconds and the chute buffers ~6. "A surge is coming" tells you nothing that "the chute is full" won't tell you two seconds later. **The lead time is shorter than the reaction time, so foresight has nothing to buy.**

### Fix 3 — Manifest foresight + exceptions that consume crew
Gave the player advance knowledge of the *next* trailer's contents (up to 38s of lead), and made clearing exceptions pull a crew member off loading for 5s so exceptions compete with the main task.

| Configuration | Do nothing | Reactive | Departure-aware | Manifest |
|---|---|---|---|---|
| baseline | 180 | **228** | 225 | 213 |
| travel only | 180 | **207** | 194 | 198 |
| crew-cost exceptions | 124 | **225** | 217 | 207 |
| both | 124 | **197** | 177 | 188 |
| both, slow travel | 124 | **181** | 162 | 178 |

Reactive wins all five. Foresight is worth **negative** value in every single configuration.

### Fix 4 — A different verb entirely: trailer dispatch
Replaced fixed departures with a player decision: trailers have capacity, you choose when to send them. Irreversible, made under uncertainty, with a real cost either way. This is the kind of decision that *should* resist greedy.

| Dispatch policy | Shipped | sd |
|---|---|---|
| Never dispatch (cutoffs only) | 174 | 10.5 |
| Send when full (greedy) | 177 | 9.3 |
| Surge-aware (send early to clear the gap before a wave) | 174 | 14.7 |

All three inside the noise band. **Never dispatching at all is statistically as good as optimal dispatch.**

---

## 4. Why this keeps happening

It isn't bad luck across four designs. It's structural.

The shift is a **queueing system with fully observable state, symmetric servers, and time constants shorter than the player's reaction loop.** For that class of system, greedy allocation is provably near-optimal. This is a control theory result, not a game design accident. Any verb of the form *"distribute a fixed resource among visible queues"* will land in the same place.

Put differently: **all the player's levers change the *distribution* of capacity, never the *total*.** And the outcome is nearly determined by the total.

---

## 5. The decisive test

If depth requires changing the total, then structural choices — the things a *build phase* controls — should dominate. Measured, holding the playstyle fixed at the best known policy:

| Structural change | Shipped | vs baseline |
|---|---|---|
| Down to 2 associates | 116 | **−39%** |
| Wider chute (2 → 3 crew per lane) | 134 | **−29%** |
| Shallow chutes (6 → 3) | 163 | −14% |
| Shorter belt (12 → 7) | 189 | 0% |
| Longer belt (12 → 24) | 188 | −1% |
| **BASELINE** | **189** | — |
| Second dock door (gap 18 → 8s) | 194 | +3% |
| Deeper chutes (6 → 12) | 201 | +6% |
| Deep chutes + second door | 206 | +9% |
| Powered loader (1.4 → 0.9s) | 208 | +10% |
| Hire a 4th associate | 208 | +10% |

**Structural swing: 79%. In-shift policy swing: 2%. Roughly 40x.**

And look at the two biggest losers, because they're the interesting part:

**"Wider chute" is a trap.** Allowing 3 crew at one chute *lowers* throughput by 29% — because with 3 associates total, the optimal policy piles all three onto one lane and starves the other three. An upgrade that sounds like a straight improvement is actively harmful given your crew count. **That is a real decision with a non-obvious answer.** There were none of those anywhere in the shift.

**Belt length does nothing** (±1%), while chute depth matters a lot (−14% to +6%). Not obvious in advance. Also a real decision.

---

## 6. What this means

I told you: *"build the shift loop first, fake the build phase, because the build phase is fun to design and easy to build, so it's a trap."*

**That was backwards.** The evidence says the shift is the part that can be faked, and the build phase is the part that carries the game.

This is consistent with every reference title, which I should have weighted more heavily:

- **Factorio, Satisfactory, shapez** — you build; the factory runs itself. Watching it run is *feedback*, not gameplay.
- **Parcel Simulator** — you inspect by hand, then automate. The automation design is the game.
- **Mini Motorways** — you draw roads. The cars drive themselves.

In every case the simulation running is the **scoreboard**, not the play. I built a scoreboard and went looking for a game inside it.

### What the shift is actually for

Don't throw it away — it just isn't the game. It's:

- the **readable consequence** of your layout, which is exactly what makes a builder satisfying
- the **pressure** that gives structural choices weight
- the **texture** — jams, no-reads, the 5pm cutoff — that makes it *your* warehouse rather than a generic factory

Keep the 3-minute shift. Demote it from "the game" to "the test your build has to pass."

### What I'd build next

A build phase where the decisions look like the table in section 5 — where "wider chute" is a trap unless you also hire, where chute depth and dock doors trade against each other, where an upgrade can make things worse. That table is a prototype design document. Every row is a decision with a non-obvious answer, which is precisely what the shift never had.

---

## 7. ADDENDUM — distance-based travel, and the one thing that worked

Jordan proposed travel time that scales with **distance across the floor**, not the flat cost I tested in Fix 1. That distinction turned out to matter, and it produced the only meaningful skill differential in the entire investigation.

*(Note: my first run of this test was wrong — I read a crew member's position after reassigning them, so distance collapsed to zero and travel was never charged. Fixed and re-run. The flat-travel results in Fix 1 used a different code path and are unaffected.)*

### It doesn't create anticipation

Pre-positioning for an incoming surge beat reacting by at most **+5.4%**, and only at near-degenerate settings (95% of freight to one lane, 17.5s to cross the floor). At 26s it went negative again. So the original thesis stays dead.

### It creates the opposite skill: restraint

Walking punishes *thrashing*. Measured, varying only how willing a policy is to reshuffle crew:

| Cross-floor walk | Thrash (moves) | Steady (moves) | Commit (moves) | Patient (moves) | Best |
|---|---|---|---|---|---|
| off | **235** (369) | 232 (174) | 229 (98) | 226 (57) | thrash |
| 3s | 200 (289) | 214 (145) | **217** (101) | 216 (56) | commit |
| 6s | 173 (264) | 191 (130) | 200 (92) | **207** (56) | patient |
| 10s | 147 (245) | 168 (121) | 177 (79) | **197** (53) | patient |

**Without walking, constant reshuffling is optimal. With walking, it's the worst thing you can do — patient play beats it by 20% at 6s and 34% at 10s.**

That's a 10-17x larger skill effect than anything measured in sections 2-5, and it's a genuine inversion: the correct play is the opposite of what the original design taught. We told the player to react fast and chase the fullest chute. The right answer is to pick positions and hold them, moving only when the gain clearly beats the walk.

It also **degrades gracefully into a decision**: the correct patience threshold depends on how far apart the chutes are. Which means the floor plan changes how you should play — the first real link between the build phase and the shift.

### Also confirmed: geometry matters more than play

In the same test, changing only the floor layout (evenly-spaced chutes vs two clustered pairs) moved static-play throughput from **182 to 131**. The layout swung the outcome roughly 10x harder than the planning skill did — consistent with section 5, and further evidence that structure is where the game lives.

### Current settings

`WALK_SPEED = 26` → about **3s between neighbouring chutes, 8s across the floor, 8.5s from the break room to lane D.** Chutes overflow in ~10s, so a cross-floor rescue is always marginal by design.

Re-benchmarked: passive **115**, committed play **184**, a **+60% skill gap** (was +2% before travel existed).

Both the walk speed and the layout are exposed in the lab. Longer walks make the skill more pronounced but lower total throughput — that's a feel question, not a math one, and it needs a human.

---

## 8. Confidence and limits

**Strong confidence:** the negative result. Four independent attempted fixes, ~60k simulated shifts, consistent direction, effect sizes far outside the noise bands.

**Caveats worth stating:**

- My policies are *good* but not provably optimal. A cleverer strategy might find depth I missed — though four attempts finding nothing is meaningful evidence against.
- I measured **throughput only.** A game can be enjoyable without strategic depth — reflex, rhythm, and texture are real pleasures, and Diner Dash sold millions on exactly that. If the shift is *fun* in your hands, that's evidence my metric doesn't capture. **Play it before you accept this.**
- The dispatch verb (Fix 4) was tested at one parameter set. Smaller trailers would make the decision bind more often. I judged further tuning low-value given the pattern, but it isn't exhausted.

**The one thing that would overturn this:** you play it and can't stop. Throughput is not the same as fun, and I can only measure the first one.
