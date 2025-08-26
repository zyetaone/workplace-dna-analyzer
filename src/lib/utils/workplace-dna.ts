/**
 * Utility functions for consistent workplace DNA generation
 */

import type { PreferenceScores } from '$lib/types';

/**
 * Generate workplace DNA string from preference scores
 * This ensures consistent DNA generation across the application
 */
export function generateWorkplaceDNA(scores: PreferenceScores): string {
	const { collaboration, formality, wellness } = scores;
	// Handle both 'technology' and 'tech' property names
	const technology = scores.technology ?? scores.tech ?? 0;
	
	const traits: string[] = [];
	
	// Collaboration dimension
	if (collaboration >= 7) traits.push('Collaborative');
	else if (collaboration >= 4) traits.push('Balanced');
	else traits.push('Independent');
	
	// Formality dimension  
	if (formality >= 7) traits.push('Structured');
	else if (formality >= 4) traits.push('Flexible');
	else traits.push('Casual');
	
	// Technology dimension
	if (technology >= 7) traits.push('Digital-First');
	else if (technology >= 4) traits.push('Tech-Enabled');
	else traits.push('Traditional');
	
	// Wellness dimension
	if (wellness >= 7) traits.push('Wellness-Focused');
	else if (wellness >= 4) traits.push('Balance-Aware');
	else traits.push('Performance-Driven');
	
	return traits.join(' · ');
}

/**
 * Calculate average preference scores from multiple attendees
 */
export function calculateAverageScores(attendees: any[]): PreferenceScores {
	if (attendees.length === 0) {
		return { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
	}
	
	const totals = attendees.reduce((acc, attendee) => {
		const scores = attendee.preferenceScores;
		if (scores) {
			acc.collaboration += scores.collaboration || 0;
			acc.formality += scores.formality || 0;
			acc.technology += scores.technology || scores.tech || 0;
			acc.wellness += scores.wellness || 0;
		}
		return acc;
	}, { collaboration: 0, formality: 0, technology: 0, wellness: 0 });
	
	const multiplier = 1 / attendees.length;
	
	return {
		collaboration: Math.round(totals.collaboration * multiplier),
		formality: Math.round(totals.formality * multiplier),
		technology: Math.round(totals.technology * multiplier),
		wellness: Math.round(totals.wellness * multiplier)
	};
}

/**
 * Get conceptual color for word cloud terms
 */
export function getConceptualColor(text: string): string {
	const colorMap: Record<string, string> = {
		// DNA Components
		'Collaborative': '#3b82f6',
		'Balanced': '#6366f1',
		'Independent': '#8b5cf6',
		'Structured': '#f59e0b',
		'Flexible': '#eab308',
		'Casual': '#84cc16',
		'Digital-First': '#10b981',
		'Tech-Enabled': '#14b8a6',
		'Traditional': '#06b6d4',
		'Wellness-Focused': '#ef4444',
		'Balance-Aware': '#f97316',
		'Performance-Driven': '#dc2626',
		
		// Preference dimensions
		'Technology': '#10b981',
		'Wellness': '#ef4444',
		'Collaboration': '#3b82f6',
		'Formality': '#f59e0b',
		'Structure': '#f59e0b',
		
		// Generations
		'Millennial': '#8b5cf6',
		'Gen Z': '#ec4899',
		'Gen X': '#6366f1',
		'Baby Boomer': '#14b8a6',
		
		// Workspace concepts
		'Smart Office': '#8b5cf6',
		'Open Space': '#3b82f6',
		'Focus Zones': '#6366f1',
		'Biophilic': '#10b981',
		'Ergonomic': '#ef4444',
		'Sustainable': '#84cc16',
		'Innovation': '#f59e0b',
		'Culture': '#ec4899'
	};
	
	return colorMap[text] || '#6b7280';
}