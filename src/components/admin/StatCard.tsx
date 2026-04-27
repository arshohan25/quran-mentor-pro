import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  delta?: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "muted";
  className?: string;
}

export default function StatCard({ label, value, delta, icon: Icon, tone = "primary", className }: Props) {
  const toneClass =
    tone === "accent"
      ? "from-accent/15 to-accent/5 text-accent"
      : tone === "muted"
      ? "from-muted to-muted/40 text-muted-foreground"
      : "from-primary/15 to-primary/5 text-primary";

  return (
    <div className={cn("rounded-xl border bg-card p-4 flex items-start gap-3", className)}>
      <div className={cn("p-2 rounded-lg bg-gradient-to-br shrink-0", toneClass)}>
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground tabular-nums leading-tight mt-1.5">{value}</p>
        {delta && <p className="text-[11px] text-muted-foreground mt-0.5">{delta}</p>}
      </div>
    </div>
  );
}
