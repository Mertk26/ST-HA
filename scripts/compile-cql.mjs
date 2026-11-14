import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { compileCql } from '../poc/scripts/compile-cql.mjs';

const source = await readFile(new URL('../knowledge/Hecatron.cql', import.meta.url), 'utf8');
const elm = await compileCql(source);
const output = `${JSON.stringify(elm, null, 2)}\n`;
await writeFile(new URL('../src/Hecatron.elm.json', import.meta.url), output);
await writeFile(new URL('../src/knowledge-manifest.json', import.meta.url), `${JSON.stringify({
  library: 'Hecatron', version: '0.1.0', compiler: '@cqframework/cql@5.6.1', runtime: 'cql-execution@3.3.2',
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  elmSha256: createHash('sha256').update(output).digest('hex'),
  authority: 'Synthetic demonstration; parameter-only System model; not clinically authorized',
}, null, 2)}\n`);
console.log('Compiled Hecatron 0.1.0 locally with no diagnostics.');
