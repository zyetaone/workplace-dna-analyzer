/**
 * Modern Svelte 5 Realtime Manager
 * Replaces Socket.io with native SSE + Remote Functions
 */

import { EventEmitter } from 'node:events';

interface SessionStats {
  attendees: number;
  responses: number;
  startTime: Date;
  lastActivity: Date;
}

export class RealtimeManager extends EventEmitter {
  private sessions = new Map<string, Set<WritableStreamDefaultWriter>>();
  private sessionStats = new Map<string, SessionStats>();
  
  /**
   * Add a client to a session room for SSE broadcasts
   */
  addClient(sessionCode: string, writer: WritableStreamDefaultWriter) {
    if (!this.sessions.has(sessionCode)) {
      this.sessions.set(sessionCode, new Set());
      this.sessionStats.set(sessionCode, {
        attendees: 0,
        responses: 0,
        startTime: new Date(),
        lastActivity: new Date()
      });
    }
    
    this.sessions.get(sessionCode)!.add(writer);
    this.updateStats(sessionCode, 'join');
    
    // Log for monitoring
    console.log(`[Realtime] Client joined session ${sessionCode}. Total: ${this.sessions.get(sessionCode)!.size}`);
  }
  
  /**
   * Remove a client from a session room
   */
  removeClient(sessionCode: string, writer: WritableStreamDefaultWriter) {
    const session = this.sessions.get(sessionCode);
    if (!session) return;
    
    session.delete(writer);
    this.updateStats(sessionCode, 'leave');
    
    // Clean up empty sessions
    if (session.size === 0) {
      this.sessions.delete(sessionCode);
      this.sessionStats.delete(sessionCode);
      console.log(`[Realtime] Session ${sessionCode} closed - no clients remaining`);
    }
  }
  
  /**
   * Broadcast SSE message to all clients in a session
   */
  async broadcast(sessionCode: string, event: string, data: any): Promise<void> {
    const clients = this.sessions.get(sessionCode);
    if (!clients || clients.size === 0) return;
    
    const message = this.formatSSEMessage(event, data);
    const encoder = new TextEncoder();
    const chunk = encoder.encode(message);
    
    // Track failed clients for cleanup
    const failedClients: WritableStreamDefaultWriter[] = [];
    
    // Broadcast to all clients with proper error handling
    const results = await Promise.allSettled(
      Array.from(clients).map(async (writer) => {
        try {
          // Check if writer is still writable before writing
          if (writer.closed === undefined || !writer.closed) {
            await writer.write(chunk);
          } else {
            failedClients.push(writer);
          }
        } catch (error) {
          // Only log actual errors, not normal disconnections
          if (error && typeof error === 'object' && 'message' in error) {
            console.warn(`[Realtime] Client write failed in session ${sessionCode}:`, error.message);
          }
          failedClients.push(writer);
        }
      })
    );
    
    // Log any unexpected rejections
    results.forEach((result, index) => {
      if (result.status === 'rejected' && result.reason) {
        console.warn(`[Realtime] Broadcast failed for client ${index}:`, result.reason);
      }
    });
    
    // Clean up failed clients
    for (const writer of failedClients) {
      try {
        this.removeClient(sessionCode, writer);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    this.updateStats(sessionCode, 'broadcast');
  }
  
  /**
   * Send targeted message to specific client
   */
  async sendToClient(writer: WritableStreamDefaultWriter, event: string, data: any): Promise<void> {
    const message = this.formatSSEMessage(event, data);
    const encoder = new TextEncoder();
    
    try {
      await writer.write(encoder.encode(message));
    } catch (error) {
      console.error('[Realtime] Failed to send to client:', error);
      throw error;
    }
  }
  
  /**
   * Format data as SSE message
   */
  private formatSSEMessage(event: string, data: any): string {
    const lines = [
      `event: ${event}`,
      `data: ${JSON.stringify(data)}`,
      `id: ${Date.now()}`,
      '', // Empty line to terminate message
      ''
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Update session statistics
   */
  private updateStats(sessionCode: string, action: 'join' | 'leave' | 'broadcast') {
    const stats = this.sessionStats.get(sessionCode);
    if (!stats) return;
    
    stats.lastActivity = new Date();
    
    switch (action) {
      case 'join':
        stats.attendees++;
        break;
      case 'leave':
        stats.attendees = Math.max(0, stats.attendees - 1);
        break;
      case 'broadcast':
        stats.responses++;
        break;
    }
    
    // Emit stats update event
    this.emit('stats:updated', { sessionCode, stats });
  }
  
  /**
   * Get current session statistics
   */
  getSessionStats(sessionCode: string): SessionStats | undefined {
    return this.sessionStats.get(sessionCode);
  }
  
  /**
   * Get all active sessions
   */
  getActiveSessions(): Array<{ code: string; clients: number; stats: SessionStats }> {
    return Array.from(this.sessions.entries()).map(([code, clients]) => ({
      code,
      clients: clients.size,
      stats: this.sessionStats.get(code)!
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

// Singleton instance
export const realtime = new RealtimeManager();

// Health monitoring
setInterval(() => {
  const metrics = realtime.getHealthMetrics();
  if (metrics.activeSessions > 0) {
    console.log('[Realtime Health]', metrics);
  }
}, 30000);