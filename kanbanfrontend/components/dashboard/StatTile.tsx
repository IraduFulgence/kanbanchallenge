import type { HomeIcon } from "@/components/dashboard/layout/icons";

export default function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HomeIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-sm dark:border-zinc-700 dark:bg-gray-900">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}
