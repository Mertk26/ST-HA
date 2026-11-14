import type { LocalNotificationsPlugin } from '@capacitor/local-notifications';

type NotificationPort = Pick<LocalNotificationsPlugin,
  'checkPermissions' | 'requestPermissions' | 'createChannel' | 'schedule' | 'cancel'
  | 'removeDeliveredNotifications'>;

const notificationId = 41001;
const channelId = 'hecatron-poc-reminders';
const content = {
  title: 'Hecatron demo',
  body: 'Synthetic health check-in due. Open Hecatron for details.',
};

export function createNotifier(platform: string, port: NotificationPort, now: () => number = Date.now) {
  function requireAndroid() {
    if (platform !== 'android') {
      throw new Error('Android-only proof: browser notifications are not a substitute for phone/watch delivery.');
    }
  }

  return {
    async schedule() {
      requireAndroid();
      let permission = await port.checkPermissions();
      if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
        permission = await port.requestPermissions();
      }
      if (permission.display !== 'granted') {
        throw new Error('Notification permission is denied. Enable it in Android app settings and retry.');
      }
      await port.createChannel({
        id: channelId,
        name: 'Hecatron synthetic demo reminders',
        importance: 3,
        visibility: 0,
      });
      await port.cancel({ notifications: [{ id: notificationId }] });
      const at = new Date(now() + 10_000);
      const scheduled = await port.schedule({
        notifications: [{
          id: notificationId,
          channelId,
          ...content,
          isExactNotification: false,
          schedule: { at },
          extra: { noticeId: 'synthetic-check-in-001', route: 'task' },
        }],
      });
      if (scheduled.notifications.length !== 1 || scheduled.notifications[0]?.id !== notificationId) {
        throw new Error('Android did not confirm scheduling the requested reminder ID.');
      }
      return {
        state: 'scheduled-on-phone',
        id: notificationId,
        requestedAt: at.toISOString(),
        limitation: 'Approximate scheduling; watch delivery is unverified until observed on the paired watch.',
      };
    },
    async clear() {
      requireAndroid();
      await port.cancel({ notifications: [{ id: notificationId }] });
      await port.removeDeliveredNotifications({ notifications: [{ id: notificationId, ...content }] });
    },
  };
}
