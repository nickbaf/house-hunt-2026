import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { v4 as uuid } from "uuid";
import { fetchProperties, saveWithRetry } from "@/api/github";
import { useAuth } from "@/context/AuthContext";
import type { Property, PropertiesData, Comment, PropertyStatus } from "@/types";

interface DataContextType {
  properties: Property[];
  users: string[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addProperty: (property: Omit<Property, "id" | "addedBy" | "addedAt" | "comments" | "rightmoveId" | "source" | "lastSeen"> & { latitude?: number | null; longitude?: number | null }) => Promise<void>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  updateStatus: (id: string, status: PropertyStatus) => Promise<void>;
  addComment: (propertyId: string, text: string) => Promise<void>;
  deleteComment: (propertyId: string, commentId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, username } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await fetchProperties();
      setProperties(data.properties);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProperty = useCallback(
    async (property: Omit<Property, "id" | "addedBy" | "addedAt" | "comments" | "rightmoveId" | "source" | "lastSeen"> & { latitude?: number | null; longitude?: number | null }) => {
      const newProperty: Property = {
        ...property,
        id: uuid(),
        addedBy: username,
        addedAt: new Date().toISOString(),
        comments: [],
        rightmoveId: null,
        source: "manual",
        lastSeen: null,
        latitude: property.latitude ?? null,
        longitude: property.longitude ?? null,
      };

      const { data } = await saveWithRetry(
        (current) => ({
          ...current,
          properties: [...current.properties, newProperty],
          users: current.users.includes(username)
            ? current.users
            : [...current.users, username],
        }),
        `Add property: ${property.title}`,
      );
      setProperties(data.properties);
      setUsers(data.users);
    },
    [username],
  );

  const updateProperty = useCallback(
    async (id: string, updates: Partial<Property>) => {
      const { data } = await saveWithRetry(
        (current) => ({
          ...current,
          properties: current.properties.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        }),
        `Update property: ${updates.title ?? id.slice(0, 8)}`,
      );
      setProperties(data.properties);
    },
    [],
  );

  const deleteProperty = useCallback(async (id: string) => {
    const { data } = await saveWithRetry(
      (current) => ({
        ...current,
        properties: current.properties.filter((p) => p.id !== id),
      }),
      `Remove property: ${id.slice(0, 8)}`,
    );
    setProperties(data.properties);
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: PropertyStatus) => {
      const { data } = await saveWithRetry(
        (current) => ({
          ...current,
          properties: current.properties.map((p) =>
            p.id === id ? { ...p, status } : p,
          ),
        }),
        `Update status to ${status}: ${id.slice(0, 8)}`,
      );
      setProperties(data.properties);
    },
    [],
  );

  const addComment = useCallback(
    async (propertyId: string, text: string) => {
      const comment: Comment = {
        id: uuid(),
        author: username,
        text,
        createdAt: new Date().toISOString(),
      };

      const { data } = await saveWithRetry(
        (current: PropertiesData) => ({
          ...current,
          properties: current.properties.map((p) =>
            p.id === propertyId
              ? { ...p, comments: [...p.comments, comment] }
              : p,
          ),
        }),
        `Add comment on ${propertyId.slice(0, 8)}`,
      );
      setProperties(data.properties);
    },
    [username],
  );

  const deleteComment = useCallback(
    async (propertyId: string, commentId: string) => {
      const { data } = await saveWithRetry(
        (current: PropertiesData) => ({
          ...current,
          properties: current.properties.map((p) =>
            p.id === propertyId
              ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
              : p,
          ),
        }),
        `Remove comment on ${propertyId.slice(0, 8)}`,
      );
      setProperties(data.properties);
    },
    [],
  );

  return (
    <DataContext.Provider
      value={{
        properties,
        users,
        isLoading,
        error,
        refresh,
        addProperty,
        updateProperty,
        deleteProperty,
        updateStatus,
        addComment,
        deleteComment,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
