/**
 * Consolidated Utility Functions
 * Single import point for all utility functions
 */

// Chart Configuration Utilities
export * from '../components/charts/chart-config';

// Common Utilities
export * from './common';

// ID Generation Utilities
export * from './id';

// Scoring Utilities
export * from './scoring';

// Common types used across utilities
export interface ChartConfig {
	type: 'radar' | 'donut' | 'bar' | 'line';
	data: any;
	options?: any;
}

export interface PreferenceScores {
	collaboration: number;
	formality: number;
	tech: number;
	wellness: number;
}

// Utility function to get all available utilities
export const utils = {
	// Chart utilities
	chartColors: () => import('../components/charts/chart-config').then(m => m.chartColors),
	createRadarData: () => import('../components/charts/chart-config').then(m => m.createRadarData),
	createDonutData: () => import('../components/charts/chart-config').then(m => m.createDonutData),

	// Common utilities
	formatDate: () => import('./common').then(m => m.formatDate),
	copyToClipboard: () => import('./common').then(m => m.copyToClipboard),
	copyParticipantLink: () => import('./common').then(m => m.copyParticipantLink),

	// ID utilities
	generateId: () => import('./id').then(m => m.generateId),
	generateSessionCode: () => import('./id').then(m => m.generateSessionCode),

	// Scoring utilities
	calculatePreferenceScores: () => import('./scoring').then(m => m.calculatePreferenceScores),
	getWorkplaceDNA: () => import('./scoring').then(m => m.getWorkplaceDNA),
};