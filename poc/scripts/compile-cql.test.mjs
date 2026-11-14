import assert from 'node:assert/strict';
import test from 'node:test';
import { compileCql } from './compile-cql.mjs';

test('compiler rejects an unresolved expression rather than producing a usable artifact', async () => {
  await assert.rejects(
    compileCql("library InvalidPoc version '1.0.0'\ndefine Broken: UnresolvedExpression"),
    /CQL compilation diagnostics:.*UnresolvedExpression/s,
  );
});
