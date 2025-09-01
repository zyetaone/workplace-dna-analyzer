/**
 * Workplace preference quiz questions
 * Now integrated with the unified question system
 */

// Migration and types now handled by unified quiz system

export type Generation = 'Baby Boomers' | 'Gen X' | 'Millennials' | 'Gen Z';

// Legacy interfaces for backward compatibility
export interface QuestionOption {
	id: string;
	label: string;
	description?: string;
	icon?: string;
}

export interface Question {
	id: string;
	question: string;
	description: string;
	options: QuestionOption[];
	category:
		| 'communication'
		| 'technology'
		| 'environment'
		| 'meetings'
		| 'feedback'
		| 'learning'
		| 'workspace'
		| 'decision-making'
		| 'work-life'
		| 'recognition';
}

export interface GenerationOption {
	id: Generation;
	label: string;
	description: string;
}

export const GENERATION_OPTIONS: GenerationOption[] = [
	{
		id: 'Baby Boomers',
		label: 'Baby Boomers (1946-1964)',
		description: 'Traditional values, experience-focused, prefer formal communication'
	},
	{
		id: 'Gen X',
		label: 'Gen X (1965-1980)',
		description: 'Independent, adaptable, value work-life balance'
	},
	{
		id: 'Millennials',
		label: 'Millennials (1981-1996)',
		description: 'Tech-savvy, collaborative, seek meaningful work'
	},
	{
		id: 'Gen Z',
		label: 'Gen Z (1997-2012)',
		description: 'Digital natives, diverse, socially conscious'
	}
];

// Quiz questions
export const questions: Question[] = [
	{
		id: 'communication',
		question: 'How do you prefer to communicate with your team?',
		description: 'Your preferred communication style affects team collaboration',
		category: 'communication',
		options: [
			{
				id: 'team_chat',
				label: 'Team chat and instant messaging',
				description: 'Quick, informal communication'
			},
			{
				id: 'email',
				label: 'Email for formal communication',
				description: 'Structured, documented communication'
			},
			{
				id: 'meetings',
				label: 'Regular team meetings',
				description: 'Face-to-face or video discussions'
			},
			{
				id: 'documents',
				label: 'Shared documents and wikis',
				description: 'Asynchronous, documented collaboration'
			}
		]
	},
	{
		id: 'technology',
		question: "What's your preference for workplace technology?",
		description: 'Your tech comfort level influences tool adoption',
		category: 'technology',
		options: [
			{
				id: 'latest_tech',
				label: 'Always use the latest technology',
				description: 'Embrace cutting-edge tools and innovations'
			},
			{
				id: 'reliable_tools',
				label: 'Reliable, proven tools',
				description: 'Stable, well-established solutions'
			},
			{
				id: 'minimal_tech',
				label: 'Minimal technology, focus on people',
				description: 'Prefer human interaction over digital tools'
			},
			{
				id: 'custom_solutions',
				label: 'Custom-built or specialized tools',
				description: 'Tailored solutions for specific needs'
			}
		]
	},
	{
		id: 'environment',
		question: "What's your ideal work environment?",
		description: 'Your workspace preference affects productivity and satisfaction',
		category: 'environment',
		options: [
			{
				id: 'open_office',
				label: 'Open office with team collaboration',
				description: 'Dynamic, interactive workspace'
			},
			{
				id: 'private_office',
				label: 'Private office for focused work',
				description: 'Quiet, concentrated environment'
			},
			{
				id: 'remote_work',
				label: 'Remote work from home',
				description: 'Flexible, location-independent work'
			},
			{
				id: 'hybrid_model',
				label: 'Hybrid office and remote work',
				description: 'Best of both worlds'
			}
		]
	},
	{
		id: 'meetings',
		question: 'How do you prefer to conduct team meetings?',
		description: 'Your meeting style affects team efficiency',
		category: 'meetings',
		options: [
			{
				id: 'structured_agenda',
				label: 'Structured with clear agenda',
				description: 'Organized, goal-oriented meetings'
			},
			{
				id: 'brainstorming',
				label: 'Open brainstorming sessions',
				description: 'Creative, idea-generating discussions'
			},
			{
				id: 'quick_standups',
				label: 'Quick daily stand-ups',
				description: 'Brief, status-focused updates'
			},
			{
				id: 'flexible_discussion',
				label: 'Flexible discussion format',
				description: 'Adaptive to current needs'
			}
		]
	},
	{
		id: 'feedback',
		question: 'How do you prefer to give and receive feedback?',
		description: 'Your feedback style affects team growth and morale',
		category: 'feedback',
		options: [
			{
				id: 'regular_checkins',
				label: 'Regular one-on-one check-ins',
				description: 'Consistent, personal feedback sessions'
			},
			{
				id: 'peer_reviews',
				label: 'Peer review and 360-degree feedback',
				description: 'Multi-source feedback system'
			},
			{
				id: 'real_time',
				label: 'Real-time, informal feedback',
				description: 'Immediate, ongoing communication'
			},
			{
				id: 'annual_reviews',
				label: 'Formal annual performance reviews',
				description: 'Structured, comprehensive evaluations'
			}
		]
	},
	{
		id: 'learning',
		question: "What's your preferred learning style?",
		description: 'Your learning preference affects skill development',
		category: 'learning',
		options: [
			{
				id: 'hands_on',
				label: 'Hands-on, practical experience',
				description: 'Learning by doing'
			},
			{
				id: 'formal_training',
				label: 'Formal training and courses',
				description: 'Structured educational programs'
			},
			{
				id: 'peer_learning',
				label: 'Learning from peers and mentors',
				description: 'Knowledge sharing within teams'
			},
			{
				id: 'self_directed',
				label: 'Self-directed online learning',
				description: 'Independent study and research'
			}
		]
	},
	{
		id: 'workspace',
		question: "What's your ideal workspace setup?",
		description: 'Your workspace preferences affect comfort and productivity',
		category: 'workspace',
		options: [
			{
				id: 'ergonomic_setup',
				label: 'Fully ergonomic setup',
				description: 'Height-adjustable desk, proper chair, multiple monitors'
			},
			{
				id: 'minimalist_desk',
				label: 'Clean, minimalist desk',
				description: 'Essential items only, organized space'
			},
			{
				id: 'personalized_space',
				label: 'Personalized with plants and photos',
				description: 'Comfortable, home-like environment'
			},
			{
				id: 'flexible_spaces',
				label: 'Access to various work spaces',
				description: 'Meeting rooms, quiet areas, collaborative zones'
			}
		]
	},
	{
		id: 'decision_making',
		question: 'How do you prefer to make team decisions?',
		description: 'Your decision-making style affects team dynamics',
		category: 'decision-making',
		options: [
			{
				id: 'consensus_building',
				label: 'Consensus building with full team input',
				description: 'Inclusive, collaborative decisions'
			},
			{
				id: 'expert_guidance',
				label: 'Expert guidance with team consultation',
				description: 'Knowledge-based decisions with input'
			},
			{
				id: 'data_driven',
				label: 'Data-driven analysis and metrics',
				description: 'Evidence-based decision making'
			},
			{
				id: 'efficient_process',
				label: 'Efficient process with clear delegation',
				description: 'Streamlined decision-making workflow'
			}
		]
	},
	{
		id: 'work_life',
		question: 'How important is work-life balance to you?',
		description: 'Your work-life balance preference affects well-being',
		category: 'work-life',
		options: [
			{
				id: 'strict_boundaries',
				label: 'Strict boundaries between work and personal life',
				description: 'Clear separation, no after-hours work'
			},
			{
				id: 'flexible_schedule',
				label: 'Flexible schedule with personal time',
				description: 'Adaptable hours, work when productive'
			},
			{
				id: 'integrated_life',
				label: 'Integrated work and personal life',
				description: 'Blended lifestyle, always connected'
			},
			{
				id: 'career_focus',
				label: 'Career-focused with occasional breaks',
				description: 'Work-centric with planned time off'
			}
		]
	},
	{
		id: 'recognition',
		question: 'How do you prefer to be recognized for your work?',
		description: 'Your recognition preference affects motivation',
		category: 'recognition',
		options: [
			{
				id: 'public_recognition',
				label: 'Public recognition in team meetings',
				description: 'Celebration in group settings'
			},
			{
				id: 'private_feedback',
				label: 'Private feedback from managers',
				description: 'One-on-one acknowledgment'
			},
			{
				id: 'peer_appreciation',
				label: 'Peer-to-peer appreciation',
				description: 'Recognition from colleagues'
			},
			{
				id: 'tangible_rewards',
				label: 'Tangible rewards and bonuses',
				description: 'Monetary or physical incentives'
			}
		]
	}
];

// Generation options moved to top of file to avoid duplication

// Unified question set using the new system
// Note: Temporarily commented out until migration modules are created
// export const generalWorkplaceQuestionSet: QuestionSet = migrateGeneralQuestions(questions);

// Helper functions (legacy - use QuestionHelpers from unified system instead)
export function getQuestionById(id: string): Question | undefined {
	return questions.find((q) => q.id === id);
}

export function getQuestionsByCategory(category: Question['category']): Question[] {
	return questions.filter((q) => q.category === category);
}

export function getTotalQuestions(): number {
	return questions.length;
}

export function getQuestionIndex(questionId: string): number {
	return questions.findIndex((q) => q.id === questionId);
}

export function getNextQuestion(currentIndex: number): Question | null {
	if (currentIndex + 1 < questions.length) {
		return questions[currentIndex + 1];
	}
	return null;
}

export function getPreviousQuestion(currentIndex: number): Question | null {
	if (currentIndex > 0) {
		return questions[currentIndex - 1];
	}
	return null;
}
