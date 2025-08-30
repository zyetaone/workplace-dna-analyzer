/**
 * Centralized Type Definitions
 *
 * Provides comprehensive, strict TypeScript types to eliminate 'any' usage
 * and ensure type safety across the entire application.
 */

// ============================================================================
// QUIZ & RESPONSE TYPES
// ============================================================================

/**
 * Represents a single quiz response from a participant
 *
 * Tracks which answer was selected for a specific question, along with
 * the timestamp when the response was recorded.
 *
 * @interface QuizResponse
 * @property {string} questionId - Unique identifier of the question
 * @property {string} answerId - Unique identifier of the selected answer
 * @property {Date} timestamp - When the response was recorded
 *
 * @example
 * ```typescript
 * const response: QuizResponse = {
 *   questionId: 'q1',
 *   answerId: 'a2',
 *   timestamp: new Date()
 * };
 * ```
 */
export interface QuizResponse {
	questionId: string;
	answerId: string;
	timestamp: Date;
}

/**
 * Represents a quiz session with metadata and participant tracking
 *
 * Contains all the information needed to manage a quiz session,
 * including its lifecycle state and participant count.
 *
 * @interface QuizSession
 * @property {string} id - Unique session identifier
 * @property {string} code - Human-readable session code for joining
 * @property {Date} createdAt - Session creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 * @property {boolean} isActive - Whether the session is currently active
 * @property {number} participantCount - Number of participants in the session
 *
 * @example
 * ```typescript
 * const session: QuizSession = {
 *   id: 'sess_123',
 *   code: 'ABC123',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   isActive: true,
 *   participantCount: 25
 * };
 * ```
 */
export interface QuizSession {
	id: string;
	code: string;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
	participantCount: number;
}

/**
 * Represents a quiz participant with their responses and demographic info
 *
 * Contains all participant data including their quiz responses, demographic
 * information, and calculated preference scores.
 *
 * @interface Participant
 * @property {string} id - Unique participant identifier
 * @property {string} sessionId - ID of the session this participant belongs to
 * @property {string} name - Participant's display name
 * @property {'Baby Boomers' | 'Gen X' | 'Millennials' | 'Gen Z'} generation - Participant's generation cohort
 * @property {QuizResponse[]} responses - Array of quiz responses
 * @property {PreferenceScores} preferenceScores - Calculated preference scores
 * @property {Date} [completedAt] - When the participant completed the quiz
 * @property {Date} createdAt - When the participant joined the session
 *
 * @example
 * ```typescript
 * const participant: Participant = {
 *   id: 'part_456',
 *   sessionId: 'sess_123',
 *   name: 'John Doe',
 *   generation: 'Millennials',
 *   responses: [...],
 *   preferenceScores: {
 *     collaboration: 7.5,
 *     formality: 6.2,
 *     tech: 8.1,
 *     wellness: 7.8
 *   },
 *   createdAt: new Date()
 * };
 * ```
 */
export interface Participant {
	id: string;
	sessionId: string;
	name: string;
	generation: 'Baby Boomers' | 'Gen X' | 'Millennials' | 'Gen Z';
	responses: QuizResponse[];
	preferenceScores: PreferenceScores;
	completedAt?: Date;
	createdAt: Date;
}

/**
 * Calculated preference scores for a participant across different dimensions
 *
 * Represents the participant's preferences on a scale (typically 0-10) across
 * four key dimensions that influence workplace preferences and behavior.
 *
 * @interface PreferenceScores
 * @property {number} collaboration - Preference for collaborative work environments (0-10)
 * @property {number} formality - Preference for formal vs casual work settings (0-10)
 * @property {number} tech - Comfort level with technology and digital tools (0-10)
 * @property {number} wellness - Importance of work-life balance and wellness (0-10)
 *
 * @example
 * ```typescript
 * const scores: PreferenceScores = {
 *   collaboration: 8.5,  // High preference for teamwork
 *   formality: 3.2,      // Prefers casual environment
 *   tech: 9.1,           // Very comfortable with technology
 *   wellness: 7.8        // Values work-life balance
 * };
 * ```
 */
export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

export interface QuizAnalytics {
	totalParticipants: number;
	averageScores: PreferenceScores;
	generationBreakdown: Record<string, number>;
	completionRate: number;
	popularAnswers: Record<string, Record<string, number>>;
}

// ============================================================================
// DATABASE SCHEMA TYPES
// ============================================================================

export interface DatabaseSession {
	id: string;
	code: string;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
}

export interface DatabaseParticipant {
	id: string;
	sessionId: string;
	name: string;
	generation: string;
	responses: Record<string, string>; // questionId -> answerId
	preferenceScores: Record<string, number>; // scoreType -> value
	completedAt: Date | null;
	createdAt: Date;
}

// ============================================================================
// API & REMOTE FUNCTION TYPES
// ============================================================================

/**
 * Standardized API response wrapper for all remote operations
 *
 * Provides a consistent structure for API responses, including success status,
 * optional data payload, and structured error information.
 *
 * @template T - The type of data returned on success
 * @interface ApiResponse
 * @property {boolean} success - Whether the operation succeeded
 * @property {T} [data] - Response data (present only on success)
 * @property {object} [error] - Error details (present only on failure)
 * @property {string} error.code - Machine-readable error code
 * @property {string} error.message - Human-readable error message
 * @property {string} [error.details] - Additional error context/details
 *
 * @example
 * ```typescript
 * // Success response
 * const successResponse: ApiResponse<User> = {
 *   success: true,
 *   data: { id: '123', name: 'John' }
 * };
 *
 * // Error response
 * const errorResponse: ApiResponse<User> = {
 *   success: false,
 *   error: {
 *     code: 'USER_NOT_FOUND',
 *     message: 'User not found',
 *     details: 'No user exists with ID 123'
 *   }
 * };
 * ```
 */
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: string;
	};
}

/**
 * Base interface for remote functions with input/output typing and validation
 *
 * Defines the structure for server-side functions that can be called remotely,
 * including input validation schema and handler function.
 *
 * @template TInput - Input parameter type
 * @template TOutput - Output return type
 * @interface RemoteFunction
 * @property {unknown} schema - Valibot validation schema for input
 * @property {(input: TInput) => Promise<TOutput>} handler - Function implementation
 *
 * @example
 * ```typescript
 * const createUser: RemoteFunction<CreateUserInput, User> = {
 *   schema: createUserSchema,
 *   handler: async (input) => {
 *     return await db.users.create(input);
 *   }
 * };
 * ```
 */
export interface RemoteFunction<TInput, TOutput> {
	schema: unknown; // Valibot schema
	handler: (input: TInput) => Promise<TOutput>;
}

/**
 * Query function for read-only operations
 *
 * Extends RemoteFunction for operations that read data without side effects.
 * Queries are typically safe to retry and cache.
 *
 * @template TInput - Query input parameters
 * @template TOutput - Query result type
 * @interface QueryFunction
 * @extends RemoteFunction
 */
export interface QueryFunction<TInput, TOutput> extends RemoteFunction<TInput, TOutput> {}

/**
 * Command function for write operations with side effects
 *
 * Extends RemoteFunction for operations that modify data or have side effects.
 * Commands may not be safe to retry and should be handled with care.
 *
 * @template TInput - Command input parameters
 * @template TOutput - Command result type
 * @interface CommandFunction
 * @extends RemoteFunction
 */
export interface CommandFunction<TInput, TOutput> extends RemoteFunction<TInput, TOutput> {}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * Client-side quiz state for participant-facing interfaces
 *
 * Manages the current state of a quiz session from the participant's perspective,
 * including their progress, responses, and current question.
 *
 * @interface QuizState
 * @property {QuizSession | null} session - Current quiz session (null if not loaded)
 * @property {Participant | null} currentParticipant - Current participant data
 * @property {number} currentQuestionIndex - Index of currently displayed question
 * @property {QuizResponse[]} responses - Array of participant's responses so far
 * @property {boolean} isLoading - Whether data is currently being loaded
 * @property {string | null} error - Current error message (null if no error)
 *
 * @example
 * ```typescript
 * const quizState: QuizState = {
 *   session: { id: 's1', code: 'ABC123', ... },
 *   currentParticipant: { id: 'p1', name: 'John', ... },
 *   currentQuestionIndex: 2,
 *   responses: [{ questionId: 'q1', answerId: 'a2', timestamp: new Date() }],
 *   isLoading: false,
 *   error: null
 * };
 * ```
 */
export interface QuizState {
	session: QuizSession | null;
	currentParticipant: Participant | null;
	currentQuestionIndex: number;
	responses: QuizResponse[];
	isLoading: boolean;
	error: string | null;
}

/**
 * Admin-side state for session management and analytics
 *
 * Manages the complete state of a quiz session from the administrator's perspective,
 * including all participants, analytics data, and AI insights.
 *
 * @interface AdminState
 * @property {QuizSession | null} session - Current quiz session
 * @property {Participant[]} participants - All participants in the session
 * @property {QuizAnalytics | null} analytics - Calculated analytics data
 * @property {unknown | null} insights - AI-generated insights and recommendations
 * @property {boolean} isLoading - Whether data is currently being loaded
 * @property {string | null} error - Current error message (null if no error)
 *
 * @example
 * ```typescript
 * const adminState: AdminState = {
 *   session: { id: 's1', code: 'ABC123', participantCount: 25, ... },
 *   participants: [participant1, participant2, ...],
 *   analytics: {
 *     totalParticipants: 25,
 *     averageScores: { collaboration: 7.2, ... },
 *     ...
 *   },
 *   insights: { recommendations: [...], trends: [...] },
 *   isLoading: false,
 *   error: null
 * };
 * ```
 */
export interface AdminState {
	session: QuizSession | null;
	participants: Participant[];
	analytics: QuizAnalytics | null;
	insights: unknown | null;
	isLoading: boolean;
	error: string | null;
}

// ============================================================================
// CHART & VISUALIZATION TYPES
// ============================================================================

export interface ChartDataPoint {
	label: string;
	value: number;
	color?: string;
}

export interface ChartConfig {
	type: 'bar' | 'pie' | 'radar' | 'line';
	data: ChartDataPoint[];
	options?: ChartOptions;
}

export interface ChartOptions {
	showLegend?: boolean;
	showLabels?: boolean;
	colors?: string[];
	animation?: boolean;
	responsive?: boolean;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface BaseComponentProps {
	class?: string;
	disabled?: boolean;
	loading?: boolean;
}

export interface FormFieldProps extends BaseComponentProps {
	label: string;
	required?: boolean;
	error?: string;
	hint?: string;
}

export interface ButtonProps extends BaseComponentProps {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	onClick?: () => void;
	href?: string;
	external?: boolean;
}

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface SelectProps extends FormFieldProps {
	options: SelectOption[];
	value?: string;
	placeholder?: string;
	multiple?: boolean;
	onChange?: (value: string | string[]) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface CustomEventMap {
	'quiz:response': CustomEvent<QuizResponse>;
	'quiz:complete': CustomEvent<Participant>;
	'session:update': CustomEvent<QuizSession>;
	'participant:join': CustomEvent<Participant>;
}

export type CustomEventType = keyof CustomEventMap;

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AppConfig {
	environment: 'development' | 'staging' | 'production';
	apiUrl: string;
	features: {
		analytics: boolean;
		ai: boolean;
		notifications: boolean;
	};
	limits: {
		maxParticipants: number;
		maxSessionDuration: number;
	};
}

export interface ValidationConfig {
	strictMode: boolean;
	allowPartialResponses: boolean;
	validateOnChange: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
	code: string;
	message: string;
	details?: string;
	userMessage: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	recoverable: boolean;
	recoveryAction?: string;
}

export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

export interface PerformanceMetrics {
	renderTime: number;
	memoryUsage: number;
	loadTime: number;
	interactionTime: number;
}

export interface PerformanceConfig {
	trackRenders: boolean;
	trackMemory: boolean;
	trackInteractions: boolean;
	sampleRate: number;
}

// Browser Performance API types
export interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

export interface ExtendedPerformance extends Performance {
	memory?: PerformanceMemory;
}

export interface LayoutShiftEntry extends PerformanceEntry {
	value: number;
	hadRecentInput: boolean;
}

// ============================================================================
// LEGACY TYPE ALIASES (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use QuizResponse instead
 */
export type ResponseItem = QuizResponse;

/**
 * @deprecated Use PreferenceScores instead
 */
export type ScoringResult = PreferenceScores;
