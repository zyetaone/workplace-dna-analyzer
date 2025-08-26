// Svelte 5 {@attach} pattern for real-time updates using SSE
// No Socket.io needed - pure browser EventSource API


export interface RealtimeConfig {
	url: string;
	reconnect?: boolean;
	reconnectDelay?: number;
	maxReconnectDelay?: number;
}

export interface RealtimeEvents {
	'realtime:connected': CustomEvent<void>;
	'realtime:disconnected': CustomEvent<void>;
	'realtime:response': CustomEvent<any>;
	'realtime:attendee_joined': CustomEvent<any>;
	'realtime:attendee_left': CustomEvent<any>;
	'realtime:response_received': CustomEvent<any>;
	'realtime:attendee_completed': CustomEvent<any>;
	'realtime:analytics': CustomEvent<any>;
	'realtime:error': CustomEvent<Error>;
}

/**
 * Creates a reactive SSE attachment for real-time updates
 * Usage: <div {@attach realtime({ url: '/api/stream' })}>
 */
export function realtime(config: RealtimeConfig) {
	return function realtimeAttachment(element: HTMLElement) {
		let eventSource: EventSource | null = null;
		let reconnectTimeout: NodeJS.Timeout;
		let reconnectDelay = config.reconnectDelay || 1000;
		const maxDelay = config.maxReconnectDelay || 30000;
		let isIntentionallyClosed = false;
		
		function connect() {
			try {
				eventSource = new EventSource(config.url);
				
				eventSource.onopen = () => {
					console.log('✅ SSE Connected (onopen fired)');
					reconnectDelay = config.reconnectDelay || 1000; // Reset delay
					element.dispatchEvent(new CustomEvent('realtime:connected'));
					element.setAttribute('data-realtime-status', 'connected');
				};
				
				eventSource.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);
						const eventType = `realtime:${data.type}` as keyof RealtimeEvents;
						element.dispatchEvent(new CustomEvent(eventType, { 
							detail: data.payload,
							bubbles: true 
						}));
					} catch (error) {
						console.error('Failed to parse SSE message:', error);
					}
				};
				
				eventSource.onerror = (error) => {
					console.error('❌ SSE Error:', error);
					element.setAttribute('data-realtime-status', 'disconnected');
					element.dispatchEvent(new CustomEvent('realtime:disconnected'));
					
					if (eventSource) {
						eventSource.close();
						eventSource = null;
					}
					
					// Only reconnect if not intentionally closed
					if (!isIntentionallyClosed && config.reconnect !== false) {
						clearTimeout(reconnectTimeout);
						reconnectTimeout = setTimeout(() => {
							connect();
							reconnectDelay = Math.min(reconnectDelay * 2, maxDelay);
						}, reconnectDelay);
					}
				};
				
				// Handle specific event types
				eventSource.addEventListener('connected', (event: MessageEvent) => {
					console.log('✅ SSE Connected Event received');
					const data = JSON.parse(event.data);
					element.dispatchEvent(new CustomEvent('realtime:connected', { 
						detail: data,
						bubbles: true 
					}));
					element.setAttribute('data-realtime-status', 'connected');
				});
				
				eventSource.addEventListener('response', (event: MessageEvent) => {
					const data = JSON.parse(event.data);
					element.dispatchEvent(new CustomEvent('realtime:response', { 
						detail: data,
						bubbles: true 
					}));
				});
				
				eventSource.addEventListener('attendee_joined', (event: MessageEvent) => {
					const data = JSON.parse(event.data);
					element.dispatchEvent(new CustomEvent('realtime:attendee_joined', { 
						detail: data,
						bubbles: true 
					}));
				});
				
				eventSource.addEventListener('analytics', (event: MessageEvent) => {
					const data = JSON.parse(event.data);
					element.dispatchEvent(new CustomEvent('realtime:analytics', { 
						detail: data,
						bubbles: true 
					}));
				});
				
				eventSource.addEventListener('response_received', (event: MessageEvent) => {
					const data = JSON.parse(event.data);
					element.dispatchEvent(new CustomEvent('realtime:response_received', { 
						detail: data,
						bubbles: true 
					}));
				});
				
				eventSource.addEventListener('attendee_completed', (event: MessageEvent) => {
					const data = JSON.parse(event.data);
					element.dispatchEvent(new CustomEvent('realtime:attendee_completed', { 
						detail: data,
						bubbles: true 
					}));
				});
				
			} catch (error) {
				console.error('Failed to create EventSource:', error);
				element.dispatchEvent(new CustomEvent('realtime:error', { 
					detail: error as Error 
				}));
			}
		}
		
		// Start connection
		connect();
		
		// Store cleanup function on element for manual disconnect
		(element as any).__realtimeDisconnect = () => {
			isIntentionallyClosed = true;
			clearTimeout(reconnectTimeout);
			if (eventSource) {
				console.log('🔌 Closing SSE connection');
				eventSource.close();
				eventSource = null;
			}
			element.removeAttribute('data-realtime-status');
			element.dispatchEvent(new CustomEvent('realtime:disconnected'));
		};
		
		// Cleanup function
		return () => {
			isIntentionallyClosed = true;
			clearTimeout(reconnectTimeout);
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
			element.removeAttribute('data-realtime-status');
		};
	};
}
