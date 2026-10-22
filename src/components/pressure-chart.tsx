import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from "react-native-svg";

import { Palette } from "@/components/tensio-ui";
import type { Measurement } from "@/utils/measurements";


type Props = { measurements: Measurement[] };
type Point = { x: number; y: number };

function shortDate(measurement: Measurement): string {
  if (!measurement.measuredAt) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(measurement.measuredAt));
}

function linePath(points: Point[]): string {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

export function PressureChart({ measurements }: Props) {
  const { width: viewportWidth } = useWindowDimensions();
  const dated = useMemo(
    () => [...measurements]
      .filter((measurement) => measurement.measuredAt)
      .sort((first, second) => (first.measuredAt ?? "").localeCompare(second.measuredAt ?? ""))
      .slice(-14),
    [measurements],
  );

  const baseWidth = Math.max(260, Math.min(590, viewportWidth - 92));
  const chartWidth = Math.max(baseWidth, dated.length > 7 ? dated.length * 44 : baseWidth);
  const height = 170;
  const paddingX = 10;
  const paddingTop = 12;
  const paddingBottom = 16;
  const chartHeight = height - paddingTop - paddingBottom;
  const minValue = 50;
  const maxValue = 200;

  const points = useMemo(() => {
    const gap = dated.length > 1 ? (chartWidth - paddingX * 2) / (dated.length - 1) : 0;
    const yFor = (value: number) => {
      const clamped = Math.min(maxValue, Math.max(minValue, value));
      return paddingTop + (1 - (clamped - minValue) / (maxValue - minValue)) * chartHeight;
    };
    return dated.map((measurement, index) => ({
      x: dated.length > 1 ? paddingX + gap * index : chartWidth / 2,
      systolic: { x: dated.length > 1 ? paddingX + gap * index : chartWidth / 2, y: yFor(measurement.systolic) },
      diastolic: { x: dated.length > 1 ? paddingX + gap * index : chartWidth / 2, y: yFor(measurement.diastolic) },
    }));
  }, [dated, chartWidth]);

  if (dated.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyTitle}>Votre courbe apparaîtra ici</Text>
        <Text style={styles.emptyText}>
          Ajoutez quelques mesures datées pour voir l’évolution de vos relevés dans le temps.
        </Text>
        {measurements.some((measurement) => !measurement.measuredAt) ? (
          <Text style={styles.legacyHint}>Les anciennes données n’incluaient pas la date de mesure.</Text>
        ) : null}
      </View>
    );
  }

  const first = dated[0];
  const middle = dated[Math.floor((dated.length - 1) / 2)];
  const last = dated[dated.length - 1];

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: Palette.teal }]} /><Text style={styles.legendText}>Systolique</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: Palette.blue }]} /><Text style={styles.legendText}>Diastolique</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 2 }}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="systolicGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Palette.teal} stopOpacity="0.14" />
              <Stop offset="1" stopColor={Palette.teal} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {[60, 100, 140, 180].map((value) => {
            const y = paddingTop + (1 - (value - minValue) / (maxValue - minValue)) * chartHeight;
            return <Line key={value} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#EAF0F1" strokeWidth="1" strokeDasharray="3 5" />;
          })}
          {points.length > 1 ? (
            <Path
              d={`${linePath(points.map((point) => point.systolic))} L${points[points.length - 1].systolic.x} ${height} L${points[0].systolic.x} ${height} Z`}
              fill="url(#systolicGlow)"
            />
          ) : null}
          <Path d={linePath(points.map((point) => point.systolic))} fill="none" stroke={Palette.teal} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={linePath(points.map((point) => point.diastolic))} fill="none" stroke={Palette.blue} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => (
            <Circle key={`sys-${index}`} cx={point.systolic.x} cy={point.systolic.y} r="4" fill={Palette.surface} stroke={Palette.teal} strokeWidth="2.5" />
          ))}
          {points.map((point, index) => (
            <Circle key={`dia-${index}`} cx={point.diastolic.x} cy={point.diastolic.y} r="3.5" fill={Palette.surface} stroke={Palette.blue} strokeWidth="2.2" />
          ))}
        </Svg>
      </ScrollView>
      <View style={styles.dateAxis}>
        <Text style={styles.axisText}>{shortDate(first)}</Text>
        {dated.length > 3 ? <Text style={styles.axisText}>{shortDate(middle)}</Text> : null}
        {dated.length > 1 ? <Text style={styles.axisText}>{shortDate(last)}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", gap: 18, marginBottom: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendLine: { height: 3, width: 15, borderRadius: 2 },
  legendText: { color: Palette.muted, fontSize: 11, fontWeight: "600" },
  dateAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 1, paddingHorizontal: 2 },
  axisText: { color: Palette.faint, fontSize: 10, textTransform: "capitalize" },
  emptyChart: { minHeight: 135, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  emptyTitle: { color: Palette.ink, fontSize: 14, fontWeight: "700", marginBottom: 5, textAlign: "center" },
  emptyText: { color: Palette.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  legacyHint: { color: Palette.faint, fontSize: 11, textAlign: "center", marginTop: 8 },
});


