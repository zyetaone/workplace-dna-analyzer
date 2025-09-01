/**
 * Unified Type Definitions
 *
 * This file consolidates all TypeScript types for the application.
 * Types are inferred from:
 * - Drizzle ORM schemas (database layer)
 * - Valibot schemas (validation layer)
 * - Component-level interfaces (UI layer)
 */

// ============================================================================
// DATABASE SCHEMA TYPES (inferred from Drizzle)
// ============================================================================

import type {
	Session,
	NewSession,
	Participant,
	NewParticipant,
	Activity,
	NewActivity,
	ParticipantProgress,
	NewParticipantProgress,
	SessionWithCounts,
	PreferenceScores
} from '$lib/server/db/schema';

export type {
	Session,
	NewSession,
	Participant,
	NewParticipant,
	Activity,
	NewActivity,
	ParticipantProgress,
	NewParticipantProgress,
	SessionWithCounts,
	PreferenceScores
};

// ============================================================================
// VALIBOT SCHEMA TYPES (inferred from validation schemas)
// ============================================================================

// Session operations
export type {
	GetSessionInfoInput,
	CreateSessionInput,
	DeleteSessionInput,
	ToggleSessionStatusInput,
	SessionOperationInput,
	GetQuizStateInput,
	SaveAnswerInput,
	CompleteQuizInput,
	GetAllSessionsInput,
	GetSessionDataInput,
	GetCompletionResultsInput,
	DeleteParticipantInput,
	SessionWithCounts as SessionWithCountsValibot
} from '$lib/server/schemas/session';

// Participant operations
export type {
	GetQuizStateOutput,
	SaveAnswerOutput,
	CompleteQuizOutput,
	GetCompletionResultsOutput,
	RemoveParticipantOutput
} from '$lib/server/schemas/participant';

// Activity operations
export type {
	LoadActivityInput,
	GetSessionActivitiesInput,
	GetActivityProgressInput,
	SaveActivityResponseInput,
	CalculateActivityScoreInput,
	CreateActivityInput,
	AddActivityToSessionInput,
	GetActivityAnalyticsInput,
	ToggleSessionActivityInput,
	ReorderSessionActivityInput,
	RemoveSessionActivityInput
} from '$lib/server/schemas/activity';

// ============================================================================
// QUIZ & RESPONSE TYPES
// ============================================================================

/**
 * Represents a single response from a participant
 */
export interface Response {
	questionId: string;
	value: any;
	timestamp: Date;
}

/**
 * Represents a session with metadata and participant tracking
 */
export interface QuizSession {
	id: string;
	code: string;
	name: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	participantCount: number;
}

/**
 * Represents a participant with their responses and demographic info
 */
export interface QuizParticipant {
	id: string;
	sessionId: string;
	name: string;
	generation: 'Baby Boomers' | 'Gen X' | 'Millennials' | 'Gen Z';
	responses: Response[];
	preferenceScores: PreferenceScores;
	completedAt?: Date;
	createdAt: Date;
}

/**
 * Calculated preference scores for a participant across different dimensions
 */
export interface QuizAnalytics {
	totalParticipants: number;
	averageScores: PreferenceScores;
	generationBreakdown: Record<string, number>;
	completionRate: number;
	popularAnswers: Record<string, Record<string, number>>;
}

// ============================================================================
// ACTIVITY SYSTEM TYPES
// ============================================================================

// Core activity status lifecycle
export type ActivityStatus = 'initializing' | 'ready' | 'active' | 'paused' | 'completed' | 'error';

// Activity interaction modes
export type ActivityMode = 'presentation' | 'interaction' | 'results';

// Base activity configuration
export interface BaseActivityConfig {
	id: string;
	type: string;
	name: string;
	description?: string;
	version: string;
	author?: string;
	icon?: string;
	thumbnail?: string;
	fallbackMessage?: string;

	// Feature capabilities
	capabilities: {
		realtime: boolean;
		anonymous: boolean;
		requiresAuth: boolean;
		supportsGroups: boolean;
		hasResults: boolean;
		isExportable: boolean;
	};

	// Presentation settings
	presentation: {
		showTimer: boolean;
		showProgressBar: boolean;
		showParticipantCount: boolean;
		allowLateJoins: boolean;
		duration?: number; // seconds
	};

	// Data validation
	validation?: {
		minParticipants?: number;
		maxParticipants?: number;
		requiredFields?: string[];
	};
}

// Specific activity types
export interface QuizActivityConfig extends BaseActivityConfig {
	type: 'quiz';
	questions: QuizQuestion[];
	scoring: {
		mode: 'immediate' | 'end';
		showCorrectAnswers: boolean;
		allowRetries: boolean;
	};
}

export interface PollActivityConfig extends BaseActivityConfig {
	type: 'poll';
	question: string;
	options: PollOption[];
	settings: {
		multipleChoice: boolean;
		showLiveResults: boolean;
		allowNewOptions: boolean;
		requireComment: boolean;
	};
}

export interface WordCloudActivityConfig extends BaseActivityConfig {
	type: 'wordcloud';
	prompt: string;
	settings: {
		maxWords?: number;
		minWordLength?: number;
		moderationEnabled: boolean;
		profanityFilter: boolean;
	};
}

export interface OpenTextActivityConfig extends BaseActivityConfig {
	type: 'opentext';
	prompt: string;
	settings: {
		charLimit?: number;
		moderationEnabled: boolean;
		showSubmissions: boolean;
		allowAnonymous: boolean;
	};
}

export interface RatingActivityConfig extends BaseActivityConfig {
	type: 'rating';
	items: RatingItem[];
	scale: {
		min: number;
		max: number;
		labels?: string[];
		type: 'numeric' | 'star' | 'emoji';
	};
}

// Union type for all activity configurations
export type ActivityConfig =
	| QuizActivityConfig
	| PollActivityConfig
	| WordCloudActivityConfig
	| OpenTextActivityConfig
	| RatingActivityConfig;

// Activity state management
export interface ActivityState {
	id: string;
	status: ActivityStatus;
	mode?: ActivityMode;
	data: Record<string, any>;
	error: string | null;
	retryCount: number;
	startedAt?: Date;
	completedAt?: Date;
	participantCount?: number;
	results?: ActivityResults;
}

// Activity interaction events
export interface ActivityEvent {
	type: string;
	activityId: string;
	sessionCode: string;
	participantId?: string;
	timestamp: Date;
	data: Record<string, any>;
}

// Results and analytics
export interface ActivityResults {
	activityId: string;
	totalParticipants: number;
	completedParticipants: number;
	responses: ActivityResponse[];
	analytics: Record<string, any>;
	generatedAt: Date;
}

export interface ActivityResponse {
	participantId: string;
	activityId: string;
	response: any;
	submittedAt: Date;
	isAnonymous: boolean;
	metadata?: Record<string, any>;
}

// Supporting types
export interface QuizQuestion {
	id: string;
	question: string;
	type: 'multiple-choice' | 'true-false' | 'open-text';
	options?: QuizOption[];
	correctAnswer?: string | string[];
	explanation?: string;
	timeLimit?: number;
	points?: number;
}

export interface QuizOption {
	id: string;
	text: string;
	isCorrect?: boolean;
}

export interface PollOption {
	id: string;
	text: string;
	color?: string;
	emoji?: string;
}

export interface RatingItem {
	id: string;
	text: string;
	category?: string;
}

// Activity plugin interface
export interface ActivityPlugin {
	config: ActivityConfig;
	component: any; // Svelte component
	presenterComponent?: any; // Presenter-specific UI
	resultsComponent?: any; // Results visualization

	// Lifecycle hooks
	onInit?: (state: ActivityState) => void;
	onStart?: (state: ActivityState) => void;
	onComplete?: (state: ActivityState) => void;
	onDestroy?: (state: ActivityState) => void;

	// Data processing
	processResponse?: (response: any) => any;
	calculateResults?: (responses: ActivityResponse[]) => Record<string, any>;
	exportData?: (results: ActivityResults) => any;
}

// Session activity management
export interface SessionActivity {
	id: string;
	sessionId: string;
	config: ActivityConfig;
	state: ActivityState;
	order: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Activity registry for plugin management
export interface ActivityRegistry {
	register(plugin: ActivityPlugin): void;
	unregister(type: string): void;
	get(type: string): ActivityPlugin | null;
	getAll(): ActivityPlugin[];
	isSupported(type: string): boolean;
}

// ============================================================================
// QUIZ COMPONENT TYPES (component-level interfaces)
// ============================================================================

import type { ComponentType } from 'svelte';

// QuizStore interface for the new simplified quiz system
export interface QuizStore {
	// Add any needed store interface properties here
}

// Core quiz interfaces for components
export interface QuizQuestionComponent {
	id: string | number;
	text: string;
	type: 'rating' | 'emoji' | 'yesno' | 'text' | 'select' | 'multiselect';
	required?: boolean;
	options?: QuizOptionComponent[];
	placeholder?: string;
	minValue?: number;
	maxValue?: number;
	labels?: {
		min?: string;
		max?: string;
	};
	category?: string;
	weight?: number;
}

export interface QuizOptionComponent {
	id?: string;
	value: string | number;
	label: string;
	emoji?: string;
	score?: number;
	scores?: Record<string, number>; // For multi-dimensional scoring
}

export interface QuizResponseComponent {
	questionId: string | number;
	value: string | number | string[];
	timestamp: Date;
}

export interface QuizResultComponent {
	overallScore?: number;
	sentiment?: 'positive' | 'neutral' | 'negative';
	responses: QuizResponseComponent[];
	insights?: string[];
	profile?: QuizProfile;
	scores?: Record<string, number>;
	percentiles?: Record<string, number>;
	trends?: {
		current: number;
		previous?: number;
		change?: number;
	};
}

export interface QuizProfile {
	type: string;
	description: string;
	strengths: string[];
	idealEnvironment?: string[];
	recommendations?: string[];
}

export interface QuizStateComponent {
	currentQuestionIndex: number;
	responses: QuizResponseComponent[];
	startTime: Date | null;
	endTime: Date | null;
	isComplete: boolean;
	result: QuizResultComponent | null;
	allowSkip?: boolean;
}

export interface QuizConfigComponent {
	id: string;
	name: string;
	description?: string;
	version?: string;
	questions: QuizQuestionComponent[];
	allowSkip?: boolean;
	randomizeQuestions?: boolean;
	minQuestionsRequired?: number;
	showProgressBar?: boolean;
	allowAnonymous?: boolean;
	frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
	showResults?: boolean;
	customThankYouMessage?: string;
	timeLimit?: number;
	autoAdvance?: boolean;
	autoAdvanceDelay?: number;
	allowReview?: boolean;
	scoring?: {
		enabled: boolean;
		dimensions?: string[];
		profiles?: QuizProfile[];
		weights?: Record<string, number>;
	};
}

// Activity interfaces for components
export interface ActivityConfigComponent {
	id: string;
	name: string;
	description?: string;
	version?: string;
	minParticipants?: number;
	maxParticipants?: number;
	estimatedDuration?: number;
	tags?: string[];
}

export interface ActivityStateComponent {
	readonly isActive: boolean;
	readonly isComplete: boolean;
	readonly currentStep: number;
	readonly totalSteps: number;
	readonly error: string | null;

	start(): void;
	stop(): void;
	reset(): void;
	submitResponse(response: any): Promise<void>;
	getResults(): any;
}

export interface ActivityModule {
	config: ActivityConfigComponent;
	components: {
		main: ComponentType;
		results?: ComponentType;
		admin?: ComponentType;
		preview?: ComponentType;
	};
	createState: (sessionId: string, participantId?: string) => ActivityStateComponent;
	validateResponse?: (response: any) => boolean;
	calculateScore?: (responses: any[]) => number;
	exportData?: (data: any) => Record<string, any>;
}

// Component props interfaces
export interface QuizViewProps {
	store: any;
	sessionCode?: string;
	participantName?: string;
	onComplete?: (result: any) => void;
	onError?: (error: Error) => void;
}

export interface QuestionViewProps {
	question: QuizQuestionComponent;
	value?: any;
	onSubmit?: (value: any) => void;
	disabled?: boolean;
}

export interface ResultsViewProps {
	result: QuizResultComponent;
	onClose?: () => void;
	onRestart?: () => void;
	showDetails?: boolean;
}

// Quiz type definitions
export type QuizType = 'survey' | 'assessment';

export interface QuizTypeConfig {
	type: QuizType;
	title: string;
	description: string;
	features: string[];
	icon: string;
	primaryColor: string;
}

// Predefined quiz configurations
export const QUIZ_TYPE_CONFIGS: Record<QuizType, QuizTypeConfig> = {
	survey: {
		type: 'survey',
		title: 'Quick Survey',
		description: 'Gather feedback and sentiment from participants',
		features: ['Quick', 'Anonymous', 'Instant Results', 'Multiple Question Types'],
		icon: '📊',
		primaryColor: '#4F46E5'
	},
	assessment: {
		type: 'assessment',
		title: 'Assessment',
		description: 'Evaluate preferences and provide personalized insights',
		features: ['Personalized', 'Detailed Analysis', 'Recommendations', 'Peer Comparison'],
		icon: '🎯',
		primaryColor: '#059669'
	}
};

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * Client-side state for participant-facing interfaces
 */
export interface QuizStateStore {
	session: QuizSession | null;
	currentParticipant: QuizParticipant | null;
	currentQuestionIndex: number;
	responses: Response[];
	isLoading: boolean;
	error: string | null;
}

/**
 * Admin-side state for session management and analytics
 */
export interface AdminState {
	session: QuizSession | null;
	participants: QuizParticipant[];
	analytics: QuizAnalytics | null;
	insights: unknown | null;
	isLoading: boolean;
	error: string | null;
}

// ============================================================================
// API & REMOTE FUNCTION TYPES
// ============================================================================

/**
 * Standardized API response wrapper for all remote operations
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
 */
export interface RemoteFunction<TInput, TOutput> {
	schema: unknown; // Valibot schema
	handler: (input: TInput) => Promise<TOutput>;
}

/**
 * Query function for read-only operations
 */
export interface QueryFunction<TInput, TOutput> extends RemoteFunction<TInput, TOutput> {}

/**
 * Command function for write operations with side effects
 */
export interface CommandFunction<TInput, TOutput> extends RemoteFunction<TInput, TOutput> {}

// ============================================================================
// QUIZ COMPONENT TYPES
// ============================================================================

export interface QuizOptions {
	type?: 'survey' | 'assessment';
	allowSkip?: boolean;
	showProgress?: boolean;
	autoAdvance?: boolean;
	timeLimit?: number;
	class?: string;
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
	'quiz:response': CustomEvent<QuizResponseComponent>;
	'quiz:complete': CustomEvent<QuizParticipant>;
	'session:update': CustomEvent<QuizSession>;
	'participant:join': CustomEvent<QuizParticipant>;
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
 * @deprecated Use Response instead
 */
export type QuizResponse = Response;

/**
 * @deprecated Use QuizSession instead
 */
export type QuizSessionLegacy = QuizSession;

/**
 * @deprecated Use Response instead
 */
export type ResponseItem = Response;

/**
 * @deprecated Use PreferenceScores instead
 */
export type ScoringResult = PreferenceScores;
