import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';

/**
 * Standardized API Response Helpers
 *
 * All API routes use these helpers for consistent response shapes.
 * Never use raw NextResponse.json() directly in route handlers.
 */

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

/** Return a success response */
export function successResponse<T>(data: T, status: number = 200, meta?: ApiResponse['meta']) {
    const body: ApiResponse<T> = { success: true, data };
    if (meta) body.meta = meta;
    return NextResponse.json(body, { status });
}

/** Return an error response from a caught error */
export function errorResponse(error: unknown) {
    // Known application errors
    if (error instanceof AppError) {
        const body: ApiResponse = {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                ...('details' in error ? { details: (error as { details: Record<string, string[]> }).details } : {}),
            },
        };
        return NextResponse.json(body, { status: error.statusCode });
    }

    // Zod validation errors
    if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
            const path = issue.path.join('.') || '_root';
            if (!details[path]) details[path] = [];
            details[path].push(issue.message);
        }
        const body: ApiResponse = {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details,
            },
        };
        return NextResponse.json(body, { status: 422 });
    }

    // Unknown errors
    console.error('Unhandled error:', error);
    const body: ApiResponse = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'development'
                ? (error instanceof Error ? error.message : 'Unknown error')
                : 'Internal server error',
        },
    };
    return NextResponse.json(body, { status: 500 });
}
