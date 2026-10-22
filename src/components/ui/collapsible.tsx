import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useState, type PropsWithChildren } from "react";

import { Icon, Palette, Panel } from "@/components/tensio-ui";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <ThemedView style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((value) => !value)}
        style={({ pressed }) => [styles.heading, pressed && styles.pressed]}
      >
        <View style={styles.icon}><Icon name="chevron" size={15} color={Palette.tealDark} /></View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.title}>{title}</ThemedText>
        </View>
        <Icon name="chevron" size={16} color={Palette.muted} />
      </Pressable>
      {isOpen ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <Panel style={styles.content}>{children}</Panel>
        </Animated.View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  heading: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 6 },
  icon: { width: 28, height: 28, borderRadius: 9, backgroundColor: Palette.tealSoft, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-90deg" }] },
  title: { color: Palette.ink, fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.7 },
  content: { padding: 13, borderRadius: 14 },
});



