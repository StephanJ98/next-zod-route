/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema } from 'zod';

export type HandlerFunction<TParams, TQuery, TBody, TContext, TMetadata = unknown> = (
  request: Request,
  context: { params: TParams; query: TQuery; body: TBody; data: TContext; metadata?: TMetadata },
) => any;

/**
 * Represents the merged context type between the existing context and new context added by middleware
 */
export type MiddlewareContext<TContext, TNewContext> = TContext & TNewContext;

/**
 * Function signature for the next() function in middleware
 * @param options - Optional configuration object
 * @returns Promise resolving to the response from the next middleware or handler
 */
export type NextFunction = (options?: { context?: Record<string, unknown> }) => Promise<Response>;

/**
 * Middleware function that can:
 * 1. Execute code before/after the handler
 * 2. Modify the response
 * 3. Add context data that will be available to subsequent middleware and the handler
 * 4. Short-circuit the middleware chain by returning a Response
 *
 * Type parameters:
 * - TContext: The type of the existing context
 * - TNewContext: The type of additional context this middleware adds
 * - TMetadata: The type of metadata available to the middleware
 *
 * @param opts - Configuration object for the middleware
 *
 * @returns Promise resolving to either additional context or a Response to short-circuit
 */
export type MiddlewareFunction<
  TContext = Record<string, unknown>,
  TNewContext = Record<string, unknown>,
  TMetadata = unknown,
> = (opts: {
  request: Request;
  context: TContext;
  metadata?: TMetadata;
  next: NextFunction;
}) => Promise<TNewContext | Response>;

export interface RouteHandlerBuilderConfig {
  paramsSchema: Schema;
  querySchema: Schema;
  bodySchema: Schema;
}

export type OriginalRouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, unknown>>; metadata?: unknown },
) => any;

export type HandlerServerErrorFn = (error: Error) => Response;
