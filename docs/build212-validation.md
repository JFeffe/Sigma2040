# Build 212 — Cooperative campaign

New cooperative campaigns require three dismantled cells plus the Architect's arrest. Three cells reveal the Architect; four distinct authentic verified dossiers remain an alternate discovery path. Safehouses and active country hack bonuses are shared. Hack sources retain their owner, duration, cancellation and refund. Diplomacy, budgets, modules and agent control remain individual.

New coop pressure: 35 turns, +2 crisis each turn, +5 per successful attack. The 22 initially scheduled attacks are unchanged and end at T30; enemy adaptations can still delay them. The new coopCampaignRules marker preserves existing saves' objectives, pressure and support ownership. Regular/advanced campaigns retain existing behavior.

Validation:
- npm test: 618 tests passed, including new shared-support, cancellation, migration, campaign-limit and multiplayer-projection coverage.
- 60 paired BB1 campaigns (indices 900–959, seed = 330001 + index × 7919) reproduced the experimental candidate's recorded results exactly, with JSON save/reload after every turn.
- Browser preview: build label 212, new cooperative briefing, draft, campaign launch at T1/35, +2 crisis per turn, 0/3 objective, and Architect discovery instructions.
- Existing deterministic Easy/Normal/Expert fixtures pass unchanged.

The earlier laboratory's 300 paired BB1 scenarios at indices 900–1199 produced 51 wins at T30 and 183 at T35 with +5 attack/+2 turn pressure. This is evidence for human playtesting, not a prediction of human win rate. Start a new cooperative campaign to test these rules.
