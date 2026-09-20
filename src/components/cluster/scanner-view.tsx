import { SERVICE_JOBS, AUTOPHIX } from "@/lib/taos/autophix";

export function ScannerView() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-surface px-5 py-5 shadow-[var(--shadow-border)]">
        <div className="text-cluster uppercase text-subtle">{AUTOPHIX.name}</div>
        <h2 className="mt-1 text-lg font-medium">{AUTOPHIX.kind}</h2>
        <p className="mt-2 text-sm text-muted">{AUTOPHIX.port}</p>
      </section>
      {SERVICE_JOBS.map((job) => (
        <article key={job.id} className="rounded-xl bg-surface px-5 py-5 shadow-[var(--shadow-border)]">
          <h3 className="text-base font-medium">{job.name}</h3>
          <p className="mt-1 text-xs text-subtle">{job.onTool}</p>
          <p className="mt-2 text-sm text-muted">{job.when}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
            {job.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-subtle">{job.note}</p>
        </article>
      ))}
    </div>
  );
}
