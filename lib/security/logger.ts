// SECURITY-03: structured application logging with timestamp, level, message.
// SECURITY-12: secrets/keys are redacted and never logged.

type Level = 'info' | 'warn' | 'error';

// Redact common secret shapes (API keys, bearer tokens, "key": "...").
const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9-_]{8,}/g,
  /\b(api[_-]?key|authorization|bearer|secret|token)\b\s*[:=]\s*["']?[A-Za-z0-9-_.]{6,}["']?/gi,
];

export function redact(input: string): string {
  let out = input;
  for (const re of SECRET_PATTERNS) out = out.replace(re, '[redacted]');
  return out;
}

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (/key|secret|token|authorization|password/i.test(k)) {
      clean[k] = '[redacted]';
    } else if (typeof v === 'string') {
      clean[k] = redact(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

function emit(level: Level, msg: string, meta?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: redact(msg),
    ...sanitizeMeta(meta),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
};
