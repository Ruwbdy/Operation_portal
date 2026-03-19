// logger.ts — Centralized logger for the IN Portal
// All logs are prefixed with a module tag.
// Controlled entirely by VITE_ENABLE_LOGS and VITE_LOG_LEVEL in your .env files.
//
// VITE_ENABLE_LOGS=true   — turn all logging on
// VITE_ENABLE_LOGS=false  — silence everything (including errors)
// VITE_LOG_LEVEL=debug    — show debug + info + warn + error
// VITE_LOG_LEVEL=info     — show info + warn + error  (default)
// VITE_LOG_LEVEL=warn     — show warn + error only
// VITE_LOG_LEVEL=error    — show errors only

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
};

const LOGS_ENABLED = import.meta.env.VITE_ENABLE_LOGS === 'true';
const MIN_LEVEL = (import.meta.env.VITE_LOG_LEVEL as LogLevel) ?? 'info';

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #6B7280; font-weight: normal',   // grey
  info:  'color: #2563EB; font-weight: bold',      // blue
  warn:  'color: #D97706; font-weight: bold',      // amber
  error: 'color: #DC2626; font-weight: bold',      // red
};

function log(level: LogLevel, module: string, message: string, ...args: unknown[]): void {
  if (!LOGS_ENABLED) return;
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;
  const tag = `[${module}]`;
  const style = LEVEL_STYLES[level];
  if (args.length > 0) {
    console[level](`%c${tag} ${message}`, style, ...args);
  } else {
    console[level](`%c${tag} ${message}`, style);
  }
}

export function createLogger(module: string) {
  return {
    debug: (message: string, ...args: unknown[]) => log('debug', module, message, ...args),
    info:  (message: string, ...args: unknown[]) => log('info',  module, message, ...args),
    warn:  (message: string, ...args: unknown[]) => log('warn',  module, message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', module, message, ...args),
  };
}