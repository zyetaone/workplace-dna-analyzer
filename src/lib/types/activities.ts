/**
 * ACTIVITY TYPE SYSTEM
 * Type-safe activity plugin architecture for Mentimeter-like functionality
 */

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
