import SplitText from "@/components/SplitText"
import { cn } from "@/lib/utils"

/** Brand red used as the starting colour for heading letters (settles to the text colour). */
const ACCENT_HEX = "#e0281f"

export function SectionHeading({
  index,
  eyebrow,
  title,
  className,
  children,
}: {
  index: string
  eyebrow: string
  title: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("mb-10 flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="min-w-0">
        <p className="font-mono text-xs tracking-[0.25em] text-primary uppercase">
          {index} — {eyebrow}
        </p>
        <SplitText
          text={title}
          tag="h2"
          splitType="words"
          mask
          textAlign="left"
          trigger="view"
          rootMargin="-60px"
          delay={60}
          duration={0.9}
          ease="expo.out"
          from={{ yPercent: 110 }}
          to={{ yPercent: 0 }}
          accentColor={ACCENT_HEX}
          className="mt-3 block text-4xl leading-[0.95] font-semibold tracking-[-0.04em] text-balance sm:text-6xl"
        />
      </div>
      {children}
    </div>
  )
}
