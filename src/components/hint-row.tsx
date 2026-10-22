import { View, StyleSheet, Text } from "react-native";

import { Icon, Palette } from "@/components/tensio-ui";

export function HintRow({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.number}><Text style={styles.numberText}>{number}</Text></View>
      <Text style={styles.copy}>{text}</Text>
      <Icon name="check" size={15} color={Palette.teal} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#EEF2F3" },
  number: { width: 25, height: 25, borderRadius: 9, backgroundColor: Palette.tealSoft, alignItems: "center", justifyContent: "center" },
  numberText: { color: Palette.tealDark, fontSize: 9, fontWeight: "800" },
  copy: { flex: 1, color: Palette.muted, fontSize: 10, lineHeight: 16, paddingTop: 4 },
});
