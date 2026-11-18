/** Build-time configuration (isolated so tests can swap it — Jest has no import.meta). */
export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "")
