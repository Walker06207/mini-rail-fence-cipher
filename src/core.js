/**
 * Implementation of the classical rail fence cipher.
 *
 * The cipher writes characters in a zigzag pattern across `rails`
 * horizontal rows and then reads each row left-to-right to produce
 * the ciphertext. Deciphering reverses that: we work out how many
 * characters land on each row, slice the ciphertext into those rows,
 * and walk the same zigzag path to reassemble the plaintext.
 *
 * Design decisions (stated plainly so the tests and README agree):
 *
 * 1. `rails` must be an integer >= 2. A single rail is just the
 *    identity transform, which is useless and almost certainly a
 *    caller bug, so we reject it rather than silently returning the
 *    input unchanged.
 *
 * 2. Empty input is allowed and returns an empty string for both
 *    operations. This keeps the functions total and removes a
 *    special case callers would otherwise have to handle.
 *
 * 3. The cipher operates on UTF-16 code units, not grapheme
 *    clusters. A surrogate pair therefore occupies two "cells" on
 *    the rail, which means a character outside the Basic Multilingual
 *    Plane can be split across rows. This is the same behaviour as
 *    treating the string as an array of `charCodeAt` values and is
 *    the least surprising choice for ASCII-heavy input, which is
 *    what this cipher is historically used for. Handling grapheme
 *    clusters correctly would require a segmentation library and
 *    would change the ciphertext length in ways callers do not
 *    expect.
 */

/**
 * Computes the row index (0-based) that the i-th character occupies
 * for a given number of rails.
 *
 * The pattern visits rows 0, 1, ..., rails-1, rails-2, ..., 1 and
 * then repeats. That full cycle has length `2 * (rails - 1)`. Within
 * the first half of the cycle the row simply increases; in the second
 * half it mirrors back down.
 *
 * This is pulled out so that encipher and decipher share the exact
 * same notion of the zigzag path. If they ever disagreed on the
 * pattern, round-tripping would silently break.
 *
 * @param {number} i - Position in the plaintext stream.
 * @param {number} rails - Number of rails (>= 2).
 * @returns {number} Row index, in [0, rails-1].
 */
function rowOf(i, rails) {
  const cycle = 2 * (rails - 1);
  const pos = i % cycle;
  // In the second half of the cycle, mirror: row goes from rails-2
  // down to 1. `cycle - pos` gives exactly that sequence.
  return pos < rails ? pos : cycle - pos;
}

/**
 * Enciphers `text` using a rail fence cipher with `rails` rows.
 *
 * @param {string} text - The plaintext to encipher.
 * @param {number} rails - Number of rails; an integer >= 2.
 * @returns {string} The ciphertext.
 * @throws {TypeError} If `rails` is not a finite integer.
 * @throws {RangeError} If `rails` is less than 2.
 */
export function encipher(text, rails) {
  if (!Number.isInteger(rails)) {
    throw new TypeError(`rails must be an integer, got ${String(rails)}`);
  }
  if (rails < 2) {
    throw new RangeError(`rails must be >= 2, got ${rails}`);
  }
  const textStr = String(text);
  if (textStr.length === 0) {
    return '';
  }

  // Build an array of strings, one per row, then join. Using an
  // array of arrays and a final flat join would also work, but
  // string concatenation per row is simpler and avoids an extra
  // allocation pass.
  const rows = new Array(rails).fill('');
  for (let i = 0; i < textStr.length; i++) {
    rows[rowOf(i, rails)] += textStr[i];
  }
  return rows.join('');
}

/**
 * Deciphers `text` that was produced by `encipher` with `rails` rows.
 *
 * @param {string} text - The ciphertext to decipher.
 * @param {number} rails - Number of rails; an integer >= 2.
 * @returns {string} The recovered plaintext.
 * @throws {TypeError} If `rails` is not a finite integer.
 * @throws {RangeError} If `rails` is less than 2.
 */
export function decipher(text, rails) {
  if (!Number.isInteger(rails)) {
    throw new TypeError(`rails must be an integer, got ${String(rails)}`);
  }
  if (rails < 2) {
    throw new RangeError(`rails must be >= 2, got ${rails}`);
  }
  const textStr = String(text);
  const n = textStr.length;
  if (n === 0) {
    return '';
  }

  // Count how many characters belong to each row, then walk the
  // zigzag path to reassemble. We count by iterating over every
  // position rather than using a closed-form formula: the formula
  // has fencepost behaviour at the cycle boundaries that is easy
  // to get wrong, and this loop is O(n) which is the same cost as
  // the encipher step. Correctness over cleverness.
  const counts = new Array(rails).fill(0);
  for (let i = 0; i < n; i++) {
    counts[rowOf(i, rails)]++;
  }

  // Slice the ciphertext into per-row segments in row order.
  const rows = new Array(rails);
  let cursor = 0;
  for (let r = 0; r < rails; r++) {
    const len = counts[r];
    rows[r] = textStr.slice(cursor, cursor + len);
    cursor += len;
  }

  // Walk the zigzag again, pulling one character from the
  // appropriate row each time.
  const offsets = new Array(rails).fill(0);
  let result = '';
  for (let i = 0; i < n; i++) {
    const r = rowOf(i, rails);
    result += rows[r][offsets[r]];
    offsets[r]++;
  }
  return result;
}
