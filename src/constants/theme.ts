import "@/global.css";
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#132C3D",
    background: "#F3F7F8",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#E2F4F1",
    textSecondary: "#657987",
  },
  dark: {
    text: "#EAF3F5",
    background: "#101F2A",
    backgroundElement: "#172B38",
    backgroundSelected: "#163B3A",
    textSecondary: "#A5B9C2",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: "system-ui", serif: "ui-serif", rounded: "ui-rounded", mono: "ui-monospace" },
  default: { sans: "normal", serif: "serif", rounded: "normal", mono: "monospace" },
  web: { sans: "Inter, ui-sans-serif, system-ui, sans-serif", serif: "Georgia, 'Times New Roman', serif", rounded: "ui-rounded, sans-serif", mono: "ui-monospace, monospace" },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const BottomTabInset = Platform.select({ ios: 48, android: 72, web: 88 }) ?? 0;
export const MaxContentWidth = 720;
