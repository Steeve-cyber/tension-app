import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import { Fonts, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "small" | "smallBold" | "subtitle" | "link" | "linkPrimary" | "code";
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = "default", themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return <Text style={[{ color: theme[themeColor ?? "text"] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  small: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  smallBold: { fontSize: 13, lineHeight: 19, fontWeight: "700" },
  default: { fontSize: 15, lineHeight: 23, fontWeight: "500" },
  title: { fontSize: 34, lineHeight: 40, fontWeight: "700", letterSpacing: -0.8 },
  subtitle: { fontSize: 24, lineHeight: 31, fontWeight: "700", letterSpacing: -0.4 },
  link: { lineHeight: 24, fontSize: 13, fontWeight: "600" },
  linkPrimary: { lineHeight: 24, fontSize: 13, fontWeight: "700", color: "#08786F" },
  code: { fontFamily: Fonts.mono, fontWeight: Platform.select({ android: "700" }) ?? "500", fontSize: 11 },
});
