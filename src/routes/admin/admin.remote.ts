/**
 * Admin remote functions - Client-side wrappers for server operations
 */

import * as v from 'valibot';
import { query, command } from '$app/server';
import {
  getAllSessions,
  createSession,
  deleteSession,
  getSessionWithParticipants,
  updateSessionStatus,
  removeParticipant
} from '$lib/server/session-operations';
import { sessionCodeSchema } from '$lib/validation';

// Session management functions
export const getAllSessionsRemote = query(
  v.object({}),
  async () => {
    return await getAllSessions({});
  }
);

export const createSessionRemote = command(
  v.object({ name: v.string() }),
  async ({ name }) => {
    return await createSession({ name });
  }
);

export const deleteSessionRemote = command(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    return await deleteSession({ code });
  }
);

// Session data functions
export const getSessionData = query(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    return await getSessionWithParticipants({ code });
  }
);

export const toggleSessionStatus = command(
  v.object({ code: sessionCodeSchema, isActive: v.boolean() }),
  async ({ code, isActive }) => {
    return await updateSessionStatus({ code, isActive });
  }
);

export const endSession = command(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    return await updateSessionStatus({ code, endSession: true });
  }
);

export const deleteParticipant = command(
  v.object({ code: sessionCodeSchema, participantId: v.string() }),
  async ({ code, participantId }) => {
    return await removeParticipant({ code, participantId });
  }
);