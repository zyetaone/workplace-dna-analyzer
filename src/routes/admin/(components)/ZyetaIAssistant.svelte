<!--
  ZyetaI AI Assistant - Floating Professional AI Assistant
  Provides 4 specialized AI services for workplace optimization
-->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { getAISessionStore } from '../ai.svelte';
	import { getSessionStore } from '../admin.svelte';

	interface ZyetaIAssistantProps {
		sessionCode: string;
	}

	let { sessionCode }: ZyetaIAssistantProps = $props();

	// AI Service Modes
	type ServiceMode = 'brainstorm' | 'layout-2d' | 'environment-3d' | 'general';

	let activeMode = $state<ServiceMode>('general');
	let isExpanded = $state(false);
	let userMessage = $state('');
	let isTyping = $state(false);
	let messages = $state<Array<{ role: 'user' | 'assistant'; content: string; mode: ServiceMode }>>(
		[]
	);

	// Get AI store
	const aiStore = getAISessionStore(sessionCode);
	const sessionStore = getSessionStore(sessionCode);

	// Service mode configurations
	const serviceModes = {
		brainstorm: {
			name: 'Brainstorm',
			icon: '🧠',
			description: 'Creative ideation and problem-solving'
		},
		'layout-2d': {
			name: '2D Layout',
			icon: '📐',
			description: 'Office space planning and design'
		},
		'environment-3d': {
			name: '3D Environment',
			icon: '🏢',
			description: 'Virtual office and hybrid work design'
		},
		general: {
			name: 'General AI',
			icon: '🤖',
			description: 'Comprehensive workplace assistance'
		}
	};

	// Quick suggestions based on mode
	const quickSuggestions = {
		brainstorm: [
			'How can we improve team collaboration?',
			'Ideas for hybrid work success',
			'Innovation challenges we face'
		],
		'layout-2d': [
			'Optimize our current office layout',
			'Design a new team space',
			'Improve meeting room usage'
		],
		'environment-3d': [
			'Virtual office best practices',
			'Hybrid work technology setup',
			'Remote team engagement ideas'
		],
		general: [
			'Workplace culture assessment',
			'Leadership development tips',
			'Team motivation strategies'
		]
	};

	// Handle sending messages
	async function sendMessage() {
		if (!userMessage.trim()) return;

		const message = userMessage.trim();
		const currentMode = activeMode;

		// Add user message
		messages.push({ role: 'user', content: message, mode: currentMode });
		userMessage = '';
		isTyping = true;

		try {
			// For now, provide contextual responses based on mode
			let aiResponse = '';

			switch (currentMode) {
				case 'brainstorm':
					aiResponse = `💡 Brainstorm Mode: ${message}\n\nBased on workplace data analysis, here are some creative ideas to consider...`;
					break;
				case 'layout-2d':
					aiResponse = `📐 Layout Planning: ${message}\n\nConsidering spatial design and workflow optimization...`;
					break;
				case 'environment-3d':
					aiResponse = `🏢 3D Environment: ${message}\n\nFocusing on virtual and hybrid work solutions...`;
					break;
				case 'general':
				default:
					aiResponse = `🤖 ZyetaI: ${message}\n\nDrawing from workplace insights and best practices...`;
					break;
			}

			// Simulate typing delay
			await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

			messages.push({
				role: 'assistant',
				content: aiResponse,
				mode: currentMode
			});
		} catch (error) {
			messages.push({
				role: 'assistant',
				content:
					'I apologize, but I encountered an error. Please check your connection and try again.',
				mode: currentMode
			});
		} finally {
			isTyping = false;
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isExpanded = false;
		}
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
</script>

<!-- Floating Assistant Button -->
<div class="fixed bottom-6 right-6 z-50">
	<!-- Expanded Assistant Panel -->
	{#if isExpanded}
		<div
			class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 w-96 h-[500px] flex flex-col"
			in:fly={{ y: 20, duration: 300 }}
			out:fly={{ y: 20, duration: 200 }}
		>
			<!-- Header -->
			<div class="p-4 border-b border-gray-200/50">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center"
						>
							<span class="text-white text-sm font-bold">Z</span>
						</div>
						<div>
							<h3 class="font-semibold text-gray-900">ZyetaI Assistant</h3>
							<p class="text-xs text-gray-500">{serviceModes[activeMode].name}</p>
						</div>
					</div>
					<button
						onclick={() => (isExpanded = false)}
						class="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
						aria-label="Close ZyetaI Assistant"
					>
						<svg
							class="w-4 h-4 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<!-- Service Mode Tabs -->
				<div class="flex gap-1 mt-3">
					{#each Object.entries(serviceModes) as [mode, config]}
						<button
							class="flex-1 px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-center gap-1
                {activeMode === mode
								? 'bg-purple-100 text-purple-700 border border-purple-200'
								: 'text-gray-600 hover:bg-gray-100'}"
							onclick={() => (activeMode = mode as ServiceMode)}
						>
							<span>{config.icon}</span>
							<span class="truncate">{config.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Messages Area -->
			<div class="flex-1 overflow-y-auto p-4 space-y-4">
				{#if messages.length === 0}
					<!-- Welcome Message -->
					<div class="text-center py-8">
						<div
							class="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"
						>
							<span class="text-white text-lg">🤖</span>
						</div>
						<h4 class="font-medium text-gray-900 mb-2">Welcome to ZyetaI!</h4>
						<p class="text-sm text-gray-600 mb-4">
							I'm your AI assistant for workplace optimization. Choose a service mode above and ask
							me anything!
						</p>

						<!-- Quick Suggestions -->
						<div class="space-y-2">
							<p class="text-xs text-gray-500 mb-2">Try asking:</p>
							{#each quickSuggestions[activeMode] as suggestion}
								<button
									class="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
									onclick={() => (userMessage = suggestion)}
								>
									{suggestion}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<!-- Message History -->
					{#each messages as message}
						<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[80%] px-3 py-2 rounded-lg
                {message.role === 'user'
									? 'bg-purple-600 text-white'
									: 'bg-gray-100 text-gray-900'}"
							>
								<p class="text-sm">{message.content}</p>
							</div>
						</div>
					{/each}

					{#if isTyping}
						<div class="flex justify-start">
							<div class="bg-gray-100 px-3 py-2 rounded-lg">
								<div class="flex space-x-1">
									<div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
									<div
										class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
										style="animation-delay: 0.2s"
									></div>
									<div
										class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
										style="animation-delay: 0.4s"
									></div>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Input Area -->
			<div class="p-4 border-t border-gray-200/50">
				<div class="flex gap-2">
					<input
						bind:value={userMessage}
						placeholder={`Ask ZyetaI about ${serviceModes[activeMode].description.toLowerCase()}...`}
						class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						onkeydown={handleKeydown}
						disabled={isTyping}
					/>
					<button
						onclick={sendMessage}
						disabled={!userMessage.trim() || isTyping}
						class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						aria-label="Send message to ZyetaI Assistant"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
							></path>
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Floating Button -->
	<button
		onclick={() => (isExpanded = !isExpanded)}
		class="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center group"
		aria-label="Open ZyetaI Assistant"
	>
		<span class="text-white text-xl group-hover:animate-pulse">🤖</span>

		<!-- Pulse ring animation -->
		<div class="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-20"></div>
	</button>
</div>

<!-- Floating Assistant Button -->
<div class="fixed bottom-6 right-6 z-50">
	<!-- Expanded Assistant Panel -->
	{#if isExpanded}
		<div
			class="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 w-96 h-[500px] flex flex-col"
			in:fly={{ y: 20, duration: 300 }}
			out:fly={{ y: 20, duration: 200 }}
		>
			<!-- Header -->
			<div class="p-4 border-b border-gray-200/50">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div
							class="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center"
						>
							<span class="text-white text-sm font-bold">Z</span>
						</div>
						<div>
							<h3 class="font-semibold text-gray-900">ZyetaI Assistant</h3>
							<p class="text-xs text-gray-500">{serviceModes[activeMode].name}</p>
						</div>
					</div>
					<button
						onclick={() => (isExpanded = false)}
						class="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
						aria-label="Close ZyetaI Assistant"
					>
						<svg
							class="w-4 h-4 text-gray-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<!-- Service Mode Tabs -->
				<div class="flex gap-1 mt-3">
					{#each Object.entries(serviceModes) as [mode, config]}
						<button
							class="flex-1 px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-center gap-1
                {activeMode === mode
								? 'bg-purple-100 text-purple-700 border border-purple-200'
								: 'text-gray-600 hover:bg-gray-100'}"
							onclick={() => (activeMode = mode as ServiceMode)}
						>
							<span>{config.icon}</span>
							<span class="truncate">{config.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Messages Area -->
			<div class="flex-1 overflow-y-auto p-4 space-y-4">
				{#if messages.length === 0}
					<!-- Welcome Message -->
					<div class="text-center py-8">
						<div
							class="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3"
						>
							<span class="text-white text-lg">🤖</span>
						</div>
						<h4 class="font-medium text-gray-900 mb-2">Welcome to ZyetaI!</h4>
						<p class="text-sm text-gray-600 mb-4">
							I'm your AI assistant for workplace optimization. Choose a service mode above and ask
							me anything!
						</p>

						<!-- Quick Suggestions -->
						<div class="space-y-2">
							<p class="text-xs text-gray-500 mb-2">Try asking:</p>
							{#each quickSuggestions[activeMode] as suggestion}
								<button
									class="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
									onclick={() => (userMessage = suggestion)}
								>
									{suggestion}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<!-- Message History -->
					{#each messages as message}
						<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[80%] px-3 py-2 rounded-lg
                {message.role === 'user'
									? 'bg-purple-600 text-white'
									: 'bg-gray-100 text-gray-900'}"
							>
								<p class="text-sm">{message.content}</p>
							</div>
						</div>
					{/each}

					{#if isTyping}
						<div class="flex justify-start">
							<div class="bg-gray-100 px-3 py-2 rounded-lg">
								<div class="flex space-x-1">
									<div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
									<div
										class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
										style="animation-delay: 0.2s"
									></div>
									<div
										class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
										style="animation-delay: 0.4s"
									></div>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Input Area -->
			<div class="p-4 border-t border-gray-200/50">
				<div class="flex gap-2">
					<input
						bind:value={userMessage}
						placeholder={`Ask ZyetaI about ${serviceModes[activeMode].description.toLowerCase()}...`}
						class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						onkeydown={handleKeydown}
						disabled={isTyping}
					/>
					<button
						onclick={sendMessage}
						disabled={!userMessage.trim() || isTyping}
						class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						aria-label="Send message to ZyetaI Assistant"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
							></path>
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Floating Button -->
	<button
		onclick={() => (isExpanded = !isExpanded)}
		class="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center group"
		aria-label="Open ZyetaI Assistant"
	>
		<span class="text-white text-xl group-hover:animate-pulse">🤖</span>

		<!-- Pulse ring animation -->
		<div class="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-20"></div>
	</button>
</div>

