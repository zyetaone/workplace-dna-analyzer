/**
 * Chart Configuration Utilities
 * 
 * Provides typed factory functions for creating Chart.js configurations with
 * consistent theming, styling, and behavior across the application.
 * 
 * Features:
 * - Type-safe chart configurations
 * - Consistent color schemes and themes
 * - Reusable formatters and callbacks
 * - Chart preset system for common use cases
 * - DRY principle implementation
 */

import type { ChartConfiguration, TooltipItem, ChartOptions, Plugin } from 'chart.js';
import type { PreferenceScores } from '$lib/types';

// ============================================================================
// Core Types & Interfaces
// ============================================================================

/**
 * Supported chart types with their specific configurations
 */
export type ChartType = 'bar' | 'radar' | 'doughnut' | 'pie' | 'line' | 'polarArea';

/**
 * Theme configuration for consistent styling
 */
export interface ChartTheme {
	colors: {
		primary: string[];
		secondary: string[];
		gradients: string[];
	};
	fonts: {
		size: {
			small: number;
			medium: number;
			large: number;
		};
		family: string;
	};
	spacing: {
		padding: number;
		margin: number;
	};
}

/**
 * Chart preset configuration
 */
export interface ChartPreset {
	responsive: boolean;
	maintainAspectRatio: boolean;
	plugins: {
		legend: boolean;
		tooltip: boolean;
		title: boolean;
	};
	animation: boolean;
}

/**
 * Custom chart configuration options
 */
export interface ChartConfigOptions {
	theme?: Partial<ChartTheme>;
	preset?: Partial<ChartPreset>;
	customOptions?: Partial<ChartOptions>;
	plugins?: Plugin[];
}

// ============================================================================
// Theme System
// ============================================================================

/**
 * Default application theme for charts
 */
export const DEFAULT_THEME: ChartTheme = {
	colors: {
		primary: [
			'rgba(59, 130, 246, 0.8)',   // Blue
			'rgba(245, 158, 11, 0.8)',   // Amber
			'rgba(34, 197, 94, 0.8)',    // Green
			'rgba(239, 68, 68, 0.8)',    // Red
			'rgba(147, 51, 234, 0.8)',   // Purple
			'rgba(251, 146, 60, 0.8)',   // Orange
		],
		secondary: [
			'rgb(59, 130, 246)',         // Blue border
			'rgb(245, 158, 11)',         // Amber border
			'rgb(34, 197, 94)',          // Green border
			'rgb(239, 68, 68)',          // Red border
			'rgb(147, 51, 234)',         // Purple border
			'rgb(251, 146, 60)',         // Orange border
		],
		gradients: [
			'rgba(59, 130, 246, 0.2)',   // Light blue
			'rgba(245, 158, 11, 0.2)',   // Light amber
			'rgba(34, 197, 94, 0.2)',    // Light green
			'rgba(239, 68, 68, 0.2)',    // Light red
			'rgba(147, 51, 234, 0.2)',   // Light purple
			'rgba(251, 146, 60, 0.2)',   // Light orange
		]
	},
	fonts: {
		size: {
			small: 10,
			medium: 12,
			large: 14
		},
		family: 'Inter, system-ui, sans-serif'
	},
	spacing: {
		padding: 15,
		margin: 10
	}
};

/**
 * Workplace preference-specific color scheme
 */
export const PREFERENCE_COLORS = {
	collaboration: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' },
	formality: { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)' },
	technology: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
	wellness: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' }
};

/**
 * Generation-specific color scheme
 */
export const GENERATION_COLORS = {
	'Baby Boomer': { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgb(147, 51, 234)' },
	'Gen X': { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' },
	'Millennial': { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
	'Gen Z': { bg: 'rgba(251, 146, 60, 0.8)', border: 'rgb(251, 146, 60)' }
};

// ============================================================================
// Chart Presets
// ============================================================================

/**
 * Default preset for responsive charts
 */
export const DEFAULT_PRESET: ChartPreset = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: true,
		tooltip: true,
		title: false
	},
	animation: true
};

/**
 * Minimal preset for embedded charts
 */
export const MINIMAL_PRESET: ChartPreset = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: false,
		tooltip: true,
		title: false
	},
	animation: false
};

/**
 * Dashboard preset for analytics charts
 */
export const DASHBOARD_PRESET: ChartPreset = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: false,
		tooltip: true,
		title: false
	},
	animation: true
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Merges theme configurations with defaults
 */
function mergeTheme(customTheme?: Partial<ChartTheme>): ChartTheme {
	if (!customTheme) return DEFAULT_THEME;

	return {
		colors: { ...DEFAULT_THEME.colors, ...customTheme.colors },
		fonts: { ...DEFAULT_THEME.fonts, ...customTheme.fonts },
		spacing: { ...DEFAULT_THEME.spacing, ...customTheme.spacing }
	};
}

/**
 * Merges preset configurations with defaults
 */
function mergePreset(customPreset?: Partial<ChartPreset>): ChartPreset {
	if (!customPreset) return DEFAULT_PRESET;

	return {
		...DEFAULT_PRESET,
		...customPreset,
		plugins: { ...DEFAULT_PRESET.plugins, ...customPreset.plugins }
	};
}

/**
 * Creates standardized tooltip formatter for scores (0-10 scale)
 */
export function createScoreTooltipFormatter() {
	return {
		label: (context: TooltipItem<any>) => {
			return `${context.label}: ${context.formattedValue}/10`;
		}
	};
}

/**
 * Creates standardized tooltip formatter for percentages
 */
export function createPercentageTooltipFormatter() {
	return {
		label: (context: TooltipItem<any>) => {
			const dataset = context.dataset;
			const total = (dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
			const value = context.parsed || 0;
			const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
			return `${context.label}: ${value} (${percentage}%)`;
		}
	};
}

/**
 * Creates common chart options with theme and preset
 */
function createBaseOptions(
	theme: ChartTheme,
	preset: ChartPreset,
	customOptions?: Partial<ChartOptions>
): ChartOptions {
	const baseOptions: ChartOptions = {
		responsive: preset.responsive,
		maintainAspectRatio: preset.maintainAspectRatio,
		animation: preset.animation as false | any,
		plugins: {
			legend: {
				display: preset.plugins.legend,
				position: 'bottom',
				labels: {
					padding: theme.spacing.padding,
					font: {
						size: theme.fonts.size.medium,
						family: theme.fonts.family
					}
				}
			},
			tooltip: {
				enabled: preset.plugins.tooltip,
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
				titleColor: 'white',
				bodyColor: 'white',
				borderColor: 'rgba(255, 255, 255, 0.1)',
				borderWidth: 1,
				cornerRadius: 8,
				displayColors: true
			},
			title: {
				display: preset.plugins.title,
				font: {
					size: theme.fonts.size.large,
					family: theme.fonts.family
				}
			}
		}
	};

	// Merge with custom options if provided
	if (customOptions) {
		return mergeDeep(baseOptions, customOptions);
	}

	return baseOptions;
}

/**
 * Deep merge utility for chart options
 */
function mergeDeep(target: any, source: any): any {
	const result = { ...target };

	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
			result[key] = mergeDeep(target[key] || {}, source[key]);
		} else {
			result[key] = source[key];
		}
	}

	return result;
}

// ============================================================================
// Chart Factory Functions
// ============================================================================

/**
 * Creates a bar chart configuration for preference scores
 */
export function createBarChartConfig(
	scores: PreferenceScores,
	options?: ChartConfigOptions
): ChartConfiguration {
	const theme = mergeTheme(options?.theme);
	const preset = mergePreset(options?.preset);

	const labels = ['Collaboration', 'Formality', 'Technology', 'Wellness'];
	const data = [scores.collaboration, scores.formality, scores.tech, scores.wellness];

	const baseOptions = createBaseOptions(theme, preset, options?.customOptions);

	return {
		type: 'bar',
		data: {
			labels,
			datasets: [{
				label: 'Average Score',
				data,
				backgroundColor: Object.values(PREFERENCE_COLORS).map(color => color.bg),
				borderColor: Object.values(PREFERENCE_COLORS).map(color => color.border),
				borderWidth: 1,
				borderRadius: 4,
				borderSkipped: false
			}]
		},
		options: {
			...baseOptions,
			scales: {
				y: {
					beginAtZero: true,
					max: 10,
					ticks: {
						stepSize: 2,
						font: {
							size: theme.fonts.size.medium,
							family: theme.fonts.family
						}
					},
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					}
				},
				x: {
					ticks: {
						font: {
							size: theme.fonts.size.medium,
							family: theme.fonts.family
						}
					},
					grid: {
						display: false
					}
				}
			},
			plugins: {
				...baseOptions.plugins,
				tooltip: {
					...baseOptions.plugins?.tooltip,
					callbacks: createScoreTooltipFormatter()
				}
			}
		},
		plugins: options?.plugins
	};
}

/**
 * Creates a radar chart configuration for preference scores
 */
export function createRadarChartConfig(
	scores: PreferenceScores,
	options?: ChartConfigOptions
): ChartConfiguration {
	const theme = mergeTheme(options?.theme);
	const preset = mergePreset(options?.preset);

	const labels = ['Collaboration', 'Formality', 'Technology', 'Wellness'];
	const data = [scores.collaboration, scores.formality, scores.tech, scores.wellness];

	const baseOptions = createBaseOptions(theme, preset, options?.customOptions);

	return {
		type: 'radar',
		data: {
			labels,
			datasets: [{
				label: 'Team Preferences',
				data,
				backgroundColor: theme.colors.gradients[0],
				borderColor: theme.colors.secondary[0],
				pointBackgroundColor: theme.colors.secondary[0],
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: theme.colors.secondary[0],
				pointRadius: 6,
				pointHoverRadius: 8,
				borderWidth: 2
			}]
		},
		options: {
			...baseOptions,
			scales: {
				r: {
					min: 0,
					max: 10,
					ticks: {
						stepSize: 2,
						backdropColor: 'transparent',
						color: 'rgba(0, 0, 0, 0.7)',
						font: {
							size: theme.fonts.size.small,
							family: theme.fonts.family
						}
					},
					pointLabels: {
						font: {
							size: theme.fonts.size.medium,
							family: theme.fonts.family
						},
						color: 'rgba(0, 0, 0, 0.8)'
					},
					grid: {
						color: 'rgba(0, 0, 0, 0.1)'
					},
					angleLines: {
						color: 'rgba(0, 0, 0, 0.1)'
					}
				}
			},
			plugins: {
				...baseOptions.plugins,
				tooltip: {
					...baseOptions.plugins?.tooltip,
					callbacks: createScoreTooltipFormatter()
				}
			}
		},
		plugins: options?.plugins
	};
}

/**
 * Creates a doughnut chart configuration for generation distribution
 */
export function createDoughnutChartConfig(
	distribution: Record<string, number>,
	options?: ChartConfigOptions
): ChartConfiguration {
	const theme = mergeTheme(options?.theme);
	const preset = mergePreset(options?.preset);

	const labels = Object.keys(distribution);
	const data = Object.values(distribution);

	// Use generation-specific colors if available, fall back to theme colors
	const backgroundColors: string[] = [];
	const borderColors: string[] = [];

	labels.forEach((label, index) => {
		const genColor = GENERATION_COLORS[label as keyof typeof GENERATION_COLORS];
		if (genColor) {
			backgroundColors.push(genColor.bg);
			borderColors.push(genColor.border);
		} else {
			backgroundColors.push(theme.colors.primary[index % theme.colors.primary.length]);
			borderColors.push(theme.colors.secondary[index % theme.colors.secondary.length]);
		}
	});

	const baseOptions = createBaseOptions(theme, preset, options?.customOptions);

	return {
		type: 'doughnut',
		data: {
			labels,
			datasets: [{
				data,
				backgroundColor: backgroundColors,
				borderColor: borderColors,
				borderWidth: 2,
				hoverOffset: 8
			}]
		},
		options: {
			...baseOptions,
			...(baseOptions as any),
			cutout: '60%',
			plugins: {
				...baseOptions.plugins,
				legend: {
					...baseOptions.plugins?.legend,
					display: true,
					position: 'bottom'
				},
				tooltip: {
					...baseOptions.plugins?.tooltip,
					callbacks: createPercentageTooltipFormatter()
				}
			}
		},
		plugins: options?.plugins
	};
}

/**
 * Creates a pie chart configuration for distribution data
 */
export function createPieChartConfig(
	distribution: Record<string, number>,
	options?: ChartConfigOptions
): ChartConfiguration {
	const config = createDoughnutChartConfig(distribution, options);
	config.type = 'pie';
	if (config.options) {
		delete (config.options as any).cutout;
	}
	return config;
}

/**
 * Creates a polar area chart configuration for preference visualization
 */
export function createPolarAreaChartConfig(
	scores: PreferenceScores,
	options?: ChartConfigOptions
): ChartConfiguration {
	const theme = mergeTheme(options?.theme);
	const preset = mergePreset(options?.preset);

	const labels = ['Collaboration', 'Formality', 'Technology', 'Wellness'];
	const data = [scores.collaboration, scores.formality, scores.tech, scores.wellness];

	const baseOptions = createBaseOptions(theme, preset, options?.customOptions);

	return {
		type: 'polarArea',
		data: {
			labels,
			datasets: [{
				data,
				backgroundColor: Object.values(PREFERENCE_COLORS).map(color => color.bg),
				borderColor: Object.values(PREFERENCE_COLORS).map(color => color.border),
				borderWidth: 2
			}]
		},
		options: {
			...baseOptions,
			scales: {
				r: {
					min: 0,
					max: 10,
					ticks: {
						stepSize: 2,
						backdropColor: 'transparent',
						font: {
							size: theme.fonts.size.small,
							family: theme.fonts.family
						}
					}
				}
			},
			plugins: {
				...baseOptions.plugins,
				tooltip: {
					...baseOptions.plugins?.tooltip,
					callbacks: createScoreTooltipFormatter()
				}
			}
		},
		plugins: options?.plugins
	};
}

// ============================================================================
// Convenience Functions (Backward Compatibility)
// ============================================================================

/**
 * @deprecated Use createBarChartConfig instead
 * Creates a bar chart configuration for preference scores (backward compatibility)
 */
export function createChartConfig(scores: PreferenceScores): ChartConfiguration {
	return createBarChartConfig(scores, { preset: DASHBOARD_PRESET });
}

/**
 * @deprecated Use createRadarChartConfig instead
 * Creates a radar chart configuration for preference scores (backward compatibility)
 */
export function createPreferenceRadarConfig(scores: PreferenceScores): ChartConfiguration {
	return createRadarChartConfig(scores, { preset: DASHBOARD_PRESET });
}

/**
 * @deprecated Use createDoughnutChartConfig instead
 * Creates a generation distribution chart configuration (backward compatibility)
 */
export function createGenerationChartConfig(distribution: Record<string, number>): ChartConfiguration {
	return createDoughnutChartConfig(distribution, { preset: DASHBOARD_PRESET });
}

// ============================================================================
// Chart Preset Factories
// ============================================================================

/**
 * Creates a chart configuration using a specific preset
 */
export function createChartWithPreset(
	type: ChartType,
	data: PreferenceScores | Record<string, number>,
	presetName: 'default' | 'minimal' | 'dashboard' = 'default',
	customOptions?: ChartConfigOptions
): ChartConfiguration {
	const preset = presetName === 'minimal' ? MINIMAL_PRESET :
		presetName === 'dashboard' ? DASHBOARD_PRESET : DEFAULT_PRESET;

	const options: ChartConfigOptions = {
		preset,
		...customOptions
	};

	if (type === 'bar' && 'collaboration' in data) {
		return createBarChartConfig(data as PreferenceScores, options);
	} else if (type === 'radar' && 'collaboration' in data) {
		return createRadarChartConfig(data as PreferenceScores, options);
	} else if (type === 'doughnut') {
		return createDoughnutChartConfig(data as Record<string, number>, options);
	} else if (type === 'pie') {
		return createPieChartConfig(data as Record<string, number>, options);
	} else if (type === 'polarArea' && 'collaboration' in data) {
		return createPolarAreaChartConfig(data as PreferenceScores, options);
	}

	throw new Error(`Unsupported chart type: ${type} with provided data structure`);
}

// ============================================================================
// Additional Exports 
// ============================================================================
// All types are already exported as interfaces above