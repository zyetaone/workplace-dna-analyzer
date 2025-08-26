import { getSession } from "../../../../../remote/xu03kg.js";
const load = async ({ params }) => {
  const { sessionId } = params;
  try {
    const sessionData = await getSession(sessionId);
    console.log("[Page Server Load] Session loaded:", {
      sessionId,
      attendeeCount: sessionData.attendees?.length || 0,
      completed: sessionData.attendees?.filter((a) => a.completed).length || 0
    });
    return {
      sessionId,
      initialSession: sessionData,
      initialAttendees: sessionData.attendees || []
    };
  } catch (error) {
    console.error("[Page Server Load] Failed to load session:", error);
    return {
      sessionId,
      initialSession: null,
      initialAttendees: []
    };
  }
};
export {
  load
};
