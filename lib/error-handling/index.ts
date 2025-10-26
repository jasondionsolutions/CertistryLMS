// lib/error-handling/index.ts - Standardized Error Handling Utilities
// PORTED FROM CERTISTRY-APP - FULL CODE
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { toast } from 'sonner';
import { logger } from '@/lib/utils/secure-logger';

// Window interface extensions for monitoring queues
declare global {
  interface Window {
    __ERROR_MONITORING_QUEUE?: any[];
    __ANALYTICS_QUEUE?: any[];
    __PERFORMANCE_MONITORING_QUEUE?: any[];
  }
}

// ========================================
// STANDARDIZED ERROR TYPES
// ========================================

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class PermissionError extends Error {
  constructor(message: string, public requiredPermission?: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class ConflictError extends Error {
  constructor(message: string, public conflictType?: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string, public resourceType?: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ========================================
// ERROR HANDLING CONFIGURATION
// ========================================

export interface ErrorHandlingConfig {
  showToast?: boolean;
  logToConsole?: boolean;
  logToService?: boolean;
  operationName?: string;
  context?: Record<string, any>;
}

export interface ErrorResult {
  success: false;
  error: string;
  errorType: string;
  context?: Record<string, any>;
}

export interface SuccessResult<T = any> {
  success: true;
  data: T;
}

export type ApiResult<T = any> = SuccessResult<T> | ErrorResult;

// ========================================
// ERROR ANALYSIS AND CATEGORIZATION
// ========================================

export interface ErrorAnalysis {
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRecoverable: boolean;
  userImpact: UserImpact;
  technicalDetails: TechnicalDetails;
  suggestedActions: string[];
}

export type ErrorCategory =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'RESOURCE_ERROR'
  | 'PERMISSION_ERROR'
  | 'CONFLICT_ERROR'
  | 'BUSINESS_LOGIC_ERROR'
  | 'SYSTEM_ERROR'
  | 'APPLICATION_ERROR';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UserImpact = 'NONE' | 'MINIMAL' | 'MODERATE' | 'SEVERE' | 'BLOCKING';

export interface TechnicalDetails {
  isRetryable: boolean;
  estimatedRecoveryTime?: number; // seconds
  requiresUserAction: boolean;
  hasPerformanceImpact: boolean;
  affectsDataIntegrity: boolean;
}

/**
 * Generate unique error ID for tracking
 */
export function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Create error fingerprint for deduplication
 */
export function createErrorFingerprint(error: unknown, operation: string): string {
  if (error instanceof Error) {
    const key = `${operation}_${error.name}_${error.message.substring(0, 50)}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
  return btoa(`${operation}_unknown`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

/**
 * Comprehensive error analysis
 */
export function analyzeError(error: unknown, context: Record<string, any> = {}): ErrorAnalysis {
  const category = categorizeError(error);
  const severity = assessSeverity(error, category, context);
  const userImpact = assessUserImpact(category, severity, context);
  const technicalDetails = analyzeTechnicalDetails(error, category);

  return {
    category,
    severity,
    isRecoverable: technicalDetails.isRetryable,
    userImpact,
    technicalDetails,
    suggestedActions: generateSuggestedActions(category, technicalDetails),
  };
}

/**
 * Categorize error based on type and message
 */
function categorizeError(error: unknown): ErrorCategory {
  if (!error) return 'APPLICATION_ERROR';

  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();

    // Network-related errors
    if (name.includes('network') || name.includes('fetch') ||
        message.includes('network') || message.includes('fetch') ||
        message.includes('timeout') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }

    // Authentication and authorization
    if (name.includes('auth') || name.includes('permission') ||
        message.includes('unauthorized') || message.includes('forbidden') ||
        message.includes('authentication') || message.includes('token')) {
      return 'AUTH_ERROR';
    }

    // Permission-specific errors
    if (error instanceof PermissionError || message.includes('permission denied')) {
      return 'PERMISSION_ERROR';
    }

    // Validation errors
    if (error instanceof ValidationError || name.includes('validation') ||
        message.includes('validation') || message.includes('invalid') ||
        message.includes('required') || message.includes('format')) {
      return 'VALIDATION_ERROR';
    }

    // Resource errors
    if (error instanceof NotFoundError || name.includes('notfound') ||
        message.includes('not found') || message.includes('missing') ||
        message.includes('does not exist')) {
      return 'RESOURCE_ERROR';
    }

    // Conflict errors
    if (error instanceof ConflictError || name.includes('conflict') ||
        message.includes('conflict') || message.includes('already exists') ||
        message.includes('duplicate')) {
      return 'CONFLICT_ERROR';
    }

    // System-level errors
    if (message.includes('database') || message.includes('sql') ||
        message.includes('connection') || message.includes('server') ||
        message.includes('service unavailable')) {
      return 'SYSTEM_ERROR';
    }

    // Business logic errors (custom errors)
    if (message.includes('business') || message.includes('rule') ||
        message.includes('policy') || message.includes('constraint')) {
      return 'BUSINESS_LOGIC_ERROR';
    }
  }

  return 'APPLICATION_ERROR';
}

/**
 * Assess error severity
 */
function assessSeverity(error: unknown, category: ErrorCategory, context: Record<string, any>): ErrorSeverity {
  // Critical errors
  if (category === 'AUTH_ERROR' || category === 'SYSTEM_ERROR') {
    return 'CRITICAL';
  }

  // High severity errors
  if (category === 'PERMISSION_ERROR' || category === 'BUSINESS_LOGIC_ERROR') {
    return 'HIGH';
  }

  // Medium severity errors
  if (category === 'NETWORK_ERROR' || category === 'RESOURCE_ERROR' || category === 'CONFLICT_ERROR') {
    return 'MEDIUM';
  }

  // Context-based severity adjustment
  const isUserFacing = context.component?.includes('UI') || context.operation?.includes('User');
  const isCriticalOperation = context.operation?.includes('Payment') || context.operation?.includes('Auth');

  if (isCriticalOperation) {
    return 'CRITICAL';
  }

  if (isUserFacing && category === 'VALIDATION_ERROR') {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Assess user impact
 */
function assessUserImpact(category: ErrorCategory, severity: ErrorSeverity, context: Record<string, any>): UserImpact {
  if (severity === 'CRITICAL') return 'BLOCKING';
  if (severity === 'HIGH') return 'SEVERE';

  if (category === 'AUTH_ERROR' || category === 'PERMISSION_ERROR') return 'BLOCKING';
  if (category === 'SYSTEM_ERROR') return 'SEVERE';
  if (category === 'BUSINESS_LOGIC_ERROR') return 'MODERATE';
  if (category === 'NETWORK_ERROR') return 'MODERATE';
  if (category === 'VALIDATION_ERROR') return 'MINIMAL';

  return 'NONE';
}

/**
 * Analyze technical details
 */
function analyzeTechnicalDetails(error: unknown, category: ErrorCategory): TechnicalDetails {
  const isRetryable = category === 'NETWORK_ERROR' || category === 'SYSTEM_ERROR';
  const requiresUserAction = category === 'VALIDATION_ERROR' || category === 'AUTH_ERROR';
  const hasPerformanceImpact = category === 'SYSTEM_ERROR' || category === 'NETWORK_ERROR';
  const affectsDataIntegrity = category === 'BUSINESS_LOGIC_ERROR' || category === 'CONFLICT_ERROR';

  let estimatedRecoveryTime: number | undefined;
  if (isRetryable) {
    estimatedRecoveryTime = category === 'NETWORK_ERROR' ? 5 : 30; // seconds
  }

  return {
    isRetryable,
    estimatedRecoveryTime,
    requiresUserAction,
    hasPerformanceImpact,
    affectsDataIntegrity,
  };
}

/**
 * Generate suggested actions
 */
function generateSuggestedActions(category: ErrorCategory, technical: TechnicalDetails): string[] {
  const actions: string[] = [];

  if (technical.isRetryable) {
    actions.push('Retry the operation after a brief delay');
  }

  if (technical.requiresUserAction) {
    actions.push('Validate user input and correct any issues');
  }

  switch (category) {
    case 'NETWORK_ERROR':
      actions.push('Check internet connection', 'Verify server availability');
      break;
    case 'AUTH_ERROR':
      actions.push('Re-authenticate user', 'Check session validity');
      break;
    case 'VALIDATION_ERROR':
      actions.push('Display clear validation messages', 'Guide user to correct input');
      break;
    case 'PERMISSION_ERROR':
      actions.push('Check user permissions', 'Contact administrator if needed');
      break;
    case 'RESOURCE_ERROR':
      actions.push('Verify resource exists', 'Check resource permissions');
      break;
    case 'SYSTEM_ERROR':
      actions.push('Monitor system health', 'Contact support if persistent');
      break;
  }

  return actions;
}

// ========================================
// ENHANCED LOGGING FUNCTIONS
// ========================================

/**
 * Handle user notification with categorized messaging
 */
function handleUserNotification(errorType: string, message: string, severity: ErrorSeverity) {
  // Only show toasts on the client side
  if (typeof window === 'undefined') {
    return; // Skip toast notifications on server side
  }

  const baseMessage = message;

  switch (severity) {
    case 'CRITICAL':
      toast.error(`Critical Error: ${baseMessage}`, { duration: 8000 });
      break;
    case 'HIGH':
      if (errorType === 'ValidationError') {
        toast.error(`Validation Error: ${baseMessage}`, { duration: 6000 });
      } else if (errorType === 'PermissionError') {
        toast.error(`Access Denied: ${baseMessage}`, { duration: 6000 });
      } else {
        toast.error(baseMessage, { duration: 6000 });
      }
      break;
    case 'MEDIUM':
      if (errorType === 'NetworkError') {
        toast.error(`Connection Error: ${baseMessage}`, { duration: 5000 });
      } else {
        toast.error(baseMessage, { duration: 5000 });
      }
      break;
    case 'LOW':
      toast(baseMessage, { duration: 4000 });
      break;
  }
}

/**
 * Enhanced console logging
 */
function logErrorToConsole(operation: string, error: unknown, context: any, analysis: ErrorAnalysis) {
  if (process.env.NODE_ENV === 'development') {
    // Use structured logging instead of console statements
    logger.error(`Error: ${operation} [${analysis.category}]`, error, {
      category: analysis.category,
      severity: analysis.severity,
      userImpact: analysis.userImpact,
      isRecoverable: analysis.isRecoverable,
      suggestedActions: analysis.suggestedActions,
      context
    });
  } else {
    logger.error(`${operation} error`,
      error instanceof Error ? error : new Error(String(error)),
      { ...context, analysis }
    );
  }
}

/**
 * Enhanced service logging
 */
function logErrorToService(operation: string, error: unknown, context: any, analysis: ErrorAnalysis) {
  logger.error(`${operation} failed`,
    error instanceof Error ? error : new Error(String(error)),
    {
      ...context,
      analysis,
      structuredData: {
        category: analysis.category,
        severity: analysis.severity,
        userImpact: analysis.userImpact,
        technicalDetails: analysis.technicalDetails,
        suggestedActions: analysis.suggestedActions,
      }
    }
  );
}

/**
 * Queue error for external monitoring services
 */
function queueErrorForMonitoring(errorData: any) {
  if (typeof window !== 'undefined') {
    window.__ERROR_MONITORING_QUEUE = window.__ERROR_MONITORING_QUEUE || [];
    window.__ERROR_MONITORING_QUEUE.push({
      type: 'structured_error',
      timestamp: Date.now(),
      data: errorData,
    });
  }
}

// ========================================
// STANDARDIZED ERROR UTILITIES
// ========================================

/**
 * Normalize any error to a standard message format
 * Handles Error objects, strings, and unknown types consistently
 */
export function normalizeError(error: unknown, fallbackMessage = 'An unexpected error occurred'): {
  message: string;
  type: string;
  originalError: unknown;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.constructor.name,
      originalError: error
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      type: 'StringError',
      originalError: error
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String((error as any).message),
      type: 'ObjectError',
      originalError: error
    };
  }

  return {
    message: fallbackMessage,
    type: 'UnknownError',
    originalError: error
  };
}

/**
 * Standard error handler with enhanced logging and monitoring integration
 * Includes error categorization, severity assessment, and structured reporting
 */
export function createErrorHandler(config: ErrorHandlingConfig = {}) {
  return (error: unknown, customMessage?: string): ErrorResult => {
    const {
      showToast = true,
      logToConsole = true,
      logToService = false,
      operationName = 'Operation',
      context = {}
    } = config;

    const normalized = normalizeError(error, customMessage || `${operationName} failed`);
    const errorMessage = customMessage || normalized.message;

    // Enhanced error categorization and analysis
    const errorAnalysis = analyzeError(normalized.originalError, context);

    // Enhanced structured logging context
    const enhancedContext = {
      ...context,
      errorType: normalized.type,
      operation: operationName,
      category: errorAnalysis.category,
      severity: errorAnalysis.severity,
      timestamp: new Date().toISOString(),
      errorId: generateErrorId(),
      fingerprint: createErrorFingerprint(normalized.originalError, operationName),
    };

    // User feedback via toast with improved categorization
    if (showToast) {
      handleUserNotification(normalized.type, errorMessage, errorAnalysis.severity);
    }

    // Enhanced structured logging for development and production
    if (logToConsole) {
      logErrorToConsole(operationName, normalized.originalError, enhancedContext, errorAnalysis);
    }

    // Enhanced structured logging for monitoring services
    if (logToService) {
      logErrorToService(operationName, normalized.originalError, enhancedContext, errorAnalysis);
    }

    // Report to monitoring queue for external services
    queueErrorForMonitoring({
      ...enhancedContext,
      message: errorMessage,
      analysis: errorAnalysis,
    });

    return {
      success: false,
      error: errorMessage,
      errorType: normalized.type,
      context: enhancedContext
    };
  };
}

/**
 * Async operation wrapper with standardized error handling and loading states
 * Enhanced version of the executeWithLoading pattern
 */
export async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    setLoading?: (loading: boolean) => void;
    setError?: (error: string | null) => void;
    errorConfig?: ErrorHandlingConfig;
  } = {}
): Promise<ApiResult<T>> {
  const { setLoading, setError, errorConfig = {} } = options;
  const handleError = createErrorHandler(errorConfig);

  try {
    setLoading?.(true);
    setError?.(null);

    const result = await operation();

    return {
      success: true,
      data: result
    };
  } catch (error) {
    const errorResult = handleError(error);
    setError?.(errorResult.error);
    return errorResult;
  } finally {
    setLoading?.(false);
  }
}


// ========================================
// SUCCESS RESULT HELPERS
// ========================================

export function createSuccessResult<T>(data: T): SuccessResult<T> {
  return { success: true, data };
}

export function createErrorResult(error: unknown, operationName = 'Operation'): ErrorResult {
  const errorHandler = createErrorHandler({
    operationName,
    showToast: false,
    logToConsole: true
  });
  return errorHandler(error);
}

// ========================================
// TYPE GUARDS
// ========================================

export function isSuccessResult<T>(result: ApiResult<T>): result is SuccessResult<T> {
  return result.success === true;
}

export function isErrorResult<T>(result: ApiResult<T>): result is ErrorResult {
  return result.success === false;
}
