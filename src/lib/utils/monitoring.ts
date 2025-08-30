// Simple monitoring utilities
// TODO: Implement proper error reporting and monitoring

export function reportError(error: Error | string, context?: any) {
	console.error('Error reported:', error, context);
	// In production, this would send to error reporting service
}

export function trackEvent(event: string, data?: any) {
	console.log('Event tracked:', event, data);
	// In production, this would send to analytics service
}

export function measurePerformance(name: string, fn: () => any) {
	const start = performance.now();
	const result = fn();
	const end = performance.now();
	console.log(`${name} took ${end - start}ms`);
	return result;
}
