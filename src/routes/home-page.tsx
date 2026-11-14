import { useHealth } from '@/api/health';

export function HomePage() {
  const health = useHealth();

  return (
    <main>
      <h1>Expense Tracker</h1>
      <section aria-labelledby="api-status-heading">
        <h2 id="api-status-heading">API status</h2>
        <div role="status" aria-live="polite">
          {health.isPending && <p>Checking the API…</p>}
          {health.isSuccess && <p>{health.data.status}</p>}
          {health.isError && (
            <div>
              <p>The API is unreachable.</p>
              <button type="button" onClick={() => void health.refetch()}>
                Retry
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
