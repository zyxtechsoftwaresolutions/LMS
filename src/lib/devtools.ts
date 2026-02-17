// Developer experience helpers
export function logDebug(message: string, ...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[DEBUG]', message, ...args);
  }
}

export function logError(message: string, ...args: any[]) {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', message, ...args);
}

export function logInfo(message: string, ...args: any[]) {
  // eslint-disable-next-line no-console
  console.info('[INFO]', message, ...args);
}

// Example usage: logDebug('User loaded', user)
