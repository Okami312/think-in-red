/** Shared motion tokens (match --ease-out / --ease-in-out in index.css). */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

/** Viewport settings for scroll-triggered entrances: fire once, a little before fully in view. */
export const IN_VIEW = { once: true, margin: "0px 0px -12% 0px" } as const
