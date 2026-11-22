/** The message to show for a caught error: its own message, or `fallback` for non-Error values. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}
