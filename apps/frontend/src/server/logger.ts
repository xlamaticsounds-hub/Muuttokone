import 'server-only';

// Simple logger utility for server-side logging
export function logger(level: 'info' | 'warn' | 'error', message: string, extra?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (extra) {
    console[level](logMessage, extra);
  } else {
    console[level](logMessage);
  }
}
