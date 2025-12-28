export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <div className="skeleton h-12 w-12 rounded-full mx-auto mb-2" />
          <div className="skeleton h-4 w-24 mx-auto rounded" />
        </div>
        <div className="skeleton h-10 w-16 rounded" />
        <div className="flex-1 text-center">
          <div className="skeleton h-12 w-12 rounded-full mx-auto mb-2" />
          <div className="skeleton h-4 w-24 mx-auto rounded" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTeamCard({ className = '' }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="skeleton h-14 w-14 rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-5 w-32 mb-2 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="skeleton h-12 rounded-lg" />
        <div className="skeleton h-12 rounded-lg" />
        <div className="skeleton h-12 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3, type = 'card' }) {
  const Component = type === 'team' ? SkeletonTeamCard : SkeletonCard
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  )
}

