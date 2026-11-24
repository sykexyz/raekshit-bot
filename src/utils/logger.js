
const { addLog } = require('../db');

let ioRef = null;
const setIo = (io) => { ioRef = io; };

const emit = (level, message, raidId = null) => {
  const stamp = new Date().toISOString();
  console.log(`[${stamp}] [${level}] ${raidId ? `#${raidId} ` : ''}${message}`);
  try { if (raidId !== null) addLog(raidId, level, message); } catch {}
  if (ioRef) ioRef.emit('log', { ts: stamp, level, message, raidId });
};

module.exports = {
  setIo,
  info:    (m, r) => emit('info',    m, r),
  warn:    (m, r) => emit('warn',    m, r),
  error:   (m, r) => emit('error',   m, r),
  success: (m, r) => emit('success', m, r),
};
