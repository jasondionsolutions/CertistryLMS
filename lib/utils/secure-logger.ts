// lib/utils/secure-logger.ts - Secure logging utility for production applications
/* eslint-disable @typescript-eslint/no-explicit-any */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  action?: string;
  userId?: string;
  requestId?: string;
  timestamp?: string;
  component?: string;
  [key: string]: any;
}

interface SensitiveDataConfig {
  maskEmail?: boolean;
  maskUserId?: boolean;
  maskTokens?: boolean;
  maskPII?: boolean;
  developmentOnly?: boolean;
}

class SecureLogger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Sanitizes sensitive data from log objects
   */
  private sanitizeData(data: any, config: SensitiveDataConfig = {}): any {
    if (data === null || data === undefined) return data;

    // Don't sanitize in development unless explicitly requested
    if (this.isDevelopment && !config.developmentOnly) {
      return data;
    }

    // Handle different data types
    if (typeof data === 'string') {
      return this.sanitizeString(data, config);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, config));
    }

    if (typeof data === 'object') {
      return this.sanitizeObject(data, config);
    }

    return data;
  }

  /**
   * Sanitizes sensitive strings
   */
  private sanitizeString(str: string, config: SensitiveDataConfig): string {
    let result = str;

    // Mask email addresses
    if (config.maskEmail) {
      result = result.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    }

    // Mask potential tokens (long alphanumeric strings)
    if (config.maskTokens) {
      result = result.replace(/\b[A-Za-z0-9]{20,}\b/g, '[TOKEN_REDACTED]');
    }

    return result;
  }

  /**
   * Sanitizes sensitive object properties
   */
  private sanitizeObject(obj: any, config: SensitiveDataConfig): any {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cognitoId', 'accessToken', 'refreshToken', 'idToken',
      'email', 'phone', 'ssn', 'creditCard', 'payload'
    ];

    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();

      // Check if this is a sensitive key
      const isSensitive = sensitiveKeys.some(sensitive =>
        keyLower.includes(sensitive.toLowerCase())
      );

      if (isSensitive) {
        // Handle different types of sensitive data
        if (keyLower.includes('email') && config.maskEmail !== false) {
          result[key] = this.maskEmail(String(value));
        } else if (keyLower.includes('cognitoid') || keyLower.includes('userid')) {
          result[key] = this.maskUserId(String(value));
        } else if (keyLower.includes('token') || keyLower.includes('payload')) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = '[SENSITIVE_DATA_REDACTED]';
        }
      } else {
        // Recursively sanitize nested objects
        result[key] = this.sanitizeData(value, config);
      }
    }

    return result;
  }

  /**
   * Mask email addresses while preserving some structure
   */
  private maskEmail(email: string): string {
    if (!email || typeof email !== 'string') return '[INVALID_EMAIL]';

    const parts = email.split('@');
    if (parts.length !== 2) return '[MALFORMED_EMAIL]';

    const [username, domain] = parts;
    const maskedUsername = username.length > 2
      ? `${username.substring(0, 2)}***`
      : '***';

    // In production, also mask the domain
    if (this.isProduction) {
      return `${maskedUsername}@[DOMAIN_REDACTED]`;
    }

    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask user IDs while preserving some structure for debugging
   */
  private maskUserId(userId: string): string {
    if (!userId || typeof userId !== 'string') return '[INVALID_USER_ID]';

    if (userId.length <= 8) return '[USER_ID_REDACTED]';

    // Show first 4 characters and length for debugging
    return `${userId.substring(0, 4)}***[${userId.length}]`;
  }

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const component = context?.component || 'APP';
    const action = context?.action || 'UNKNOWN';

    return `[${timestamp}] [${level.toUpperCase()}] [${component}] [${action}] ${message}`;
  }

  /**
   * Debug logging - Only in development unless forced
   */
  debug(message: string, data?: any, context?: LogContext): void {
    if (!this.isDevelopment && !context?.component?.includes('FORCE')) return;

    const sanitizedData = this.sanitizeData(data, { developmentOnly: true });
    const formattedMessage = this.formatMessage('debug', message, context);

    /* eslint-disable no-console */
    console.log(formattedMessage, sanitizedData ? sanitizedData : '');
    /* eslint-enable no-console */
  }

  /**
   * Info logging - Safe operational information
   */
  info(message: string, data?: any, context?: LogContext): void {
    const sanitizedData = this.sanitizeData(data, { maskEmail: true, maskTokens: true });
    const formattedMessage = this.formatMessage('info', message, context);

    /* eslint-disable no-console */
    console.log(formattedMessage, sanitizedData ? sanitizedData : '');
    /* eslint-enable no-console */
  }

  /**
   * Warning logging - Potential issues
   */
  warn(message: string, data?: any, context?: LogContext): void {
    const sanitizedData = this.sanitizeData(data, {
      maskEmail: true,
      maskTokens: true,
      maskPII: true
    });
    const formattedMessage = this.formatMessage('warn', message, context);

    console.warn(formattedMessage, sanitizedData ? sanitizedData : '');
  }

  /**
   * Error logging - Sanitized error information
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const sanitizedError = this.sanitizeError(error);
    const formattedMessage = this.formatMessage('error', message, context);

    console.error(formattedMessage, sanitizedError);
  }

  /**
   * Sanitize error objects
   */
  private sanitizeError(error?: Error | any): any {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.sanitizeString(error.message, { maskTokens: true, maskEmail: true }),
        stack: this.isDevelopment ? error.stack : '[STACK_REDACTED_IN_PRODUCTION]'
      };
    }

    return this.sanitizeData(error, {
      maskEmail: true,
      maskTokens: true,
      maskPII: true
    });
  }

  /**
   * Authentication-specific logging
   */
  auth = {
    success: (action: string, context?: Omit<LogContext, 'component'>) => {
      this.info(`Auth success: ${action}`, null, {
        ...context,
        component: 'AUTH'
      });
    },

    failure: (action: string, error?: any, context?: Omit<LogContext, 'component'>) => {
      this.error(`Auth failure: ${action}`, error, {
        ...context,
        component: 'AUTH'
      });
    },

    attempt: (action: string, context?: Omit<LogContext, 'component'>) => {
      this.info(`Auth attempt: ${action}`, null, {
        ...context,
        component: 'AUTH'
      });
    }
  };

  /**
   * Database-specific logging
   */
  db = {
    query: (operation: string, context?: Omit<LogContext, 'component'>) => {
      this.debug(`DB query: ${operation}`, null, {
        ...context,
        component: 'DATABASE'
      });
    },

    error: (operation: string, error?: any, context?: Omit<LogContext, 'component'>) => {
      this.error(`DB error: ${operation}`, error, {
        ...context,
        component: 'DATABASE'
      });
    },

    connection: (status: 'connected' | 'disconnected' | 'error', context?: Omit<LogContext, 'component'>) => {
      this.info(`DB connection: ${status}`, null, {
        ...context,
        component: 'DATABASE'
      });
    }
  };

  /**
   * Security-specific logging
   */
  security = {
    alert: (message: string, data?: any, context?: Omit<LogContext, 'component'>) => {
      this.warn(`Security alert: ${message}`, data, {
        ...context,
        component: 'SECURITY'
      });
    },

    violation: (message: string, data?: any, context?: Omit<LogContext, 'component'>) => {
      this.error(`Security violation: ${message}`, data, {
        ...context,
        component: 'SECURITY'
      });
    },

    audit: (action: string, context?: Omit<LogContext, 'component'>) => {
      this.info(`Security audit: ${action}`, null, {
        ...context,
        component: 'SECURITY'
      });
    }
  };
}

// Export singleton instance
export const logger = new SecureLogger();

// Export helper functions for common patterns
export const createRequestLogger = (requestId: string) => {
  return {
    info: (message: string, data?: any, context?: LogContext) =>
      logger.info(message, data, { ...context, requestId }),
    warn: (message: string, data?: any, context?: LogContext) =>
      logger.warn(message, data, { ...context, requestId }),
    error: (message: string, error?: any, context?: LogContext) =>
      logger.error(message, error, { ...context, requestId }),
    debug: (message: string, data?: any, context?: LogContext) =>
      logger.debug(message, data, { ...context, requestId })
  };
};

export const createComponentLogger = (component: string) => {
  return {
    info: (message: string, data?: any, context?: LogContext) =>
      logger.info(message, data, { ...context, component }),
    warn: (message: string, data?: any, context?: LogContext) =>
      logger.warn(message, data, { ...context, component }),
    error: (message: string, error?: any, context?: LogContext) =>
      logger.error(message, error, { ...context, component }),
    debug: (message: string, data?: any, context?: LogContext) =>
      logger.debug(message, data, { ...context, component })
  };
};
