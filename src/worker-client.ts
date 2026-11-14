import { z } from 'zod';
import { evaluationSchema, type Evaluation, type Workspace } from './domain.ts';

const response = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), evaluation: evaluationSchema }),
  z.object({ ok: z.literal(false), message: z.string() }),
]);
export function analyse(workspace: Workspace, at: string, signal: AbortSignal): Promise<Evaluation> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
    const finish = () => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      worker.terminate();
    };
    const abort = () => { finish(); reject(new DOMException('Analysis cancelled.', 'AbortError')); };
    const timeout = setTimeout(() => { finish(); reject(new Error('Analysis exceeded the 5-second execution limit.')); }, 5000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<unknown>) => {
      finish();
      const parsed = response.safeParse(event.data);
      if (!parsed.success) { reject(new Error('The engine returned an invalid result contract.')); return; }
      if (!parsed.data.ok) { reject(new Error(parsed.data.message)); return; }
      resolve(parsed.data.evaluation);
    };
    worker.onerror = event => {
      event.preventDefault();
      finish();
      reject(new Error(`Inference worker failed: ${event.message}`));
    };
    worker.onmessageerror = () => { finish(); reject(new Error('The inference worker response could not be decoded.')); };
    worker.postMessage({ workspace, at });
  });
}
