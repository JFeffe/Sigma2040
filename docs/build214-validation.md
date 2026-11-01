# Build 214 — Bot Brillant 2

BB1 is restored byte-for-byte from published build 213 except cache-busting imports. The audited and improved planner is exposed separately as BB2 with separate `bb2` memory. New solo campaigns and lobbies default to BB2. Easy/Normal/Expert are no longer selectable and their planner implementation is removed; old saved difficulties migrate to BB1, while existing BB1 games remain BB1. Tutorials retain BB1.

BB2 prioritizes terminal arrests and preventable fatal attacks, coordinates allied evidence and deployments, shares one standing cooperative verifier, and skips redundant verification when a case already has an admissible verified proof. No mission chances, costs or campaign rules change.

Historical benchmark files retain their original BB1 working-name labels. They describe the development of the planner now called BB2. Run `node scripts/benchmark-bb2.mjs cooperative 300 900` for the integrated planner; the older script explicitly runs preserved BB1.

Tests exclusively covering the removed Easy/Normal/Expert policies (`accepted-npc-policy`, `continuity162`, `npc160`, old difficulty scoring and legacy campaign hashes) are retired and remain in Git history. BB1 unit/support tests stay intact. BB2 priority and investigation tests are separate. Integration tests cover both selectable bots, independent memory, equal starting probabilities/resources, save migration and host-only selection.

Browser preview: build 214, BB1 and BB2 only, BB2 selected by default. The old cooperative save remains BB1 with its original 35-turn rules.

Final validation: `npm test` — 620 passed, 0 failed. `git diff --check` clean.
