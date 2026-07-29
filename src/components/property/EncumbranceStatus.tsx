import { PropertySection, FieldRow, SubSection } from "./PropertySection";

interface Loan {
  lenderName: string;
  loanType: string;
  loanSanctionNumber: string;
  sanctionedAmount: number;
  outstandingAmount: number;
  sanctionDate: string;
  isNOCReceived: boolean;
  remarks?: string;
}

interface Encumbrance {
  hasExistingLoan: boolean;
  loans?: Loan[];
  hasLitigation: boolean;
  litigationDetails?: string | null;
  isEncumbered: boolean;
  encumbranceCertificateReference?: string;
  encumbrancePeriod?: string;
}

interface Props {
  data: unknown;
  status: "verified" | "pending" | "restricted";
}

export function EncumbranceStatus({ data, status }: Props) {
  const enc = parseEncumbrance(data);

  return (
    <PropertySection title="Encumbrance" status={status}>
      {!enc ? (
        <p className="text-sm text-text-secondary/60">No encumbrance data available.</p>
      ) : (
        <div className="space-y-4">
          <SubSection title="Summary">
            <FieldRow label="Encumbered" value={enc.isEncumbered ? "Yes" : "No"} />
            <FieldRow label="Existing Loan" value={enc.hasExistingLoan ? "Yes" : "No"} />
            <FieldRow label="Litigation" value={enc.hasLitigation ? "Yes" : "No"} />
            {enc.encumbranceCertificateReference && (
              <FieldRow label="EC Reference" value={enc.encumbranceCertificateReference} monospace />
            )}
            {enc.encumbrancePeriod && (
              <FieldRow label="EC Period" value={enc.encumbrancePeriod} />
            )}
          </SubSection>

          {enc.hasExistingLoan && enc.loans && enc.loans.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Loans</h4>
              {enc.loans.map((loan, i) => (
                <SubSection key={i} title={loan.lenderName}>
                  <FieldRow label="Type" value={loan.loanType} />
                  <FieldRow label="Sanction No." value={loan.loanSanctionNumber} monospace />
                  <FieldRow label="Sanctioned" value={loan.sanctionedAmount} />
                  <FieldRow label="Outstanding" value={loan.outstandingAmount} />
                  <FieldRow label="Sanction Date" value={loan.sanctionDate ? formatDate(loan.sanctionDate) : null} />
                  <FieldRow label="NOC Received" value={loan.isNOCReceived ? "Yes" : "No"} />
                  {loan.remarks && <FieldRow label="Remarks" value={loan.remarks} />}
                </SubSection>
              ))}
            </div>
          )}

          {enc.hasLitigation && enc.litigationDetails && (
            <SubSection title="Litigation">
              <p className="text-xs text-text-secondary">{enc.litigationDetails}</p>
            </SubSection>
          )}
        </div>
      )}
    </PropertySection>
  );
}

function parseEncumbrance(data: unknown): Encumbrance | null {
  if (!data) return null;
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return null; }
  }
  if (typeof data === "object" && data !== null) {
    return data as Encumbrance;
  }
  return null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
