// **🎯 MINIMAL DATABASE SCHEMA - Single Table Design**

import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Minimal session data - everything in one table
export const sessions = sqliteTable('sessions', {
	// Primary identifier - 4-digit codes like "ABC1", "XYZ9"
	code: text('code').primaryKey(), // Simple 4-char codes (no UUIDs)
	
	// Basic session info
	name: text('name').notNull(), // "Team Meeting Quiz"
	
	// Activities data as JSON array
	activities: text('activities', { mode: 'json' })
		.$type<MinimalActivity[]>()
		.default([]),
		
	// Current activity index (0, 1, 2...)
	currentActivity: integer('current_activity').notNull().default(0),
	
	// All responses as nested JSON object
	responses: text('responses', { mode: 'json' })
		.$type<MinimalResponses>()
		.default({}),
		
	// Participant names array 
	participants: text('participants', { mode: 'json' })
		.$type<string[]>()
		.default([]),
	
	// Session metadata
	createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

// Type definitions for JSON data structures
export interface MinimalActivity {
	type: string;           // "quiz", "poll", "wordcloud"
	name: string;           // "Lunch Poll" 
	config: any;            // Plugin-specific config
}

export interface MinimalResponses {
	[participantName: string]: {
		[activityIndex: string]: any; // Activity responses
	};
}

// Example data structure:
/*
{
  code: "ABC1",
  name: "Team Meeting",
  activities: [
    { type: "quiz", name: "Preferences", config: { questions: [...] } },
    { type: "poll", name: "Lunch Choice", config: { question: "...", options: [...] } }
  ],
  currentActivity: 0,
  responses: {
    "Alice": { 
      "0": { questionId: "q1", optionId: "opt1", value: "teamwork" },
      "1": { optionIds: ["opt2"], submittedAt: "2025-01-01T12:00:00Z" }
    },
    "Bob": { 
      "0": { questionId: "q1", optionId: "opt3", value: "independent" }
    }
  },
  participants: ["Alice", "Bob", "Charlie"],
  createdAt: "2025-01-01T10:00:00Z",
  isActive: true
}
*/

// Type exports
export type MinimalSession = typeof sessions.$inferSelect;
export type NewMinimalSession = typeof sessions.$inferInsert;

// Helper functions for working with minimal schema
export function generateSessionCode(): string {
	// Generate 4-character code like "ABC1"
	const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // No O/0 confusion
	let result = '';
	for (let i = 0; i < 3; i++) {
		result += chars.charAt(Math.floor(Math.random() * 25)); // Letters first
	}
	result += Math.floor(Math.random() * 9) + 1; // Number last
	return result;
}

export function addParticipant(session: MinimalSession, participantName: string): MinimalSession {
	const participants = [...session.participants];
	if (!participants.includes(participantName)) {
		participants.push(participantName);
	}
	return { ...session, participants };
}

export function addResponse(
	session: MinimalSession, 
	participantName: string, 
	activityIndex: number, 
	response: any
): MinimalSession {
	const responses = { ...session.responses };
	if (!responses[participantName]) {
		responses[participantName] = {};
	}
	responses[participantName][activityIndex.toString()] = response;
	return { ...session, responses };
}

export function switchActivity(session: MinimalSession, activityIndex: number): MinimalSession {
	return { ...session, currentActivity: activityIndex };
}

export function addActivity(session: MinimalSession, activity: MinimalActivity): MinimalSession {
	const activities = [...session.activities, activity];
	return { ...session, activities };
}

// Migration helper (if needed later)
export function createMinimalSession(
	name: string, 
	activities: MinimalActivity[] = []
): NewMinimalSession {
	return {
		code: generateSessionCode(),
		name,
		activities,
		currentActivity: 0,
		responses: {},
		participants: [],
		isActive: true
	};
}