/**
 * Schema Adapter for SvelteKit Remote Functions
 * Simple bypass approach - use "unchecked" validation and validate manually
 */

import * as v from 'valibot';

/**
 * Validates input using Valibot schema and throws on validation failure
 */
export function validateInput<T>(schema: v.BaseSchema<any, T, any>, input: unknown): T {
  const result = v.safeParse(schema, input);
  if (!result.success) {
    const errors = result.issues.map(issue => issue.message || 'Validation error').join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }
  return result.output;
}

/**
 * Create a query function with Valibot validation
 */
export function createQuery<TInput, TOutput>(
  schema: v.BaseSchema<any, TInput, any>,
  handler: (input: TInput) => Promise<TOutput>
) {
  return {
    schema,
    handler: async (input: unknown): Promise<TOutput> => {
      const validInput = validateInput(schema, input);
      return handler(validInput);
    }
  };
}

/**
 * Create a command function with Valibot validation
 */
export function createCommand<TInput, TOutput>(
  schema: v.BaseSchema<any, TInput, any>,
  handler: (input: TInput) => Promise<TOutput>
) {
  return {
    schema,
    handler: async (input: unknown): Promise<TOutput> => {
      const validInput = validateInput(schema, input);
      return handler(validInput);
    }
  };
}

// Export validation schemas for reuse
export { sessionCodeSchema, participantNameSchema, generationSchema, questionIndexSchema } from '$lib/utils/validation';