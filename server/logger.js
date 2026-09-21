function write(level, event, details = {}) {
  const entry = { timestamp: new Date().toISOString(), level, event, ...details };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.log(line);
}

export const logger = {
  info(event, details) { write("info", event, details); },
  error(event, error, details = {}) {
    write("error", event, {
      ...details,
      message: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
    });
  },
};
