import { useHealth } from '@/api/health';

export function HomePage() {
  const health = useHealth();

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Expense Tracker</h1>
      <section
        aria-labelledby="api-status-heading"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm"
      >
        <h2 id="api-status-heading" className="text-sm font-medium text-text-muted">
          API status
        </h2>
        <div role="status" aria-live="polite" className="mt-2 text-base">
          {health.isPending && <p className="text-text-muted">Checking the API…</p>}
          {health.isSuccess && (
            <p className="font-semibold text-success tabular-nums">{health.data.status}</p>
          )}
          {health.isError && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-medium text-error">The API is unreachable.</p>
              <button
                type="button"
                onClick={() => void health.refetch()}
                className="rounded-lg border border-border-strong px-3 py-1 text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
