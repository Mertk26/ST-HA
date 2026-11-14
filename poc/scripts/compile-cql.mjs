import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  CqlTranslator,
  LibraryManager,
  ModelManager,
  createModelInfoProvider,
  stringAsSource,
} from '@cqframework/cql/cql-to-elm';

const modelUrl = new URL('../knowledge/system-modelinfo.xml', import.meta.url);

export async function compileCql(source) {
  const modelXml = await readFile(modelUrl, 'utf8');
  const models = new ModelManager();
  models.modelInfoLoader.registerModelInfoProvider(
    createModelInfoProvider(name => name === 'System' ? stringAsSource(modelXml) : null),
  );
  const translator = CqlTranslator.fromText(source, new LibraryManager(models));
  const diagnostics = translator.exceptions.asJsArrayView();
  if (diagnostics.length !== 0) {
    throw new Error(`CQL compilation diagnostics:\n${diagnostics.map(item => item.message).join('\n')}`);
  }
  return JSON.parse(translator.toJson());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = await readFile(new URL('../knowledge/HecatronPoc.cql', import.meta.url), 'utf8');
  const elm = await compileCql(source);
  const output = `${JSON.stringify(elm, null, 2)}\n`;
  await writeFile(new URL('../src/HecatronPoc.elm.json', import.meta.url), output);
  await writeFile(new URL('../src/knowledge-manifest.json', import.meta.url), `${JSON.stringify({
    library: 'HecatronPoc',
    version: '0.1.0',
    compiler: '@cqframework/cql@5.6.1',
    runtime: 'cql-execution@3.3.2',
    model: 'System 1.0.0; parameter-only, no FHIR mapping',
    sourceSha256: createHash('sha256').update(source).digest('hex'),
    elmSha256: createHash('sha256').update(output).digest('hex'),
    authority: 'Synthetic demonstration only; not a medical protocol',
  }, null, 2)}\n`);
  console.log('Compiled HecatronPoc 0.1.0 locally; no diagnostics.');
}
