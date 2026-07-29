import { Badge, Card } from "@/components/ui";

interface PropertySectionProps {
  title: string;
  status: "verified" | "pending" | "restricted";
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const statusLabel: Record<string, string> = {
  verified: "Verified",
  pending: "Pending",
  restricted: "Restricted",
};

export function PropertySection({ title, status, children, defaultOpen = true }: PropertySectionProps) {
  const isRestricted = status === "restricted";

  return (
    <Card className="overflow-hidden !p-0">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          {isRestricted && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-text-secondary/40">
              <path d="M7 3V7M7 10H7.01M3 1H11C12.1046 1 13 1.89543 13 3V11C13 12.1046 12.1046 13 11 13H3C1.89543 13 1 12.1046 1 11V3C1 1.89543 1.89543 1 3 1Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <h3 className="text-sm font-semibold text-text truncate">{title}</h3>
        </div>
        <Badge
          variant={isRestricted ? "default" : status === "verified" ? "success" : "warning"}
          className="shrink-0"
        >
          {statusLabel[status] ?? status}
        </Badge>
      </div>
      <div className="px-4 sm:px-5 py-4 sm:py-5">
        {isRestricted ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-secondary/30">
              <path d="M10 5V10M10 14H10.01M5 2H15C16.1046 2 17 2.89543 17 4V16C17 17.1046 16.1046 18 15 18H5C3.89543 18 3 17.1046 3 16V4C3 2.89543 3.89543 2 5 2Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-text-secondary/60">Restricted — not available for your role</p>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

export function FieldRow({ label, value, monospace }: { label: string; value: string | number | null | undefined; monospace?: boolean }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0 border-b border-border/40 last:border-0">
      <span className="text-xs text-text-secondary shrink-0 min-w-[120px]">{label}</span>
      <span className={`text-xs text-text text-right break-words max-w-[60%] ${monospace ? "font-mono" : ""}`}>
        {typeof value === "number" ? formatIndianCurrency(value) : String(value)}
      </span>
    </div>
  );
}

export function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

export function SubSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-4 space-y-2">
      {title && <h4 className="text-xs font-semibold text-text uppercase tracking-wider">{title}</h4>}
      {children}
    </div>
  );
}

function formatIndianCurrency(n: number): string {
  const str = Math.round(n).toString();
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return "₹" + formatted;
}
