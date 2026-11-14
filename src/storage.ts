import { openDB, type DBSchema } from 'idb';
import { workspaceSchema, type Workspace } from './domain.ts';

interface Database extends DBSchema {
  workspaces: { key: string; value: Workspace };
}
const database = () => openDB<Database>('hecatron-local-v1', 1, {
  upgrade(db) { db.createObjectStore('workspaces', { keyPath: 'id' }); },
});
export async function loadWorkspace(id: string): Promise<Workspace | null> {
  const db = await database();
  try {
    const value = await db.get('workspaces', id);
    return value === undefined ? null : workspaceSchema.parse(value);
  } finally { db.close(); }
}
export async function saveWorkspace(workspace: Workspace): Promise<Workspace> {
  const parsed = workspaceSchema.parse(workspace);
  const db = await database();
  try {
    const tx = db.transaction('workspaces', 'readwrite');
    const current = await tx.store.get(parsed.id);
    if ((current?.revision ?? 0) !== parsed.revision) {
      await tx.done;
      throw new Error('Another tab changed this workspace. Reload its saved state before editing again.');
    }
    const next = workspaceSchema.parse({ ...parsed, revision: parsed.revision + 1 });
    await Promise.all([tx.store.put(next), tx.done]);
    return next;
  } finally { db.close(); }
}
export async function removeWorkspace(workspace: Workspace) {
  const db = await database();
  try {
    const tx = db.transaction('workspaces', 'readwrite');
    const current = await tx.store.get(workspace.id);
    if (current && current.revision !== workspace.revision) {
      await tx.done;
      throw new Error('Another tab changed this workspace. Reload before resetting it.');
    }
    await Promise.all([tx.store.delete(workspace.id), tx.done]);
  } finally { db.close(); }
}
