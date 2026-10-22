import { NativeTabs } from "expo-router/native-tabs";

import { Palette } from "@/components/tensio-ui";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Palette.surface}
      indicatorColor={Palette.tealSoft}
      labelStyle={{
        color: Palette.faint,
        selected: { color: Palette.tealDark },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Suivi</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Analyses</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/explore.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
