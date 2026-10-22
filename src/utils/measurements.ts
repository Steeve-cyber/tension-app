export type MeasurementContext = "Matin" | "Soir" | "Autre";

export function getDefaultMeasurementContext(date = new Date()): MeasurementContext {
  const hour = date.getHours();
  if (hour < 12) return "Matin";
  if (hour >= 17) return "Soir";
  return "Autre";
}

export interface Measurement {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  measuredAt: string | null;
  context: MeasurementContext;
  note?: string;
  /** The previous app stored only a clock time, so these entries have no reliable date. */
  legacyTime?: string;
}

export type EvaluationTone = "normal" | "low" | "high" | "critical";

export interface PressureEvaluation {
  tone: EvaluationTone;
  label: string;
  detail: string;
}

export function evaluatePressure(systolic: number, diastolic: number): PressureEvaluation {
  if (systolic >= 180 || diastolic >= 110) {
    return {
      tone: "critical",
      label: "Valeur très élevée",
      detail: "Reprenez la mesure au calme. Si elle se confirme, demandez rapidement un avis médical.",
    };
  }

  if (systolic < 90 || diastolic < 60) {
    return {
      tone: "low",
      label: "Valeur basse",
      detail: "Une valeur basse peut être habituelle. Parlez-en à un professionnel si elle s’accompagne de symptômes.",
    };
  }

  if (systolic >= 135 || diastolic >= 85) {
    return {
      tone: "high",
      label: "Au-dessus du repère à domicile",
      detail: "Une mesure isolée ne suffit pas. Notez plusieurs relevés et échangez avec un professionnel si cela se répète.",
    };
  }

  return {
    tone: "normal",
    label: "Dans les repères à domicile",
    detail: "Repère indicatif pour une mesure à domicile chez l’adulte : moins de 135/85 mmHg.",
  };
}

export function validateMeasurement(
  systolicText: string,
  diastolicText: string,
  pulseText: string,
): string | null {
  if (!systolicText.trim() || !diastolicText.trim()) {
    return "Renseignez les deux valeurs de tension pour continuer.";
  }

  const systolic = Number(systolicText);
  const diastolic = Number(diastolicText);
  const pulse = pulseText.trim() ? Number(pulseText) : null;

  if (!Number.isInteger(systolic) || systolic < 50 || systolic > 280) {
    return "La systolique doit être un nombre compris entre 50 et 280 mmHg.";
  }

  if (!Number.isInteger(diastolic) || diastolic < 30 || diastolic > 200) {
    return "La diastolique doit être un nombre compris entre 30 et 200 mmHg.";
  }

  if (systolic <= diastolic) {
    return "La systolique doit être supérieure à la diastolique.";
  }

  if (pulse !== null && (!Number.isInteger(pulse) || pulse < 25 || pulse > 240)) {
    return "Le pouls doit être un nombre compris entre 25 et 240 BPM.";
  }

  return null;
}

export function formatMeasurementDate(measurement: Measurement): string {
  if (!measurement.measuredAt) {
    return measurement.legacyTime
      ? `Date non conservée · ${measurement.legacyTime}`
      : "Date non renseignée";
  }

  const date = new Date(measurement.measuredAt);
  if (Number.isNaN(date.getTime())) return "Date non renseignée";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatClockTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function inDateRange(measurement: Measurement, start: Date | null): boolean {
  if (!start) return true;
  if (!measurement.measuredAt) return false;
  const timestamp = new Date(measurement.measuredAt).getTime();
  return Number.isFinite(timestamp) && timestamp >= start.getTime();
}

export function getRangeStart(days: number | null): Date | null {
  if (days === null) return null;
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

