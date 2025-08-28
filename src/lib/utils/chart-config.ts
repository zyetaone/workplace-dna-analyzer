/**
 * Chart Configuration Utilities
 * Simplified color schemes and data formatting for charts
 */

// Chart configuration interface
export interface ChartConfig {
	type: 'radar' | 'donut' | 'bar' | 'line';
	data: any;
	options?: any;
}

// Color schemes for consistent theming across all charts
export const chartColors = {
	// Preference categories
	collaboration: '#3b82f6', // Blue
	formality: '#f59e0b',     // Amber
	tech: '#22c55e',          // Green
	wellness: '#ef4444',      // Red
	
	// Generation categories
	generations: {
		'Baby Boomer': '#9333ea', // Purple
		'Gen X': '#3b82f6',       // Blue
		'Millennial': '#22c55e',  // Green
		'Gen Z': '#fb923c'        // Orange
	},
	
	// Status colors
	completed: '#10b981',     // Green
	inProgress: '#fbbf24',    // Amber
	pending: '#6b7280'        // Gray
};

/**
 * Creates Chart.js compatible radar chart data structure
 */
export function createRadarData(scores: Record<string, number>, label = 'Preferences') {
	const labels = Object.keys(scores).map(key => 
		key.charAt(0).toUpperCase() + key.slice(1)
	);
	const values = Object.values(scores);
	
	return {
		data: {
			labels,
			datasets: [{
				label,
				data: values,
				backgroundColor: 'rgba(59, 130, 246, 0.4)', // Blue with opacity
				borderColor: '#3b82f6',
				borderWidth: 2
			}]
		}
	};
}

/**
 * Creates Chart.js compatible donut chart data structure
 */
export function createDonutData(data: Record<string, number>, colorMap?: Record<string, string>) {
	const labels = Object.keys(data);
	const values = Object.values(data);
	
	// Use provided colors or generate defaults
	const colors = labels.map(label => 
		colorMap?.[label] || chartColors.generations[label as keyof typeof chartColors.generations] || '#6b7280'
	);
	
	return {
		data: {
			labels,
			datasets: [{
				data: values,
				backgroundColor: colors
			}]
		}
	};
}