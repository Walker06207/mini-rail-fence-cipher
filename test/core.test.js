import { test } from 'node:test';
import assert from 'node:assert/strict';

import { encipher, decipher } from '../src/core.js';

// Classical reference vector: "WEAREDISCOVEREDFLEEATONCE" with 3 rails
// is the canonical textbook example. Its ciphertext is well-known,
// so this pins the implementation to the standard zigzag convention.
const PLAINTEXT = 'WEAREDISCOVEREDFLEEATONCE';
const CIPHERTEXT_3 = 'WECRLTEERDSOEEFEAOCAIVDEN';

test('encipher produces the canonical 3-rail ciphertext', () => {
  assert.equal(encipher(PLAINTEXT, 3), CIPHERTEXT_3);
});

test('decipher recovers the canonical 3-rail plaintext', () => {
  assert.equal(decipher(CIPHERTEXT_3, 3), PLAINTEXT);
});

test('encipher and decipher are inverses across several rail counts', () => {
  const sample = 'The quick brown fox jumps over the lazy dog';
  for (const rails of [2, 3, 4, 5, 7, 10]) {
    const ct = encipher(sample, rails);
    assert.equal(decipher(ct, rails), sample,
      `round-trip failed for rails=${rails}`);
  }
});

test('2 rails interleaves characters: even indices then odd indices', () => {
  // With 2 rails, row 0 takes positions 0,2,4,... and row 1 takes
  // 1,3,5,... So the ciphertext is the even-indexed characters
  // followed by the odd-indexed ones. This is a useful structural
  // check that does not depend on remembering a specific vector.
  const input = 'ABCDEFGH';
  assert.equal(encipher(input, 2), 'ACEGBDFH');
});

test('decipher of encipher returns identity for 2 rails', () => {
  const input = 'ABCDEFGH';
  assert.equal(decipher(encipher(input, 2), 2), input);
});

test('rails equal to text length puts each character on its own row', () => {
  // When rails === length, every character is on a distinct row in
  // ascending order, so the ciphertext equals the plaintext.
  const input = 'HELLO';
  assert.equal(encipher(input, 5), input);
  assert.equal(decipher(input, 5), input);
});

test('rails greater than text length also yields the plaintext', () => {
  // With more rails than characters, the zigzag only ever climbs, so
  // each character is on row i and the rows read back in order.
  const input = 'SHORT';
  assert.equal(encipher(input, 20), input);
  assert.equal(decipher(input, 20), input);
});

test('empty string round-trips for any rail count', () => {
  for (const rails of [2, 3, 10]) {
    assert.equal(encipher('', rails), '');
    assert.equal(decipher('', rails), '');
  }
});

test('single character is unchanged regardless of rail count', () => {
  for (const rails of [2, 3, 50]) {
    assert.equal(encipher('X', rails), 'X');
    assert.equal(decipher('X', rails), 'X');
  }
});

test('preserves spaces and punctuation', () => {
  // The cipher treats every code unit uniformly, so spaces and
  // punctuation participate in the zigzag just like letters.
  const input = 'Hello, World!';
  assert.equal(decipher(encipher(input, 3), 3), input);
});

test('encipher throws TypeError for non-integer rails', () => {
  assert.throws(() => encipher('ABC', 3.5), TypeError);
  assert.throws(() => encipher('ABC', NaN), TypeError);
});

test('decipher throws TypeError for non-integer rails', () => {
  assert.throws(() => decipher('ABC', 3.5), TypeError);
  assert.throws(() => decipher('ABC', '3'), TypeError);
});

test('encipher throws RangeError for rails < 2', () => {
  assert.throws(() => encipher('ABC', 1), RangeError);
  assert.throws(() => encipher('ABC', 0), RangeError);
  assert.throws(() => encipher('ABC', -3), RangeError);
});

test('decipher throws RangeError for rails < 2', () => {
  assert.throws(() => decipher('ABC', 1), RangeError);
  assert.throws(() => decipher('ABC', 0), RangeError);
  assert.throws(() => decipher('ABC', -3), RangeError);
});

test('non-string input is coerced to string and round-trips', () => {
  // String(text) is applied, so numbers and booleans do not crash;
  // they are treated as their string representation. This documents
  // that behaviour so callers know what to expect.
  const ct = encipher(12345, 3);
  assert.equal(decipher(ct, 3), '12345');
});
