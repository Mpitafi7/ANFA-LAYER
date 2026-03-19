enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export const logger = {
  info: (message: string, ...args: any[]) => log(LogLevel.INFO, message, ...args),
  warn: (message: string, ...args: any[]) => log(LogLevel.WARN, message, ...args),
  error: (message: string, ...args: any[]) => log(LogLevel.ERROR, message, ...args),
  debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, message, ...args),
};

function log(level: LogLevel, message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  switch (level) {
    case LogLevel.ERROR:
      console.error(formattedMessage, ...args);
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage, ...args);
      break;
    default:
      console.log(formattedMessage, ...args);
      break;
  }
}
