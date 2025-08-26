import "../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import { q as query, a as command } from "../chunks/query.js";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { d as db, s as sessions, a as attendees } from "../chunks/index2.js";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { _broadcastEvents } from "../entries/endpoints/api/sessions/_id_/stream/_server.ts.js";
const CreateSessionSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  presenterId: v.pipe(v.string(), v.minLength(1))
});
const createSession = command(CreateSessionSchema, async ({ title, presenterId }) => {
  const code = nanoid(8).toUpperCase();
  const [session] = await db.insert(sessions).values({
    code,
    name: title
  }).returning();
  return {
    success: true,
    session,
    redirect: `/session/${session.id}/presenter`
  };
});
const getSession = query(v.string(), async (sessionId) => {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session) {
    error(404, "Session not found");
  }
  const sessionAttendees = await db.select().from(attendees).where(eq(attendees.sessionId, sessionId));
  return {
    ...session,
    attendees: sessionAttendees
  };
});
const getSessionByCode = query(v.string(), async (code) => {
  const [session] = await db.select().from(sessions).where(eq(sessions.code, code.toUpperCase()));
  if (!session) {
    error(404, "Session not found");
  }
  return session;
});
const getActiveSessions = query(async () => {
  const activeSessions = await db.select().from(sessions).where(eq(sessions.isActive, true)).orderBy(desc(sessions.createdAt));
  const sessionsWithCounts = await Promise.all(
    activeSessions.map(async (session) => {
      const attendeeList = await db.select().from(attendees).where(eq(attendees.sessionId, session.id));
      const activeCount = attendeeList.length;
      const completedCount = attendeeList.filter((a) => a.completed).length;
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
const updateSession = command(UpdateSessionSchema, async ({ sessionId, isActive }) => {
  const [updated] = await db.update(sessions).set({ isActive }).where(eq(sessions.id, sessionId)).returning();
  if (!updated) {
    error(404, "Session not found");
  }
  return { success: true, session: updated };
});
const JoinSessionSchema = v.object({
  sessionCode: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100))
});
const joinSession = command(JoinSessionSchema, async ({ sessionCode, name }) => {
  const [session] = await db.select().from(sessions).where(eq(sessions.code, sessionCode));
  if (!session) {
    error(404, "Session not found");
  }
  const [attendee] = await db.insert(attendees).values({
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
const refreshSessionData = query(v.string(), async (sessionId) => {
  console.log("=== REFRESHING SESSION DATA ===");
  console.log("Session ID:", sessionId);
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session) {
    console.log("Session not found");
    return null;
  }
  const sessionAttendees = await db.select().from(attendees).where(eq(attendees.sessionId, sessionId));
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
export {
  createSession,
  getActiveSessions,
  getSession,
  getSessionByCode,
  joinSession,
  refreshSessionData,
  updateSession
};
