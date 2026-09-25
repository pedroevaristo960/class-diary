import fs from 'node:fs';
import path from 'node:path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private logFilePath: string | null = null;

  init(logDir: string, logFileName = 'class-diary.log') {
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logFilePath = path.join(logDir, logFileName);
      this.info('Logger initialized', { logFilePath: this.logFilePath });
    } catch (err) {
      console.error('Failed to initialize file logger:', err);
    }
  }

  private write(level: LogLevel, message: string, context?: unknown) {
    const timestamp = new Date().toISOString();
    const formattedContext = context
      ? ` | ${typeof context === 'object' ? JSON.stringify(context) : String(context)}`
      : '';
    const logLine = `[${timestamp}] [${level}] ${message}${formattedContext}\n`;

    // Console output
    if (level === 'ERROR') {
      console.error(logLine.trim());
    } else if (level === 'WARN') {
      console.warn(logLine.trim());
    } else {
      console.log(logLine.trim());
    }

    // File output
    if (this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, logLine, 'utf-8');
      } catch (err) {
        console.error('Failed to append to log file:', err);
      }
    }
  }

  debug(message: string, context?: unknown) {
    this.write('DEBUG', message, context);
  }

  info(message: string, context?: unknown) {
    this.write('INFO', message, context);
  }

  warn(message: string, context?: unknown) {
    this.write('WARN', message, context);
  }

  error(message: string, context?: unknown) {
    this.write('ERROR', message, context);
  }
}

export const logger = new Logger();
