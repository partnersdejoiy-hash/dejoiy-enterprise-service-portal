export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />

        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          Loading DEJOIY Portal
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Please wait while we prepare your workspace and load the required enterprise services.
        </p>
      </div>
    </div>
  );
}
