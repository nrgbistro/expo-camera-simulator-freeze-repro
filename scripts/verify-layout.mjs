import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../App.tsx', import.meta.url), 'utf8')

assert.match(source, /paddingTop:\s*72/, 'main screen needs 72pt top padding')
assert.match(
  source,
  /paddingHorizontal:\s*24/,
  'main screen needs 24pt horizontal padding',
)
assert.equal(
  source.match(/style=\{styles\.primaryAction\}/g)?.length,
  2,
  'Open Camera and Save Placeholder must share primaryAction',
)
assert.match(
  source,
  /primaryAction:\s*\{[\s\S]*?bottom:\s*112/,
  'primary action must sit 112pt from the bottom',
)
assert.match(
  source,
  /secondaryAction:\s*\{[\s\S]*?bottom:\s*48/,
  'Cancel must sit 48pt from the bottom',
)
