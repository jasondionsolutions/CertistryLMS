// components/ui/error-boundary.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { AlertTriangle, RefreshCcw, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logger } from '@/lib/utils/secure-logger';

// Window interface extensions for monitoring queues
declare global {
  interface Window {
    __ERROR_MONITORING_QUEUE?: any[];
    __ANALYTICS_QUEUE?: any[];
    __PERFORMANCE_MONITORING_QUEUE?: any[];
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  level: 'page' | 'component' | 'feature';
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

// Sanitize error messages for security
function sanitizeError(error: Error): string {
  const message = error.message || 'An unexpected error occurred';

  // Remove potentially sensitive information
  const sanitized = message
    .replace(/\/[^\s]+/g, '[path]') // Remove file paths
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]') // Remove IP addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]') // Remove emails
    .replace(/[A-Za-z0-9+/]{20,}={0,2}/g, '[token]'); // Remove potential tokens

  return sanitized;
}

// Generate secure error ID for tracking
function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      logger.error(`Error caught by ${this.props.level} boundary:`, error, {
        errorId: this.state.errorId,
        error: sanitizeError(error),
        stack: error.stack?.split('\n').slice(0, 5), // Limit stack trace
        componentStack: errorInfo.componentStack?.split('\n').slice(0, 3),
      });
    }

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Report to monitoring (if enabled)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Enhanced error reporting with categorization and monitoring integration
    const errorReport = {
      // Basic error info
      id: this.state.errorId,
      level: this.props.level,
      message: sanitizeError(error),
      timestamp: new Date().toISOString(),

      // Error categorization
      category: this.categorizeError(error),
      severity: this.calculateSeverity(error, this.props.level),
      userImpact: this.assessUserImpact(this.props.level),

      // Technical details
      errorType: error.name,
      errorConstructor: error.constructor.name,

      // Context information
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : null,

      // Performance tracking
      performanceMetrics: typeof window !== 'undefined' ? this.gatherPerformanceMetrics() : null,

      // Component context
      componentName: this.getComponentName(errorInfo?.componentStack || ''),
      errorBoundaryLevel: this.props.level,

      // Development data (conditionally included)
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        props: this.sanitizeProps(),
      }),
    };

    // Enhanced logging with structured data
    if (process.env.NODE_ENV === 'development') {
      logger.error(`Error Boundary Report [${errorReport.category}]`, error, {
        report: errorReport
      });
    }

    // Report to monitoring services
    if (typeof window !== 'undefined') {
      // Multiple reporting channels for comprehensive monitoring
      this.reportToMonitoringService(errorReport);
      this.reportToAnalytics(errorReport);
      this.reportToPerformanceMonitoring(errorReport);
    }
  };

  /**
   * Categorize errors for better monitoring and debugging
   */
  private categorizeError(error: Error): string {
    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';

    // Network errors
    if (name.includes('network') || message.includes('fetch') ||
        message.includes('timeout') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }

    // Permission/Auth errors
    if (name.includes('permission') || name.includes('auth') ||
        message.includes('unauthorized') || message.includes('forbidden')) {
      return 'AUTH_ERROR';
    }

    // Validation errors
    if (name.includes('validation') || message.includes('validation') ||
        message.includes('invalid') || message.includes('required')) {
      return 'VALIDATION_ERROR';
    }

    // Resource errors
    if (name.includes('notfound') || message.includes('not found') ||
        message.includes('missing') || message.includes('undefined')) {
      return 'RESOURCE_ERROR';
    }

    // React-specific errors
    if (message.includes('hydration') || message.includes('render') ||
        message.includes('hook') || message.includes('component')) {
      return 'REACT_ERROR';
    }

    // Database/API errors
    if (message.includes('database') || message.includes('sql') ||
        message.includes('api') || message.includes('server')) {
      return 'BACKEND_ERROR';
    }

    // Generic application error
    return 'APPLICATION_ERROR';
  }

  /**
   * Calculate error severity based on error type and boundary level
   */
  private calculateSeverity(error: Error, level: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const category = this.categorizeError(error);

    // Critical errors - always high impact
    if (category === 'AUTH_ERROR' || category === 'BACKEND_ERROR') {
      return level === 'page' ? 'CRITICAL' : 'HIGH';
    }

    // Network errors - depends on level
    if (category === 'NETWORK_ERROR') {
      return level === 'page' ? 'HIGH' : 'MEDIUM';
    }

    // React/Component errors
    if (category === 'REACT_ERROR') {
      return level === 'page' ? 'HIGH' : level === 'component' ? 'MEDIUM' : 'LOW';
    }

    // Validation and resource errors
    if (category === 'VALIDATION_ERROR' || category === 'RESOURCE_ERROR') {
      return level === 'page' ? 'MEDIUM' : 'LOW';
    }

    // Default based on level
    return level === 'page' ? 'HIGH' : level === 'component' ? 'MEDIUM' : 'LOW';
  }

  /**
   * Assess user impact based on boundary level
   */
  private assessUserImpact(level: string): 'BLOCKING' | 'DEGRADED' | 'MINIMAL' {
    switch (level) {
      case 'page': return 'BLOCKING';
      case 'component': return 'DEGRADED';
      case 'feature': return 'MINIMAL';
      default: return 'DEGRADED';
    }
  }

  /**
   * Extract component name from component stack
   */
  private getComponentName(componentStack: string): string | null {
    if (!componentStack) return null;

    const lines = componentStack.split('\n').filter(line => line.trim());
    const firstComponent = lines[0];
    const match = firstComponent?.match(/in (\w+)/);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Gather performance metrics at error time
   */
  private gatherPerformanceMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;

      return {
        loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : null,
        domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : null,
        memoryUsage: memory ? {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        } : null,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Sanitize component props for logging
   */
  private sanitizeProps() {
    try {
      const props = { ...this.props };
      delete props.children; // Remove children to avoid circular refs
      delete props.onError; // Remove function refs
      delete props.fallback; // Remove component refs
      return props;
    } catch {
      return null;
    }
  }

  /**
   * Report to primary monitoring service
   */
  private reportToMonitoringService(errorReport: any) {
    try {
      // Integration point for services like Sentry, DataDog, etc.
      const monitoringData = {
        fingerprint: [errorReport.category, errorReport.errorType, errorReport.componentName].filter(Boolean),
        tags: {
          category: errorReport.category,
          severity: errorReport.severity,
          level: errorReport.level,
          userImpact: errorReport.userImpact,
        },
        extra: {
          errorId: errorReport.id,
          performanceMetrics: errorReport.performanceMetrics,
          viewport: errorReport.viewport,
        },
        user: {
          // Add user context when available
        }
      };

      // Store in window for monitoring service pickup
      if (typeof window !== 'undefined') {
        window.__ERROR_MONITORING_QUEUE = window.__ERROR_MONITORING_QUEUE || [];
        window.__ERROR_MONITORING_QUEUE.push(monitoringData);
      }
    } catch (reportingError) {
      logger.warn('Failed to report to monitoring service', reportingError as Error, {});
    }
  }

  /**
   * Report to analytics for trend tracking
   */
  private reportToAnalytics(errorReport: any) {
    try {
      const analyticsEvent = {
        event: 'error_boundary_triggered',
        category: 'error_tracking',
        properties: {
          error_category: errorReport.category,
          error_severity: errorReport.severity,
          boundary_level: errorReport.level,
          user_impact: errorReport.userImpact,
          component_name: errorReport.componentName,
          error_type: errorReport.errorType,
          has_performance_impact: errorReport.performanceMetrics !== null,
        }
      };

      // Store for analytics service pickup
      if (typeof window !== 'undefined') {
        window.__ANALYTICS_QUEUE = window.__ANALYTICS_QUEUE || [];
        window.__ANALYTICS_QUEUE.push(analyticsEvent);
      }
    } catch (analyticsError) {
      logger.warn('Failed to report to analytics', analyticsError as Error, {});
    }
  }

  /**
   * Report to performance monitoring
   */
  private reportToPerformanceMonitoring(errorReport: any) {
    try {
      if (!errorReport.performanceMetrics) return;

      const performanceEvent = {
        type: 'error_performance_impact',
        errorId: errorReport.id,
        category: errorReport.category,
        metrics: errorReport.performanceMetrics,
        impact: {
          severity: errorReport.severity,
          userImpact: errorReport.userImpact,
          boundaryLevel: errorReport.level,
        }
      };

      // Store for performance monitoring service pickup
      if (typeof window !== 'undefined') {
        window.__PERFORMANCE_MONITORING_QUEUE = window.__PERFORMANCE_MONITORING_QUEUE || [];
        window.__PERFORMANCE_MONITORING_QUEUE.push(performanceEvent);
      }
    } catch (performanceError) {
      logger.warn('Failed to report to performance monitoring', performanceError as Error, {});
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      // Default error UI based on level
      return this.renderDefaultError();
    }

    return this.props.children;
  }

  private renderDefaultError() {
    const { level } = this.props;
    const { error, errorId } = this.state;

    // Page-level error (full screen)
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <Badge variant="secondary" className="mx-auto">
                Error ID: {errorId}
              </Badge>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We encountered an unexpected error. Our team has been notified.
              </p>

              {this.props.showErrorDetails && process.env.NODE_ENV === 'development' && (
                <div className="text-left p-3 bg-gray-100 rounded text-sm font-mono">
                  {sanitizeError(error!)}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Component-level error (inline)
    if (level === 'component') {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Component Error</p>
                <p className="text-sm text-red-700">This section couldn&apos;t load properly.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={this.handleRetry}
                className="flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Feature-level error (minimal)
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Feature temporarily unavailable</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={this.handleRetry}
            className="ml-auto h-6 px-2 text-yellow-700 hover:text-yellow-900"
          >
            <RefreshCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: 'page' | 'component' | 'feature' = 'component'
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary level={level}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for functional components to create error boundaries
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Wrapper component for easier usage with default settings
interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  level?: 'page' | 'component' | 'feature';
  showErrorDetails?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ErrorBoundaryWrapper({
  children,
  level = 'component',
  showErrorDetails = false,
  onError
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary level={level} showErrorDetails={showErrorDetails} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}
