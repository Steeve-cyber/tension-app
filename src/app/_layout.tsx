import * as Notifications from "expo-notifications";

import AppTabs from "@/components/app-tabs";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { MeasurementsProvider } from "@/providers/measurements-provider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <MeasurementsProvider>
      <AppTabs />
      <AnimatedSplashOverlay />
    </MeasurementsProvider>
  );
}
