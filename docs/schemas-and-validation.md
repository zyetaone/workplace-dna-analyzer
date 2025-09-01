# Schemas & Validation

- DB schema (single source): `src/lib/server/db/schema.ts` using Drizzle. Infer types with `$inferSelect`/`$inferInsert`; do not duplicate table shapes elsewhere.
- API schemas: `src/lib/server/schemas/` using Valibot. Define request/response schemas per remote and import them rather than declaring inline.
- Response validation: Always validate output before returning from `query`/`command` using `validateResponse`.

## Patterns

- Input (Valibot):
  - `export const CreateSessionInput = v.object({ name: v.string() });`
  - `export type CreateSessionInput = v.InferOutput<typeof CreateSessionInput>;`
- Output (Valibot):
  - `export const CreateSessionOutput = v.object({ success: v.literal(true), data: SessionRecord, redirect: v.string(), invalidate: v.array(v.string()) });`
- Usage in remotes:
  - `export const createSession = command(CreateSessionInput, async ({ name }) => { /* ... */ return validateResponse(CreateSessionOutput, result); });`

## Locations

- Inputs/outputs (server-only):
  - `src/lib/server/schemas/session.ts`
  - `src/lib/server/schemas/activity.ts`
  - Helper: `src/lib/server/schemas/common.ts` (`validateResponse`)
- Remotes:
  - `src/routes/data.remote.ts`
  - `src/routes/activities/activities.remote.ts`

## Notes

- Prefer inferred types over hand-written interfaces at DB/API boundaries.
- Keep schemas minimal but strict on critical fields; use `v.unknown()` for opaque blobs.
- Avoid client bundling of server schemas by keeping them under `src/lib/server/`.
