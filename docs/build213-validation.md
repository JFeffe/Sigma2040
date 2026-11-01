# Build 213 — Cooperative pressure restored

New cooperative campaigns use 30 turns, +3 crisis per turn and +30 per successful enemy attack. The victory/revelation threshold remains three dismantled cells, with the Architect's arrest also required for victory. Shared investigations, contacts, mandates, safehouses and country hack bonuses remain enabled; diplomacy and budgets remain individual.

The coopCampaignRules marker is now 2 for new games. Marker 1 preserves build 212's 35/+2/+5 settings. Older unmarked campaigns retain their original behavior. Player projections preserve the exact marker.

Validation: npm test — 622 tests passed. Coverage checks actual attack/turn crisis deltas, the T30 deadline, old-save compatibility, multiplayer projections, shared support and the unchanged 22-attack schedule with five-turn warning. Browser preview confirmed build 213 and the new cooperative briefing; the previous test save still displays T1/35.

Initial calendar: Janus T3/9/15/21/27; Prisme T5/11/17/23/29; Cendre T7/13/19/25; Eclipse T6/12/18/24/30; Architect T16/22/28. Existing threat adaptation and cancellation rules are unchanged.
