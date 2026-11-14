import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { Task, Workspace } from './domain.ts';

export const isAndroid = Capacitor.getPlatform() === 'android';
const channelId = 'hecatron-routines';
const title = 'ST-HA reminder';
const body = 'Example reminder. Open ST-HA for details.';
const testId = 2_000_000_001;

function taskNotificationId(workspace: Workspace, task: Task) {
  return (workspace.personaId === 'alex' ? 1000 : 2000) + (task.kind === 'assessment' ? 1 : task.kind === 'movement' ? 2 : 3);
}
export function plannedReminders(workspace: Workspace, now: number): LocalNotificationSchema[] {
  if (!workspace.nativeReminders || workspace.mode !== 'standard') return [];
  return workspace.tasks.filter(task => task.status === 'pending' && Date.parse(task.dueAt) > now).map(task => ({
    id: taskNotificationId(workspace, task), title,
    body: `Example task due ${task.dueAt.slice(11, 16)} UTC. Open ST-HA for details.`,
    channelId, isExactNotification: false, schedule: { at: new Date(task.dueAt) },
    extra: { workspaceId: workspace.id, taskId: task.id },
  }));
}
export async function clearNativeReminders(removeDelivered = true) {
  if (!isAndroid) return;
  const pending = await LocalNotifications.getPending();
  await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) });
  if (removeDelivered) {
    const delivered = await LocalNotifications.getDeliveredNotifications();
    await LocalNotifications.removeDeliveredNotifications({ notifications: delivered.notifications });
  }
}
async function permission() {
  if (!isAndroid) throw new Error('Native reminders require the Android application. Browser previews cannot prove watch delivery.');
  let state = await LocalNotifications.checkPermissions();
  if (state.display === 'prompt' || state.display === 'prompt-with-rationale') state = await LocalNotifications.requestPermissions();
  if (state.display !== 'granted') throw new Error('Android notification permission is denied. Review the app notification settings before retrying.');
  await LocalNotifications.createChannel({ id: channelId, name: 'Health routines', importance: 3, visibility: 0 });
}
export async function syncNativeReminders(workspace: Workspace) {
  if (!isAndroid) return;
  await clearNativeReminders(!workspace.nativeReminders);
  if (!workspace.nativeReminders || workspace.mode === 'replay') return;
  await permission();
  const retiredIds = new Set(workspace.tasks.filter(task => task.status !== 'pending').map(task => taskNotificationId(workspace, task)));
  const delivered = await LocalNotifications.getDeliveredNotifications();
  const retired = delivered.notifications.filter(item => retiredIds.has(item.id));
  if (retired.length) await LocalNotifications.removeDeliveredNotifications({ notifications: retired });
  const notifications = plannedReminders(workspace, Date.now());
  if (!notifications.length) return;
  const result = await LocalNotifications.schedule({ notifications });
  if (result.notifications.length !== notifications.length
    || notifications.some(item => !result.notifications.some(saved => saved.id === item.id))) {
    throw new Error('Android did not confirm the requested reminder identities.');
  }
}
export async function testWatchReminder(workspace: Workspace) {
  if (workspace.mode !== 'standard') throw new Error('Device reminders are disabled in isolated replay.');
  await permission();
  const result = await LocalNotifications.schedule({ notifications: [{
    id: testId, title, body, channelId, isExactNotification: false,
    schedule: { at: new Date(Date.now() + 10_000) },
    extra: { workspaceId: workspace.id, taskId: null },
  }] });
  if (result.notifications[0]?.id !== testId) throw new Error('Android did not confirm scheduling the reminder.');
}
export function listenToNativeActions(onTask: (scope: string) => void, onError: (message: string) => void) {
  if (!isAndroid) return () => {};
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', event => {
    const extra: unknown = event.notification.extra;
    if (typeof extra === 'object' && extra !== null && 'workspaceId' in extra && typeof extra.workspaceId === 'string') {
      onTask(extra.workspaceId);
    } else {
      onError('Notification navigation metadata is unavailable; no task was changed.');
    }
  });
  void handle.catch(error => onError(`Native notification listener failed: ${error instanceof Error ? error.message : String(error)}`));
  return () => { void handle.then(listener => listener.remove()).catch(error => onError(`Native listener cleanup failed: ${String(error)}`)); };
}
