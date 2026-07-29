import { PropertySection, FieldRow, SubSection } from "./PropertySection";

interface TaxYear {
  year: string;
  amount: number;
  paidOn: string;
  receiptNo: string;
}

interface TaxData {
  propertyTaxId: string;
  annualTaxAmount: number;
  lastPaymentDate: string;
  lastPaymentReceiptNo: string;
  taxDue: number;
  taxArrears: number;
  taxAssessmentYear: string;
  taxPaidUpTo: string;
  propertyTaxHistory?: TaxYear[];
  waterTaxId?: string;
  waterTaxDue?: number;
  approvedBuildingPlanRef?: string;
  occupancyCertificateRef?: string | null;
}

interface Props {
  data: unknown;
  status: "verified" | "pending" | "restricted";
}

export function TaxRecords({ data, status }: Props) {
  const tax = parseTaxData(data);

  return (
    <PropertySection title="Tax Records" status={status}>
      {!tax ? (
        <p className="text-sm text-text-secondary/60">No tax records available.</p>
      ) : (
        <div className="space-y-4">
          <SubSection title="Property Tax">
            <FieldRow label="Tax ID" value={tax.propertyTaxId} monospace />
            <FieldRow label="Annual Amount" value={tax.annualTaxAmount} />
            <FieldRow label="Assessment Year" value={tax.taxAssessmentYear} />
            <FieldRow label="Paid Up To" value={tax.taxPaidUpTo} />
            <FieldRow label="Last Paid" value={tax.lastPaymentDate ? formatDate(tax.lastPaymentDate) : null} />
            <FieldRow label="Receipt No." value={tax.lastPaymentReceiptNo} monospace />
            <FieldRow label="Due" value={tax.taxDue != null ? (tax.taxDue === 0 ? "Nil" : tax.taxDue) : null} />
            <FieldRow label="Arrears" value={tax.taxArrears != null ? (tax.taxArrears === 0 ? "Nil" : tax.taxArrears) : null} />
          </SubSection>

          {tax.waterTaxId && (
            <SubSection title="Water Tax">
              <FieldRow label="Water Tax ID" value={tax.waterTaxId} monospace />
              <FieldRow label="Due" value={tax.waterTaxDue != null ? (tax.waterTaxDue === 0 ? "Nil" : tax.waterTaxDue) : null} />
            </SubSection>
          )}

          <SubSection title="Approvals">
            <FieldRow label="Building Plan" value={tax.approvedBuildingPlanRef} monospace />
            <FieldRow label="Occupancy Cert" value={tax.occupancyCertificateRef ?? "Not available"} />
          </SubSection>

          {tax.propertyTaxHistory && tax.propertyTaxHistory.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-text uppercase tracking-wider">Payment History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-text-secondary">
                      <th className="text-left py-1.5 pr-3 font-medium">Year</th>
                      <th className="text-right py-1.5 px-3 font-medium">Amount</th>
                      <th className="text-left py-1.5 px-3 font-medium">Paid On</th>
                      <th className="text-right py-1.5 pl-3 font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tax.propertyTaxHistory.map((h, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0">
                        <td className="py-1.5 pr-3 text-text">{h.year}</td>
                        <td className="py-1.5 px-3 text-right text-text font-mono">{formatCurrency(h.amount)}</td>
                        <td className="py-1.5 px-3 text-text-secondary">{formatDate(h.paidOn)}</td>
                        <td className="py-1.5 pl-3 text-right text-text-secondary font-mono text-[10px]">{h.receiptNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </PropertySection>
  );
}

function parseTaxData(data: unknown): TaxData | null {
  if (!data) return null;
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return null; }
  }
  if (typeof data === "object" && data !== null) {
    return data as TaxData;
  }
  return null;
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
