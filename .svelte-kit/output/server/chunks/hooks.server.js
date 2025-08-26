import { sequence } from "@sveltejs/kit/hooks";
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Unhandled Rejection] at:", promise, "reason:", reason);
  });
  process.on("uncaughtException", (error) => {
    console.error("[Uncaught Exception]:", error);
    if (error.message?.includes("write") || error.message?.includes("stream")) {
      console.log("[Server] Ignoring stream error, continuing...");
      return;
    }
    process.exit(1);
  });
}
const sessionHandler = async ({ event, resolve }) => {
  const sessionMatch = event.url.pathname.match(/^\/session\/([^\/]+)/);
  if (sessionMatch) {
    const sessionId = sessionMatch[1];
    event.locals.sessionId = sessionId;
    if (event.url.pathname.includes("/presenter")) {
      event.locals.isPresenter = true;
    }
    const attendeeMatch = event.url.pathname.match(/\/attendee\/([^\/]+)/);
    if (attendeeMatch) {
      const attendeeId = attendeeMatch[1];
      event.locals.attendeeId = attendeeId;
      event.locals.isAttendee = true;
    }
  }
  return resolve(event);
};
const timingHandler = async ({ event, resolve }) => {
  const start = Date.now();
  const response = await resolve(event);
  const duration = Date.now() - start;
  if (duration > 1e3) {
    console.warn(`Slow request: ${event.url.pathname} took ${duration}ms`);
  }
  response.headers.set("X-Response-Time", `${duration}ms`);
  return response;
};
const corsHandler = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/")) {
    if (event.request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
  }
  const response = await resolve(event);
  if (event.url.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return response;
};
const errorHandler = async ({ event, resolve }) => {
  try {
    return await resolve(event);
  } catch (error) {
    console.error("Request error:", error);
    console.error({
      url: event.url.pathname,
      method: event.request.method,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }
};
const handle = sequence(
  errorHandler,
  sessionHandler,
  timingHandler,
  corsHandler
);
export {
  handle
};
