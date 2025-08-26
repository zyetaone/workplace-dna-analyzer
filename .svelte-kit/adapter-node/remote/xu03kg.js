import "../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import { a, q } from "../chunks/query.js";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { d, s, a as a$1 } from "../chunks/index3.js";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { _broadcastEvents } from "../entries/endpoints/api/sessions/_id_/stream/_server.ts.js";
import "../chunks/true.js";
import "../chunks/shared.js";
import "../chunks/paths.js";
const CreateSessionSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  presenterId: v.pipe(v.string(), v.minLength(1))
});
const createSession = a(CreateSessionSchema, async ({ title, presenterId }) => {
  const code = nanoid(8).toUpperCase();
  const [session] = await d.insert(s).values({
    code,
    name: title
  }).returning();
  return {
    success: true,
    session,
    redirect: `/session/${session.id}/presenter`
  };
});
const getSession = q(v.string(), async (sessionId) => {
  const [session] = await d.select().from(s).where(eq(s.id, sessionId));
  if (!session) {
    error(404, "Session not found");
  }
  const sessionAttendees = await d.select().from(a$1).where(eq(a$1.sessionId, sessionId));
  return {
    ...session,
    attendees: sessionAttendees
  };
});
const getSessionByCode = q(v.string(), async (code) => {
  const [session] = await d.select().from(s).where(eq(s.code, code.toUpperCase()));
  if (!session) {
    error(404, "Session not found");
  }
  return session;
});
const getActiveSessions = q(async () => {
  const activeSessions = await d.select().from(s).where(eq(s.isActive, true)).orderBy(desc(s.createdAt));
  const sessionsWithCounts = await Promise.all(
    activeSessions.map(async (session) => {
      const attendeeList = await d.select().from(a$1).where(eq(a$1.sessionId, session.id));
      const activeCount = attendeeList.length;
      const completedCount = attendeeList.filter((a2) => a2.completed).length;
      return {
        ...session,
        activeCount,
        completedCount
      };
    })
  );
  return sessionsWithCounts;
});
const UpdateSessionSchema = v.object({
  sessionId: v.pipe(v.string(), v.uuid()),
  isActive: v.boolean()
});
const updateSession = a(UpdateSessionSchema, async ({ sessionId, isActive }) => {
  const [updated] = await d.update(s).set({ isActive }).where(eq(s.id, sessionId)).returning();
  if (!updated) {
    error(404, "Session not found");
  }
  return { success: true, session: updated };
});
const JoinSessionSchema = v.object({
  sessionCode: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});
const joinSession = a(JoinSessionSchema, async ({ sessionCode, name }) => {
  const [session] = await d.select().from(s).where(eq(s.code, sessionCode));
  if (!session) {
    error(404, "Session not found");
  }
  const [attendee] = await d.insert(a$1).values({
    sessionId: session.id,
    name
  }).returning();
  _broadcastEvents.attendeeJoined(session.id, {
    id: attendee.id,
    name: attendee.name,
    timestamp: /* @__PURE__ */ new Date()
  });
  return {
    success: true,
    attendee,
    sessionId: session.id,
    redirect: `/session/${session.id}/attendee/${attendee.id}`
  };
});
const refreshSessionData = q(v.string(), async (sessionId) => {
  console.log("=== REFRESHING SESSION DATA ===");
  console.log("Session ID:", sessionId);
  const [session] = await d.select().from(s).where(eq(s.id, sessionId));
  if (!session) {
    console.log("Session not found");
    return null;
  }
  const sessionAttendees = await d.select().from(a$1).where(eq(a$1.sessionId, sessionId));
  console.log("Found attendees:", sessionAttendees.length);
  sessionAttendees.forEach((att) => {
    console.log(`Attendee: ${att.name}, Completed: ${att.completed}, Scores:`, att.preferenceScores);
  });
  return {
    ...session,
    attendees: sessionAttendees,
    timestamp: /* @__PURE__ */ new Date()
    // For cache busting
  };
});
for (const [name, fn] of Object.entries({ createSession, getActiveSessions, getSession, getSessionByCode, joinSession, refreshSessionData, updateSession })) {
  fn.__.id = "xu03kg/" + name;
  fn.__.name = name;
}
export {
  createSession,
  getActiveSessions,
  getSession,
  getSessionByCode,
  joinSession,
  refreshSessionData,
  updateSession
};
