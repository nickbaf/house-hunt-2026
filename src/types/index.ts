export const PROPERTY_STATUSES = [
  "interested",
  "viewing_scheduled",
  "visited",
  "applied",
  "offer_made",
  "accepted",
  "rejected",
  "passed",
] as const;

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; color: string; bgColor: string }
> = {
  interested: {
    label: "Interested",
    color: "text-blue-400",
    bgColor: "bg-blue-400/15",
  },
  viewing_scheduled: {
    label: "Viewing Scheduled",
    color: "text-amber-400",
    bgColor: "bg-amber-400/15",
  },
  visited: {
    label: "Visited",
    color: "text-purple-400",
    bgColor: "bg-purple-400/15",
  },
  applied: {
    label: "Applied",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/15",
  },
  offer_made: {
    label: "Offer Made",
    color: "text-orange-400",
    bgColor: "bg-orange-400/15",
  },
  accepted: {
    label: "Accepted",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/15",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-400",
    bgColor: "bg-red-400/15",
  },
  passed: {
    label: "Passed",
    color: "text-zinc-400",
    bgColor: "bg-zinc-400/15",
  },
};

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  tower: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  floor: number | null;
  url: string;
  images: string[];
  agentName: string;
  agentPhone: string;
  status: PropertyStatus;
  rating: number | null;
  pros: string[];
  cons: string[];
  visitDate: string | null;
  addedBy: string;
  addedAt: string;
  comments: Comment[];
}

export interface PropertiesData {
  properties: Property[];
  users: string[];
}
