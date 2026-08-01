export default function BreakdownBar({
  rows,
}: {
  rows: { label: string; count: number; colorClass: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 text-zinc-600 dark:text-zinc-300">{row.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${row.colorClass}`}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-medium text-zinc-900 dark:text-white">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}
