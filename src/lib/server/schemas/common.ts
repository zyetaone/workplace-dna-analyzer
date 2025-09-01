import * as v from 'valibot';

export { v };

export function validateResponse<T>(schema: v.BaseSchema<unknown, T, any>, data: unknown): T {
	const result = v.safeParse(schema, data);
	if (!result.success) {
		const details = result.issues
			.map((i) => `${i.path?.map((p) => String(p.key)).join('.') || 'root'}: ${i.message}`)
			.join('; ');
		throw new Error(`Response validation failed: ${details}`);
	}
	return result.output;
}
