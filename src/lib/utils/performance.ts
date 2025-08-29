/**
 * Performance Monitoring Utilities
 * Provides comprehensive performance tracking for the PPT Quiz App
 */

import { browser } from '$app/environment';

// Performance metrics storage
let metrics: PerformanceMetrics = {
	componentRenders: new Map(),
	apiCalls: [],
	memoryUsage: [],
	navigationTiming: null,
	resourceTiming: [],
	largestContentfulPaint: null,
	firstInput: null,
	cumulativeLayoutShift: 0
};

interface PerformanceMetrics {
	componentRenders: Map<string, ComponentRenderMetric[]>;
	apiCalls: ApiCallMetric[];
	memoryUsage: MemoryMetric[];
	navigationTiming: PerformanceNavigationTiming | null;
	resourceTiming: PerformanceResourceTiming[];
	largestContentfulPaint: PerformanceEntry | null;
	firstInput: PerformanceEventTiming | null;
	cumulativeLayoutShift: number;
}

interface ComponentRenderMetric {
	componentName: string;
	renderTime: number;
	timestamp: number;
	propsCount: number;
}

interface ApiCallMetric {
	url: string;
	method: string;
	duration: number;
	status: number;
	timestamp: number;
	size: number;
}

interface MemoryMetric {
	used: number;
	total: number;
	timestamp: number;
}

// Component render time tracking
export function trackComponentRender(
	componentName: string,
	renderTime: number,
	propsCount: number = 0
) {
	if (!browser) return;

	const metric: ComponentRenderMetric = {
		componentName,
		renderTime,
		timestamp: Date.now(),
		propsCount
	};

	if (!metrics.componentRenders.has(componentName)) {
		metrics.componentRenders.set(componentName, []);
	}

	const componentMetrics = metrics.componentRenders.get(componentName)!;
	componentMetrics.push(metric);

	// Keep only last 100 metrics per component
	if (componentMetrics.length > 100) {
		componentMetrics.shift();
	}

	// Log slow renders
	if (renderTime > 16) {
		// More than one frame
		console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
	}
}

// API call tracking
export function trackApiCall(
	url: string,
	method: string,
	startTime: number,
	endTime: number,
	status: number,
	responseSize: number = 0
) {
	if (!browser) return;

	const metric: ApiCallMetric = {
		url,
		method,
		duration: endTime - startTime,
		status,
		timestamp: Date.now(),
		size: responseSize
	};

	metrics.apiCalls.push(metric);

	// Keep only last 100 API calls
	if (metrics.apiCalls.length > 100) {
		metrics.apiCalls.shift();
	}

	// Log slow API calls
	if (metric.duration > 1000) {
		// More than 1 second
		console.warn(`Slow API call: ${method} ${url} took ${metric.duration}ms`);
	}
}

// Memory usage tracking
export function trackMemoryUsage() {
	if (!browser) return;

	// Use performance.memory if available (Chrome/Edge), otherwise skip
	const memory = (performance as any).memory;
	if (!memory) return;

	const metric: MemoryMetric = {
		used: memory.usedJSHeapSize,
		total: memory.totalJSHeapSize,
		timestamp: Date.now()
	};

	metrics.memoryUsage.push(metric);

	// Keep only last 50 memory measurements
	if (metrics.memoryUsage.length > 50) {
		metrics.memoryUsage.shift();
	}

	// Log high memory usage
	const usagePercent = (metric.used / metric.total) * 100;
	if (usagePercent > 80) {
		console.warn(
			`High memory usage: ${usagePercent.toFixed(1)}% (${(metric.used / 1024 / 1024).toFixed(1)}MB)`
		);
	}
}

// Web Vitals tracking
export function initWebVitalsTracking() {
	if (!browser) return;

	// Largest Contentful Paint
	if ('PerformanceObserver' in window) {
		const lcpObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const lastEntry = entries[entries.length - 1];
			metrics.largestContentfulPaint = lastEntry;
		});
		lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

		// First Input Delay
		const fidObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			entries.forEach((entry) => {
				const eventEntry = entry as PerformanceEventTiming;
				if (
					!metrics.firstInput ||
					eventEntry.processingStart < metrics.firstInput.processingStart
				) {
					metrics.firstInput = eventEntry;
				}
			});
		});
		fidObserver.observe({ entryTypes: ['first-input'] });

		// Cumulative Layout Shift
		const clsObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			entries.forEach((entry) => {
				const layoutEntry = entry as any;
				if (!layoutEntry.hadRecentInput) {
					metrics.cumulativeLayoutShift += layoutEntry.value;
				}
			});
		});
		clsObserver.observe({ entryTypes: ['layout-shift'] });
	}

	// Navigation timing
	if (performance.getEntriesByType) {
		const navigationEntries = performance.getEntriesByType(
			'navigation'
		) as PerformanceNavigationTiming[];
		if (navigationEntries.length > 0) {
			metrics.navigationTiming = navigationEntries[0];
		}
	}
}

// Performance report generation
export function generatePerformanceReport(): PerformanceReport {
	const componentStats = calculateComponentStats();
	const apiStats = calculateApiStats();
	const memoryStats = calculateMemoryStats();
	const webVitals = getWebVitals();

	return {
		timestamp: Date.now(),
		components: componentStats,
		api: apiStats,
		memory: memoryStats,
		webVitals,
		recommendations: generateRecommendations(componentStats, apiStats, memoryStats)
	};
}

function calculateComponentStats() {
	const stats: Record<string, ComponentStats> = {};

	metrics.componentRenders.forEach((componentMetrics, componentName) => {
		if (componentMetrics.length === 0) return;

		const renderTimes = componentMetrics.map((m) => m.renderTime);
		const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
		const maxRenderTime = Math.max(...renderTimes);
		const slowRenders = renderTimes.filter((time) => time > 16).length;

		stats[componentName] = {
			averageRenderTime: avgRenderTime,
			maxRenderTime,
			totalRenders: componentMetrics.length,
			slowRenders,
			slowRenderPercentage: (slowRenders / componentMetrics.length) * 100
		};
	});

	return stats;
}

function calculateApiStats() {
	if (metrics.apiCalls.length === 0) return null;

	const durations = metrics.apiCalls.map((call) => call.duration);
	const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
	const maxDuration = Math.max(...durations);
	const slowCalls = durations.filter((duration) => duration > 1000).length;

	const statusCounts = metrics.apiCalls.reduce(
		(acc, call) => {
			acc[call.status] = (acc[call.status] || 0) + 1;
			return acc;
		},
		{} as Record<number, number>
	);

	return {
		averageDuration: avgDuration,
		maxDuration,
		totalCalls: metrics.apiCalls.length,
		slowCalls,
		statusCounts
	};
}

function calculateMemoryStats() {
	if (metrics.memoryUsage.length === 0) return null;

	const usages = metrics.memoryUsage.map((m) => m.used);
	const avgUsage = usages.reduce((a, b) => a + b, 0) / usages.length;
	const maxUsage = Math.max(...usages);
	const latestUsage = usages[usages.length - 1];

	return {
		averageUsage: avgUsage,
		maxUsage,
		latestUsage,
		measurements: metrics.memoryUsage.length
	};
}

function getWebVitals() {
	return {
		lcp: metrics.largestContentfulPaint?.startTime || null,
		fid: metrics.firstInput?.processingStart || null,
		cls: metrics.cumulativeLayoutShift
	};
}

function generateRecommendations(
	componentStats: Record<string, ComponentStats>,
	apiStats: ApiStats | null,
	memoryStats: MemoryStats | null
): string[] {
	const recommendations: string[] = [];

	// Component recommendations
	Object.entries(componentStats).forEach(([componentName, stats]) => {
		if (stats.slowRenderPercentage > 20) {
			recommendations.push(
				`${componentName}: ${stats.slowRenderPercentage.toFixed(1)}% of renders are slow (>16ms). Consider memoization.`
			);
		}
	});

	// API recommendations
	if (apiStats && apiStats.averageDuration > 500) {
		recommendations.push(
			`API calls are slow (avg ${apiStats.averageDuration.toFixed(0)}ms). Consider caching or optimization.`
		);
	}

	// Memory recommendations
	if (memoryStats && memoryStats.latestUsage > 50 * 1024 * 1024) {
		// 50MB
		recommendations.push(
			`High memory usage (${(memoryStats.latestUsage / 1024 / 1024).toFixed(1)}MB). Consider memory optimization.`
		);
	}

	return recommendations;
}

// Types
interface ComponentStats {
	averageRenderTime: number;
	maxRenderTime: number;
	totalRenders: number;
	slowRenders: number;
	slowRenderPercentage: number;
}

interface ApiStats {
	averageDuration: number;
	maxDuration: number;
	totalCalls: number;
	slowCalls: number;
	statusCounts: Record<number, number>;
}

interface MemoryStats {
	averageUsage: number;
	maxUsage: number;
	latestUsage: number;
	measurements: number;
}

export interface PerformanceReport {
	timestamp: number;
	components: Record<string, ComponentStats>;
	api: ApiStats | null;
	memory: MemoryStats | null;
	webVitals: {
		lcp: number | null;
		fid: number | null;
		cls: number;
	};
	recommendations: string[];
}

// Export metrics for debugging
export function getMetrics() {
	return { ...metrics };
}

// Clear all metrics
export function clearMetrics() {
	metrics = {
		componentRenders: new Map(),
		apiCalls: [],
		memoryUsage: [],
		navigationTiming: null,
		resourceTiming: [],
		largestContentfulPaint: null,
		firstInput: null,
		cumulativeLayoutShift: 0
	};
}
