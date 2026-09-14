/**
 * io.js — Singleton module for the Socket.IO server instance.
 * Replaces the `global.io` anti-pattern.
 *
 * Usage:
 *   setIo(io)  → call once in index.js after creating the Server
 *   getIo()    → call anywhere you need to emit (e.g. code.controller.js)
 */

let _io = null;

export const setIo = (io) => {
  _io = io;
};

export const getIo = () => {
  if (!_io) {
    console.warn("⚠️  getIo() called before setIo() — io is not yet initialized.");
  }
  return _io;
};
