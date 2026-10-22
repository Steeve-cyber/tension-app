import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";

import { BrandMark, Palette } from "@/components/tensio-ui";

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
    const timeout = setTimeout(() => setVisible(false), 760);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View pointerEvents="none" style={styles.overlayHost}>
      {visible ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(260)} style={styles.overlay}>
          <Animated.View entering={ZoomIn.duration(500).springify()}>
            <BrandMark size={70} />
          </Animated.View>
          <Text style={styles.wordmark}>Tensio</Text>
          <Text style={styles.tagline}>Votre suivi, en toute clarté.</Text>
          <View style={styles.loaderLine}><View style={styles.loaderFill} /></View>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function AnimatedIcon() {
  return (
    <Animated.View entering={ZoomIn.duration(480).springify()}>
      <BrandMark size={46} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayHost: { ...StyleSheet.absoluteFill, zIndex: 1000 },
  overlay: { flex: 1, backgroundColor: Palette.navy, alignItems: "center", justifyContent: "center" },
  wordmark: { color: "#FFFFFF", fontSize: 23, fontWeight: "800", letterSpacing: -0.4, marginTop: 17 },
  tagline: { color: "#B9CDD4", fontSize: 11, marginTop: 5, letterSpacing: 0.2 },
  loaderLine: { width: 72, height: 3, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.16)", marginTop: 29, overflow: "hidden" },
  loaderFill: { width: "65%", height: "100%", borderRadius: 5, backgroundColor: "#70D9C4" },
});

