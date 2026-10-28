/**
 * Public entry point for the library.
 *
 * Re-exports the two pure functions that form the entire API:
 * `encipher` and `decipher`. Keeping them in a separate `core.js`
 * module makes the boundary between implementation and packaging
 * explicit, so consumers can import from the package root and tests
 * can import the implementation directly without pulling in any
 * re-export indirection.
 */
export { encipher, decipher } from './core.js';
