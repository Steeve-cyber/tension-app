import {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,

} from "react-native-reanimated";
import type { ReactNode } from "react";
import Animated from "react-native-reanimated";
import { useEffect } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

export const Palette = {
  page: "#F3F7F8",
  surface: "#FFFFFF",
  surfaceSoft: "#EDF4F5",
  ink: "#132C3D",
  muted: "#657987",
  faint: "#94A6AE",
  border: "#E1EAED",
  teal: "#098E83",
  tealDark: "#08786F",
  tealSoft: "#E2F4F1",
  navy: "#102C40",
  blue: "#5579BF",
  blueSoft: "#EAF0FB",
  amber: "#A76A14",
  amberSoft: "#FFF3DD",
  red: "#B94343",
  redSoft: "#FCEAEA",
  purple: "#765DA8",
  purpleSoft: "#F1ECFA",
} as const;

export type IconName =
  | "heart"
  | "pulse"
  | "home"
  | "chart"
  | "plus"
  | "check"
  | "arrow"
  | "arrowDown"
  | "calendar"
  | "clock"
  | "bell"
  | "download"
  | "trash"
  | "info"
  | "shield"
  | "sun"
  | "moon"
  | "arm"
  | "sparkle"
  | "close"
  | "chevron"
  | "note"
  | "heartRate";

export function Icon({ name, size = 20, color = Palette.ink, strokeWidth = 1.8 }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const common = { fill: "none", stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shapes: Record<IconName, ReactNode> = {
    heart: <Path {...common} d="M20.8 4.7a5.4 5.4 0 0 0-7.6 0L12 5.9l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6l1.2 1.2L12 21l7.6-7.5 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />,
    pulse: <Path {...common} d="M2.5 12h4l2.2-6.5 4.2 13 3.1-9 2 2.5h3.5" />,
    home: <Path {...common} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />,
    chart: <><Line {...common} x1="4" y1="19" x2="20" y2="19" /><Line {...common} x1="4" y1="19" x2="4" y2="5" /><Path {...common} d="m6 15 4-4 3 2 5-7 2 2" /><Circle cx="10" cy="11" r="1" fill={color} /><Circle cx="13" cy="13" r="1" fill={color} /><Circle cx="18" cy="6" r="1" fill={color} /></>,
    plus: <><Line {...common} x1="12" y1="5" x2="12" y2="19" /><Line {...common} x1="5" y1="12" x2="19" y2="12" /></>,
    check: <Path {...common} d="m5 12 4.5 4.5L19 7" />,
    arrow: <><Line {...common} x1="4" y1="12" x2="19" y2="12" /><Path {...common} d="m13 6 6 6-6 6" /></>,
    arrowDown: <><Line {...common} x1="12" y1="4" x2="12" y2="19" /><Path {...common} d="m6 13 6 6 6-6" /></>,
    calendar: <><Rect {...common} x="3" y="5" width="18" height="16" rx="2" /><Line {...common} x1="16" y1="3" x2="16" y2="7" /><Line {...common} x1="8" y1="3" x2="8" y2="7" /><Line {...common} x1="3" y1="10" x2="21" y2="10" /></>,
    clock: <><Circle {...common} cx="12" cy="12" r="9" /><Path {...common} d="M12 7v5l3 2" /></>,
    bell: <><Path {...common} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><Path {...common} d="M10 21h4" /></>,
    download: <><Path {...common} d="M12 3v12" /><Path {...common} d="m7 10 5 5 5-5" /><Path {...common} d="M5 20h14" /></>,
    trash: <><Path {...common} d="M4 7h16" /><Path {...common} d="M10 11v6M14 11v6" /><Path {...common} d="m5 7 1 14h12l1-14" /><Path {...common} d="M9 7V4h6v3" /></>,
    info: <><Circle {...common} cx="12" cy="12" r="9" /><Line {...common} x1="12" y1="11" x2="12" y2="16" /><Circle cx="12" cy="8" r="0.7" fill={color} /></>,
    shield: <><Path {...common} d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><Path {...common} d="m9 12 2 2 4-4" /></>,
    sun: <><Circle {...common} cx="12" cy="12" r="4" /><Path {...common} d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <Path {...common} d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />,
    arm: <><Path {...common} d="M5 17c1.7-2.3 2.4-6.5 3.7-8.1.9-1.1 2.4-1 3.1.1l1.1 1.8c.5.8 1.5 1.1 2.4.7l1.4-.6a2 2 0 0 1 2.6 2.8l-1.5 2.4A7 7 0 0 1 12 19.5H7a2.5 2.5 0 0 1-2-2.5Z" /><Path {...common} d="M8.2 9.2 7 6.4a1.7 1.7 0 0 1 3.1-1.3l1.3 3" /></>,
    sparkle: <><Path {...common} d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><Path {...common} d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    close: <><Line {...common} x1="6" y1="6" x2="18" y2="18" /><Line {...common} x1="18" y1="6" x2="6" y2="18" /></>,
    chevron: <Path {...common} d="m7 10 5 5 5-5" />,
    note: <><Path {...common} d="M4 4h16v16H4z" /><Path {...common} d="M8 9h8M8 13h8M8 17h5" /></>,
    heartRate: <><Path {...common} d="M20.8 4.7a5.4 5.4 0 0 0-7.6 0L12 5.9l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6l1.2 1.2L12 21l7.6-7.5 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" /><Path {...common} d="M6.5 12h3l1.2-2.3 2.1 4.6 1.2-2.3h3.5" /></>,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {shapes[name]}
    </Svg>
  );
}

export function BrandMark({ size = 46 }: { size?: number }) {
  return (
    <View style={[styles.brandMark, { width: size, height: size, borderRadius: Math.round(size * 0.31) }]}>
      <Icon name="pulse" size={size * 0.56} color="#FFFFFF" strokeWidth={2.05} />
    </View>
  );
}

export function AnimatedBlock({ children, delay = 0, style }: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(420).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}

export function PulseOrb({ size = 100 }: { size?: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(progress);
      progress.value = 1;
      return;
    }
    progress.value = withRepeat(withTiming(1, { duration: 1900, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.2 : 0.34 * (1 - progress.value),
    transform: [{ scale: reduceMotion ? 0.96 : 0.76 + progress.value * 0.34 }],
  }));

  return (
    <View style={[styles.orb, { width: size, height: size }]}>
      <Animated.View style={[styles.orbRing, ringStyle, { width: size * 0.92, height: size * 0.92, borderRadius: size }]} />
      <Animated.View style={[styles.orbCore, { width: size * 0.73, height: size * 0.73, borderRadius: size }]}>
        <Icon name="heartRate" size={size * 0.34} color="#C5FFF4" strokeWidth={1.65} />
      </Animated.View>
    </View>
  );
}

export function TonePill({ tone, children, compact = false }: {
  tone: "normal" | "low" | "high" | "critical";
  children: ReactNode;
  compact?: boolean;
}) {
  const tones = {
    normal: [Palette.tealSoft, Palette.tealDark],
    low: [Palette.blueSoft, Palette.blue],
    high: [Palette.amberSoft, Palette.amber],
    critical: [Palette.redSoft, Palette.red],
  } as const;
  const [backgroundColor, color] = tones[tone];

  return (
    <View style={[styles.pill, compact && styles.pillCompact, { backgroundColor }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, compact && styles.pillTextCompact, { color }]}>{children}</Text>
    </View>
  );
}

export function SectionHeading({ eyebrow, title, action }: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export const uiStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Palette.page },
  scrollContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 122, width: "100%", maxWidth: 720, alignSelf: "center" },
  horizontal: { flexDirection: "row", alignItems: "center" },
  caption: { color: Palette.muted, fontSize: 13, lineHeight: 19 },
  smallLabel: { color: Palette.faint, fontSize: 10, letterSpacing: 1.1, fontWeight: "800" },
});

const styles = StyleSheet.create({
  brandMark: { backgroundColor: Palette.teal, alignItems: "center", justifyContent: "center", shadowColor: Palette.teal, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  orb: { alignItems: "center", justifyContent: "center" },
  orbRing: { position: "absolute", borderWidth: 1, borderColor: "#7BF3DF", backgroundColor: "rgba(75, 225, 201, 0.05)" },
  orbCore: { backgroundColor: "rgba(80, 211, 188, 0.17)", borderWidth: 1, borderColor: "rgba(192, 255, 241, 0.34)", alignItems: "center", justifyContent: "center" },
  pill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 11 },
  pillCompact: { paddingVertical: 6, paddingHorizontal: 9 },
  pillDot: { width: 7, height: 7, borderRadius: 5 },
  pillText: { fontSize: 12, lineHeight: 16, fontWeight: "700" },
  pillTextCompact: { fontSize: 10, lineHeight: 14 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 14 },
  eyebrow: { color: Palette.teal, fontSize: 10, lineHeight: 15, fontWeight: "800", letterSpacing: 1.35, marginBottom: 4 },
  sectionTitle: { color: Palette.ink, fontSize: 20, lineHeight: 26, fontWeight: "700" },
  panel: { backgroundColor: Palette.surface, borderColor: Palette.border, borderWidth: 1, borderRadius: 22, padding: 18, shadowColor: "#183445", shadowOpacity: 0.035, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.border },
});




