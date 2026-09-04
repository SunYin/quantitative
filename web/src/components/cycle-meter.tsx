const STEPS = ["trough", "early", "mid", "late"] as const;

export function CycleMeter({ position }: { position: string }) {
  const active = STEPS.indexOf(position as (typeof STEPS)[number]);
  return (
    <ol className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
      {STEPS.map((step, index) => (
        <li key={step} className="flex items-center gap-1">
          <span
            className={`h-2 w-2 rounded-full ${index === active ? "bg-sky-400" : "bg-muted"}`}
            aria-current={index === active}
          />
          <span className={index === active ? "text-foreground" : ""}>{step}</span>
          {index < STEPS.length - 1 ? <span className="text-border">—</span> : null}
        </li>
      ))}
    </ol>
  );
}
