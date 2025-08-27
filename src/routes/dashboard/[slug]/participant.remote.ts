/**
 * Participant Remote Functions - Optimized for Performance
 * Enhanced with caching, retry logic, and comprehensive error handling
 */

import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import * as v from 'valibot';
import { db } from '$lib/server/db/index';
import { sessions, participants } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { questions, isGenerationQuestion, GENERATION_QUESTION_INDEX } from '$lib/questions';
import {
	SlugSchema,
	ParticipantIdSchema,
	SessionCodeSchema,
	ParticipantNameSchema,
	RemoteError,
	handleDatabaseError,
	withRetry,
	cache,
	findSessionBySlug,
	findSessionByCode,
	findParticipantById,
	invalidateSessionCache,
	validateAndParse,
	formatSuccessResponse
} from '$lib/server/remote-utils';

// ============= VALIDATION SCHEMAS =============

const JoinSessionSchema = v.object({
	sessionCode: SessionCodeSchema,
	name: ParticipantNameSchema
});

const SaveResponseSchema = v.object({
	sessionSlug: SlugSchema,
	participantId: ParticipantIdSchema,
	questionIndex: v.pipe(v.number(), v.minValue(0), v.maxValue(questions.length - 1)),
	response: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
	generation: v.optional(v.pipe(v.string(), v.maxLength(50)))
});

const CompleteQuizSchema = v.object({
	sessionSlug: SlugSchema,
	participantId: ParticipantIdSchema,
	scores: v.object({
		collaboration: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
		formality: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
		tech: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
		wellness: v.pipe(v.number(), v.minValue(0), v.maxValue(100))
	})
});

const LoadParticipantSchema = v.object({
	sessionSlug: SlugSchema,
	participantId: ParticipantIdSchema
});

const GetProgressSchema = v.object({
	sessionSlug: SlugSchema,
	participantId: ParticipantIdSchema
});

// ============= COMMAND FUNCTIONS (Mutations) =============

/**
 * Join a session as a participant with enhanced validation
 */
export const joinSession = command(JoinSessionSchema, async (input) => {
	const { sessionCode, name } = validateAndParse(JoinSessionSchema, input);
	
	return withRetry(async () => {
		try {
			// Find session by code with caching
			const session = await findSessionByCode(sessionCode);
			
			// Verify session is active
			if (!session.isActive) {
				throw new RemoteError(400, 'Session is not active', 'SESSION_INACTIVE');
			}
			
			// Check for duplicate participant names (optional business rule)
			const existingParticipant = await db
				.select()
				.from(participants)
				.where(and(
					eq(participants.sessionId, session.id),
					eq(participants.name, name)
				))
				.limit(1);
			
			if (existingParticipant.length > 0) {
				throw new RemoteError(409, 'A participant with this name already exists', 'DUPLICATE_NAME');
			}
			
			// Create new participant
			const [participant] = await db.insert(participants).values({
				sessionId: session.id,
				name: name.trim() // Sanitize name
			}).returning();
			
			// Invalidate session cache to reflect new participant
			await invalidateSessionCache(session.id, session.slug, session.code);
			
			return formatSuccessResponse({
				participant,
				sessionSlug: session.slug,
				sessionName: session.name,
				redirect: `/dashboard/${session.slug}/p/${participant.id}/quiz`,
				questionCount: questions.length
			}, 'Successfully joined session');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'join session');
		}
	});
});

/**
 * Save a quiz response with validation and atomic updates
 */
export const saveResponse = command(SaveResponseSchema, async (input) => {
	const { sessionSlug, participantId, questionIndex, response, generation } = validateAndParse(SaveResponseSchema, input);
	
	return withRetry(async () => {
		try {
			// Get session with caching
			const session = await findSessionBySlug(sessionSlug);
			
			// Verify session is still active
			if (!session.isActive) {
				throw new RemoteError(400, 'Session is no longer active', 'SESSION_INACTIVE');
			}
			
			// Get participant with validation
			const currentParticipant = await findParticipantById(participantId, session.id);
			
			// Prevent updates to completed participants
			if (currentParticipant.completed) {
				throw new RemoteError(400, 'Cannot update completed participant', 'PARTICIPANT_COMPLETED');
			}
			
			// Validate question index
			if (questionIndex < 0 || questionIndex >= questions.length) {
				throw new RemoteError(400, 'Invalid question index', 'INVALID_QUESTION');
			}
			
			// Safely update responses
			const currentResponses = (typeof currentParticipant.responses === 'object' && 
				currentParticipant.responses !== null) 
				? { ...currentParticipant.responses as Record<string, any> }
				: {};
			
			currentResponses[questionIndex] = response.trim();
			
			// Prepare atomic update
			const updateData: any = { 
				responses: currentResponses
			};
			
			// Handle generation question specially
			if (generation && isGenerationQuestion(questionIndex)) {
				updateData.generation = generation;
			}
			
			// Atomic database update
			const result = await db
				.update(participants)
				.set(updateData)
				.where(and(
					eq(participants.id, participantId),
					eq(participants.sessionId, session.id)
				))
				.returning();
			
			if (result.length === 0) {
				throw new RemoteError(404, 'Failed to update participant', 'UPDATE_FAILED');
			}
			
			// Invalidate cache for real-time updates
			cache.delete(`participants:${session.id}`);
			cache.delete(`analytics:${sessionSlug}`);
			
			// Calculate progress
			const answeredCount = Object.keys(currentResponses).length;
			const progress = Math.round((answeredCount / questions.length) * 100);
			
			return formatSuccessResponse({
				questionIndex,
				progress,
				totalQuestions: questions.length,
				answeredCount,
				isGenerationQuestion: isGenerationQuestion(questionIndex)
			}, 'Response saved successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'save response');
		}
	});
});

/**
 * Complete the quiz with comprehensive validation and analytics
 */
export const completeQuiz = command(CompleteQuizSchema, async (input) => {
	const { sessionSlug, participantId, scores } = validateAndParse(CompleteQuizSchema, input);
	
	return withRetry(async () => {
		try {
			// Get session with caching
			const session = await findSessionBySlug(sessionSlug);
			
			// Get and validate participant
			const participant = await findParticipantById(participantId, session.id);
			
			// Prevent double completion
			if (participant.completed) {
				throw new RemoteError(400, 'Quiz already completed', 'ALREADY_COMPLETED');
			}
			
			// Validate scores are within expected range
			const scoreValues = Object.values(scores);
			if (scoreValues.some(score => score < 0 || score > 100)) {
				throw new RemoteError(400, 'Invalid score values', 'INVALID_SCORES');
			}
			
			// Validate participant has answered enough questions
			const responses = participant.responses as Record<string, any> || {};
			const answeredCount = Object.keys(responses).length;
			const minimumAnswers = Math.ceil(questions.length * 0.8); // Require 80% completion
			
			if (answeredCount < minimumAnswers) {
				throw new RemoteError(400, 
					`Insufficient answers: ${answeredCount}/${minimumAnswers} minimum required`, 
					'INSUFFICIENT_ANSWERS'
				);
			}
			
			// Update participant with completion data
			const completionTime = new Date().toISOString();
			const result = await db
				.update(participants)
				.set({ 
					completed: true,
					preferenceScores: scores,
					completedAt: completionTime
				} as any)
				.where(and(
					eq(participants.id, participantId),
					eq(participants.sessionId, session.id)
				))
				.returning();
			
			if (result.length === 0) {
				throw new RemoteError(404, 'Failed to complete quiz', 'COMPLETION_FAILED');
			}
			
			// Invalidate cache for real-time analytics update
			await invalidateSessionCache(session.id, session.slug, session.code);
			
			// Calculate completion stats for response
			const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
			const averageScore = totalScore / 4;
			
			return formatSuccessResponse({
				participant: result[0],
				scores,
				totalScore,
				averageScore: Math.round(averageScore),
				answeredQuestions: answeredCount,
				totalQuestions: questions.length,
				completionRate: Math.round((answeredCount / questions.length) * 100),
				redirect: `/dashboard/${session.slug}/p/${participantId}/quiz/complete`
			}, 'Quiz completed successfully');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'complete quiz');
		}
	}, 2); // Only retry twice for completion operations
});

// ============= QUERY FUNCTIONS (Reads) =============

/**
 * Load participant session data with caching and comprehensive info
 */
export const loadParticipantData = query(LoadParticipantSchema, async (input) => {
	const { sessionSlug, participantId } = validateAndParse(LoadParticipantSchema, input);
	
	const cacheKey = `participant_data:${sessionSlug}:${participantId}`;
	let cachedData = cache.get(cacheKey);
	
	if (cachedData) {
		return { ...cachedData, cached: true };
	}
	
	return withRetry(async () => {
		try {
			// Get session with caching
			const session = await findSessionBySlug(sessionSlug);
			
			// Get participant with validation
			const participant = await findParticipantById(participantId, session.id);
			
			// Calculate progress metrics
			const responses = (participant.responses as Record<string, any>) || {};
			const answeredCount = Object.keys(responses).length;
			const progress = Math.round((answeredCount / questions.length) * 100);
			
			// Determine next question
			const answeredIndices = Object.keys(responses).map(Number).sort((a, b) => a - b);
			const nextQuestionIndex = answeredIndices.length < questions.length 
				? answeredIndices.length 
				: -1; // All answered
			
			const result = {
				session: {
					id: session.id,
					name: session.name,
					code: session.code,
					slug: session.slug,
					isActive: session.isActive
				},
				participant: {
					id: participant.id,
					name: participant.name,
					generation: participant.generation,
					completed: participant.completed,
					joinedAt: participant.joinedAt,
					completedAt: participant.completedAt,
					responses,
					preferenceScores: participant.preferenceScores
				},
				quiz: {
					questions,
					totalQuestions: questions.length,
					answeredCount,
					progress,
					nextQuestionIndex,
					isComplete: participant.completed
				},
				meta: {
					loadedAt: new Date(),
					cached: false
				}
			};
			
			// Cache for 30 seconds
			cache.set(cacheKey, result, 30000);
			
			return result;
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'load participant data');
		}
	});
});

/**
 * Get real-time progress with enhanced metrics and caching
 */
export const getProgress = query(GetProgressSchema, async (input) => {
	const { sessionSlug, participantId } = validateAndParse(GetProgressSchema, input);
	
	// Use shorter cache for real-time updates
	const cacheKey = `progress:${sessionSlug}:${participantId}`;
	let cachedProgress = cache.get(cacheKey);
	
	if (cachedProgress) {
		return { ...cachedProgress, cached: true };
	}
	
	return withRetry(async () => {
		try {
			// Get session with caching
			const session = await findSessionBySlug(sessionSlug);
			
			// Get participant - return empty state if not found
			let participant;
			try {
				participant = await findParticipantById(participantId, session.id);
			} catch (err) {
				if (err instanceof Error && err.message === 'Participant not found') {
					return {
						exists: false,
						completed: false,
						responses: {},
						progress: 0,
						totalQuestions: questions.length,
						answeredCount: 0
					};
				}
				throw err;
			}
			
			// Calculate comprehensive progress metrics
			const responses = (participant.responses as Record<string, any>) || {};
			const answeredCount = Object.keys(responses).length;
			const progress = Math.round((answeredCount / questions.length) * 100);
			
			// Determine completion status
			const isFullyAnswered = answeredCount === questions.length;
			const hasMinimumAnswers = answeredCount >= Math.ceil(questions.length * 0.8);
			
			// Calculate time-based metrics
			const joinedAt = new Date(participant.joinedAt);
			const now = new Date();
			const timeSpentMinutes = Math.round((now.getTime() - joinedAt.getTime()) / 60000);
			
			const progressData = {
				exists: true,
				completed: participant.completed,
				responses,
				progress,
				totalQuestions: questions.length,
				answeredCount,
				isFullyAnswered,
				hasMinimumAnswers,
				canComplete: hasMinimumAnswers && !participant.completed,
				scores: participant.preferenceScores,
				timeMetrics: {
					joinedAt: participant.joinedAt,
					completedAt: participant.completedAt,
					timeSpentMinutes,
					averageTimePerQuestion: answeredCount > 0 ? Math.round(timeSpentMinutes / answeredCount) : 0
				},
				sessionInfo: {
					isActive: session.isActive,
					name: session.name
				},
				lastUpdated: new Date()
			};
			
			// Cache for 10 seconds (shorter for real-time feel)
			cache.set(cacheKey, progressData, 10000);
			
			return progressData;
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'get progress');
		}
	});
});

// ============= UTILITY FUNCTIONS =============

/**
 * Validate participant session access
 */
export const validateParticipantAccess = query(LoadParticipantSchema, async (input) => {
	const { sessionSlug, participantId } = validateAndParse(LoadParticipantSchema, input);
	
	return withRetry(async () => {
		try {
			const session = await findSessionBySlug(sessionSlug);
			const participant = await findParticipantById(participantId, session.id);
			
			return formatSuccessResponse({
				valid: true,
				sessionActive: session.isActive,
				participantCompleted: participant.completed,
				sessionName: session.name,
				participantName: participant.name
			}, 'Access validated');
			
		} catch (err) {
			if (err instanceof RemoteError && err.statusCode === 404) {
				return {
					success: false,
					valid: false,
					error: err.message,
					code: err.code
				};
			}
			throw err;
		}
	});
});

/**
 * Get participant summary for analytics
 */
export const getParticipantSummary = query(LoadParticipantSchema, async (input) => {
	const { sessionSlug, participantId } = validateAndParse(LoadParticipantSchema, input);
	
	return withRetry(async () => {
		try {
			const session = await findSessionBySlug(sessionSlug);
			const participant = await findParticipantById(participantId, session.id);
			
			const responses = (participant.responses as Record<string, any>) || {};
			const answeredCount = Object.keys(responses).length;
			
			return formatSuccessResponse({
				id: participant.id,
				name: participant.name,
				generation: participant.generation,
				completed: participant.completed,
				answeredCount,
				progress: Math.round((answeredCount / questions.length) * 100),
				joinedAt: participant.joinedAt,
				completedAt: participant.completedAt,
				preferenceScores: participant.preferenceScores
			}, 'Participant summary retrieved');
			
		} catch (err) {
			if (err instanceof RemoteError) throw err;
			handleDatabaseError(err, 'get participant summary');
		}
	});
});