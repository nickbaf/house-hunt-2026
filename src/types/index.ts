export const PROPERTY_STATUSES = [
  "new",
  "interested",
  "viewing_scheduled",
  "visited",
  "applied",
  "offer_made",
  "accepted",
  "rejected",
  "passed",
  "let_agreed",
] as const;

export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export type PropertySource = "manual" | "rightmove";

export const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; color: string; bgColor: string }
> = {
  new: {
    label: "New",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/15",
  },
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
  let_agreed: {
    label: "Let Agreed",
    color: "text-zinc-500",
    bgColor: "bg-zinc-500/10",
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
  rightmoveId: string | null;
  source: PropertySource;
  lastSeen: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PropertiesData {
  properties: Property[];
  users: string[];
}
