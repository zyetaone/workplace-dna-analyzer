import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { b as private_env } from "./shared-server.js";
const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  endedAt: text("ended_at")
});
const attendees = sqliteTable("attendees", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  name: text("name").notNull(),
  generation: text("generation"),
  responses: text("responses", { mode: "json" }).$type().default({}),
  preferenceScores: text("preference_scores", { mode: "json" }).$type(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at")
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  attendees,
  sessions
}, Symbol.toStringTag, { value: "Module" }));
const DATABASE_URL = private_env.DATABASE_URL || "./local.db";
const DATABASE_AUTH_TOKEN = private_env.DATABASE_AUTH_TOKEN;
const client = createClient({
  url: DATABASE_URL.startsWith("libsql://") || DATABASE_URL.startsWith("https://") ? DATABASE_URL : `file:${DATABASE_URL}`,
  authToken: DATABASE_AUTH_TOKEN
  // Only needed for remote Turso databases
});
async function initializePragmas() {
  if (!DATABASE_URL.startsWith("libsql://") && !DATABASE_URL.startsWith("https://")) {
    try {
      await client.execute("PRAGMA journal_mode = WAL");
      await client.execute("PRAGMA busy_timeout = 5000");
      await client.execute("PRAGMA synchronous = NORMAL");
      await client.execute("PRAGMA cache_size = -20000");
      await client.execute("PRAGMA foreign_keys = ON");
      await client.execute("PRAGMA temp_store = MEMORY");
      console.log("SQLite pragmas initialized for optimal performance");
    } catch (error) {
      console.error("Failed to initialize SQLite pragmas:", error);
    }
  }
}
initializePragmas();
const db = drizzle(client, { schema });
export {
  attendees as a,
  db as d,
  sessions as s
};
