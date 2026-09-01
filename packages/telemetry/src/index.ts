type Fields = Record<string, string | number | boolean | null | undefined>

export function createLogger(base: Fields) {
  const emit = (
    level: 'info' | 'warn' | 'error',
    message: string,
    fields: Fields = {},
  ) => {
    // Structured JSON is intentionally portable to Vercel Runtime Logs and log drains.
    console[level](
      JSON.stringify({
        level,
        message,
        ...base,
        ...fields,
        timestamp: new Date().toISOString(),
      }),
    )
  }
  return {
    info: (message: string, fields?: Fields) => emit('info', message, fields),
    warn: (message: string, fields?: Fields) => emit('warn', message, fields),
    error: (message: string, fields?: Fields) => emit('error', message, fields),
  }
}
