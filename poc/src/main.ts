import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { evaluate, fixture } from './engine.ts';
import { createNotifier } from './notifications.ts';
import './style.css';

function element<T extends HTMLElement>(id: string, type: { new(): T }): T {
  const found = document.getElementById(id);
  if (!(found instanceof type)) throw new Error(`Missing interface element: ${id}`);
  return found;
}

function message(error: unknown) {
  console.error(error);
  return error instanceof Error ? error.message : String(error);
}

const select = element('scenario', HTMLSelectElement);
const evaluateButton = element('evaluate', HTMLButtonElement);
const status = element('engine-status', HTMLParagraphElement);
const output = element('result', HTMLPreElement);

evaluateButton.addEventListener('click', async () => {
  evaluateButton.disabled = true;
  output.textContent = '';
  status.textContent = 'Evaluating committed synthetic snapshot...';
  try {
    const scenario = select.value;
    const snapshot = {
      ...fixture,
      revision: scenario === 'corrected' ? 2 : 1,
      sleep: scenario === 'missing' ? null
        : scenario === 'corrected' ? { value: 480, unit: 'min' } : fixture.sleep,
      observedAt: scenario === 'stale' ? '2026-11-12T06:00:00.000Z' : fixture.observedAt,
    };
    const started = performance.now();
    const result = await evaluate(snapshot);
    output.textContent = JSON.stringify(result, null, 2);
    status.textContent = `Completed locally in ${(performance.now() - started).toFixed(1)} ms`;
  } catch (error) {
    status.textContent = `Evaluation failed: ${message(error)}`;
  } finally {
    evaluateButton.disabled = false;
  }
});

const platform = Capacitor.getPlatform();
const notifier = createNotifier(platform, LocalNotifications);
const notifyButton = element('notify', HTMLButtonElement);
const clearButton = element('clear', HTMLButtonElement);
const notificationStatus = element('notification-status', HTMLParagraphElement);
element('platform', HTMLParagraphElement).textContent = platform === 'android'
  ? 'Android native bridge detected. Physical phone/watch verification is still required.'
  : 'Browser: native notification proof is unavailable. Use the Android APK; no browser fallback is used.';
notifyButton.disabled = clearButton.disabled = platform !== 'android';

async function notificationAction(action: () => Promise<void>) {
  notifyButton.disabled = clearButton.disabled = true;
  try {
    await action();
  } catch (error) {
    notificationStatus.textContent = `Notification operation failed: ${message(error)}`;
  } finally {
    notifyButton.disabled = clearButton.disabled = platform !== 'android';
  }
}

notifyButton.addEventListener('click', () => void notificationAction(async () => {
  const result = await notifier.schedule();
  notificationStatus.textContent = `Scheduled on phone for approximately ${result.requestedAt}. ${result.limitation}`;
}));
clearButton.addEventListener('click', () => void notificationAction(async () => {
  await notifier.clear();
  notificationStatus.textContent = 'Pending and posted demo notifications cleared on phone.';
}));

if (platform === 'android') {
  LocalNotifications.addListener('localNotificationActionPerformed', event => {
    if (event.notification.id !== 41001) return;
    location.hash = 'task';
    element('task', HTMLElement).focus();
    element('action-status', HTMLParagraphElement).textContent =
      'Opened the synthetic check-in from a notification. No task has been marked complete.';
  }).catch(error => {
    notifyButton.disabled = clearButton.disabled = true;
    notificationStatus.textContent = `Notification listener failed: ${message(error)}`;
  });
}
