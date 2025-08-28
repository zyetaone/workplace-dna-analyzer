import type { Participant } from '$lib/types';

const countBy = <T>(arr: T[], fn: (item: T) => string) =>
	arr.reduce((acc, item) => {
		const key = fn(item);
		acc[key] = (acc[key] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

export function calculateSessionAnalytics(participants: Participant[]) {
	const completedCount = participants.filter(p => p.completed).length;
	const total = participants.length;
	
	return {
		activeCount: total - completedCount,
		completedCount,
		totalCount: total,
		responseRate: total > 0 ? Math.round((completedCount / total) * 100) : 0
	};
}

export function calculateGenerationData(participants: Participant[]) {
	const genCount = countBy(participants, p => p.generation || 'Unknown');
	const total = participants.length;
	
	return Object.entries(genCount).map(([generation, count]) => ({
		label: generation,
		value: count,
		percentage: total > 0 ? Math.round((count / total) * 100) : 0
	}));
}

export function calculatePreferenceAverages(participants: Participant[]) {
	const completed = participants.filter(p => p.completed && p.preferenceScores);
	
	if (completed.length === 0) {
		return { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
	}
	
	const totals = completed.reduce((acc, p) => {
		const scores = p.preferenceScores!;
		return {
			collaboration: acc.collaboration + (scores.collaboration || 0),
			formality: acc.formality + (scores.formality || 0),
			tech: acc.tech + (scores.tech || 0),
			wellness: acc.wellness + (scores.wellness || 0)
		};
	}, { collaboration: 0, formality: 0, tech: 0, wellness: 0 });
	
	const len = completed.length;
	return {
		collaboration: Math.round(totals.collaboration / len),
		formality: Math.round(totals.formality / len),
		tech: Math.round(totals.tech / len),
		wellness: Math.round(totals.wellness / len)
	};
}

export function generateWordCloud(participants: Participant[]) {
	const concepts = {
		'Collaboration': ['team', 'together', 'group', 'collaborative', 'open'],
		'Remote Work': ['remote', 'home', 'flexible', 'hybrid', 'virtual'],
		'Innovation': ['creative', 'innovative', 'ideas', 'brainstorm', 'new'],
		'Wellness': ['wellness', 'health', 'balance', 'mindful', 'wellbeing'],
		'Technology': ['tech', 'digital', 'software', 'tools', 'automation'],
		'Structure': ['process', 'organized', 'systematic', 'formal', 'planned']
	};
	
	const wordFreq: Record<string, number> = {};
	
	participants.forEach(p => 
		Object.values(p.responses || {}).forEach(response => {
			if (typeof response !== 'string') return;
			response.toLowerCase().split(/\s+/).forEach(word => {
				for (const [concept, keywords] of Object.entries(concepts)) {
					if (keywords.includes(word)) {
						wordFreq[concept] = (wordFreq[concept] || 0) + 1;
						return;
					}
				}
				if (word.length > 3) wordFreq[word] = (wordFreq[word] || 0) + 1;
			});
		})
	);
	
	return Object.entries(wordFreq)
		.sort(([,a], [,b]) => b - a)
		.slice(0, 20)
		.map(([text, count]) => ({ text, size: Math.min(40, 10 + count * 3), count }));
}

export function generateAIInsights(participants: Participant[]) {
	const completed = participants.filter(p => p.completed);
	if (!completed.length) return ['Waiting for participants to complete the survey...'];
	
	const scores = calculatePreferenceAverages(participants);
	
	const scoreInsights = [
		[scores.collaboration >= 7, "Strong collaborative preference. Consider open spaces and team areas."],
		[scores.collaboration <= 3, "Values independent work. Focus on private workspaces and quiet zones."],
		[scores.tech >= 7, "Highly tech-savvy workforce. Invest in cutting-edge digital tools."],
		[scores.tech <= 3, "Prefers traditional methods. Balance technology introductions carefully."],
		[scores.wellness >= 7, "Wellness priority. Add wellness rooms and ergonomic furniture."],
		[scores.formality >= 7, "Appreciates structure. Maintain clear hierarchies and meeting spaces."],
		[scores.formality <= 3, "Thrives in flexibility. Consider hot-desking and informal areas."]
	];
	
	const insights = scoreInsights.filter(([condition]) => condition).map(([, insight]) => insight as string);
	
	const genCounts = countBy(participants, p => p.generation || 'Unknown');
	const dominantGen = Object.entries(genCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
	
	const genInsights: Record<string, string> = {
		'Gen Z': "Gen Z majority: prioritize digital-first solutions and flexibility.",
		'Millennial': "Millennial workforce values work-life balance and collaborative tech.",
		'Gen X': "Gen X employees appreciate autonomy and efficiency-focused workspaces.",
		'Baby Boomer': "Balance digital tools with traditional face-to-face communication."
	};
	
	if (genInsights[dominantGen]) insights.push(genInsights[dominantGen]);
	
	return insights.length < 3 ? [...insights, "Continue gathering responses for detailed insights."] : insights;
}