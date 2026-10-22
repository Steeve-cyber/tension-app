import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "@tensio_rappel";
const CHANNEL_ID = "tensio-measurement-reminder";

type ReminderConfig = {
  enabled: boolean;
  time: string;
  notificationId?: string;
};

const DEFAULT_CONFIG: ReminderConfig = { enabled: false, time: "08:00" };

export function useDailyReminder() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = Platform.OS !== "web";

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted || !stored) return;
        const parsed = JSON.parse(stored) as Partial<ReminderConfig>;
        const time = typeof parsed.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(parsed.time)
          ? parsed.time
          : DEFAULT_CONFIG.time;
        setConfig({
          enabled: parsed.enabled === true && typeof parsed.notificationId === "string",
          time,
          notificationId: parsed.notificationId,
        });
      })
      .catch(() => setError("Impossible de lire le réglage du rappel."))
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => { mounted = false; };
  }, []);

  const schedule = useCallback(async (time: string, previousId?: string) => {
    if (Platform.OS === "web") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Rappel de mesure",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 120],
        lightColor: "#098E83",
      });
    }

    let { granted } = await Notifications.getPermissionsAsync();
    if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
    if (!granted) throw new Error("Autorisez les notifications dans les réglages pour activer le rappel.");

    if (previousId) await Notifications.cancelScheduledNotificationAsync(previousId);
    const [hour, minute] = time.split(":").map(Number);
    return Notifications.scheduleNotificationAsync({
      content: {
        title: "Un petit rappel pour votre suivi",
        body: "Prenez quelques minutes au calme pour noter votre mesure du jour.",
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    setError(null);
    try {
      if (!available) return;
      if (enabled) {
        const notificationId = await schedule(config.time, config.notificationId);
        if (!notificationId) return;
        const next = { enabled: true, time: config.time, notificationId };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
      } else {
        if (config.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(config.notificationId);
        }
        const next = { enabled: false, time: config.time };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Le rappel n’a pas pu être mis à jour.");
    }
  }, [available, config, schedule]);

  const setTime = useCallback(async (time: string) => {
    setError(null);
    try {
      if (config.enabled) {
        const notificationId = await schedule(time, config.notificationId);
        const next = { enabled: true, time, notificationId: notificationId ?? undefined };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
      } else {
        const next = { enabled: false, time };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setConfig(next);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’horaire n’a pas pu être modifié.");
    }
  }, [config, schedule]);

  return { ...config, isReady, available, error, setEnabled, setTime };
}
