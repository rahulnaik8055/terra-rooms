import { Card, StatusBadge, Badge } from "@/components/ui";

interface OverviewData {
  address: string;
  city: string;
  state: string;
  surveyNumber?: string;
  roomStatus: string;
  sectionStatus?: Record<string, "verified" | "pending">;
}

interface Props {
  data: Record<string, unknown>;
  roomStatus: string;
}

export function PropertyOverview({ data, roomStatus }: Props) {
  const address = (data.address as string) ?? "—";
  const city = (data.city as string) ?? "";
  const state = (data.state as string) ?? "";
  const survey = (data.surveyNumber as string) ?? "";
  const sectionStatus = data.sectionStatus as Record<string, "verified" | "pending"> | undefined;

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b border-border px-4 sm:px-5 py-3 sm:py-3.5">
        <p className="text-sm font-medium text-text break-words">{address}</p>
        <p className="mt-0.5 text-xs text-text-secondary break-words">
          {[city, state].filter(Boolean).join(", ")}
          {survey ? ` · Survey ${survey}` : ""}
        </p>
      </div>
      <div className="px-4 sm:px-5 py-3 sm:py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-secondary">Room status:</span>
          <StatusBadge status={roomStatus} />
        </div>
        {sectionStatus && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-text-secondary mr-1">Sections:</span>
            {Object.entries(sectionStatus).map(([key, val]) => (
              <Badge key={key} variant={val === "verified" ? "success" : "warning"}>
                {key.replace(/([A-Z])/g, " $1").trim()} · {val}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
