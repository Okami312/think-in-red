import { cn } from "@/lib/utils"

/**
 * Line illustrations used when a product has no image.
 * Strokes use currentColor; the single red detail uses the primary colour.
 */
export function ProductArt({
  category,
  className,
  animated = false,
}: {
  category: string
  className?: string
  /** Pop the TrackPoint in after an entrance (hero only). */
  animated?: boolean
}) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-auto w-full", className)}
      aria-hidden
    >
      {category === "laptops" ? <LaptopArt animated={animated} /> : (ART[category] ?? ART.default)}
    </svg>
  )
}

const red = "fill-primary stroke-primary"

const ART: Record<string, React.ReactNode> = {
  monitors: (
    <>
      <rect x={34} y={16} width={172} height={102} rx={5} />
      <rect x={42} y={24} width={156} height={84} rx={2} strokeWidth={1.25} opacity={0.5} />
      <rect x={113} y={118} width={14} height={22} rx={2} className={red} />
      <path d="M86 144h68" strokeWidth={4} />
    </>
  ),
  keyboards: <KeyboardArt />,
  mice: (
    <>
      <rect x={88} y={20} width={64} height={120} rx={32} />
      <path d="M120 20v44M88 64h64" strokeWidth={1.5} opacity={0.6} />
      <rect x={116} y={34} width={8} height={18} rx={4} className={red} />
    </>
  ),
  bags: (
    <>
      <path d="M100 38c0-12 40-12 40 0" />
      <rect x={70} y={36} width={100} height={110} rx={24} />
      <rect x={86} y={90} width={68} height={44} rx={10} strokeWidth={1.5} />
      <path d="M92 98h56" strokeWidth={3} className="stroke-primary" />
      <path d="M78 60h84" strokeWidth={1.25} opacity={0.5} />
    </>
  ),
  desktops: (
    <>
      {/* Tower */}
      <rect x={72} y={20} width={50} height={118} rx={4} />
      <path d="M80 34H114M80 42H114" strokeWidth={1.25} opacity={0.6} />
      <rect x={81} y={52} width={6} height={3.5} rx={0.8} strokeWidth={1} opacity={0.7} />
      <rect x={90} y={52} width={6} height={3.5} rx={0.8} strokeWidth={1} opacity={0.7} />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M82 ${98 + i * 6}H112`} strokeWidth={1.25} strokeDasharray="2 2" opacity={0.5} />
      ))}
      <circle cx={109} cy={53.75} r={2.6} className={red} />
      <path d="M76 138v3M118 138v3" strokeWidth={2} />
      {/* Tiny PC */}
      <rect x={132} y={104} width={62} height={34} rx={3} />
      {Array.from({ length: 4 }, (_, i) => (
        <path key={i} d={`M${139 + i * 5} 112V130`} strokeWidth={1.25} strokeDasharray="2 2" opacity={0.5} />
      ))}
      <rect x={164} y={116} width={6} height={3.5} rx={0.8} strokeWidth={1} opacity={0.7} />
      <rect x={173} y={116} width={6} height={3.5} rx={0.8} strokeWidth={1} opacity={0.7} />
      <circle cx={186} cy={117.75} r={2.2} className={red} />
    </>
  ),
  default: (
    <>
      <path d="M80 56l40-20 40 20v48l-40 20-40-20z" />
      <path d="M80 56l40 20 40-20M120 76v48" strokeWidth={1.5} opacity={0.6} />
      <circle cx={120} cy={60} r={3} className={red} />
    </>
  ),
}

/**
 * Compact TrackPoint keyboard: function row, five staggered rows, inset arrow
 * cluster, red pointing stick between G/H/B and three buttons below the spacebar.
 * Widths are in key units (u); the main block is 15u wide.
 */
function KeyboardArt() {
  const oy = 27 // vertical offset that centres the board in the 240×160 viewBox
  const x0 = 22
  const u = 196 / 15
  const gap = 1.5
  const keyH = 10.5
  const pitch = 12.2
  const rowY = (i: number) => oy + 16 + i * pitch

  // Lay out a row of keys from unit widths, starting at `startU`.
  const row = (key: string, y: number, h: number, widths: number[], startU = 0) => {
    let at = startU
    return widths.map((w, i) => {
      const rect = (
        <rect
          key={`${key}${i}`}
          x={x0 + at * u + gap / 2}
          y={y}
          width={w * u - gap}
          height={h}
          rx={1.6}
          strokeWidth={1.1}
          opacity={0.75}
        />
      )
      at += w
      return rect
    })
  }
  const ones = (n: number) => Array<number>(n).fill(1)

  const stickX = x0 + 6.75 * u // corner where G, H and B meet
  const buttonsY = oy + 80
  const buttons: [number, number][] = [
    [4.45, 6.3],
    [6.35, 7.15],
    [7.2, 9.05],
  ]

  return (
    <>
      <rect x={14} y={oy} width={212} height={106} rx={6} />
      {row("fn", oy + 7, 6, Array<number>(17).fill(15 / 17))}
      {row("r1", rowY(0), keyH, [...ones(13), 2])}
      {row("r2", rowY(1), keyH, [1.5, ...ones(12), 1.5])}
      {row("r3", rowY(2), keyH, [1.75, ...ones(11), 2.25])}
      {row("r4", rowY(3), keyH, [2.25, ...ones(10), 2.75])}
      {row("r5", rowY(4), keyH, [1, 1.25, 1, 1, 4.75, 1, 1, 1])}
      {row("ar1", rowY(4), 8.2, ones(3), 12)}
      {row("ar2", rowY(4) + 9.6, 8.2, ones(3), 12)}
      {buttons.map(([from, to], i) => (
        <rect
          key={`b${i}`}
          x={x0 + from * u}
          y={buttonsY}
          width={(to - from) * u}
          height={8}
          rx={1.6}
          strokeWidth={1.1}
          opacity={0.75}
        />
      ))}
      {[buttons[0], buttons[2]].map(([from, to], i) => (
        <path
          key={`s${i}`}
          d={`M${x0 + from * u + 2} ${buttonsY + 6.2}H${x0 + to * u - 2}`}
          strokeWidth={1.4}
          className="stroke-primary"
        />
      ))}
      <circle cx={stickX} cy={rowY(3) - (pitch - keyH) / 2} r={2.6} className={red} />
    </>
  )
}

/**
 * Open laptop, front view: plain lid, and a deck of the same width with a full
 * keyboard, speaker grilles, a centred TrackPoint, three buttons and a touchpad.
 */
function LaptopArt({ animated }: { animated: boolean }) {
  // Lid and deck share the same width and corner radius.
  const x = 70
  const w = 100
  const lid = { y: 8, h: 64 }
  const deck = { y: 74, h: 62 }

  const kb = { left: 80, right: 160, top: deck.y + 7 }
  const u = (kb.right - kb.left) / 15
  const ones = (n: number) => Array<number>(n).fill(1)
  const rows: { h: number; widths: number[] }[] = [
    { h: 2.2, widths: Array<number>(17).fill(15 / 17) },
    { h: 3.2, widths: [...ones(13), 2] },
    { h: 3.2, widths: [1.5, ...ones(12), 1.5] },
    { h: 3.2, widths: [1.75, ...ones(11), 2.25] },
    { h: 3.2, widths: [2.25, ...ones(10), 2.75] },
    { h: 3.2, widths: [1, 1.25, 1, 1, 4.75, 1, 1, 1, ...ones(3)] },
  ]
  const rowGap = 1

  let y = kb.top
  let stickY = 0
  const keyRects: React.ReactNode[] = []
  rows.forEach((row, r) => {
    let at = 0
    row.widths.forEach((kw, i) => {
      keyRects.push(
        <rect
          key={`${r}-${i}`}
          x={kb.left + at * u + 0.4}
          y={y}
          width={kw * u - 0.8}
          height={row.h}
          rx={0.6}
          strokeWidth={0.7}
          opacity={0.7}
        />,
      )
      at += kw
    })
    if (r === 3) stickY = y + row.h + rowGap / 2 // between the G/H and B rows
    y += row.h + rowGap
  })
  const kbBottom = y - rowGap

  const grille = (gx: number) =>
    [0, 1.5, 3].map((d) => (
      <path key={`${gx}-${d}`} d={`M${gx + d} ${kb.top} V${kbBottom}`} strokeWidth={0.7} strokeDasharray="0.9 1" opacity={0.6} />
    ))

  const btn = { x: 100, w: 40, y: kbBottom + 3, h: 3.6 }
  const pad = { y: btn.y + btn.h + 1.4, h: 19 }

  return (
    <>
      {/* Lid */}
      <rect x={x} y={lid.y} width={w} height={lid.h} rx={3} />
      <rect x={x + 4} y={lid.y + 4} width={w - 8} height={lid.h - 8} rx={1} strokeWidth={1.1} opacity={0.5} />
      <circle cx={120} cy={lid.y + 2} r={0.8} className="fill-current" stroke="none" opacity={0.7} />
      {/* Deck + rounded base lip */}
      <rect x={x} y={deck.y} width={w} height={deck.h} rx={3} />
      <path
        d={`M${x + 1.5} ${deck.y + deck.h + 1.2} Q${x + 2.6} ${deck.y + deck.h + 4} ${x + 5.5} ${deck.y + deck.h + 4} H${x + w - 5.5} Q${x + w - 2.6} ${deck.y + deck.h + 4} ${x + w - 1.5} ${deck.y + deck.h + 1.2}`}
        strokeWidth={1.5}
      />
      <path d={`M${x + 6} ${deck.y + 3} H${x + w - 6}`} strokeWidth={1} opacity={0.5} />
      {keyRects}
      {grille(x + 3)}
      {grille(x + w - 6)}
      <circle
        cx={120}
        cy={stickY}
        r={1.5}
        className={cn(red, animated && "animate-pop")}
        style={animated ? ({ "--delay": "520ms" } as React.CSSProperties) : undefined}
      />
      {/* Buttons and touchpad */}
      <rect x={btn.x} y={btn.y} width={btn.w} height={btn.h} rx={0.8} strokeWidth={0.9} opacity={0.75} />
      <path d={`M115.5 ${btn.y} V${btn.y + btn.h} M124.5 ${btn.y} V${btn.y + btn.h}`} strokeWidth={0.9} opacity={0.75} />
      <path d={`M101.5 ${btn.y + 0.7} H114 M126 ${btn.y + 0.7} H138.5`} strokeWidth={1} className="stroke-primary" />
      <rect x={btn.x} y={pad.y} width={btn.w} height={pad.h} rx={1.2} strokeWidth={1} opacity={0.75} />
    </>
  )
}
