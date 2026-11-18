import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { useEffect, useRef } from "react"
import { EASE_OUT } from "@/lib/motion"

/** A number that counts up from 0 the first time it scrolls into view. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    if (!inView) return
    if (reduce) return count.set(value)
    const controls = animate(count, value, { duration: 1.4, ease: EASE_OUT })
    return () => controls.stop()
  }, [inView, reduce, value, count])

  return (
    <motion.span ref={ref} className={className} aria-label={String(value)}>
      {rounded}
    </motion.span>
  )
}
