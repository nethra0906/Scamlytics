/**
 * Skeleton.jsx — Animated skeleton loader components for loading states.
 * 
 * Usage:
 *   <SkeletonStat />          — For dashboard stat cards while loading
 *   <SkeletonText lines={3} /> — For text blocks
 *   <SkeletonCard />           — Generic card placeholder
 */

/** Base shimmer style — pure CSS, no Tailwind animation dependency */
function Shimmer({ className = "", style = {} }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            #151e2f 25%,
            #1f2937 50%,
            #151e2f 75%
          );
          background-size: 800px 100%;
          animation: skeleton-shimmer 1.6s ease-in-out infinite;
          border-radius: 0.375rem;
        }
      `}</style>
      <div className={`skeleton-shimmer ${className}`} style={style} />
    </>
  );
}

/** Stat card placeholder — matches the dashboard module cards */
export function SkeletonStat() {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-8">
        <Shimmer className="w-10 h-10 rounded-lg" />
        <Shimmer className="w-5 h-5 rounded" />
      </div>
      <div className="space-y-2">
        <Shimmer className="w-16 h-8 rounded" />
        <Shimmer className="w-32 h-4 rounded" />
        <Shimmer className="w-20 h-3 rounded mt-2" />
      </div>
    </div>
  );
}

/** Text block with configurable line count */
export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className="h-4 rounded"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

/** Generic card with header + content placeholder */
export function SkeletonCard({ rows = 4 }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <div className="border-b border-surface-border p-4 bg-surface-base/50">
        <Shimmer className="h-4 w-40 rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-surface-border last:border-0">
            <Shimmer className="h-4 w-24 rounded" />
            <Shimmer className="h-6 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-page loading indicator */
export function SkeletonPage() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-8">
        <Shimmer className="w-24 h-6 rounded-full mb-6" />
        <Shimmer className="w-64 h-12 rounded mb-4" />
        <SkeletonText lines={2} className="max-w-lg" />
      </div>
      {/* Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
      </div>
    </div>
  );
}
