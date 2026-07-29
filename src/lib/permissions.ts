import type { Property } from "@/generated/prisma/client";

export type Role = "BUYER" | "SELLER" | "BANK" | "LAWYER" | "BROKER";
export type RoomStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "LAWYER_VERIFIED"
  | "BANK_APPROVED"
  | "CLOSED";

type SectionName =
  | "ownershipHistory"
  | "encumbranceStatus"
  | "taxRecords"
  | "titleChain";

interface PermissionEntry {
  sections: SectionName[];
  canSetStatus: RoomStatus[];
}

const permissionMap: Record<Role, PermissionEntry> = {
  BUYER: { sections: [], canSetStatus: [] },
  SELLER: { sections: [], canSetStatus: [] },
  BANK: {
    sections: ["encumbranceStatus", "taxRecords"],
    canSetStatus: ["BANK_APPROVED"],
  },
  LAWYER: {
    sections: ["ownershipHistory", "titleChain", "encumbranceStatus"],
    canSetStatus: ["LAWYER_VERIFIED"],
  },
  BROKER: { sections: [], canSetStatus: ["IN_REVIEW", "CLOSED"] },
};

const statusFlow: Record<RoomStatus, RoomStatus[]> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["LAWYER_VERIFIED"],
  LAWYER_VERIFIED: ["BANK_APPROVED"],
  BANK_APPROVED: ["CLOSED"],
  CLOSED: [],
};

export interface PropertyOverview {
  id: string;
  address: string;
  city: string;
  state: string;
  surveyNumber: string;
  sectionStatus: Record<SectionName, "verified" | "pending">;
}

export interface SanitizedProperty extends PropertyOverview {
  ownershipHistory?: unknown;
  encumbranceStatus?: unknown;
  taxRecords?: unknown;
  titleChain?: unknown;
}

export function sanitizeForOverview(property: {
  id: string;
  address: string;
  city: string;
  state: string;
  surveyNumber: string;
}): PropertyOverview {
  return {
    id: property.id,
    address: property.address,
    city: property.city,
    state: property.state,
    surveyNumber: property.surveyNumber,
    sectionStatus: {
      ownershipHistory: "verified",
      encumbranceStatus: "verified",
      taxRecords: "verified",
      titleChain: "verified",
    },
  };
}

export function sanitizePropertyForRole(
  property: Property,
  role: Role
): SanitizedProperty {
  const entry = permissionMap[role];
  const overview = sanitizeForOverview(property);

  const result: SanitizedProperty = {
    ...overview,
  };

  for (const section of entry.sections) {
    result[section] = property[section];
  }

  return result;
}

export function canTransitionStatus(
  currentStatus: RoomStatus,
  newStatus: RoomStatus
): boolean {
  const allowed = statusFlow[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

export function roleCanSetStatus(role: Role, status: RoomStatus): boolean {
  const entry = permissionMap[role];
  return entry.canSetStatus.includes(status);
}

export function getSectionStatus(
  role: Role,
  section: SectionName
): "verified" | "hidden" {
  if (role === "BUYER" || role === "SELLER" || role === "BROKER") {
    return "hidden";
  }
  return permissionMap[role].sections.includes(section) ? "verified" : "hidden";
}
