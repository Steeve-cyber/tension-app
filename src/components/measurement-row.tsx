import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, Palette, TonePill } from "@/components/tensio-ui";
import type { Measurement } from "@/utils/measurements";
import { evaluatePressure, formatMeasurementDate } from "@/utils/measurements";

export function MeasurementRow({ measurement, onDelete }: {
  measurement: Measurement;
  onDelete?: () => void;
}) {
  const evaluation = evaluatePressure(measurement.systolic, measurement.diastolic);

  return (
    <View style={styles.row}>
      <View style={[styles.edge, { backgroundColor: evaluation.tone === "normal" ? Palette.teal : evaluation.tone === "low" ? Palette.blue : evaluation.tone === "high" ? Palette.amber : Palette.red }]} />
      <View style={styles.main}>
        <View style={styles.topLine}>
          <Text style={styles.date} numberOfLines={1}>{formatMeasurementDate(measurement)}</Text>
          <TonePill tone={evaluation.tone} compact>{evaluation.label}</TonePill>
        </View>
        <View style={styles.measureLine}>
          <Text style={styles.values}>{measurement.systolic}<Text style={styles.slash}> / </Text>{measurement.diastolic}</Text>
          <Text style={styles.unit}>mmHg</Text>
          {measurement.pulse !== null ? (
            <View style={styles.pulseTag}>
              <Icon name="heart" size={12} color={Palette.red} />
              <Text style={styles.pulseText}>{measurement.pulse} bpm</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.bottomLine}>
          <Text style={styles.context}>{measurement.context}</Text>
          {measurement.note ? <Text numberOfLines={1} style={styles.note}>· {measurement.note}</Text> : null}
        </View>
      </View>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Supprimer cette mesure"
          hitSlop={10}
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.65 }]}
        >
          <Icon name="trash" size={16} color={Palette.faint} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, borderRadius: 18, overflow: "hidden", flexDirection: "row", alignItems: "stretch", marginBottom: 10, minHeight: 92 },
  edge: { width: 4 },
  main: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, minWidth: 0 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 },
  date: { flex: 1, minWidth: 0, color: Palette.muted, fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  measureLine: { flexDirection: "row", alignItems: "baseline", gap: 7 },
  values: { color: Palette.ink, fontSize: 24, lineHeight: 29, fontWeight: "700", fontVariant: ["tabular-nums"] },
  slash: { color: Palette.faint, fontSize: 18, fontWeight: "400" },
  unit: { color: Palette.faint, fontSize: 10, fontWeight: "700" },
  pulseTag: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 7, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#FFF0EF", borderRadius: 20 },
  pulseText: { color: Palette.muted, fontSize: 10, fontWeight: "700" },
  bottomLine: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 5 },
  context: { color: Palette.faint, fontSize: 10, fontWeight: "600" },
  note: { flex: 1, minWidth: 0, color: Palette.muted, fontSize: 10 },
  deleteButton: { width: 42, alignItems: "center", justifyContent: "center" },
});

