/**
 * # Schema Adapter for SvelteKit Remote Functions
 *
 * Provides a standardized way to handle validation in SvelteKit remote functions
 * with consistent error handling and type safety.
 *
 * ## Features
 *
 * - **Type-Safe Validation**: Full TypeScript support with Valibot schemas
 * - **Consistent Error Handling**: Standardized error messages and formats
 * - **Remote Function Integration**: Seamless integration with SvelteKit remote functions
 * - **Performance Optimized**: Efficient validation with minimal overhead
 * - **Developer Experience**: Clear error messages and debugging information
 *
 * ## Usage Patterns
 *
 * ### Basic Validation
 * ```typescript
 * import { validateInput, sessionCodeSchema } from '$lib/server/schema-adapter';
 *
 * const validCode = validateInput(sessionCodeSchema, input.code);
 * ```
 *
 * ### Remote Function with Validation
 * ```typescript
 * import { createQuery } from '$lib/server/schema-adapter';
 *
 * export const getSession = createQuery(
 *   v.object({ code: sessionCodeSchema }),
 *   async ({ code }) => {
 *     return db.select().from(sessions).where(eq(sessions.code, code));
 *   }
 * );
 * ```
 *
 * ### Error Handling
 * ```typescript
 * try {
 *   const result = validateInput(schema, input);
 *   // Process valid data
 * } catch (error) {
 *   // Error message format: "Validation failed: [specific errors]"
 *   console.error(error.message);
 * }
 * ```
 *
 * ## Error Message Format
 *
 * All validation errors follow this consistent format:
 * ```
 * "Validation failed: [error1], [error2], ..."
 * ```
 *
 * This ensures predictable error handling in client code.
 */

import * as v from 'valibot';
import { validateWithDetails } from '$lib/utils/validation';

/**
 * Validates input using Valibot schema and throws on validation failure
 *
 * @param schema - Valibot schema to validate against
 * @param input - Input data to validate
 * @returns Validated and typed output
 * @throws Error with detailed validation messages
 *
 * @example
 * ```typescript
 * const user = validateInput(userSchema, request.body);
 * ```
 */
export function validateInput<T>(schema: v.BaseSchema<any, T, any>, input: unknown): T {
	const result = v.safeParse(schema, input);
	if (!result.success) {
		const errors = result.issues.map((issue) => issue.message || 'Validation error').join(', ');
		throw new Error(`Validation failed: ${errors}`);
	}
	return result.output;
}

/**
 * Validates input and returns detailed error information without throwing
 *
 * @param schema - Valibot schema to validate against
 * @param input - Input data to validate
 * @returns Validation result with success status and detailed error information
 *
 * @example
 * ```typescript
 * const result = validateInputSafe(schema, input);
 * if (!result.success) {
 *   // Handle validation errors with detailed field information
 *   result.errors.forEach(error => {
 *     console.log(`${error.field}: ${error.message}`);
 *   });
 * }
 * ```
 */
export function validateInputSafe<T>(
	schema: v.BaseSchema<any, T, any>,
	input: unknown
): {
	success: boolean;
	data?: T;
	errors?: Array<{
		field: string;
		message: string;
		code: string;
	}>;
} {
	return validateWithDetails(schema, input);
}

/**
 * Create a query function with Valibot validation
 *
 * @param schema - Input validation schema
 * @param handler - Query handler function
 * @returns Remote function object with validation
 *
 * @example
 * ```typescript
 * export const getUser = createQuery(
 *   v.object({ id: v.string() }),
 *   async ({ id }) => {
 *     return db.select().from(users).where(eq(users.id, id));
 *   }
 * );
 * ```
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
 *
 * @param schema - Input validation schema
 * @param handler - Command handler function
 * @returns Remote function object with validation
 *
 * @example
 * ```typescript
 * export const createUser = createCommand(
 *   v.object({
 *     name: participantNameSchema,
 *     email: emailSchema
 *   }),
 *   async ({ name, email }) => {
 *     return db.insert(users).values({ name, email });
 *   }
 * );
 * ```
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

/**
 * Create a mutation function with validation (alias for createCommand)
 *
 * @param schema - Input validation schema
 * @param handler - Mutation handler function
 * @returns Remote function object with validation
 */
export const createMutation = createCommand;

// ============================================================================
// SCHEMA EXPORTS
// ============================================================================

// Export all validation schemas for reuse across the application
export {
	sessionCodeSchema,
	participantNameSchema,
	generationSchema,
	questionIndexSchema,
	emailSchema,
	phoneSchema,
	urlSchema,
	passwordSchema,
	// Utility functions
	isValidSessionCode,
	isValidParticipantName,
	isValidEmail,
	isValidPhone,
	isValidUrl,
	isValidPassword,
	// Helper constructors
	createRequiredStringSchema,
	createOptionalStringSchema,
	createNumberRangeSchema,
	// Types
	type SessionCode,
	type ParticipantName,
	type Generation,
	type QuestionIndex,
	type Email,
	type Phone,
	type Url,
	type Password
} from '$lib/utils/validation';
