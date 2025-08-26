import { EventEmitter } from "node:events";
class RealtimeManager extends EventEmitter {
  sessions = /* @__PURE__ */ new Map();
  sessionStats = /* @__PURE__ */ new Map();
  /**
   * Add a client to a session room for SSE broadcasts
   */
  addClient(sessionCode, writer) {
    if (!this.sessions.has(sessionCode)) {
      this.sessions.set(sessionCode, /* @__PURE__ */ new Set());
      this.sessionStats.set(sessionCode, {
        attendees: 0,
        responses: 0,
        startTime: /* @__PURE__ */ new Date(),
        lastActivity: /* @__PURE__ */ new Date()
      });
    }
    this.sessions.get(sessionCode).add(writer);
    this.updateStats(sessionCode, "join");
    console.log(`[Realtime] Client joined session ${sessionCode}. Total: ${this.sessions.get(sessionCode).size}`);
  }
  /**
   * Remove a client from a session room
   */
  removeClient(sessionCode, writer) {
    const session = this.sessions.get(sessionCode);
    if (!session) return;
    session.delete(writer);
    this.updateStats(sessionCode, "leave");
    if (session.size === 0) {
      this.sessions.delete(sessionCode);
      this.sessionStats.delete(sessionCode);
      console.log(`[Realtime] Session ${sessionCode} closed - no clients remaining`);
    }
  }
  /**
   * Broadcast SSE message to all clients in a session
   */
  async broadcast(sessionCode, event, data) {
    const clients = this.sessions.get(sessionCode);
    if (!clients || clients.size === 0) return;
    const message = this.formatSSEMessage(event, data);
    const encoder = new TextEncoder();
    const chunk = encoder.encode(message);
    const failedClients = [];
    const results = await Promise.allSettled(
      Array.from(clients).map(async (writer) => {
        try {
          if (writer.closed === void 0 || !writer.closed) {
            await writer.write(chunk);
          } else {
            failedClients.push(writer);
          }
        } catch (error) {
          if (error && typeof error === "object" && "message" in error) {
            console.warn(`[Realtime] Client write failed in session ${sessionCode}:`, error.message);
          }
          failedClients.push(writer);
        }
      })
    );
    results.forEach((result, index) => {
      if (result.status === "rejected" && result.reason) {
        console.warn(`[Realtime] Broadcast failed for client ${index}:`, result.reason);
      }
    });
    for (const writer of failedClients) {
      try {
        this.removeClient(sessionCode, writer);
      } catch (error) {
      }
    }
    this.updateStats(sessionCode, "broadcast");
  }
  /**
   * Send targeted message to specific client
   */
  async sendToClient(writer, event, data) {
    const message = this.formatSSEMessage(event, data);
    const encoder = new TextEncoder();
    try {
      await writer.write(encoder.encode(message));
    } catch (error) {
      console.error("[Realtime] Failed to send to client:", error);
      throw error;
    }
  }
  /**
   * Format data as SSE message
   */
  formatSSEMessage(event, data) {
    const lines = [
      `event: ${event}`,
      `data: ${JSON.stringify(data)}`,
      `id: ${Date.now()}`,
      "",
      // Empty line to terminate message
      ""
    ];
    return lines.join("\n");
  }
  /**
   * Update session statistics
   */
  updateStats(sessionCode, action) {
    const stats = this.sessionStats.get(sessionCode);
    if (!stats) return;
    stats.lastActivity = /* @__PURE__ */ new Date();
    switch (action) {
      case "join":
        stats.attendees++;
        break;
      case "leave":
        stats.attendees = Math.max(0, stats.attendees - 1);
        break;
      case "broadcast":
        stats.responses++;
        break;
    }
    this.emit("stats:updated", { sessionCode, stats });
  }
  /**
   * Get current session statistics
   */
  getSessionStats(sessionCode) {
    return this.sessionStats.get(sessionCode);
  }
  /**
   * Get all active sessions
   */
  getActiveSessions() {
    return Array.from(this.sessions.entries()).map(([code, clients]) => ({
      code,
      clients: clients.size,
      stats: this.sessionStats.get(code)
    }));
  }
  /**
   * Health check for monitoring
   */
  getHealthMetrics() {
    const sessions = this.getActiveSessions();
    const totalClients = sessions.reduce((sum, s) => sum + s.clients, 0);
    const totalResponses = sessions.reduce((sum, s) => sum + (s.stats?.responses || 0), 0);
    return {
      activeSessions: sessions.length,
      totalClients,
      totalResponses,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}
const realtime = new RealtimeManager();
setInterval(() => {
  const metrics = realtime.getHealthMetrics();
  if (metrics.activeSessions > 0) {
    console.log("[Realtime Health]", metrics);
  }
}, 3e4);
const _broadcastEvents = {
  attendeeJoined: (sessionId, attendee) => {
    realtime.broadcast(sessionId, "attendee_joined", attendee);
  },
  responseReceived: (sessionId, data) => {
    realtime.broadcast(sessionId, "response_received", data);
  },
  attendeeCompleted: (sessionId, attendeeId, scores) => {
    realtime.broadcast(sessionId, "attendee_completed", {
      attendeeId,
      scores,
      timestamp: /* @__PURE__ */ new Date()
    });
  },
  analytics: (sessionId, analytics) => {
    realtime.broadcast(sessionId, "analytics", analytics);
  },
  attendeeDeleted: (sessionId, attendeeId) => {
    realtime.broadcast(sessionId, "attendee_deleted", {
      attendeeId,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
};
const GET = async ({ params, request }) => {
  const sessionCode = params.id;
  console.log(`[SSE] Client connecting to session: ${sessionCode}`);
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  realtime.addClient(sessionCode, writer);
  try {
    await writer.write(
      encoder.encode(`event: connected
data: ${JSON.stringify({
        sessionCode,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })}
id: ${Date.now()}

`)
    );
  } catch (error) {
    console.warn("[SSE] Failed to send initial connection event:", error);
    writer.close();
    return new Response("Connection failed", { status: 500 });
  }
  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`:heartbeat ${Date.now()}

`));
    } catch (error) {
      clearInterval(heartbeatInterval);
      try {
        realtime.removeClient(sessionCode, writer);
        await writer.close();
      } catch (closeError) {
      }
    }
  }, 3e4);
  request.signal.addEventListener("abort", async () => {
    console.log(`[SSE] Client disconnecting from session: ${sessionCode}`);
    clearInterval(heartbeatInterval);
    try {
      realtime.removeClient(sessionCode, writer);
      await writer.close();
    } catch (error) {
    }
  });
  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      // Disable Nginx buffering
      "Access-Control-Allow-Origin": "*"
      // Adjust for production
    }
  });
};
export {
  GET,
  _broadcastEvents
};
