import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps, type TabListProps } from "expo-router/ui";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Palette } from "@/components/tensio-ui";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="heart.text.square.fill">Suivi</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="chart.xyaxis.line">Analyses</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: string }) {
  const buttonProps = props as unknown as import("react-native").PressableProps;
  return (
    <Pressable
      {...buttonProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tabButton, isFocused && styles.tabButtonSelected, pressed && styles.pressed]}
    >
      <SymbolView name={{ ios: icon as never, android: icon === "chart.xyaxis.line" ? "show_chart" : "favorite", web: icon === "chart.xyaxis.line" ? "show_chart" : "favorite" } as never} tintColor={isFocused ? Palette.tealDark : Palette.faint} size={19} />
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelSelected]}>{children}</Text>
    </Pressable>
  );
}

function CustomTabList({ children, ...props }: TabListProps) {
  const insets = useSafeAreaInsets();
  return (
    <View {...props} style={[props.style, styles.navOuter, { bottom: Math.max(insets.bottom, 10) + 5 }]}>
      <View style={styles.navBar}>
        <Text style={styles.navBrand}>TENSIO</Text>
        <View style={styles.navTabs}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  navOuter: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: 18 },
  navBar: { width: "100%", maxWidth: 540, minHeight: 65, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.97)", borderWidth: 1, borderColor: Palette.border, shadowColor: "#102C40", shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 8, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  navBrand: { color: Palette.faint, fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginRight: 10 },
  navTabs: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 7 },
  tabButton: { minWidth: 112, height: 44, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingHorizontal: 13 },
  tabButtonSelected: { backgroundColor: Palette.tealSoft },
  tabLabel: { color: Palette.muted, fontSize: 11, fontWeight: "700" },
  tabLabelSelected: { color: Palette.tealDark, fontWeight: "800" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});



