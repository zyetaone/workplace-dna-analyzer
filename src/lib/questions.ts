

export interface Question {
	id: number;
	title: string;
	type: 'single' | 'multiple' | 'scale' | 'text';
	options?: Option[];
	subtitle?: string;
}

export interface Option {
	id: string;
	label: string;
	emoji?: string;
	description?: string;
	years?: string;
	color?: string;
	values?: {
		collaboration?: number;
		formality?: number;
		tech?: number;
		wellness?: number;
	};
}

// Constants
export const GENERATION_QUESTION_INDEX = 0;

// Derived types from actual question data
export type GenerationOption = 'Baby Boomers' | 'Gen X' | 'Millennials' | 'Gen Z';
export type QuestionResponse = string;

export const questions: Question[] = [
	{
		id: 1,
		title: "Which generation do you belong to?",
		type: "single",
		options: [
			{ 
				id: 'Baby Boomers', 
				label: "Baby Boomers", 
				years: "1946-1964", 
				emoji: "👔",
				color: "from-amber-400 to-orange-400"
			},
			{ 
				id: 'Gen X', 
				label: "Generation X", 
				years: "1965-1980", 
				emoji: "💼",
				color: "from-red-400 to-pink-400"
			},
			{ 
				id: 'Millennials', 
				label: "Millennials", 
				years: "1981-1996", 
				emoji: "💻",
				color: "from-green-400 to-emerald-400"
			},
			{ 
				id: 'Gen Z', 
				label: "Gen Z", 
				years: "1997-2012", 
				emoji: "📱",
				color: "from-blue-400 to-indigo-400"
			}
		]
	},
	{
		id: 2,
		title: "Welcome & Visitor Interaction",
		subtitle: "Client Contact Point",
		type: "single",
		options: [
			{
				id: 'vibrant_lounge',
				label: "Vibrant Co-working Lounge",
				description: "Barista bar, informal seating, social buzz",
				emoji: "☕",
				color: "from-yellow-400 to-orange-400",
				values: { collaboration: 9, formality: 2, tech: 7, wellness: 6 }
			},
			{
				id: 'classic_reception',
				label: "Classic Reception",
				description: "Formal seating and discreet waiting lounge",
				emoji: "🏛️",
				color: "from-gray-400 to-slate-600",
				values: { collaboration: 3, formality: 9, tech: 4, wellness: 5 }
			}
		]
	},
	{
		id: 3,
		title: "Workspace Selection",
		subtitle: "Choose Where to Work",
		type: "single",
		options: [
			{
				id: 'open_collaborative',
				label: "Open Collaborative Layout",
				description: "Hot desks and casual breakout areas",
				emoji: "🏢",
				color: "from-green-400 to-teal-400",
				values: { collaboration: 10, formality: 3, tech: 8, wellness: 7 }
			},
			{
				id: 'mixed_private',
				label: "Mixed Private Offices",
				description: "Formal segregation between spaces",
				emoji: "🚪",
				color: "from-blue-400 to-indigo-400",
				values: { collaboration: 4, formality: 8, tech: 5, wellness: 6 }
			}
		]
	},
	{
		id: 4,
		title: "Collaboration & Digital Interaction",
		subtitle: "Work Collaboration Setting",
		type: "single",
		options: [
			{
				id: 'tech_space',
				label: "Semi-open Tech Space",
				description: "Mobile surfaces and casual seating",
				emoji: "💡",
				color: "from-purple-400 to-pink-400",
				values: { collaboration: 8, formality: 4, tech: 10, wellness: 6 }
			},
			{
				id: 'meeting_room',
				label: "Enclosed Meeting Room",
				description: "Privacy frosting, fixed arrangement",
				emoji: "🔒",
				color: "from-red-400 to-rose-400",
				values: { collaboration: 6, formality: 8, tech: 7, wellness: 5 }
			}
		]
	},
	{
		id: 5,
		title: "Social Interaction",
		subtitle: "Connection Point",
		type: "single",
		options: [
			{
				id: 'kitchen_hub',
				label: "Shared Kitchen Hub",
				description: "Communal tables, social nooks",
				emoji: "🍽️",
				color: "from-amber-400 to-yellow-400",
				values: { collaboration: 10, formality: 2, tech: 4, wellness: 8 }
			},
			{
				id: 'library_corner',
				label: "Quiet Library Corner",
				description: "One-on-one or small-group chats",
				emoji: "📚",
				color: "from-slate-400 to-gray-400",
				values: { collaboration: 5, formality: 7, tech: 3, wellness: 7 }
			}
		]
	},
	{
		id: 6,
		title: "Midday Break",
		subtitle: "Rest & Recharge",
		type: "single",
		options: [
			{
				id: 'wellness_zone',
				label: "Wellness Zone",
				description: "Mindfulness/meditation capsule",
				emoji: "🧘",
				color: "from-cyan-400 to-blue-400",
				values: { collaboration: 2, formality: 5, tech: 3, wellness: 10 }
			},
			{
				id: 'games_lounge',
				label: "Games Lounge",
				description: "Digital gaming and recreation",
				emoji: "🎮",
				color: "from-pink-400 to-purple-400",
				values: { collaboration: 8, formality: 2, tech: 9, wellness: 7 }
			}
		]
	},
	{
		id: 7,
		title: "After Work Wellness",
		subtitle: "Health & Well-being",
		type: "single",
		options: [
			{
				id: 'fitness_studio',
				label: "Fitness Studio",
				description: "On-site gym with group classes",
				emoji: "💪",
				color: "from-orange-400 to-red-400",
				values: { collaboration: 7, formality: 3, tech: 5, wellness: 10 }
			},
			{
				id: 'green_terrace',
				label: "Green Terrace",
				description: "Outdoor seating, jogging track",
				emoji: "🌿",
				color: "from-emerald-400 to-green-400",
				values: { collaboration: 5, formality: 2, tech: 2, wellness: 10 }
			}
		]
	}
];

// Utility Functions

// Export essential constants only
export const TOTAL_QUESTIONS = questions.length;
export const GENERATION_OPTIONS: GenerationOption[] = ['Baby Boomers', 'Gen X', 'Millennials', 'Gen Z'];