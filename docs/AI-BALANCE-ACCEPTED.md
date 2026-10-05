# Accepted NPC difficulty balance — release 163

Accepted by the user on 2026-10-03 (America/Toronto). This change integrates the
three experimental policies into the shared `planFaction` used by solo and
multiplayer NPCs. The difficult level retains the saved identifier `expert` and
the existing menu label **Expert**.

| Level | Collective victory | Crisis defeat | Turn-30 defeat | Acceptance seeds |
|---|---:|---:|---:|---|
| Easy | 17.7% | 38.9% | 43.4% | 30001–31000 |
| Normal | 35.4% | 34.5% | 30.1% | 10001–11000 |
| Expert / Difficult | 64.0% | 17.8% | 18.2% | 100001–101000 |

Each row contains 1,000 all-NPC games: balanced strategy, initial player country
rotating by seed modulo six, initial roster p0/p12/p13/p14, native NPC recruitment,
maximum 30 turns. These are different seed batches. They measure collective
outcomes, not human ranking or prestige competition. User accepted up to 65%
collective victories for Difficult. No further tuning is included.

## Policy changes

- Easy: limited case continuity, critical protection and arrest boosts, and relay
  use for prepared cases. Other automatic technology purchases remain disabled.
- Normal: victory objectives, continuity, second collection while verification is
  running, selective investigation boosts, earlier analysis/logistics support.
- Difficult: builds on Normal with resource management, specialist analyst choice,
  more tolerance of fatigue/exposure on decisive operations, emergency protection,
  and continued investment in advanced cases. A colleague with higher composure
  can reinforce an already prepared dossier; this reinforcement is not permitted
  on an unprepared dossier. Existing local teammates may prepare and locate in
  parallel. Extra cells lose priority after two cells have been dismantled.

Common game rules, probabilities, costs, prestige, initial rosters, save fields,
and human control are unchanged. Existing saves retain their difficulty and
already assigned orders; future NPC decisions use the new policy.

## Historical baseline

Release 164 changes threat visibility and relocation timing. The figures above
remain release-163 acceptance results, not a forecast for later rule sets.

## Verification

`npm test` covers the shared engine and multiplayer integration. Updated obsolete
assertions: Easy now uses selective paid boosts; Normal permits parallel collection
while analysis is active; an NPC may finish every one-turn order and therefore have
no pending task after advancing a turn. The multiplayer test checks actual activity
and verifies that idle human teams received no automatic orders.

Run `node scripts/verify-accepted-ai.mjs` to replay all three original acceptance
batches. It asserts the exact 1,000-game outcome counts above and validates every
final save. This is an integration replay, not a new independent balance estimate.

The planner was copied from the accepted `hard-calibration/engine-prepared.mjs`
experiment. Experiments with stricter reinforcement after the accepted 64% result
are deliberately excluded. Publication authorized by the user on 2026-10-03. Release 163 includes the
accepted policies; earlier patch-note entries are preserved.
