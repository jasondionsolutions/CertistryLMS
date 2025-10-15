// Authentication context and types
export interface AuthContext {
  userId: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class PermissionError extends Error {
  constructor(message: string = "Access denied") {
    super(message);
    this.name = "PermissionError";
  }
}

export class ValidationError extends Error {
  constructor(message: string = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export type Permission = string;
