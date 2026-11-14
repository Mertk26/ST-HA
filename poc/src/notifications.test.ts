import assert from 'node:assert/strict';
import test from 'node:test';
import type { LocalNotificationsPlugin, ScheduleOptions } from '@capacitor/local-notifications';
import { createNotifier } from './notifications.ts';

function fakePort(display: 'granted' | 'denied' | 'prompt' = 'granted') {
  const scheduled: ScheduleOptions[] = [];
  const cancelled: number[] = [];
  const removed: number[] = [];
  let permissionRequests = 0;
  const port = {
    async checkPermissions() { return { display }; },
    async requestPermissions() { permissionRequests++; return { display: 'granted' as const }; },
    async createChannel() {},
    async schedule(options: ScheduleOptions) {
      scheduled.push(options);
      return { notifications: options.notifications.map(({ id }) => ({ id })) };
    },
    async cancel(options: { notifications: { id: number }[] }) {
      cancelled.push(...options.notifications.map(({ id }) => id));
    },
    async removeDeliveredNotifications(options: { notifications: { id: number }[] }) {
      removed.push(...options.notifications.map(({ id }) => id));
    },
  } satisfies Pick<LocalNotificationsPlugin, 'checkPermissions' | 'requestPermissions' | 'createChannel'
    | 'schedule' | 'cancel' | 'removeDeliveredNotifications'>;
  return { port, scheduled, cancelled, removed, requests: () => permissionRequests };
}

test('Android permission flow schedules a generic reminder with a repeat-stable identity', async () => {
  const fake = fakePort('prompt');
  const notifier = createNotifier('android', fake.port, () => Date.parse('2026-11-14T10:00:00Z'));
  const result = await notifier.schedule();
  await notifier.schedule();
  assert.equal(fake.requests(), 2);
  assert.equal(result.state, 'scheduled-on-phone');
  assert.equal(result.requestedAt, '2026-11-14T10:00:10.000Z');
  assert.deepEqual(fake.cancelled, [41001, 41001]);
  assert.deepEqual(fake.scheduled.map(item => item.notifications[0]?.id), [41001, 41001]);
  const notice = fake.scheduled[0]?.notifications[0];
  assert.equal(notice?.body, 'Synthetic health check-in due. Open Hecatron for details.');
  assert.equal(notice?.isExactNotification, false);
  assert.deepEqual(notice?.extra, { noticeId: 'synthetic-check-in-001', route: 'task' });
});

test('denied permission and browser execution do not claim delivery or schedule anything', async () => {
  const fake = fakePort('denied');
  await assert.rejects(createNotifier('android', fake.port).schedule(), /permission is denied/);
  await assert.rejects(createNotifier('web', fake.port).schedule(), /Android-only/);
  assert.equal(fake.scheduled.length, 0);
});

test('native failures propagate; reset removes pending and posted demo notifications', async () => {
  const fake = fakePort();
  await assert.rejects(createNotifier('android', {
    ...fake.port,
    async schedule() { throw new Error('Native scheduling failed'); },
  }).schedule(), /Native scheduling failed/);
  await assert.rejects(createNotifier('android', {
    ...fake.port,
    async schedule() { return { notifications: [] }; },
  }).schedule(), /did not confirm/);
  await createNotifier('android', fake.port).clear();
  assert.deepEqual(fake.removed, [41001]);
});
