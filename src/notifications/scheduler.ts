import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleMorningCue(hour: number = 7, minute: number = 0) {
  await cancelMorningCue();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Good morning',
      body: 'Time for your daily briefing. Plan your day.',
      data: { screen: '/(tabs)' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelMorningCue() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const morning = scheduled.filter((n) => n.content.data?.screen === '/(tabs)');
  for (const n of morning) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export async function scheduleEveningPrompt(hour: number = 20, minute: number = 0) {
  await cancelEveningPrompt();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Evening review',
      body: 'Time to review your day. How did it go?',
      data: { screen: '/(tabs)/review' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelEveningPrompt() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const evening = scheduled.filter((n) => n.content.data?.screen === '/(tabs)/review');
  for (const n of evening) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export async function scheduleHabitReminder(
  habitTitle: string,
  habitId: string,
  hour: number,
  minute: number
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Reminder',
      body: `Time to check in: ${habitTitle}`,
      data: { screen: '/(tabs)/goals', habitId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
