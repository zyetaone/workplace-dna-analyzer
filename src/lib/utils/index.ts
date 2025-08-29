/**
 * Consolidated Utility Functions
 * All utility functions in one place for better organization
 */

// Re-export all utilities for easy importing
export * from '../components/charts/chart-config';
export * from './common';
export * from './id';
export * from './scoring';
export * from './validation';

// Bits UI utilities
export { mergeProps } from 'bits-ui';

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