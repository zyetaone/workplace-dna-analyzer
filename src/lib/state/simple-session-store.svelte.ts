/**
 * Simplified Session Store - Minimal reactive state management
 */

import type { Session, Participant } from '$lib/server/db/schema';
import {
	getSessionData,
	toggleSessionStatus,
	endSession,
	deleteParticipant
} from '../../routes/admin/admin.remote';

export class SimpleSessionStore {
  session = $state<Session | null>(null);
  participants = $state<Participant[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  // Simplified computed stats
  stats = $derived(() => {
    const completed = this.participants.filter(p => p.completed).length;
    const total = this.participants.length;
    return {
      total,
      completed,
      active: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  // Simple error handling
  private async safeExecute<T>(op: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await op();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Operation failed';
      return fallback;
    }
  }

  async load(code: string) {
    this.loading = true;
    this.error = null;

    const result = await this.safeExecute(
      () => getSessionData({ code }),
      { session: null, participants: [] }
    );

    this.session = result.session;
    this.participants = result.participants;
    this.loading = false;
  }

  async toggleActive() {
    if (!this.session) return { success: false };
    const wasActive = this.session.isActive;
    this.session = { ...this.session, isActive: !wasActive };

    const result = await this.safeExecute(
      () => toggleSessionStatus({ code: this.session!.code, isActive: !wasActive }),
      { success: true, code: this.session!.code }
    );

    if (!result.success) {
      this.session = { ...this.session, isActive: wasActive };
    }
    return result;
  }

  async end() {
    if (!this.session) return { success: false };
    const result = await this.safeExecute(
      () => endSession({ code: this.session!.code }),
      { success: true, code: this.session!.code }
    );

    if (result.success) {
      this.session = { ...this.session, isActive: false };
    }
    return result;
  }

  async removeParticipant(id: string) {
    if (!this.session) return { success: false };
    const original = [...this.participants];
    this.participants = this.participants.filter(p => p.id !== id);

    const result = await this.safeExecute(
      () => deleteParticipant({ code: this.session!.code, participantId: id }),
      { success: true }
    );

    if (!result.success) {
      this.participants = original;
    }
    return result;
  }

  refresh = () => this.session && this.load(this.session.code);
}

// Simple store registry
const stores = new Map<string, SimpleSessionStore>();

export function getSessionStore(code: string): SimpleSessionStore {
  return stores.get(code) ?? (stores.set(code, new SimpleSessionStore()), stores.get(code)!);
}