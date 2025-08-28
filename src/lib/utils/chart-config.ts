/**
 * Simplified Chart Configuration Utilities
 * Direct Chart.js configurations without over-abstraction
 */

import type { PreferenceScores } from '$lib/types';
// Chart configuration type based on Chart.svelte implementation
export type ChartConfig = {
	type: 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
	data: {
		labels: string[];
		datasets: Array<{
			data: number[];
			backgroundColor?: string[];
			borderColor?: string[];
			label?: string;
		}>;
	};
	options?: any;
};

// Preference colors
const preferenceColors = {
	collaboration: '#3b82f6', // Blue
	formality: '#f59e0b',     // Amber  
	technology: '#22c55e',    // Green
	wellness: '#ef4444'       // Red
};

// Generation colors
const generationColors = {
	'Baby Boomer': '#9333ea',  // Purple
	'Gen X': '#3b82f6',       // Blue
	'Millennial': '#22c55e',  // Green
	'Gen Z': '#fb923c'        // Orange
};

/**
 * Creates a bar chart for preference scores
 */
export function createChartConfig(scores: PreferenceScores): ChartConfig {
	return {
		type: 'bar',
		data: {
			labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
			datasets: [{
				label: 'Average Score',
				data: [scores.collaboration, scores.formality, scores.tech, scores.wellness],
				backgroundColor: [
					preferenceColors.collaboration + '80',
					preferenceColors.formality + '80', 
					preferenceColors.technology + '80',
					preferenceColors.wellness + '80'
				],
				borderColor: [
					preferenceColors.collaboration,
					preferenceColors.formality,
					preferenceColors.technology, 
					preferenceColors.wellness
				]
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false
				}
			},
			scales: {
				y: {
					beginAtZero: true,
					max: 10
				}
			}
		}
	};
}

/**
 * Creates a radar chart for preference scores
 */
export function createPreferenceRadarConfig(scores: PreferenceScores): ChartConfig {
	return {
		type: 'radar',
		data: {
			labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
			datasets: [{
				label: 'Team Preferences',
				data: [scores.collaboration, scores.formality, scores.tech, scores.wellness],
				backgroundColor: ['#3b82f640'],
				borderColor: ['#3b82f6']
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false
				}
			},
			scales: {
				r: {
					beginAtZero: true,
					max: 10,
					ticks: {
						display: false
					},
					grid: {
						color: '#e5e7eb'
					}
				}
			}
		}
	};
}

/**
 * Creates a doughnut chart for generation distribution
 */
export function createGenerationChartConfig(distribution: Record<string, number>): ChartConfig {
	const labels = Object.keys(distribution);
	const data = Object.values(distribution);
	
	const colors = labels.map(label => {
		const color = generationColors[label as keyof typeof generationColors];
		return color || '#6b7280'; // Gray fallback
	});
	
	return {
		type: 'doughnut',
		data: {
			labels,
			datasets: [{
				data,
				backgroundColor: colors.map(c => c + '80'),
				borderColor: colors
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			cutout: '60%',
			plugins: {
				legend: {
					display: true,
					position: 'bottom'
				}
			}
		}
	};
}