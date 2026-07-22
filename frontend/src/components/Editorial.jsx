import { motion } from "framer-motion";

/**
 * Small uppercase eyebrow label with a leading accent tick — used as a
 * section marker throughout (mirrors DNA-capital's "APPROACH" labels).
 */
export function SectionLabel({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 eyebrow ${className}`}>
      <span className="w-8 h-px bg-accent/70" />
      {children}
    </span>
  );
}

/**
 * Big thin-outline stat ring with a large serif numeral and a caption.
 * An optional azure progress arc animates in. The signature DNA-capital motif.
 *
 * props: value, label, arc (0..1 accent sweep), accentValue (bool → azure numeral)
 */
export function StatRing({ value, label, arc = 0.0, accentValue = false, size = 200, delay = 0 }) {
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* base ring */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-surface-border-strong)" strokeWidth="0.7" />
          {/* accent arc */}
          {arc > 0 && (
            <motion.circle
              cx="50" cy="50" r={R} fill="none"
              stroke="var(--color-accent)" strokeWidth="1.1" strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - arc) }}
              transition={{ duration: 1.4, ease: "easeInOut", delay }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`numeral text-5xl sm:text-6xl leading-none ${accentValue ? "text-accent" : "text-text-primary"}`}>
            {value}
          </span>
        </div>
      </div>
      <p className="mt-4 max-w-[12rem] text-sm text-text-secondary leading-relaxed">{label}</p>
    </div>
  );
}

/** Standard editorial page header — eyebrow + light serif title + optional lede. */
export function PageHeader({ eyebrow, title, children, className = "" }) {
  return (
    <header className={`mb-12 ${className}`}>
      <SectionLabel>{eyebrow}</SectionLabel>
      <h1 className="display-serif text-4xl sm:text-5xl mt-5">{title}</h1>
      {children && <p className="mt-4 max-w-xl text-text-secondary leading-relaxed">{children}</p>}
    </header>
  );
}

/** Thin decorative diamond outline — the fixed corner motif. */
export function Diamond({ size = 14, className = "" }) {
  return (
    <span
      className={`inline-block border border-surface-border-strong rotate-45 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
