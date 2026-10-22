import { StyleSheet, Text, View } from "react-native";
import { Icon, Palette } from "@/components/tensio-ui";

export function WebBadge() {
  return (
    <View style={styles.badge}>
      <Icon name="heart" size={13} color={Palette.tealDark} />
      <Text style={styles.text}>TENSIO · APPLICATION WEB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 99, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface, paddingHorizontal: 10, paddingVertical: 7 },
  text: { color: Palette.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
});



