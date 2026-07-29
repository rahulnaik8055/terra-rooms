import { PropertySection, FieldRow, SubSection } from "./PropertySection";

interface ChainLink {
  deedType: string;
  date: string;
  parties: string[];
  documentNumber: string;
  notaryName?: string | null;
  remarks?: string;
}

interface TitleData {
  summary?: string;
  chain?: ChainLink[];
  titleOpinion?: string;
  titleInsuranceRef?: string;
}

interface Props {
  data: unknown;
  status: "verified" | "pending" | "restricted";
}

export function TitleChain({ data, status }: Props) {
  const title = parseTitleData(data);

  return (
    <PropertySection title="Title Chain" status={status}>
      {!title ? (
        <p className="text-sm text-text-secondary/60">No title chain data available.</p>
      ) : (
        <div className="space-y-5">
          {title.summary && (
            <SubSection title="Summary">
              <p className="text-xs text-text-secondary leading-relaxed">{title.summary}</p>
            </SubSection>
          )}

          {title.chain && title.chain.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Chain of Title</h4>
              {title.chain.map((link, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white shrink-0">
                      {title.chain!.length - i}
                    </div>
                    {i < title.chain!.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="rounded-xl border border-border/60 bg-surface/50 p-4 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-text">{link.deedType}</p>
                        <span className="text-[11px] text-text-secondary shrink-0">
                          {formatDate(link.date)}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-text-secondary">
                        {link.parties.map((party, j) => (
                          <p key={j} className="text-text">{party}</p>
                        ))}
                        <p className="pt-1">Doc No: <span className="font-mono text-text">{link.documentNumber}</span></p>
                        {link.notaryName && <p>Notary: {link.notaryName}</p>}
                        {link.remarks && (
                          <p className="pt-1 italic text-text-secondary/80">{link.remarks}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {title.titleOpinion && (
            <SubSection title="Legal Opinion">
              <p className="text-xs text-text-secondary leading-relaxed">{title.titleOpinion}</p>
            </SubSection>
          )}

          {title.titleInsuranceRef && (
            <SubSection title="Title Insurance">
              <FieldRow label="Policy No." value={title.titleInsuranceRef} monospace />
            </SubSection>
          )}
        </div>
      )}
    </PropertySection>
  );
}

function parseTitleData(data: unknown): TitleData | null {
  if (!data) return null;
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return null; }
  }
  if (typeof data === "object" && data !== null) {
    return data as TitleData;
  }
  return null;
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
