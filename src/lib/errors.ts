/**
 * Custom Error Classes
 *
 * Structured error hierarchy for consistent API error responses.
 * All errors extend AppError for unified handling in route handlers.
 */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class ValidationError extends AppError {
    public readonly details: Record<string, string[]>;

    constructor(message: string = 'Validation failed', details: Record<string, string[]> = {}) {
        super(message, 422, 'VALIDATION_ERROR');
        this.details = details;
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class PlanLimitError extends AppError {
    constructor(message: string = 'Plan limit reached') {
        super(message, 403, 'PLAN_LIMIT_EXCEEDED');
    }
}
