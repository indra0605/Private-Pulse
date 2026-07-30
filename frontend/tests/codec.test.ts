import assert from 'node:assert/strict';
import test from 'node:test';

import { decodePaddedUtf8, encodePaddedUtf8, fromHex, toHex, utf8ByteLength } from '../lib/codec';

test('hex helpers round-trip bytes', () => {
  const input = new Uint8Array([0, 1, 2, 255]);
  assert.equal(toHex(input), '000102ff');
  assert.deepEqual(fromHex('0x000102ff'), input);
});

test('padded text encoding trims and zero-fills', () => {
  const encoded = encodePaddedUtf8('  hello  ', 8, 'Response');
  assert.equal(encoded.length, 8);
  assert.deepEqual(Array.from(encoded), [104, 101, 108, 108, 111, 0, 0, 0]);
  assert.equal(decodePaddedUtf8(encoded), 'hello');
});

test('helpers enforce byte length using utf-8 rules', () => {
  assert.equal(utf8ByteLength('नमस्ते'), 18);
  assert.throws(() => encodePaddedUtf8('ééé', 4, 'Question'), /Question must be 4 bytes or fewer/);
});
