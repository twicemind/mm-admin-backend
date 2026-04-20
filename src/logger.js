/**
 * Simple logging system for backend
 */
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }

  /**
   * Add a log entry
   */
  addLog(level, source, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      message
    };

    this.logs.unshift(entry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also output to console
    const consoleMessage = `[${level}] [${source}] ${message}`;
    switch (level) {
      case 'ERROR':
        console.error(consoleMessage);
        break;
      case 'WARN':
        console.warn(consoleMessage);
        break;
      default:
        console.log(consoleMessage);
    }
  }

  debug(message, source = 'System') {
    this.addLog('DEBUG', source, message);
  }

  info(message, source = 'System') {
    this.addLog('INFO', source, message);
  }

  warn(message, source = 'System') {
    this.addLog('WARN', source, message);
  }

  error(message, source = 'System') {
    this.addLog('ERROR', source, message);
  }

  /**
   * Get all logs
   */
  getLogs(limit = 100) {
    return this.logs.slice(0, limit);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
