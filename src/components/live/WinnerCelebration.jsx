import { useEffect, useState } from 'react'

// Confetti particle component
function ConfettiParticle({ delay, color, left }) {
  return (
    <div
      className="fixed w-3 h-3 pointer-events-none z-50"
      style={{
        left: `${left}%`,
        top: '-20px',
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
        animation: `confetti ${2 + Math.random() * 2}s ease-out ${delay}s forwards`,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  )
}

export default function WinnerCelebration({ winner, runnerUp, show = true, onClose }) {
  const [confetti, setConfetti] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  const colors = ['#00e5a0', '#ffd700', '#ff6b35', '#4dffc3', '#fff']

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
      }))
      setConfetti(particles)
      
      // Trigger visibility with slight delay for animation
      setTimeout(() => setIsVisible(true), 100)
    }
  }, [show])

  if (!show || !winner) return null

  return (
    <>
      {/* Confetti */}
      {confetti.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          delay={particle.delay}
          color={particle.color}
          left={particle.left}
        />
      ))}

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-bg/90 backdrop-blur-md z-40 transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Celebration Modal */}
      <div className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}>
        <div 
          className={`
            relative max-w-lg w-full bg-card rounded-3xl border border-gold/30 p-8 text-center
            glow-gold transform transition-all duration-700
            ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}
          `}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card-hover flex items-center justify-center text-text-muted hover:text-text transition-colors"
          >
            ✕
          </button>

          {/* Trophy */}
          <div className="relative mb-6">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-400 via-gold to-yellow-500 flex items-center justify-center text-7xl animate-bounce-in shadow-2xl shadow-gold/30">
              🏆
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full trophy-shine" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold mb-2 animate-slide-up stagger-1">
            <span className="text-gradient-gold">CHAMPIONS!</span>
          </h2>
          
          <p className="text-text-muted mb-6 animate-slide-up stagger-2">
            Tournament Complete
          </p>

          {/* Winner */}
          <div className="bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 rounded-2xl p-6 mb-4 border border-gold/20 animate-slide-up stagger-3">
            <p className="text-sm text-gold mb-2 font-semibold uppercase tracking-wider">Winner</p>
            <h3 className="text-2xl font-bold text-text">
              {winner?.name || winner}
            </h3>
          </div>

          {/* Runner Up */}
          {runnerUp && (
            <div className="bg-card-hover rounded-2xl p-4 mb-6 animate-slide-up stagger-4">
              <p className="text-sm text-text-muted mb-1">Runner-up</p>
              <h4 className="text-lg font-semibold text-text">
                {runnerUp?.name || runnerUp}
              </h4>
            </div>
          )}

          {/* Congratulations message */}
          <p className="text-text-muted text-sm animate-slide-up stagger-5">
            Congratulations to <span className="text-primary font-semibold">{winner?.name || winner}</span> for winning the tournament!
          </p>

          {/* Continue button */}
          <button 
            onClick={onClose}
            className="mt-6 btn btn-primary w-full animate-slide-up stagger-6"
          >
            Continue Watching
          </button>
        </div>
      </div>
    </>
  )
}


