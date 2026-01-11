# Backend Bug Report: Semi-Finals Matches Not Starting Simultaneously

## Problem Summary
During knockout tournament rounds (particularly Semi-Finals), only ONE match starts and plays through while the other match(es) in the same round remain in `SCHEDULED` state. All matches in a knockout round should start and play simultaneously.

## Evidence from Live API

When querying `/api/live/fixtures` during the Semi-Finals round, the API returns:

```json
{
  "fixture 441": {
    "state": "HALFTIME",
    "minute": 45,
    "teams": "Mega City Two vs Mega City One"
  },
  "fixture 442": {
    "state": "SCHEDULED",
    "minute": 0,
    "teams": "Green Bay vs Port Hilo"
  }
}
```

**Problem**: Fixture 441 is at halftime (45 minutes played) while fixture 442 hasn't even started - it's still `SCHEDULED` with `minute: 0`.

## Expected Behavior
When a round starts (e.g., Semi-Finals at :30):
1. ALL matches in that round should transition from `SCHEDULED` to `FIRST_HALF` simultaneously
2. ALL matches should receive `match_start` SSE events at the same time
3. ALL matches should progress through the game (minute ticks, goals, halftime, etc.) in parallel
4. The round should only complete when ALL matches have finished

## Current (Buggy) Behavior
1. Only ONE match per round starts playing
2. Other matches stay in `SCHEDULED` state indefinitely
3. The second semi-final never starts while the first one plays out
4. This causes the frontend to correctly show "Upcoming" for matches that the backend hasn't started

## Investigation Areas

### 1. Match Initialization Logic
Look for code that starts matches when a round begins. Check if:
- There's a loop that should iterate over ALL matches in the round
- The loop might be breaking early or only processing the first match
- There might be an `await` inside a loop causing sequential instead of parallel execution

### 2. Round State Machine
Check the tournament state transitions:
- `SETUP` → `ROUND_OF_16` → `QF_BREAK` → `QUARTER_FINALS` → `SF_BREAK` → `SEMI_FINALS` → `FINAL_BREAK` → `FINAL` → `RESULTS`

When transitioning to a playing state (e.g., `SEMI_FINALS`), ensure ALL fixtures for that round are started.

### 3. Match Simulation Loop
If using a game loop or interval to simulate matches:
- Check if it's only updating ONE match per tick
- Should be updating ALL active matches per tick
- Might need `Promise.all()` for parallel processing

### 4. SSE Event Broadcasting
Verify that `match_start` events are being sent for ALL matches in a round, not just the first one.

## Likely Code Patterns to Fix

### Pattern 1: Sequential await in loop (BAD)
```javascript
// BAD - processes matches one at a time
for (const match of roundMatches) {
  await startMatch(match);  // This waits for each match to complete!
}
```

### Fix: Parallel processing
```javascript
// GOOD - starts all matches simultaneously
await Promise.all(roundMatches.map(match => startMatch(match)));
```

### Pattern 2: Only starting first match
```javascript
// BAD - only starts the first match
const match = roundMatches[0];
await startMatch(match);
```

### Fix: Start all matches
```javascript
// GOOD - starts all matches
for (const match of roundMatches) {
  startMatch(match);  // No await, or use Promise.all
}
```

### Pattern 3: Game loop only processing one match
```javascript
// BAD - only updates first active match
const activeMatch = getActiveMatch();
simulateTick(activeMatch);
```

### Fix: Process all active matches
```javascript
// GOOD - updates all active matches
const activeMatches = getActiveMatches();
activeMatches.forEach(match => simulateTick(match));
```

## Files to Investigate
Look for files/functions related to:
- Tournament state management
- Round initialization/starting
- Match simulation loop
- Match state transitions
- SSE event broadcasting

Common file names might include:
- `tournament.js`, `tournament-controller.js`
- `match.js`, `match-simulation.js`
- `round.js`, `round-manager.js`
- `game-loop.js`, `simulation.js`

## Verification Steps After Fix
1. Start a new tournament
2. When Semi-Finals begin, verify BOTH matches show `state: "FIRST_HALF"`
3. Both matches should have incrementing `minute` values
4. Both matches should receive goals, events, etc. in parallel
5. Verify SSE stream sends events for BOTH matches

## Additional Notes
- The frontend is correctly displaying what the backend sends
- This is NOT a frontend bug - the frontend shows "Upcoming" because the backend literally says `state: "SCHEDULED"`
- The fix needs to ensure all matches in a round start and run in parallel

-------------------------------------------

## Bug: Next Round Starts Before Current Round Matches Finish

### Problem
When a knockout tournament match goes into extra time and penalties, it takes longer to complete than matches ending in regular time. The backend is starting the next round BEFORE all matches in the current round have finished. This causes the frontend to show some matches as "draws" because:

1. Match is still in PENALTIES state when next round starts
2. The `match_end` event (with `winnerId`) hasn't been sent yet
3. Frontend shows tied regular-time scores without a winner

### Expected Behavior
The next round should ONLY start once ALL matches in the current round have `state === 'FINISHED'` and have sent their `match_end` SSE events with `winnerId`.

### Fix Required
Before transitioning to the next round state (e.g., from ROUND_OF_16 to QF_BREAK), add a check:

```javascript
// Pseudocode
const allMatchesFinished = currentRoundMatches.every(match => 
  match.state === 'FINISHED' && match.winnerId != null
)

if (!allMatchesFinished) {
  // Do NOT advance to next round yet
  // Wait for extra time / penalty matches to complete
  return
}

// Only proceed when ALL matches are done
advanceToNextRound()
```

**Status:** Backend fix was implemented ✅

-------------------------------------------

## Frontend Fix: Winner Detection for Extra Time + Penalty Matches (2026-01-05)

### Problem
Even after the backend fix, matches that went to extra time + penalty shootouts were still showing as "draws" in the frontend. The issue was that multiple frontend components were determining the winner using **only score comparisons** without checking the `winnerId` field that the backend provides.

For example, a match ending 1-1 after extra time with penalties 4-3 would:
- Have `score: { home: 1, away: 1 }` (tied)
- Have `penaltyScore: { home: 4, away: 3 }` 
- Have `winnerId` set to the home team's ID

But the frontend was checking `score.home > score.away` first, seeing a tie, and then sometimes not correctly handling the penalty logic.

### Components Fixed

1. **`RoundSection.jsx` - MatchCard component**
   - Added extraction of `winnerId` and `winner` from match object
   - Changed winner detection to check `winnerId` first before score comparisons

2. **`FixtureList.jsx` - MatchCard component**
   - Same fix as RoundSection.jsx

3. **`FixtureCard.jsx`**
   - Added support for `winner_id`, `winnerId`, and penalty scores
   - Changed winner detection to prioritize `winnerId`

4. **`useLiveStore.js` - resolveTeamsFromBracket helper**
   - Enhanced `getWinnerTeam` to check `match.winner?.id` as fallback to `winnerId`

### The Fix Pattern
```javascript
// OLD (buggy) - only checks scores
const homeWon = isFinished && (
  (score?.home > score?.away) || 
  (score?.home === score?.away && penaltyScore?.home > penaltyScore?.away)
)

// NEW (fixed) - checks winnerId first
const resolvedWinnerId = winnerId || winner?.id
let homeWon = false
let awayWon = false

if (isFinished) {
  // First check explicit winnerId from backend (handles penalties correctly)
  if (resolvedWinnerId) {
    homeWon = homeTeam?.id === resolvedWinnerId
    awayWon = awayTeam?.id === resolvedWinnerId
  } 
  // Fall back to score comparison if no winnerId
  else {
    homeWon = (score?.home > score?.away) || 
      (score?.home === score?.away && penaltyScore?.home > penaltyScore?.away)
    awayWon = (score?.away > score?.home) || 
      (score?.home === score?.away && penaltyScore?.away > penaltyScore?.home)
  }
}
```

**Status:** Frontend fix implemented ✅

-------------------------------------------

## Additional Frontend Fixes (2026-01-05, Round 2)

After further debugging, more critical bugs were discovered:

### Bug 1: winnerId Lost During Data Merging
**Problem:** When polling data was merged with SSE-updated state, the merge logic preserved `state`, `minute`, `score`, and `penaltyScore`, but **NOT `winnerId`**. This caused the winner to be forgotten after each poll.

**Fix:** Updated `useLiveStore.js` merge logic to also preserve `winnerId` and `winner` fields.

### Bug 2: Teams Not Sent to Next Round After SSE Events
**Problem:** The `resolveTeamsFromBracket` function (which propagates winners to next-round fixtures) was only called once during polling. It was NOT called after SSE `match_end` or `shootout_end` events.

**Result:** Even when a match finished via SSE, the winner wouldn't appear in the next round until the next poll cycle (8 seconds later), IF that poll also had the winner data.

**Fix:** Modified `match_end`/`shootout_end` handler to call `resolveTeamsFromBracket` after updating the fixture.

### Bug 3: Type Mismatch in ID Comparisons
**Problem:** SSE events might send team IDs as strings (e.g., `"1"`) while the API returns numbers (e.g., `1`). Using strict equality (`===`) caused comparisons to fail silently.

**Fix:** Changed all `winnerId` comparisons to use loose equality (`==`).

**Status:** All fixes implemented ✅