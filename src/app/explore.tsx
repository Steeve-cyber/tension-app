import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Link } from "expo-router";

import { ExternalLink } from "@/components/external-link";
import { HintRow } from "@/components/hint-row";
import { WebBadge } from "@/components/web-badge";
import { Collapsible } from "@/components/ui/collapsible";
import { MeasurementRow } from "@/components/measurement-row";
import { PressureChart } from "@/components/pressure-chart";
import { AnimatedBlock, BrandMark, Icon, Palette, Panel, SectionHeading, TonePill, uiStyles } from "@/components/tensio-ui";
import { useMeasurements } from "@/providers/measurements-provider";
import { evaluatePressure, formatMeasurementDate, getRangeStart, inDateRange, type Measurement } from "@/utils/measurements";

type RangeKey = "7 jours" | "30 jours" | "Tout";
const RANGES: { label: RangeKey; days: number | null }[] = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "Tout", days: null },
];

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function createCsv(measurements: Measurement[]): string {
  const rows = [
    ["Date", "Moment", "Systolique (mmHg)", "Diastolique (mmHg)", "Pouls (bpm)", "Note"],
    ...measurements.map((measurement) => [
      measurement.measuredAt ? formatMeasurementDate(measurement) : `Date non conservée${measurement.legacyTime ? ` · ${measurement.legacyTime}` : ""}`,
      measurement.context,
      measurement.systolic,
      measurement.diastolic,
      measurement.pulse ?? "",
      measurement.note ?? "",
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}

function confirmAction(title: string, message: string, action: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) action();
    return;
  }
  Alert.alert(title, message, [
    { text: "Annuler", style: "cancel" },
    { text: "Supprimer", style: "destructive", onPress: action },
  ]);
}

function MetricCard({ label, value, unit, icon, tint }: {
  label: string;
  value: string;
  unit: string;
  icon: "chart" | "heart" | "calendar";
  tint: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: tint === Palette.teal ? Palette.tealSoft : tint === Palette.blue ? Palette.blueSoft : Palette.purpleSoft }]}>
        <Icon name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.metricValue} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function ExploreScreen() {
  const { measurements, isLoading, removeMeasurement, clearMeasurements } = useMeasurements();
  const [range, setRange] = useState<RangeKey>("30 jours");
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const days = RANGES.find((item) => item.label === range)?.days ?? null;
  const filtered = useMemo(() => {
    const start = getRangeStart(days);
    return measurements.filter((measurement) => inDateRange(measurement, start));
  }, [days, measurements]);
  const averageSystolic = filtered.length
    ? Math.round(filtered.reduce((sum, item) => sum + item.systolic, 0) / filtered.length)
    : null;
  const averageDiastolic = filtered.length
    ? Math.round(filtered.reduce((sum, item) => sum + item.diastolic, 0) / filtered.length)
    : null;
  const withPulse = filtered.filter((measurement) => measurement.pulse !== null);
  const averagePulse = withPulse.length
    ? Math.round(withPulse.reduce((sum, item) => sum + (item.pulse ?? 0), 0) / withPulse.length)
    : null;
  const averageEvaluation = averageSystolic !== null && averageDiastolic !== null
    ? evaluatePressure(averageSystolic, averageDiastolic)
    : null;

  const deleteOne = (measurement: Measurement) => confirmAction(
    "Supprimer ce relevé ?",
    `${measurement.systolic}/${measurement.diastolic} mmHg · ${formatMeasurementDate(measurement)}`,
    () => {
      setOperationMessage(null);
      removeMeasurement(measurement.id).catch(() => setOperationMessage("La suppression n’a pas abouti. Réessayez."));
    },
  );

  const deleteAll = () => confirmAction(
    "Effacer tout l’historique ?",
    "Cette action supprimera définitivement les relevés enregistrés sur cet appareil.",
    () => {
      setOperationMessage(null);
      clearMeasurements().catch(() => setOperationMessage("L’historique n’a pas pu être effacé. Réessayez."));
    },
  );

  const exportAll = async () => {
    if (measurements.length === 0) return;
    setOperationMessage(null);
    setIsExporting(true);
    const csv = createCsv([...measurements].sort((first, second) => (second.measuredAt ?? "").localeCompare(first.measuredAt ?? "")));
    const filename = `tensio-releves-${new Date().toISOString().slice(0, 10)}.csv`;

    try {
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setOperationMessage("Votre fichier CSV est prêt.");
      } else {
        const directory = FileSystem.cacheDirectory;
        if (!directory) throw new Error("Le stockage temporaire n’est pas disponible.");
        const fileUri = `${directory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (!(await Sharing.isAvailableAsync())) throw new Error("Le partage de fichiers n’est pas disponible sur cet appareil.");
        await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Exporter mon suivi Tensio" });
      }
    } catch (cause) {
      setOperationMessage(cause instanceof Error ? cause.message : "L’exportation a échoué. Réessayez.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={uiStyles.page} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={uiStyles.scrollContent}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <BrandMark size={40} />
            <View>
              <Text style={styles.brandName}>Tensio</Text>
              <Text style={styles.brandDescriptor}>ANALYSES & CONSEILS</Text>
            </View>
          </View>
          <Link href="/" asChild>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}>
              <Icon name="plus" size={17} color={Palette.tealDark} />
              <Text style={styles.backLabel}>Nouveau relevé</Text>
            </Pressable>
          </Link>
        </View>

        <AnimatedBlock delay={30} style={styles.intro}>
          <Text style={styles.eyebrow}>VOTRE ÉVOLUTION</Text>
          <Text style={styles.title}>Mieux comprendre{ "\n" }vos relevés.</Text>
          <Text style={styles.subtitle}>Des tendances claires pour mieux en parler avec votre professionnel de santé.</Text>
        </AnimatedBlock>

        <AnimatedBlock delay={90}>
          <View style={styles.rangeBar} accessibilityRole="tablist">
            {RANGES.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: range === item.label }}
                onPress={() => setRange(item.label)}
                style={({ pressed }) => [styles.rangeButton, range === item.label && styles.rangeSelected, pressed && { opacity: 0.75 }]}
              >
                <Text style={[styles.rangeText, range === item.label && styles.rangeTextSelected]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </AnimatedBlock>

        <AnimatedBlock delay={140} style={styles.block}>
          <View style={styles.metricsRow}>
            <MetricCard label="Moyenne · SYS / DIA" value={averageSystolic !== null ? `${averageSystolic} / ${averageDiastolic}` : "—"} unit="mmHg" icon="chart" tint={Palette.teal} />
            <MetricCard label="Pouls moyen" value={averagePulse !== null ? String(averagePulse) : "—"} unit="bpm" icon="heart" tint={Palette.blue} />
            <MetricCard label="Relevés" value={String(filtered.length)} unit={filtered.length === 1 ? "mesure" : "mesures"} icon="calendar" tint={Palette.purple} />
          </View>
        </AnimatedBlock>

        <AnimatedBlock delay={190} style={styles.block}>
          <SectionHeading eyebrow="VUE D’ENSEMBLE" title="Évolution de la tension" />
          <Panel style={styles.chartPanel}>
            {averageEvaluation ? (
              <View style={styles.averageSummary}>
                <Text style={styles.averageLabel}>Moyenne de la période</Text>
                <TonePill tone={averageEvaluation.tone} compact>{averageEvaluation.label}</TonePill>
              </View>
            ) : null}
            <PressureChart measurements={filtered} />
            <Text style={styles.chartNote}>Les courbes représentent vos valeurs systoliques et diastoliques enregistrées.</Text>
          </Panel>
        </AnimatedBlock>

        <AnimatedBlock delay={240} style={styles.block}>
          <View style={styles.historyTitleRow}>
            <SectionHeading eyebrow="VOTRE CARNET" title="Mesures enregistrées" />
            {measurements.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={exportAll}
                disabled={isExporting}
                style={({ pressed }) => [styles.exportButton, pressed && { opacity: 0.75 }]}
              >
                <Icon name={isExporting ? "clock" : "download"} size={15} color={Palette.tealDark} />
                <Text style={styles.exportText}>{isExporting ? "Préparation…" : "Exporter"}</Text>
              </Pressable>
            ) : null}
          </View>

          {operationMessage ? (
            <View style={styles.operationMessage}>
              <Icon name="info" size={15} color={Palette.tealDark} />
              <Text style={styles.operationText}>{operationMessage}</Text>
            </View>
          ) : null}

          {measurements.length > 0 ? (
            <>
              {filtered.length > 0 ? filtered.map((measurement) => (
                <MeasurementRow key={measurement.id} measurement={measurement} onDelete={() => deleteOne(measurement)} />
              )) : (
                <Panel style={styles.emptyPanel}>
                  <Text style={styles.emptyText}>Aucun relevé dans cette période. Essayez une autre plage.</Text>
                </Panel>
              )}
              {range === "Tout" ? (
                <Pressable accessibilityRole="button" onPress={deleteAll} style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.65 }]}>
                  <Icon name="trash" size={14} color={Palette.red} />
                  <Text style={styles.clearText}>Effacer tout l’historique</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Panel style={styles.emptyPanel}>
              <View style={styles.emptyIcon}><Icon name="chart" size={21} color={Palette.teal} /></View>
              <Text style={styles.emptyTitle}>Votre analyse commence avec un premier relevé.</Text>
              <Text style={styles.emptyText}>Une série de mesures aide à visualiser vos tendances au fil des jours.</Text>
              <Link href="/" asChild>
                <Pressable style={styles.addFirstButton}>
                  <Icon name="plus" size={15} color="#FFFFFF" />
                  <Text style={styles.addFirstText}>Ajouter une mesure</Text>
                </Pressable>
              </Link>
            </Panel>
          )}
        </AnimatedBlock>

        <AnimatedBlock delay={290} style={styles.block}>
          <SectionHeading eyebrow="LE BON GESTE" title="Bien prendre sa tension" />
          <Panel style={styles.guidePanel}>
            <View style={styles.guideIntro}>
              <View style={styles.guideIcon}><Icon name="arm" size={19} color={Palette.tealDark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guideTitle}>Quelques repères pour un relevé fiable</Text>
                <Text style={styles.guideCopy}>Installez-vous au calme et suivez les indications de votre professionnel de santé.</Text>
              </View>
            </View>
            <HintRow number="01" text="Restez assis au calme pendant 3 à 5 minutes avant la mesure." />
            <HintRow number="02" text="Gardez le dos soutenu, les pieds au sol et le bras posé à hauteur du cœur." />
            <HintRow number="03" text="À domicile, la « règle des 3 » prévoit trois mesures matin et soir pendant trois jours." />
            <View style={styles.thresholdCard}>
              <View>
                <Text style={styles.thresholdLabel}>REPÈRE INDICATIF À DOMICILE · ADULTE</Text>
                <Text style={styles.thresholdValue}>&lt; 135 / 85 <Text style={styles.thresholdUnit}>mmHg</Text></Text>
              </View>
              <Icon name="info" size={18} color={Palette.tealDark} />
            </View>
            <Text style={styles.medicalNote}>Une valeur répétée au-dessus de ce repère mérite d’être discutée avec un professionnel. Une seule mesure ne permet pas de poser un diagnostic.</Text>
            <ExternalLink href="https://www.ameli.fr/assure/sante/themes/hypertension-arterielle-hta/symptomes-diagnostic" asChild>
              <Pressable accessibilityRole="link" style={({ pressed }) => [styles.sourceLink, pressed && { opacity: 0.7 }]}>
                <Text style={styles.sourceText}>Source : Assurance Maladie · automesure à domicile</Text>
                <Icon name="arrow" size={14} color={Palette.teal} />
              </Pressable>
            </ExternalLink>
            <Collapsible title="Pourquoi reprendre plusieurs mesures ?">
              <Text style={styles.medicalNote}>La tension varie au fil de la journée. Une série de mesures espacées et réalisées dans de bonnes conditions donne un aperçu plus utile qu’un relevé isolé.</Text>
            </Collapsible>
          </Panel>
        </AnimatedBlock>

        <View style={styles.footerPrivacy}>
          <Icon name="shield" size={15} color={Palette.tealDark} />
          <Text style={styles.footerText}>Vos mesures sont stockées localement sur cet appareil.</Text>
        </View>
        {Platform.OS === "web" ? <View style={{ marginTop: 16 }}><WebBadge /></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 29 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandName: { color: Palette.ink, fontSize: 19, fontWeight: "800", letterSpacing: -0.5 },
  brandDescriptor: { color: Palette.faint, fontSize: 8, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, backgroundColor: Palette.tealSoft, paddingHorizontal: 11, paddingVertical: 9 },
  backLabel: { color: Palette.tealDark, fontSize: 10, fontWeight: "800" },
  intro: { marginBottom: 20 },
  eyebrow: { color: Palette.teal, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginBottom: 8 },
  title: { color: Palette.ink, fontSize: 31, lineHeight: 37, fontWeight: "800", letterSpacing: -1 },
  subtitle: { color: Palette.muted, fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 420 },
  rangeBar: { flexDirection: "row", alignSelf: "flex-start", gap: 3, backgroundColor: "#E8EFF0", borderRadius: 13, padding: 4, marginBottom: 15 },
  rangeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  rangeSelected: { backgroundColor: Palette.surface, shadowColor: "#27404D", shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  rangeText: { color: Palette.muted, fontSize: 10, fontWeight: "700" },
  rangeTextSelected: { color: Palette.ink, fontWeight: "800" },
  block: { marginBottom: 27 },
  metricsRow: { flexDirection: "row", gap: 9 },
  metricCard: { flex: 1, minWidth: 0, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border, borderRadius: 17, paddingHorizontal: 10, paddingVertical: 11, minHeight: 109 },
  metricIcon: { width: 28, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 7 },
  metricValue: { color: Palette.ink, fontSize: 16, lineHeight: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
  metricUnit: { color: Palette.faint, fontSize: 9, fontWeight: "600", marginTop: 1 },
  metricLabel: { color: Palette.muted, fontSize: 9, lineHeight: 12, fontWeight: "600", marginTop: 5 },
  chartPanel: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 13 },
  averageSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  averageLabel: { color: Palette.ink, fontSize: 11, fontWeight: "700" },
  chartNote: { color: Palette.faint, fontSize: 9, lineHeight: 14, marginTop: 11 },
  historyTitleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  exportButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "#CDE8E3", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, marginBottom: 15 },
  exportText: { color: Palette.tealDark, fontSize: 10, fontWeight: "800" },
  operationMessage: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, backgroundColor: Palette.tealSoft, padding: 10, marginBottom: 11 },
  operationText: { color: Palette.tealDark, fontSize: 10, lineHeight: 15, flex: 1 },
  clearButton: { flexDirection: "row", alignSelf: "flex-end", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 4 },
  clearText: { color: Palette.red, fontSize: 10, fontWeight: "700" },
  emptyPanel: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 24 },
  emptyIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: Palette.tealSoft, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  emptyTitle: { color: Palette.ink, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
  emptyText: { color: Palette.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 5 },
  addFirstButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Palette.teal, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10, marginTop: 16 },
  addFirstText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  guidePanel: { padding: 17 },
  guideIntro: { flexDirection: "row", gap: 11, alignItems: "flex-start", marginBottom: 15 },
  guideIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: Palette.tealSoft, alignItems: "center", justifyContent: "center" },
  guideTitle: { color: Palette.ink, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  guideCopy: { color: Palette.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  guideStep: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#EEF2F3" },
  stepNumber: { width: 25, height: 25, borderRadius: 9, backgroundColor: Palette.tealSoft, alignItems: "center", justifyContent: "center" },
  stepNumberText: { color: Palette.tealDark, fontSize: 9, fontWeight: "800" },
  stepText: { flex: 1, color: Palette.muted, fontSize: 10, lineHeight: 16, paddingTop: 4 },
  thresholdCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EFF8F6", borderRadius: 13, paddingHorizontal: 12, paddingVertical: 11, marginTop: 9 },
  thresholdLabel: { color: Palette.tealDark, fontSize: 8, fontWeight: "800", letterSpacing: 0.7 },
  thresholdValue: { color: Palette.ink, fontSize: 19, fontWeight: "800", marginTop: 3, fontVariant: ["tabular-nums"] },
  thresholdUnit: { color: Palette.muted, fontSize: 10, fontWeight: "600" },
  medicalNote: { color: Palette.muted, fontSize: 10, lineHeight: 16, marginTop: 11 },
  sourceLink: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 14, borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: 12 },
  sourceText: { color: Palette.tealDark, fontSize: 10, fontWeight: "700", flex: 1 },
  footerPrivacy: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, marginTop: 1 },
  footerText: { color: Palette.muted, fontSize: 10, fontWeight: "600" },
});



