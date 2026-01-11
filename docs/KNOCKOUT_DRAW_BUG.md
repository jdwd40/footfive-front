# Critical Backend Bug: Knockout Matches Ending as Draws Without Penalties

## Summary

Knockout tournament matches are finishing with tied scores (e.g., 1-1) without going to extra time or penalties, and without setting a `winnerId`. This breaks the entire tournament bracket because subsequent fixtures cannot determine their team assignments.

---

## Observed Behavior

### Example from Live Data (Tournament #635700880)

```
Fixture 935 (QF4 - Quarter-Final 4):
  - homeTeam: Outside City
  - awayTeam: Virgin City
  - state: "FINISHED"
  - score: { home: 1, away: 1 }
  - penaltyScore: { home: 0, away: 0 }  ← Penalties never happened!
  - winnerId: null  ← NO WINNER SET!
```

### Resulting Problems

1. **SF2 (Semi-Final 2)** cannot start:
   - `homeTeam: Metro City` (from QF3 winner)
   - `awayTeam: null (TBD)` ← Should be QF4 winner, but there is no winner!

2. **FINAL** cannot start:
   - `homeTeam: Redstone City` (from SF1 winner)
   - `awayTeam: null (TBD)` ← Waiting for SF2 winner

3. **Tournament is stuck** in `FINAL` state but no matches can proceed.

---

## Expected Behavior

In a knockout tournament, **draws are not allowed**. When regulation time ends with a tied score:

1. **Extra Time** should be played (2 × 15 minutes)
2. If still tied after extra time, **Penalty Shootout** should occur
3. Match should ONLY transition to `FINISHED` state AFTER a winner is determined
4. `winnerId` MUST be set to the winning team's ID

### Correct Data Example

```javascript
// After a match going to penalties
{
  fixtureId: 935,
  state: "FINISHED",
  score: { home: 1, away: 1 },        // Regular time score (tied)
  penaltyScore: { home: 4, away: 3 }, // Penalty result
  winnerId: 5,                         // Home team won on penalties
  homeTeam: { id: 5, name: "Outside City" },
  awayTeam: { id: 8, name: "Virgin City" }
}
```

---

## Root Cause Analysis

The match simulation logic is likely doing something like this:

### BUGGY CODE (Pseudocode)
```javascript
// In match simulation or game loop
function endMatch(match) {
  match.state = 'FINISHED'
  
  // BUG: Only sets winnerId if there's a score difference
  if (match.score.home > match.score.away) {
    match.winnerId = match.homeTeam.id
  } else if (match.score.away > match.score.home) {
    match.winnerId = match.awayTeam.id
  }
  // BUG: Falls through with winnerId = null when tied!
  
  saveMatch(match)
  broadcastMatchEnd(match)
}
```

### CORRECT CODE (Pseudocode)
```javascript
function endRegularTime(match) {
  if (match.score.home !== match.score.away) {
    // Clear winner - finish match
    match.winnerId = match.score.home > match.score.away 
      ? match.homeTeam.id 
      : match.awayTeam.id
    match.state = 'FINISHED'
    return finishMatch(match)
  }
  
  // Scores are tied - MUST go to extra time for knockout matches
  if (match.isKnockout) {
    return startExtraTime(match)  // Don't finish yet!
  }
}

function endExtraTime(match) {
  if (match.score.home !== match.score.away) {
    // Winner decided in extra time
    match.winnerId = match.score.home > match.score.away 
      ? match.homeTeam.id 
      : match.awayTeam.id
    match.state = 'FINISHED'
    return finishMatch(match)
  }
  
  // Still tied - MUST go to penalties
  return startPenaltyShootout(match)
}

function endPenaltyShootout(match) {
  // Penalties ALWAYS have a winner
  match.winnerId = match.penaltyScore.home > match.penaltyScore.away
    ? match.homeTeam.id
    : match.awayTeam.id
  match.state = 'FINISHED'
  return finishMatch(match)
}

function finishMatch(match) {
  // CRITICAL VALIDATION
  if (match.isKnockout && !match.winnerId) {
    throw new Error(`Knockout match ${match.id} cannot finish without a winner!`)
  }
  
  saveMatch(match)
  broadcastMatchEnd(match)
  
  // Propagate winner to next fixture
  propagateWinnerToBracket(match)
}
```

---

## Areas to Investigate

### 1. Match State Machine
Look for the logic that transitions match states:
- `FIRST_HALF` → `HALFTIME` → `SECOND_HALF` → `???`

The bug is likely in the transition from `SECOND_HALF` to the next state:
- Should go to `EXTRA_TIME_1` if tied AND knockout
- Should go to `FINISHED` only if there's a score difference

### 2. Match Simulation Loop
Check the game loop that runs the match:
- Is there a check for `isKnockout` or `round !== 'group'`?
- Is the fulltime handler checking for draws?

### 3. SSE Event Broadcasting
Check if the `match_end` event is sent prematurely:
- Is `match_end` sent before penalties are complete?
- When is `winnerId` set in the event payload?

### 4. Tournament State Transitions
The tournament advanced to `FINAL` state even though QF4 had no winner:
- Is the round completion check only counting `FINISHED` matches?
- It should also verify all matches have a `winnerId`

---

## Files Likely Involved

Based on common patterns, check these areas:

```
backend/
├── src/
│   ├── simulation/
│   │   ├── MatchSimulator.js      ← Match simulation logic
│   │   ├── SimulationEngine.js    ← Game loop controller
│   │   └── PenaltyShootout.js     ← Penalty logic (may be missing?)
│   ├── tournament/
│   │   ├── TournamentManager.js   ← Round transitions
│   │   ├── BracketManager.js      ← Team propagation
│   │   └── MatchManager.js        ← Match lifecycle
│   ├── models/
│   │   └── Match.js               ← Match state machine
│   └── events/
│       └── MatchEvents.js         ← SSE event handlers
```

---

## Validation Tests

After fixing, verify these scenarios:

### Test 1: Regular Time Winner
- Match ends 2-1
- `winnerId` should be set immediately
- Winner should propagate to next fixture

### Test 2: Extra Time Winner
- Regulation ends 1-1
- Extra time ends 2-1
- `winnerId` should be set
- `penaltyScore` should still be `{ home: 0, away: 0 }`

### Test 3: Penalty Shootout Winner
- Regulation ends 1-1
- Extra time ends 1-1
- Penalties end 4-3
- `winnerId` should be set to penalty winner
- Both `score` (1-1) and `penaltyScore` (4-3) should be preserved

### Test 4: Round Cannot Advance Without Winners
- If any match in a round has `winnerId: null`
- Tournament should NOT advance to next round state
- Should log an error or retry the broken match

---

## Quick Fix (If Needed for Corrupted Data)

If you need to fix an already-corrupted tournament, you could:

```javascript
// Emergency fix for stuck matches
async function fixStuckKnockoutMatch(fixtureId) {
  const match = await Match.findById(fixtureId)
  
  if (match.state === 'FINISHED' && !match.winnerId) {
    // Randomly assign winner (or flip a coin)
    match.winnerId = Math.random() > 0.5 
      ? match.homeTeam.id 
      : match.awayTeam.id
    
    // Mark as decided by penalties
    match.penaltyScore = { home: 4, away: 3 }
    if (match.winnerId === match.awayTeam.id) {
      match.penaltyScore = { home: 3, away: 4 }
    }
    
    await match.save()
    
    // Trigger bracket recalculation
    await propagateWinnerToBracket(match)
  }
}
```

---

## Summary

| What's Wrong | What Should Happen |
|--------------|-------------------|
| Match ends 1-1 with `winnerId: null` | Extra time → Penalties → Winner set |
| `penaltyScore: { home: 0, away: 0 }` | Actual penalty scores recorded |
| Next round fixture has `awayTeam: null` | Winner propagated to next fixture |
| Tournament stuck in `FINAL` state | All fixtures playable, tournament completes |

**Priority: CRITICAL** - This bug breaks the entire tournament flow.
