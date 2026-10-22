import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedIcon } from "@/components/animated-icon";
import { MeasurementRow } from "@/components/measurement-row";
import {
  AnimatedBlock,
  Icon,
  Palette,
  Panel,
  PulseOrb,
  SectionHeading,
  TonePill,
  uiStyles,
} from "@/components/tensio-ui";
import { useDailyReminder } from "@/hooks/use-daily-reminder";
import { useMeasurements } from "@/providers/measurements-provider";
import {
  evaluatePressure,
  formatClockTime,
  getDefaultMeasurementContext,
  getRangeStart,
  inDateRange,
  validateMeasurement,
  type MeasurementContext,
} from "@/utils/measurements";

const REMINDER_TIMES = ["08:00", "20:00"];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-mid";
  return "Bonsoir";
}

function dateLabel(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(new Date())
    .replace(/^./, (letter) => letter.toUpperCase());
}

function StatTile({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  icon: "heart" | "calendar" | "chart";
  color: string;
}) {
  return (
    <View style={styles.statTile}>
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor:
              color === Palette.teal
                ? Palette.tealSoft
                : color === Palette.blue
                  ? Palette.blueSoft
                  : Palette.purpleSoft,
          },
        ]}
      >
        <Icon name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReadingInput({
  label,
  hint,
  value,
  placeholder,
  onChangeText,
  onSubmitEditing,
  returnKeyType = "next",
}: {
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  returnKeyType?: "next" | "done";
}) {
  return (
    <View style={styles.inputCell}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={styles.inputHint}>{hint}</Text>
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          accessibilityLabel={`${label}, ${hint}`}
          value={value}
          onChangeText={(text) =>
            onChangeText(text.replace(/\D/g, "").slice(0, 3))
          }
          placeholder={placeholder}
          placeholderTextColor="#ADBBC0"
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          selectionColor={Palette.teal}
          style={styles.input}
        />
        <Text style={styles.inputUnit}>{hint === "BPM" ? "bpm" : "mmHg"}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { measurements, isLoading, hasStorageError, addMeasurement } =
    useMeasurements();
  const reminder = useDailyReminder();
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [note, setNote] = useState("");
  const [context, setContext] = useState<MeasurementContext>(
    getDefaultMeasurementContext(),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const latest = measurements[0];
  const evaluation = latest
    ? evaluatePressure(latest.systolic, latest.diastolic)
    : null;
  const weekMeasurements = useMemo(
    () =>
      measurements.filter((measurement) =>
        inDateRange(measurement, getRangeStart(7)),
      ),
    [measurements],
  );
  const avgPressure = weekMeasurements.length
    ? `${Math.round(weekMeasurements.reduce((sum, item) => sum + item.systolic, 0) / weekMeasurements.length)} / ${Math.round(weekMeasurements.reduce((sum, item) => sum + item.diastolic, 0) / weekMeasurements.length)}`
    : "—";
  const pulseMeasurements = weekMeasurements.filter(
    (item) => item.pulse !== null,
  );
  const avgPulse = pulseMeasurements.length
    ? String(
        Math.round(
          pulseMeasurements.reduce((sum, item) => sum + (item.pulse ?? 0), 0) /
            pulseMeasurements.length,
        ),
      )
    : "—";

  const liveEvaluation = useMemo(() => {
    if (!systolic || !diastolic) return null;
    const sys = Number(systolic);
    const dia = Number(diastolic);
    if (!Number.isInteger(sys) || !Number.isInteger(dia) || sys <= dia)
      return null;
    return evaluatePressure(sys, dia);
  }, [systolic, diastolic]);

  const handleSave = async () => {
    setSavedMessage(null);
    const problem = validateMeasurement(systolic, diastolic, pulse);
    if (problem) {
      setValidationMessage(problem);
      return;
    }

    setValidationMessage(null);
    setIsSaving(true);
    try {
      await addMeasurement({
        systolic: Number(systolic),
        diastolic: Number(diastolic),
        pulse: pulse ? Number(pulse) : null,
        context,
        note: note.trim() || undefined,
      });
      setSystolic("");
      setDiastolic("");
      setPulse("");
      setNote("");
      setContext(getDefaultMeasurementContext());
      setSavedMessage(`Mesure enregistrée à ${formatClockTime(new Date())}.`);
    } catch {
      setValidationMessage(
        "La mesure n’a pas pu être enregistrée. Réessayez dans un instant.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={uiStyles.page} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={uiStyles.scrollContent}
        >
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <AnimatedIcon />
              <View>
                <Text style={styles.brandName}>Tensio</Text>
                <Text style={styles.brandDescriptor}>
                  VOTRE SUIVI PERSONNEL
                </Text>
              </View>
            </View>
            <View style={styles.localBadge}>
              <View style={styles.localDot} />
              <Text style={styles.localBadgeText}>Privé</Text>
            </View>
          </View>

          <AnimatedBlock delay={30} style={styles.intro}>
            <Text style={styles.dateEyebrow}>{dateLabel()}</Text>
            <View style={styles.introTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greeting()},</Text>
                <Text style={styles.headline}>à l’écoute de votre santé.</Text>
              </View>
              <Link href="/explore" asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ouvrir les analyses"
                  style={({ pressed }) => [
                    styles.analyticsButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Icon name="chart" size={19} color={Palette.tealDark} />
                </Pressable>
              </Link>
            </View>
            <Text style={styles.introCopy}>
              Un suivi simple, régulier et à votre rythme.
            </Text>
          </AnimatedBlock>
          <AnimatedBlock delay={100}>
            <View style={styles.hero}>
              <View style={styles.heroGlowOne} />
              <View style={styles.heroGlowTwo} />
              <View style={styles.heroCopy}>
                <View style={styles.heroKicker}>
                  <View style={styles.heroKickerDot} />
                  <Text style={styles.heroKickerText}>
                    {latest ? "DERNIÈRE MESURE" : "VOTRE ESPACE SANTÉ"}
                  </Text>
                </View>
                {latest ? (
                  <>
                    <Text style={styles.heroReading}>
                      {latest.systolic}
                      <Text style={styles.heroSlash}> / </Text>
                      {latest.diastolic}
                    </Text>
                    <Text style={styles.heroUnit}>
                      mmHg <Text style={styles.heroDivider}>·</Text>{" "}
                      {latest.pulse
                        ? `${latest.pulse} bpm`
                        : "pouls non renseigné"}
                    </Text>
                    <View style={styles.heroStatus}>
                      <TonePill tone={evaluation?.tone ?? "normal"} compact>
                        {evaluation?.label}
                      </TonePill>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.heroTitle}>
                      Votre suivi{"\n"}commence ici.
                    </Text>
                    <Text style={styles.heroUnit}>Chaque relevé compte.</Text>
                  </>
                )}
                <Text style={styles.heroDate}>
                  {latest
                    ? latest.measuredAt
                      ? new Intl.DateTimeFormat("fr-FR", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(latest.measuredAt))
                      : `Heure relevée · ${latest.legacyTime ?? "—"}`
                    : "Gardez un historique clair de vos relevés."}
                </Text>
              </View>
              <View style={styles.heroVisual} pointerEvents="none">
                <PulseOrb size={118} />
              </View>
              <View style={styles.heroBottomLine} />
            </View>
          </AnimatedBlock>
          <AnimatedBlock delay={150}>
            <View style={styles.statsGrid}>
              <StatTile
                label="Moyenne · 7 jours"
                value={avgPressure}
                unit="mmHg"
                icon="chart"
                color={Palette.teal}
              />
              <StatTile
                label="Pouls moyen · 7 j"
                value={avgPulse}
                unit="bpm"
                icon="heart"
                color={Palette.blue}
              />
              <StatTile
                label="Relevés · 7 jours"
                value={String(weekMeasurements.length)}
                unit="mesures"
                icon="calendar"
                color={Palette.purple}
              />
            </View>
          </AnimatedBlock>
          <AnimatedBlock delay={200} style={styles.sectionBlock}>
            <SectionHeading eyebrow="VOTRE CARNET" title="Nouvelle mesure" />
            <Panel style={styles.formPanel}>
              <View style={styles.formIntro}>
                <View style={styles.formIcon}>
                  <Icon name="pulse" size={19} color={Palette.tealDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formTitle}>Saisissez vos valeurs</Text>
                  <Text style={styles.formCaption}>
                    Lues sur votre tensiomètre à brassard
                  </Text>
                </View>
                <Text style={styles.unitBadge}>mmHg</Text>
              </View>

              <View style={styles.inputRow}>
                <ReadingInput
                  label="Systolique"
                  hint="SYS"
                  value={systolic}
                  placeholder="120"
                  onChangeText={setSystolic}
                />
                <View style={styles.inputDivider} />
                <ReadingInput
                  label="Diastolique"
                  hint="DIA"
                  value={diastolic}
                  placeholder="80"
                  onChangeText={setDiastolic}
                />
              </View>
              <View style={styles.pulseInputRow}>
                <ReadingInput
                  label="Fréquence cardiaque"
                  hint="BPM"
                  value={pulse}
                  placeholder="72"
                  onChangeText={setPulse}
                  returnKeyType="done"
                />
                <Text style={styles.optionalLabel}>Facultatif</Text>
              </View>

              <View style={styles.contextBlock}>
                <Text style={styles.contextLabel}>MOMENT DU RELEVÉ</Text>
                <View style={styles.contextChoices}>
                  {(["Matin", "Soir", "Autre"] as const).map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: context === value }}
                      onPress={() => setContext(value)}
                      style={({ pressed }) => [
                        styles.contextChip,
                        context === value && styles.contextChipSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Icon
                        name={
                          value === "Matin"
                            ? "sun"
                            : value === "Soir"
                              ? "moon"
                              : "clock"
                        }
                        size={14}
                        color={
                          context === value ? Palette.tealDark : Palette.muted
                        }
                      />
                      <Text
                        style={[
                          styles.contextChipText,
                          context === value && styles.contextChipTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <TextInput
                accessibilityLabel="Note facultative"
                value={note}
                onChangeText={setNote}
                placeholder="Note facultative · ex. après 5 min de repos"
                placeholderTextColor="#9CADB3"
                maxLength={120}
                returnKeyType="done"
                style={styles.noteInput}
              />

              {liveEvaluation ? (
                <View
                  style={[
                    styles.liveFeedback,
                    liveEvaluation.tone === "normal"
                      ? styles.liveNormal
                      : liveEvaluation.tone === "low"
                        ? styles.liveLow
                        : liveEvaluation.tone === "high"
                          ? styles.liveHigh
                          : styles.liveCritical,
                  ]}
                >
                  <TonePill tone={liveEvaluation.tone} compact>
                    {liveEvaluation.label}
                  </TonePill>
                  <Text style={styles.feedbackCopy}>
                    {liveEvaluation.detail}
                  </Text>
                </View>
              ) : null}

              {validationMessage ? (
                <View style={styles.errorBox}>
                  <Icon name="info" size={16} color={Palette.red} />
                  <Text style={styles.errorText}>{validationMessage}</Text>
                </View>
              ) : null}
              {savedMessage ? (
                <View style={styles.successBox}>
                  <Icon name="check" size={16} color={Palette.tealDark} />
                  <Text style={styles.successText}>{savedMessage}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaving }}
                onPress={handleSave}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && !isSaving && styles.savePressed,
                  isSaving && { opacity: 0.75 },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Icon name="plus" size={19} color="#FFFFFF" />
                )}
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Enregistrement…" : "Enregistrer la mesure"}
                </Text>
                {!isSaving ? (
                  <Icon name="arrow" size={16} color="#D5FFF7" />
                ) : null}
              </Pressable>
              <Text style={styles.formFootnote}>
                Vos données restent enregistrées sur cet appareil.
              </Text>
            </Panel>
          </AnimatedBlock>
          <AnimatedBlock delay={250} style={styles.sectionBlock}>
            <ReminderCard reminder={reminder} />
          </AnimatedBlock>
          <AnimatedBlock delay={300} style={styles.sectionBlock}>
            <View style={styles.recentHeading}>
              <SectionHeading eyebrow="VOTRE HISTORIQUE" title="Récemment" />
              <Link href="/explore" asChild>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.seeAll,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.seeAllText}>Tout voir</Text>
                  <Icon name="arrow" size={14} color={Palette.teal} />
                </Pressable>
              </Link>
            </View>
            {hasStorageError ? (
              <Panel style={styles.storageNotice}>
                <Icon name="info" size={16} color={Palette.amber} />
                <Text style={styles.storageNoticeText}>
                  Le stockage local est indisponible. Vérifiez l’espace de votre
                  appareil avant d’ajouter un relevé.
                </Text>
              </Panel>
            ) : null}
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={Palette.teal} />
                <Text style={styles.loadingText}>
                  Chargement de votre suivi…
                </Text>
              </View>
            ) : measurements.length > 0 ? (
              measurements
                .slice(0, 3)
                .map((measurement) => (
                  <MeasurementRow
                    key={measurement.id}
                    measurement={measurement}
                  />
                ))
            ) : (
              <Panel style={styles.emptyHistory}>
                <View style={styles.emptyIcon}>
                  <Icon name="calendar" size={21} color={Palette.teal} />
                </View>
                <Text style={styles.emptyTitle}>Pas encore de mesure</Text>
                <Text style={styles.emptyCopy}>
                  Votre historique se construira au fil des relevés enregistrés
                  ici.
                </Text>
              </Panel>
            )}
          </AnimatedBlock>
          <View style={styles.privacyFooter}>
            <Icon name="shield" size={16} color={Palette.tealDark} />
            <Text style={styles.privacyText}>
              Un carnet personnel. Les mesures ne quittent pas votre appareil.
            </Text>
          </View>
          <Text style={styles.disclaimer}>
            Tensio aide à suivre des mesures ; il ne remplace pas un avis
            médical et ne pose pas de diagnostic.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReminderCard({
  reminder,
}: {
  reminder: ReturnType<typeof useDailyReminder>;
}) {
  return (
    <Panel style={styles.reminderPanel}>
      <View style={styles.reminderTop}>
        <View style={styles.reminderIcon}>
          <Icon name="bell" size={18} color={Palette.tealDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderTitle}>Un rappel en douceur</Text>
          <Text style={styles.reminderCopy}>
            {reminder.available
              ? "Choisissez un moment régulier pour votre relevé."
              : "Les notifications quotidiennes sont disponibles sur mobile."}
          </Text>
        </View>
        {reminder.available ? (
          <Switch
            accessibilityLabel="Activer le rappel quotidien"
            value={reminder.enabled}
            onValueChange={reminder.setEnabled}
            disabled={!reminder.isReady}
            trackColor={{ false: "#D8E2E4", true: "#79CFC2" }}
            thumbColor={reminder.enabled ? Palette.teal : "#FFFFFF"}
          />
        ) : null}
      </View>
      {reminder.available ? (
        <View style={styles.reminderBottom}>
          <Text style={styles.reminderTimeLabel}>
            {reminder.enabled
              ? `Rappel activé · ${reminder.time}`
              : "HEURE DU RAPPEL"}
          </Text>
          <View style={styles.reminderTimes}>
            {REMINDER_TIMES.map((time) => (
              <Pressable
                key={time}
                onPress={() => reminder.setTime(time)}
                accessibilityRole="button"
                accessibilityState={{ selected: reminder.time === time }}
                style={({ pressed }) => [
                  styles.reminderTimeChip,
                  reminder.time === time && styles.reminderTimeSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.reminderTimeText,
                    reminder.time === time && styles.reminderTimeTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {reminder.error ? (
        <Text style={styles.reminderError}>{reminder.error}</Text>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  brandName: {
    color: Palette.ink,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandDescriptor: {
    color: Palette.faint,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 2,
  },
  localBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  localDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: Palette.teal,
  },
  localBadgeText: { color: Palette.muted, fontSize: 11, fontWeight: "700" },
  intro: { marginBottom: 19 },
  dateEyebrow: {
    color: Palette.tealDark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  introTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  greeting: {
    color: Palette.ink,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  headline: {
    color: Palette.ink,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "500",
    letterSpacing: -0.8,
  },
  introCopy: {
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  analyticsButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Palette.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  hero: {
    minHeight: 211,
    overflow: "hidden",
    borderRadius: 25,
    backgroundColor: Palette.navy,
    padding: 21,
    justifyContent: "center",
    marginBottom: 13,
  },
  heroGlowOne: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 150,
    right: -95,
    top: -105,
    backgroundColor: "rgba(59, 162, 151, 0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 100,
    right: 15,
    bottom: -135,
    backgroundColor: "rgba(82, 129, 186, 0.13)",
  },
  heroCopy: { zIndex: 2, maxWidth: "70%" },
  heroKicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },
  heroKickerDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#80E3D1",
  },
  heroKickerText: {
    color: "#B4CBD2",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.35,
  },
  heroReading: {
    color: "#FFFFFF",
    fontSize: 43,
    lineHeight: 49,
    fontWeight: "700",
    letterSpacing: -1.4,
    fontVariant: ["tabular-nums"],
  },
  heroSlash: { color: "#91B5BB", fontSize: 31, fontWeight: "400" },
  heroUnit: { color: "#ADC4CD", fontSize: 11, fontWeight: "600", marginTop: 2 },
  heroDivider: { color: "#4C7481" },
  heroStatus: { marginTop: 12 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  heroDate: {
    color: "#85A6B2",
    fontSize: 10,
    marginTop: 12,
    textTransform: "capitalize",
  },
  heroVisual: { position: "absolute", right: 5, top: 44, opacity: 0.98 },
  heroBottomLine: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(207,244,237,0.12)",
  },
  statsGrid: { flexDirection: "row", gap: 9, marginBottom: 28 },
  statTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 12,
    alignItems: "flex-start",
    minHeight: 112,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    color: Palette.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    maxWidth: "100%",
  },
  statUnit: {
    color: Palette.faint,
    fontSize: 9,
    marginTop: 1,
    fontWeight: "600",
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  sectionBlock: { marginBottom: 26 },
  formPanel: { padding: 17 },
  formIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  formIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  formTitle: { color: Palette.ink, fontSize: 14, fontWeight: "700" },
  formCaption: { color: Palette.muted, fontSize: 10, marginTop: 2 },
  unitBadge: {
    color: Palette.tealDark,
    backgroundColor: Palette.tealSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 9,
    fontWeight: "800",
  },
  inputRow: { flexDirection: "row", alignItems: "stretch" },
  inputCell: { flex: 1, minWidth: 0 },
  inputDivider: {
    width: 1,
    backgroundColor: Palette.border,
    marginHorizontal: 14,
    marginVertical: 2,
  },
  inputLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
    marginBottom: 7,
  },
  inputLabel: { color: Palette.ink, fontSize: 11, fontWeight: "700" },
  inputHint: {
    color: Palette.faint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 13,
    backgroundColor: "#FAFCFC",
    paddingHorizontal: 12,
    height: 55,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: Palette.ink,
    fontSize: 27,
    fontWeight: "700",
    paddingVertical: 0,
    fontVariant: ["tabular-nums"],
  },
  inputUnit: {
    color: Palette.faint,
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 8,
  },
  pulseInputRow: { marginTop: 15, position: "relative", paddingRight: 80 },
  optionalLabel: {
    position: "absolute",
    right: 0,
    bottom: 19,
    color: Palette.faint,
    fontSize: 9,
    fontWeight: "600",
  },
  contextBlock: { marginTop: 18 },
  contextLabel: {
    color: Palette.faint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 9,
  },
  contextChoices: { flexDirection: "row", gap: 8 },
  contextChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: Palette.surfaceSoft,
    borderWidth: 1,
    borderColor: "transparent",
  },
  contextChipSelected: {
    backgroundColor: Palette.tealSoft,
    borderColor: "#B4E3DC",
  },
  contextChipText: { color: Palette.muted, fontSize: 10, fontWeight: "600" },
  contextChipTextSelected: { color: Palette.tealDark, fontWeight: "800" },
  noteInput: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: Palette.ink,
    fontSize: 11,
    backgroundColor: "#FAFCFC",
  },
  liveFeedback: { borderRadius: 14, padding: 12, marginTop: 13, gap: 8 },
  liveNormal: { backgroundColor: "#F0FAF7" },
  liveLow: { backgroundColor: "#F0F4FC" },
  liveHigh: { backgroundColor: "#FFFAF0" },
  liveCritical: { backgroundColor: "#FFF5F4" },
  feedbackCopy: { color: Palette.muted, fontSize: 10, lineHeight: 15 },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: Palette.redSoft,
    borderRadius: 11,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    color: Palette.red,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  successBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: Palette.tealSoft,
    borderRadius: 11,
    padding: 10,
    marginTop: 12,
  },
  successText: {
    color: Palette.tealDark,
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  saveButton: {
    minHeight: 53,
    backgroundColor: Palette.teal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 14,
    marginTop: 17,
    shadowColor: Palette.tealDark,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 2,
  },
  savePressed: {
    backgroundColor: Palette.tealDark,
    transform: [{ scale: 0.99 }],
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  formFootnote: {
    color: Palette.faint,
    textAlign: "center",
    fontSize: 9,
    marginTop: 11,
  },
  reminderPanel: { padding: 16 },
  reminderTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  reminderIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: Palette.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: { color: Palette.ink, fontSize: 13, fontWeight: "700" },
  reminderCopy: {
    color: Palette.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  reminderBottom: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    marginTop: 15,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reminderTimeLabel: {
    color: Palette.faint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    flex: 1,
  },
  reminderTimes: { flexDirection: "row", gap: 6 },
  reminderTimeChip: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reminderTimeSelected: {
    backgroundColor: Palette.tealSoft,
    borderColor: "#B4E3DC",
  },
  reminderTimeText: { color: Palette.muted, fontSize: 10, fontWeight: "700" },
  reminderTimeTextSelected: { color: Palette.tealDark, fontWeight: "800" },
  reminderError: {
    color: Palette.red,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 10,
  },
  recentHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingBottom: 15,
  },
  seeAllText: { color: Palette.teal, fontSize: 11, fontWeight: "800" },
  storageNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 13,
    marginBottom: 11,
  },
  storageNoticeText: {
    flex: 1,
    color: Palette.amber,
    fontSize: 11,
    lineHeight: 16,
  },
  loading: {
    minHeight: 125,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: Palette.muted, fontSize: 12 },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 23,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: Palette.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  emptyTitle: { color: Palette.ink, fontSize: 13, fontWeight: "700" },
  emptyCopy: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 4,
  },
  privacyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 2,
  },
  privacyText: { color: Palette.muted, fontSize: 10, fontWeight: "600" },
  disclaimer: {
    color: Palette.faint,
    textAlign: "center",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 9,
    paddingHorizontal: 14,
  },
});
