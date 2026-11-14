import { z } from 'zod';
import { workspaceSchema } from './domain.ts';
import { evaluate } from './engine.ts';

const requestSchema = z.object({ workspace: workspaceSchema, at: z.iso.datetime({ offset: true }) });
self.onmessage = async (event: MessageEvent<unknown>) => {
  try {
    const request = requestSchema.parse(event.data);
    const evaluation = await evaluate(request.workspace, request.at);
    self.postMessage({ ok: true, evaluation });
  } catch (error) {
    self.postMessage({ ok: false, message: error instanceof Error ? error.message : String(error) });
  }
};
