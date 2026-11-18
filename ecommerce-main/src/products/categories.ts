// Fixed product categories. Keep in sync with frontend/src/lib/categories.ts.
export const CATEGORIES = [
  'laptops',
  'monitors',
  'keyboards',
  'mice',
  'bags',
  'desktops',
] as const;

export type Category = (typeof CATEGORIES)[number];
