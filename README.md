# mini-rail-fence-cipher

Enciphers and deciphers text using the classical rail fence cipher: characters are written in a zigzag pattern across a number of horizontal "rails" and then read off row by row.

## Usage

```js
import { encipher, decipher } from 'mini-rail-fence-cipher';

const ciphertext = encipher('WEAREDISCOVEREDFLEEATONCE', 3);
// => 'WECRLTEERDSOEEFEAOCAIVDEN'

const plaintext = decipher(ciphertext, 3);
// => 'WEAREDISCOVEREDFLEEATONCE'
```

The module exports exactly two functions: `encipher(text, rails)` and `decipher(text, rails)`. Both take a string and an integer rail count, and both return a string. `rails` must be an integer of at least 2; anything else throws.

## Why this exists

This is a small, dependency-free implementation of the rail fence cipher for anyone who needs the exact classical behaviour — educational use, CTF puzzles, simple obfuscation — without pulling in a general-purpose cryptography package. The trade-off is that the rail fence cipher is trivially weak and provides no real security; it is a transposition cipher, not encryption in any meaningful sense.

## Edge cases worth knowing

The cipher operates on UTF-16 code units, not grapheme clusters. For ASCII input this is invisible, but characters outside the Basic Multilingual Plane (emoji and some other scripts) are represented as surrogate pairs and can be split across rails during enciphering. Deciphering always reconstructs the original string because the surrogate halves are reassembled in their original order, but intermediate ciphertext may contain unpaired surrogates. If you need grapheme-safe behaviour, segment your text before passing it in.

Empty strings and single characters are handled and round-trip cleanly. When the rail count equals or exceeds the text length, the zigzag only climbs, so the ciphertext is identical to the plaintext.
