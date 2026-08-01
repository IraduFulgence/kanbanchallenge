// gives each board column a distinct color based on its position, since columns
// aren't stored with a color of their own — just cycle a fixed palette
export const COLUMN_COLORS = [
  { dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-900" },
  { dot: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200 dark:border-purple-900" },
  { dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-900" },
  { dot: "bg-teal-500", bg: "bg-teal-50 dark:bg-teal-950/40", border: "border-teal-200 dark:border-teal-900" },
  { dot: "bg-pink-500", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200 dark:border-pink-900" },
  { dot: "bg-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200 dark:border-indigo-900" },
];

export function columnColor(position: number) {
  return COLUMN_COLORS[position % COLUMN_COLORS.length];
}
