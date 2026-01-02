import { useState, useEffect, useRef } from 'react'

/**
 * GoalTicker - A scrolling ticker that shows live scores and announces goals
 * - During breaks: Shows "Semi-finals Next..." or similar
 * - During live rounds: Scrolls through all match scores
 * - When a goal is scored: Flashes the goal announcement, then returns to scores
 */
export default function GoalTicker({
    goalEvents = [],
    matches = [],
    isLive = false,
    isBreak = false,
    currentRound = '',
    nextRound = ''
}) {
    const [goalAnnouncement, setGoalAnnouncement] = useState(null)
    const [showGoal, setShowGoal] = useState(false)
    const lastGoalCountRef = useRef(0)

    // Filter to only goal events
    const goals = goalEvents.filter(e =>
        ['goal', 'penalty_scored', 'shootout_goal', 'penalty_goal'].includes(e.type || e.event_type)
    )

    // Get live matches with scores
    const liveMatches = matches.filter(m =>
        ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME_1', 'EXTRA_TIME_2', 'PENALTIES', 'HALFTIME', 'ET_HALFTIME'].includes(m.state)
    )

    // Detect new goal and show announcement
    useEffect(() => {
        if (goals.length > lastGoalCountRef.current && goals.length > 0) {
            const latestGoal = goals[goals.length - 1]
            const announcement = formatGoalAnnouncement(latestGoal)
            if (announcement) {
                setGoalAnnouncement(announcement)
                setShowGoal(true)

                // Hide goal announcement after 6 seconds and return to scores
                const timer = setTimeout(() => {
                    setShowGoal(false)
                    setGoalAnnouncement(null)
                }, 6000)

                return () => clearTimeout(timer)
            }
        }
        lastGoalCountRef.current = goals.length
    }, [goals.length])

    // Format goal announcement
    const formatGoalAnnouncement = (goal) => {
        if (!goal) return null

        const scoringTeam = goal.teamId === goal.homeTeam?.id
            ? goal.homeTeam
            : goal.awayTeam

        const scoringTeamName = scoringTeam?.name || goal.team_name || 'Team'
        const homeScore = goal.score?.home ?? 0
        const awayScore = goal.score?.away ?? 0
        const homeTeamName = goal.homeTeam?.name || 'Home'
        const awayTeamName = goal.awayTeam?.name || 'Away'
        const isPenalty = goal.type === 'penalty_scored' || goal.type === 'penalty_goal'
        const isShootout = goal.type === 'shootout_goal'

        let announcement = ''
        if (homeScore === awayScore) {
            announcement = `${scoringTeamName} have equalized!`
        } else if (
            (goal.teamId === goal.homeTeam?.id && homeScore > awayScore) ||
            (goal.teamId === goal.awayTeam?.id && awayScore > homeScore)
        ) {
            if (Math.abs(homeScore - awayScore) === 1 && (homeScore + awayScore) > 1) {
                announcement = `${scoringTeamName} take the lead!`
            } else {
                announcement = `${scoringTeamName} have scored!`
            }
        } else {
            announcement = `${scoringTeamName} have scored!`
        }

        if (isShootout) {
            announcement = `${scoringTeamName} score in the shootout!`
        } else if (isPenalty) {
            announcement = `${scoringTeamName} score from the spot!`
        }

        return {
            announcement,
            score: `${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName}`,
            scoringTeamName,
            minute: goal.minute,
            playerName: goal.displayName || goal.player_name,
        }
    }

    // During break periods - show next round
    if (isBreak && nextRound) {
        return (
            <div className="relative overflow-hidden mb-4">
                <div className="relative rounded-xl px-4 py-3 border shadow-lg
                       bg-gradient-to-r from-accent/10 via-card to-accent/10 
                       border-accent/20 shadow-accent/5">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏟️</span>
                        <div className="w-px h-8 bg-accent/30" />
                        <div className="flex items-center gap-3">
                            <span className="text-accent font-bold text-lg tracking-wide">
                                {nextRound} Next...
                            </span>
                            <span className="text-text-muted text-sm">
                                Matches starting soon
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Not live and not break - don't show
    if (!isLive) {
        return null
    }

    // Live mode - show goal announcement or scrolling scores
    return (
        <div className="relative overflow-hidden mb-4">
            <div className={`relative rounded-xl px-4 py-3 border shadow-lg transition-all duration-300
                     ${showGoal
                    ? 'bg-gradient-to-r from-live/20 via-live/10 to-live/20 border-live/30 shadow-live/10'
                    : 'bg-gradient-to-r from-primary/10 via-card to-primary/10 border-primary/20 shadow-primary/5'}`}>

                {/* Icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className={`text-2xl ${showGoal ? 'animate-bounce' : ''}`}>
                        {showGoal ? '⚽' : '📺'}
                    </span>
                    <div className={`w-px h-8 ${showGoal ? 'bg-live/30' : 'bg-primary/30'}`} />
                </div>

                {/* Content area */}
                <div className="ml-14">
                    {showGoal && goalAnnouncement ? (
                        // Goal Announcement Mode
                        <div className="animate-slide-up">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-live font-bold text-lg tracking-wide animate-pulse">
                                    GOAL!
                                </span>
                                <span className="text-text font-semibold">
                                    {goalAnnouncement.announcement}
                                </span>
                                {goalAnnouncement.minute && (
                                    <span className="text-text-muted text-sm">
                                        ({goalAnnouncement.minute}')
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className="font-mono font-bold text-primary">
                                    {goalAnnouncement.score}
                                </span>
                                {goalAnnouncement.playerName && (
                                    <>
                                        <span className="text-text-muted">•</span>
                                        <span className="text-text-muted italic">
                                            {goalAnnouncement.playerName}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Scrolling Scores Mode
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                                <span className="text-primary font-bold shrink-0 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-live animate-pulse" />
                                    LIVE
                                </span>
                                <span className="text-text-muted shrink-0">|</span>

                                {liveMatches.length > 0 ? (
                                    <div className="overflow-hidden flex-1">
                                        <div className="flex gap-6 animate-scroll-left">
                                            {/* First set of scores */}
                                            {liveMatches.map((match, idx) => (
                                                <ScoreItem key={idx} match={match} />
                                            ))}
                                            {/* Duplicate for seamless loop */}
                                            {liveMatches.map((match, idx) => (
                                                <ScoreItem key={`dup-${idx}`} match={match} />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-text-muted text-sm">
                                        {currentRound} in progress...
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pulsing glow effect for goals */}
            {showGoal && (
                <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(255, 77, 106, 0.15) 0%, transparent 70%)',
                        animation: 'pulse-glow 1s ease-in-out infinite',
                    }}
                />
            )}
        </div>
    )
}

// Individual score item for scrolling ticker
function ScoreItem({ match }) {
    const homeTeam = match.homeTeam?.name || 'Home'
    const awayTeam = match.awayTeam?.name || 'Away'
    const homeScore = match.score?.home ?? 0
    const awayScore = match.score?.away ?? 0

    return (
        <span className="whitespace-nowrap text-sm flex items-center gap-2 shrink-0">
            <span className="font-semibold text-text">{homeTeam}</span>
            <span className="font-mono font-bold text-primary">{homeScore} - {awayScore}</span>
            <span className="font-semibold text-text">{awayTeam}</span>
        </span>
    )
}
