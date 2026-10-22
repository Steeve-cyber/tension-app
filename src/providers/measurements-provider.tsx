import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Measurement, MeasurementContext } from "@/utils/measurements";

const STORAGE_KEY = "@historique_tension";

type NewMeasurement = Omit<Measurement, "id" | "measuredAt" | "legacyTime">;

type MeasurementStore = {
  measurements: Measurement[];
  isLoading: boolean;
  hasStorageError: boolean;
  addMeasurement: (measurement: NewMeasurement) => Promise<Measurement>;
  removeMeasurement: (id: string) => Promise<void>;
  clearMeasurements: () => Promise<void>;
};

const MeasurementContextValue = createContext<MeasurementStore | null>(null);

function asInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeStoredMeasurements(value: unknown): Measurement[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: Record<string, unknown>, index): Measurement | null => {
      const systolic = asInteger(item.systolic ?? item.systolique);
      const diastolic = asInteger(item.diastolic ?? item.diastolique);
      if (systolic === null || diastolic === null || systolic <= diastolic) return null;

      const pulse = asInteger(item.pulse ?? item.pouls);
      const rawDate = item.measuredAt ?? item.timestamp;
      const measuredAt = typeof rawDate === "string" && !Number.isNaN(Date.parse(rawDate))
        ? rawDate
        : null;
      const legacyTime = !measuredAt && typeof item.date === "string" ? item.date : undefined;
      const contextValue = item.context;
      const context: MeasurementContext = contextValue === "Matin" || contextValue === "Soir"
        ? contextValue
        : "Autre";

      return {
        id: typeof item.id === "string" ? item.id : `archive-${index}`,
        systolic,
        diastolic,
        pulse: pulse !== null && pulse > 0 ? pulse : null,
        measuredAt,
        context,
        note: typeof item.note === "string" ? item.note : undefined,
        legacyTime,
      };
    })
    .filter((item): item is Measurement => item !== null)
    .sort((first, second) => {
        if (!first.measuredAt && !second.measuredAt) return 0;
        if (!first.measuredAt) return 1;
        if (!second.measuredAt) return -1;
        return second.measuredAt.localeCompare(first.measuredAt);
      });
}

export function MeasurementsProvider({ children }: PropsWithChildren) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStorageError, setHasStorageError] = useState(false);
  const measurementsRef = useRef<Measurement[]>([]);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const restored = stored ? normalizeStoredMeasurements(JSON.parse(stored)) : [];
        if (mounted) {
          measurementsRef.current = restored;
          setMeasurements(restored);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setHasStorageError(true);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const mutate = useCallback((reducer: (current: Measurement[]) => Measurement[]) => {
    const operation = writeQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const next = reducer(measurementsRef.current);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        measurementsRef.current = next;
        setMeasurements(next);
        setHasStorageError(false);
      });

    writeQueueRef.current = operation;
    return operation.catch((error: unknown) => {
      setHasStorageError(true);
      throw error;
    });
  }, []);

  const addMeasurement = useCallback(async (reading: NewMeasurement) => {
    const measurement: Measurement = {
      ...reading,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      measuredAt: new Date().toISOString(),
    };
    await mutate((current) => [measurement, ...current]);
    return measurement;
  }, [mutate]);

  const removeMeasurement = useCallback((id: string) => {
    return mutate((current) => current.filter((measurement) => measurement.id !== id));
  }, [mutate]);

  const clearMeasurements = useCallback(() => mutate(() => []), [mutate]);

  const value = useMemo(() => ({
    measurements,
    isLoading,
    hasStorageError,
    addMeasurement,
    removeMeasurement,
    clearMeasurements,
  }), [measurements, isLoading, hasStorageError, addMeasurement, removeMeasurement, clearMeasurements]);

  return (
    <MeasurementContextValue.Provider value={value}>
      {children}
    </MeasurementContextValue.Provider>
  );
}

export function useMeasurements(): MeasurementStore {
  const context = useContext(MeasurementContextValue);
  if (!context) throw new Error("useMeasurements must be used inside MeasurementsProvider");
  return context;
}

