import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { CqlTranslator, LibraryManager, ModelManager, createModelInfoProvider, stringAsSource } from '@cqframework/cql/cql-to-elm';

const source = await readFile(new URL('../knowledge/Hecatron.cql', import.meta.url), 'utf8');
const model = await readFile(new URL('../knowledge/system-modelinfo.xml', import.meta.url), 'utf8');
const models = new ModelManager();
models.modelInfoLoader.registerModelInfoProvider(createModelInfoProvider(name => name === 'System' ? stringAsSource(model) : null));
const translator = CqlTranslator.fromText(source, new LibraryManager(models));
const diagnostics = translator.exceptions.asJsArrayView();
if (diagnostics.length) throw new Error(`CQL compilation diagnostics:\n${diagnostics.map(item => item.message).join('\n')}`);
const elm = JSON.parse(translator.toJson());
const output = `${JSON.stringify(elm, null, 2)}\n`;
await writeFile(new URL('../src/Hecatron.elm.json', import.meta.url), output);
await writeFile(new URL('../src/knowledge-manifest.json', import.meta.url), `${JSON.stringify({
  library: 'Hecatron', version: '0.1.0', compiler: '@cqframework/cql@5.6.1', runtime: 'cql-execution@3.3.2',
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  elmSha256: createHash('sha256').update(output).digest('hex'),
  authority: 'Synthetic demonstration; parameter-only System model; not clinically authorized',
}, null, 2)}\n`);
console.log('Compiled Hecatron 0.1.0 locally with no diagnostics.');
