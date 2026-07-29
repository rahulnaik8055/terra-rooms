import { PropertySection, SubSection } from "./PropertySection";

interface Transfer {
  transferDate: string;
  previousOwner: string;
  newOwner: string;
  considerationAmount: number;
  deedType: string;
  registrationNumber: string;
  subRegistrarOffice: string;
}

interface Props {
  data: unknown;
  status: "verified" | "pending" | "restricted";
}

export function OwnershipHistory({ data, status }: Props) {
  const transfers = parseTransfers(data);

  return (
    <PropertySection title="Ownership History" status={status}>
      {!transfers || transfers.length === 0 ? (
        <p className="text-sm text-text-secondary/60">No ownership history available.</p>
      ) : (
        <div className="space-y-4">
          {transfers.map((t, i) => (
            <div key={i} className="relative pl-6 pb-4 last:pb-0">
              {i < transfers.length - 1 && (
                <div className="absolute left-[7px] top-3 bottom-0 w-px bg-border" />
              )}
              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-surface" />
              <div className="text-xs text-text-secondary mb-0.5">
                {formatDate(t.transferDate)}
              </div>
              <p className="text-sm font-medium text-text">
                {t.deedType}
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-text-secondary">
                <p>From: <span className="text-text">{t.previousOwner}</span></p>
                <p>To: <span className="text-text">{t.newOwner}</span></p>
                <p>Consideration: <span className="font-medium text-text">{formatCurrency(t.considerationAmount)}</span></p>
                <p>Registration: {t.registrationNumber}</p>
                {t.subRegistrarOffice && <p>Office: {t.subRegistrarOffice}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </PropertySection>
  );
}

function parseTransfers(data: unknown): Transfer[] | null {
  if (!data) return null;
  let arr: Transfer[];
  if (typeof data === "string") {
    try { arr = JSON.parse(data); } catch { return null; }
  } else if (Array.isArray(data)) {
    arr = data as Transfer[];
  } else {
    return null;
  }
  return arr.length > 0 ? arr : null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatCurrency(n: number) {
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const formatted = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return "₹" + formatted;
}
