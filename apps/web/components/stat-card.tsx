type StatCardProps = {
  label: string;
  value: string | number;
  change?: string;
};

export function StatCard({ label, value, change }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition">
      
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </h3>

      {change && (
        <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {change}
        </p>
      )}

    </div>
  );
}
