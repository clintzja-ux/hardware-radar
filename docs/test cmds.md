From now on, run the tests from that folder:

cd C:\Projects\hardware-radar\hardware-radar
node public\data\sentinel\tests\run-all-tests.mjs


When we eventually have a durable acceptance state containing an observation, export it with:

npm run review:export -- <acceptance-state.json> <observationId>

By default the bundle is written into:

.forge-review/

which FM003 adds to .gitignore.

The local workflow is therefore:

Forge review
    ↓
Download Decision
    ↓
review decision JSON
    ↓
npm run review:record
    ↓
Durable review history

The recording command is:

npm run review:record -- <acceptance-state.json> <review-state.json> <decision.json>