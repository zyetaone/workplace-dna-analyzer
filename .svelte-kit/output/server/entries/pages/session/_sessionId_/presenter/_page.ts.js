import { refreshSessionData } from "../../../../../remote/xu03kg.js";
const load = async ({ params }) => {
  try {
    const sessionData = await refreshSessionData(params.sessionId);
    if (!sessionData) {
      return {
        session: null,
        sessionCode: null,
        error: "Session not found"
      };
    }
    return {
      session: sessionData,
      sessionCode: sessionData.code
    };
  } catch (error) {
    console.error("Failed to load session:", error);
    return {
      session: null,
      sessionCode: null,
      error: "Session not found"
    };
  }
};
export {
  load
};
