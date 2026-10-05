# NPC policy selected on 2026-10-04 — release 165

User selected the combined experimental adjustments for Easy and Normal and the
currently published v164 Expert policy. This supersedes acceptance of the combined
Expert variant. Expert's experimental clandestine fix is not part of this selection.

Easy and Normal remove the extra planner preference for intrusion over collection
and use government diplomacy on advanced local dossiers when a currently available
mission gains success probability. They preserve 50 confidence before turn 23 and
10 thereafter. Government medical/funding priority and the shared cooldown remain.
Expert retains the exact published policy. No action rules, prices, income, travel
risks, threat windows, rosters or hidden bonuses were changed.

| Level | Collective victory | Crisis defeat | Turn-30 defeat | Seeds |
|---|---:|---:|---:|---|
| Easy | 20.3% | 25.5% | 54.2% | 30001–31000 |
| Normal | 33.9% | 14.8% | 51.3% | 10001–11000 |
| Expert | 54.6% | 9.8% | 35.6% | 100001–101000 |

Integration replay: 1,000 all-NPC campaigns per level, initial country rotating
by seed modulo six, roster p0/p12/p13/p14, balanced strategy; every terminal save
validated. These are acceptance seed replays, not independent estimates of human play.
All counts exactly match their selected references. An additional 100 paired Expert
campaigns (100001–100100) match the published engine at every turn, including full state.

Validation: existing 371 tests pass, plus 3 new targeted policy regression tests.
`tests/accepted-npc-policy.test.js` covers useful diplomacy, confidence reserves,
no-effect purchases and difficulty-specific collection preference.
Reproduction: `node scripts/verify-selected-npc-policy.mjs dist/client/engine.js LEVEL`.

Prepared for release 165 with aligned cache-busting references and patch notes.
Publication authorized by the user on 2026-10-04.
