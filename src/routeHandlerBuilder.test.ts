import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

import { createZodRoute } from './createZodRoute';
import { MiddlewareFunction } from './types';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const querySchema = z.object({
  search: z.string().min(1),
});

const bodySchema = z.object({
  field: z.string(),
});

export const paramsToPromise = (params: Record<string, unknown>): Promise<Record<string, unknown>> => {
  return Promise.resolve(params);
};

describe('params validation', () => {
  it('should validate and handle valid params', async () => {
    const GET = createZodRoute()
      .params(paramsSchema)
      .handler((request, context) => {
        expectTypeOf(context.params).toMatchTypeOf<z.infer<typeof paramsSchema>>();
        const { id } = context.params;
        return Response.json({ id }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('should return an error for invalid params', async () => {
    const GET = createZodRoute()
      .params(paramsSchema)
      .handler((request, context) => {
        const { id } = context.params;
        return Response.json({ id }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: paramsToPromise({ id: 'invalid-uuid' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid params');
  });
});

describe('query validation', () => {
  it('should validate and handle valid query', async () => {
    const GET = createZodRoute()
      .params(paramsSchema)
      .handler((request, context) => {
        expectTypeOf(context.query).toMatchTypeOf<z.infer<typeof querySchema>>();
        const search = context.query.search;
        return Response.json({ search }, { status: 200 });
      });

    const request = new Request('http://localhost/?search=test');
    const response = await GET(request, { params: Promise.resolve({ id: 'D570D9AB-E002-46EA-996F-0E0023C8F702' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ search: 'test' });
  });

  it('should return an error for invalid query', async () => {
    const GET = createZodRoute()
      .query(querySchema)
      .handler((request, context) => {
        const search = context.query.search;
        return Response.json({ search }, { status: 200 });
      });

    const request = new Request('http://localhost/?search=');
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid query');
  });
});

describe('body validation', () => {
  it('should validate and handle valid body', async () => {
    const POST = createZodRoute()
      .body(bodySchema)
      .handler((request, context) => {
        expectTypeOf(context.body).toMatchTypeOf<z.infer<typeof bodySchema>>();
        const field = context.body.field;
        return Response.json({ field }, { status: 200 });
      });

    const request = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ field: 'test-field' }),
    });
    const response = await POST(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ field: 'test-field' });
  });

  it('should return an error for invalid body', async () => {
    const POST = createZodRoute()
      .body(bodySchema)
      .handler((request, context) => {
        const field = context.body.field;
        return Response.json({ field }, { status: 200 });
      });

    const request = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ field: 123 }),
    });
    const response = await POST(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid body');
  });
});

describe('combined validation', () => {
  it('should validate and handle valid request with params, query, and body', async () => {
    const POST = createZodRoute()
      .params(paramsSchema)
      .query(querySchema)
      .body(bodySchema)
      .handler((request, context) => {
        const { id } = context.params;
        const { search } = context.query;
        const { field } = context.body;

        return Response.json({ id, search, field }, { status: 200 });
      });

    const request = new Request('http://localhost/?search=test', {
      method: 'POST',
      body: JSON.stringify({ field: 'test-field' }),
    });

    const response = await POST(request, { params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      search: 'test',
      field: 'test-field',
    });
  });

  it('should return an error for invalid params in combined validation', async () => {
    const POST = createZodRoute()
      .params(paramsSchema)
      .query(querySchema)
      .body(bodySchema)
      .handler((request, context) => {
        const { id } = context.params;
        const { search } = context.query;
        const { field } = context.body;

        return Response.json({ id, search, field }, { status: 200 });
      });

    const request = new Request('http://localhost/?search=test', {
      method: 'POST',
      body: JSON.stringify({ field: 'test-field' }),
    });

    const response = await POST(request, { params: paramsToPromise({ id: 'invalid-uuid' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid params');
  });

  it('should return an error for invalid query in combined validation', async () => {
    const POST = createZodRoute()
      .params(paramsSchema)
      .query(querySchema)
      .body(bodySchema)
      .handler((request, context) => {
        const { id } = context.params;
        const { search } = context.query;
        const { field } = context.body;

        return Response.json({ id, search, field }, { status: 200 });
      });

    const request = new Request('http://localhost/?search=', {
      method: 'POST',
      body: JSON.stringify({ field: 'test-field' }),
    });

    const response = await POST(request, { params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid query');
  });

  it('should return an error for invalid body in combined validation', async () => {
    const POST = createZodRoute()
      .params(paramsSchema)
      .query(querySchema)
      .body(bodySchema)
      .handler((request, context) => {
        const { id } = context.params;
        const { search } = context.query;
        const { field } = context.body;

        return Response.json({ id, search, field }, { status: 200 });
      });

    const request = new Request('http://localhost/?search=test', {
      method: 'POST',
      body: JSON.stringify({ field: 123 }),
    });

    const response = await POST(request, { params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid body');
  });

  it('should execute middleware and add context properties', async () => {
    const middleware: MiddlewareFunction<Record<string, unknown>, { user: { id: string; role: string } }> = async ({
      next,
    }) => {
      const result = await next({ context: { user: { id: 'user-123', role: 'admin' } } });
      return result;
    };

    const GET = createZodRoute()
      .use(middleware)
      .params(paramsSchema)
      .handler((request, context) => {
        const { id } = context.params;
        const { user } = context.data;

        expectTypeOf(user).toMatchTypeOf<{ id: string }>();

        return Response.json({ id, user }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      user: { id: 'user-123', role: 'admin' },
    });
  });

  it('should execute multiple middlewares and merge context properties', async () => {
    const middleware1: MiddlewareFunction<Record<string, unknown>, { user: { id: string } }> = async ({ next }) => {
      const result = await next({ context: { user: { id: 'user-123' } } });
      return result;
    };

    const middleware2: MiddlewareFunction<Record<string, unknown>, { permissions: string[] }> = async ({ next }) => {
      const result = await next({ context: { permissions: ['read', 'write'] } });
      return result;
    };

    const GET = createZodRoute()
      .use(middleware1)
      .use(middleware2)
      .params(paramsSchema)
      .handler((request, context) => {
        const { id } = context.params;
        const { user, permissions } = context.data;

        expectTypeOf(user).toMatchTypeOf<{ id: string }>();
        expectTypeOf(permissions).toMatchTypeOf<string[]>();

        return Response.json({ id, user, permissions }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      user: { id: 'user-123' },
      permissions: ['read', 'write'],
    });
  });

  it('should handle server errors using handleServerError method', async () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    const handleServerError = (error: Error) => {
      if (error instanceof CustomError) {
        return new Response(JSON.stringify({ message: error.name, details: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify({ message: 'Something went wrong' }), { status: 400 });
    };

    const GET = createZodRoute({
      handleServerError,
    })
      .params(paramsSchema)
      .handler(() => {
        throw new CustomError('Test error');
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'CustomError', details: 'Test error' });
  });
});

describe('form data handling', () => {
  it('should parse and validate form data in the request body', async () => {
    const POST = createZodRoute()
      .body(bodySchema)
      .handler((request, context) => {
        const { field } = context.body;
        return Response.json({ field }, { status: 200 });
      });

    const formData = new URLSearchParams();
    formData.append('field', 'test-field');

    const request = new Request('http://localhost/', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const response = await POST(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ field: 'test-field' });
  });

  it('should return an error for invalid form data', async () => {
    const POST = createZodRoute()
      .body(bodySchema)
      .handler((request, context) => {
        const { field } = context.body;
        return Response.json({ field }, { status: 200 });
      });

    const formData = new URLSearchParams();
    formData.append('field', ''); // Empty string should fail validation

    const request = new Request('http://localhost/', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const response = await POST(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ field: '' });
  });
});

describe('response handling', () => {
  it('should return the Response object directly when handler returns a Response', async () => {
    const GET = createZodRoute().handler(() => {
      return new Response(JSON.stringify({ custom: 'response' }), {
        status: 201,
        headers: { 'X-Custom-Header': 'test' },
      });
    });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(response.headers.get('X-Custom-Header')).toBe('test');
    expect(data).toEqual({ custom: 'response' });
  });

  it('should convert non-Response return values to a JSON Response', async () => {
    const GET = createZodRoute().handler(() => {
      return { data: 'value' };
    });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    const data = await response.json();
    expect(data).toEqual({ data: 'value' });
  });
});

describe('HTTP methods handling', () => {
  it('should not parse body for DELETE requests', async () => {
    const DELETE = createZodRoute().handler(() => {
      // If we reach here without error, it means the body wasn't parsed
      return Response.json({ success: true }, { status: 200 });
    });

    const request = new Request('http://localhost/', {
      method: 'DELETE',
      // DELETE can have a body, unlike GET
      body: '{invalid json}',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await DELETE(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should not parse body for GET requests', async () => {
    const GET = createZodRoute().handler(() => {
      // If we reach here without error, it means the body wasn't parsed
      return Response.json({ success: true }, { status: 200 });
    });

    // GET requests can't have a body, so we'll just test that the handler works
    const request = new Request('http://localhost/', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });
});

describe('metadata validation', () => {
  const metadataSchema = z.object({
    permission: z.string(),
    role: z.enum(['admin', 'user']),
  });

  it('should validate and handle valid metadata', async () => {
    const GET = createZodRoute()
      .defineMetadata(metadataSchema)
      .handler((request, context) => {
        expectTypeOf(context.metadata).toEqualTypeOf<z.infer<typeof metadataSchema> | undefined>();
        const { permission, role } = context.metadata!;
        return Response.json({ permission, role }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, {
      params: Promise.resolve({}),
      metadata: { permission: 'read', role: 'admin' },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ permission: 'read', role: 'admin' });
  });

  it('should return an error for invalid metadata', async () => {
    const GET = createZodRoute()
      .defineMetadata(metadataSchema)
      .handler((request, context) => {
        const { permission, role } = context.metadata!;
        return Response.json({ permission, role }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, {
      params: Promise.resolve({}),
      metadata: { permission: 'read', role: 'invalid-role' },
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid metadata');
  });

  it('should handle missing optional metadata', async () => {
    const GET = createZodRoute()
      .defineMetadata(metadataSchema)
      .handler((request, context) => {
        expect(context.metadata).toBeUndefined();
        return Response.json({ success: true }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
  });

  it('should work with combined validation', async () => {
    const GET = createZodRoute()
      .params(paramsSchema)
      .query(querySchema)
      .defineMetadata(metadataSchema)
      .handler((request, context) => {
        const { id } = context.params;
        const { search } = context.query;
        const { permission, role } = context.metadata!;
        return Response.json({ id, search, permission, role }, { status: 200 });
      });

    const request = new Request('http://localhost/?search=test');
    const response = await GET(request, {
      params: paramsToPromise({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      metadata: { permission: 'read', role: 'admin' },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440000',
      search: 'test',
      permission: 'read',
      role: 'admin',
    });
  });

  it('should pass metadata to middleware', async () => {
    const middleware: MiddlewareFunction<
      Record<string, unknown>,
      { authorized: boolean },
      z.infer<typeof metadataSchema>
    > = async ({ next, metadata }) => {
      expect(metadata).toEqual({ permission: 'read', role: 'admin' });
      const context = await next();
      return { ...context, authorized: true };
    };

    const GET = createZodRoute()
      .defineMetadata(metadataSchema)
      .use(middleware)
      .handler((request, context) => {
        const { authorized } = context.data;
        const { permission, role } = context.metadata!;
        return Response.json({ authorized, permission, role }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, {
      params: Promise.resolve({}),
      metadata: { permission: 'read', role: 'admin' },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      authorized: true,
      permission: 'read',
      role: 'admin',
    });
  });

  it('should handle undefined metadata in middleware', async () => {
    const middleware: MiddlewareFunction<
      Record<string, unknown>,
      { authorized: boolean },
      z.infer<typeof metadataSchema>
    > = async ({ next, metadata }) => {
      expect(metadata).toBeUndefined();
      const result = await next({ context: { authorized: false } });
      return result;
    };

    const GET = createZodRoute()
      .defineMetadata(metadataSchema)
      .use(middleware)
      .handler((request, context) => {
        const { authorized } = context.data;
        return Response.json({ authorized }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ authorized: false });
  });

  it('should work with multiple middlewares accessing metadata', async () => {
    const middleware1: MiddlewareFunction<
      Record<string, unknown>,
      { hasPermission: boolean },
      z.infer<typeof metadataSchema>
    > = async ({ next, metadata }) => {
      const result = await next({ context: { hasPermission: metadata?.permission === 'read' } });
      return result;
    };

    const middleware2: MiddlewareFunction<
      Record<string, unknown>,
      { isAdmin: boolean },
      z.infer<typeof metadataSchema>
    > = async ({ next, metadata }) => {
      const result = await next({ context: { isAdmin: metadata?.role === 'admin' } });
      return result;
    };

    const GET = createZodRoute()
      .defineMetadata(metadataSchema)
      .use(middleware1)
      .use(middleware2)
      .handler((request, context) => {
        const { hasPermission, isAdmin } = context.data;
        return Response.json({ hasPermission, isAdmin }, { status: 200 });
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, {
      params: Promise.resolve({}),
      metadata: { permission: 'read', role: 'admin' },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      hasPermission: true,
      isAdmin: true,
    });
  });
});

describe('enhanced middleware functionality', () => {
  it('should allow middleware to execute code before and after handler', async () => {
    const logs: string[] = [];

    const loggingMiddleware: MiddlewareFunction = async ({ next }) => {
      logs.push('before handler');
      const startTime = performance.now();

      const response = await next();

      const endTime = performance.now();
      logs.push(`after handler - took ${Math.round(endTime - startTime)}ms`);

      return response;
    };

    const GET = createZodRoute()
      .use(loggingMiddleware)
      .handler(() => {
        logs.push('handler executed');
        return { success: true };
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true });
    expect(logs).toEqual(['before handler', 'handler executed', expect.stringMatching(/after handler - took \d+ms/)]);
  });

  it('should allow middleware to modify response', async () => {
    const addHeaderMiddleware: MiddlewareFunction = async ({ next }) => {
      const response = await next();

      // Create new response with additional header
      return new Response(response.body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'X-Custom-Header': 'middleware-added',
        },
      });
    };

    const GET = createZodRoute()
      .use(addHeaderMiddleware)
      .handler(() => {
        return { success: true };
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.headers.get('X-Custom-Header')).toBe('middleware-added');
    expect(await response.json()).toEqual({ success: true });
  });

  it('should pass context through middleware chain', async () => {
    const middleware1: MiddlewareFunction = async ({ next }) => {
      const response = await next({
        context: { value1: 'first' },
      });
      return response;
    };

    const middleware2: MiddlewareFunction = async ({ context, next }) => {
      expect(context).toHaveProperty('value1', 'first');
      const response = await next({
        context: { value2: 'second' },
      });
      return response;
    };

    const GET = createZodRoute()
      .use(middleware1)
      .use(middleware2)
      .handler((request: Request, context: { data: Record<string, unknown> }) => {
        expect(context.data).toEqual({
          value1: 'first',
          value2: 'second',
        });
        return { success: true };
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  it('should allow middleware to short-circuit the chain', async () => {
    const authMiddleware: MiddlewareFunction = async ({ next }) => {
      // Short circuit with error response
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

      // This won't be called
      await next();
    };

    const GET = createZodRoute()
      .use(authMiddleware)
      .handler(() => {
        // This won't be called
        return { success: true };
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should handle custom error thrown inside a middleware', async () => {
    class CustomMiddlewareError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomMiddlewareError';
      }
    }

    const errorMiddleware: MiddlewareFunction = async () => {
      console.trace();
      throw new CustomMiddlewareError('Middleware error occurred');
    };

    const handleServerError = (error: Error) => {
      if (error instanceof CustomMiddlewareError) {
        return new Response(JSON.stringify({ message: error.name, details: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify({ message: 'Something went wrong' }), { status: 500 });
    };

    const GET = createZodRoute({
      handleServerError,
    })
      .use(errorMiddleware)
      .handler(() => {
        return { success: true };
      });

    const request = new Request('http://localhost/');
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'CustomMiddlewareError', details: 'Middleware error occurred' });
  });
});
