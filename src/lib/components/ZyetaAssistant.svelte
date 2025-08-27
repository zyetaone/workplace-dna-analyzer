<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { marked } from 'marked';
	import { tick } from 'svelte';
	
	interface Message {
		role: string;
		content: string;
		image?: string;
	}
	
	interface Props {
		analytics?: any;
		sessionId: string;
	}
	
	let { analytics, sessionId }: Props = $props();
	
	let isOpen = $state(false);
	let selectedMode = $state<'workspace' | 'brainstorm' | 'render'>('workspace');
	let messages = $state<Message[]>([]);
	let userInput = $state('');
	let isLoading = $state(false);
	let selectedConcept = $state('');
	let shouldScrollToBottom = $state(false);
	
	// Configure marked for better rendering
	marked.setOptions({
		breaks: true,
		gfm: true
	});
	
	// Mode configurations
	const modes = {
		workspace: {
			title: '🏢 Workspace Design Assistant',
			placeholder: 'Ask about workspace design recommendations...',
			icon: '🏢',
			description: 'Get expert workspace design recommendations based on your team\'s DNA',
			hints: [
				'What workspace layout suits our collaborative culture?',
				'How can we balance focus zones with collaboration areas?',
				'Suggest wellness-focused design elements for our office',
				'What technology integrations would enhance productivity?'
			]
		},
		brainstorm: {
			title: '💡 Brainstorming Assistant',
			placeholder: 'Let\'s brainstorm workspace concepts...',
			icon: '💡',
			description: 'Brainstorm innovative workspace concepts tailored to your preferences',
			hints: [
				'Generate 5 creative workspace themes for our team',
				'What\'s a unique name for our collaborative workspace?',
				'Suggest unconventional meeting room concepts',
				'How can we reflect our brand in the workspace design?'
			]
		},
		render: {
			title: '🎨 3D Rendering Assistant',
			placeholder: 'Describe a workspace concept to visualize...',
			icon: '🎨',
			description: 'Create stunning 3D visualizations of workspace concepts',
			hints: [
				'Modern open office with biophilic design elements',
				'Tech-forward meeting room with smart glass walls',
				'Wellness-focused breakout area with natural light',
				'Flexible hot-desking space with modular furniture'
			]
		}
	};
	
	$effect(() => {
		// Clear messages when switching modes
		messages = [];
		selectedConcept = '';
	});
	
	// Auto-scroll attachment function
	function autoScrollAttachment(container: HTMLDivElement) {
		function scrollToBottom() {
			container.scrollTop = container.scrollHeight;
		}
		
		// Observe when shouldScrollToBottom changes
		$effect(() => {
			if (shouldScrollToBottom) {
				setTimeout(scrollToBottom, 0);
				shouldScrollToBottom = false;
			}
		});
		
		// Initial scroll
		scrollToBottom();
		
		// Watch for messages changes
		$effect(() => {
			messages; // Track messages array
			scrollToBottom();
		});
		
		// Return cleanup function
		return () => {
			// Cleanup if needed
		};
	}
	
	async function scrollToBottom() {
		await tick();
		shouldScrollToBottom = true;
	}
	
	function getSystemPrompt() {
		const dnaKeywords = analytics?.wordCloudData?.map((d: any) => d.text).slice(0, 10).join(', ') || '';
		const workplaceDNA = analytics?.workplaceDNA || 'Modern Workspace';
		const scores = analytics?.preferenceScores || {};
		
		// Add score-based characteristics
		const characteristics = [];
		if (scores.collaboration >= 7) characteristics.push('highly collaborative');
		else if (scores.collaboration <= 3) characteristics.push('independent-focused');
		
		if (scores.technology >= 7) characteristics.push('tech-forward');
		else if (scores.technology <= 3) characteristics.push('traditional');
		
		if (scores.wellness >= 7) characteristics.push('wellness-centric');
		if (scores.formality >= 7) characteristics.push('formal/structured');
		else if (scores.formality <= 3) characteristics.push('casual/flexible');
		
		const teamProfile = characteristics.join(', ') || 'balanced';
		
		switch(selectedMode) {
			case 'workspace':
				return `You are ZYETA's AI Workspace Design Consultant. ZYETA is India's leading workplace design firm known for creating transformative, human-centric workspaces.
				
				Current Workspace DNA: ${workplaceDNA}
				Team Profile: ${teamProfile}
				Key Themes: ${dnaKeywords}
				Preference Scores: Collaboration ${scores.collaboration || 5}/10, Technology ${scores.technology || 5}/10, Wellness ${scores.wellness || 5}/10, Formality ${scores.formality || 5}/10
				
				Provide design recommendations that:
				- Align with ZYETA's philosophy of "Spaces that Work, Work that Inspires"
				- Consider the analyzed workplace preferences
				- Focus on productivity, wellbeing, and culture
				- Include specific design elements, materials, and layouts
				- Reference successful ZYETA projects when relevant`;
				
			case 'brainstorm':
				return `You are a creative workspace concept brainstorming assistant for ZYETA.
				
				Workspace DNA: ${workplaceDNA}
				Team Profile: ${teamProfile}
				Key Themes: ${dnaKeywords}
				
				Help brainstorm innovative workspace concepts that:
				- Push boundaries while remaining practical
				- Blend the identified preferences creatively
				- Suggest unique themes and narratives
				- Propose unexpected design solutions
				- Generate names and taglines for workspace concepts
				- Always format concepts clearly with "Concept: [Name]" for easy identification`;
				
			case 'render':
				return `You are a 3D visualization assistant. Based on workspace concepts, you will generate detailed descriptions for 3D rendered images of modern office spaces.
				
				Workspace DNA: ${workplaceDNA}
				Team Profile: ${teamProfile}
				
				Focus on:
				- Photorealistic architectural visualization
				- Modern office interiors with the identified characteristics
				- Natural lighting and material textures
				- Human scale and perspective
				- Professional architectural rendering style
				- Incorporating elements that reflect the team's preferences`;
				
			default:
				return '';
		}
	}
	
	async function sendMessage() {
		if (!userInput.trim() || isLoading) return;
		
		const message = userInput;
		userInput = '';
		messages = [...messages, { role: 'user', content: message }];
		isLoading = true;
		await scrollToBottom();
		
		try {
			if (selectedMode === 'render') {
				// For rendering mode, generate an image
				const response = await fetch('/api/ai/render', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						prompt: message,
						systemPrompt: getSystemPrompt(),
						sessionId
					})
				});
				
				if (!response.ok) {
					const errorText = await response.text();
					if (import.meta.env.DEV) {
				console.error('Render API error:', response.status, errorText);
			}
					throw new Error(`API error: ${response.status}`);
				}
				
				const data = await response.json();
				if (data.imageUrl) {
					messages = [...messages, {
						role: 'assistant',
						content: data.description || 'Here\'s your 3D rendered workspace concept:',
						image: data.imageUrl
					}];
				} else {
					throw new Error(data.error || 'Failed to generate image');
				}
			} else {
				// For workspace and brainstorm modes, generate text
				const response = await fetch('/api/ai/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						message,
						systemPrompt: getSystemPrompt(),
						mode: selectedMode,
						sessionId
					})
				});
				
				if (!response.ok) {
					const errorText = await response.text();
					if (import.meta.env.DEV) {
				console.error('Chat API error:', response.status, errorText);
			}
					throw new Error(`API error: ${response.status}`);
				}
				
				const data = await response.json();
				messages = [...messages, { role: 'assistant', content: data.response }];
				
				// Extract concepts for potential rendering
				if (selectedMode === 'brainstorm' && data.response.includes('Concept:')) {
					const conceptMatch = data.response.match(/Concept:\s*([^\n]+)/);
					if (conceptMatch) {
						selectedConcept = conceptMatch[1];
					}
				}
			}
		} catch (error: any) {
			if (import.meta.env.DEV) {
			console.error('Chat error:', error);
		}
			messages = [...messages, { 
				role: 'assistant', 
				content: `Sorry, I encountered an error: ${error.message}. Please ensure the API is configured correctly.`
			}];
		} finally {
			isLoading = false;
			await scrollToBottom();
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
	
	function switchToRenderMode(concept: string) {
		selectedMode = 'render';
		userInput = concept;
		messages = [];
	}
</script>

<!-- Reusable Snippets -->
{#snippet hintButton(hint: string)}
	<button
		onclick={() => { userInput = hint; sendMessage(); }}
		class="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-sm text-gray-700"
	>
		💭 {hint}
	</button>
{/snippet}

{#snippet messageContent(message)}
	{#if message.role === 'assistant'}
		{#if message.image}
			<div>
				<img src={message.image} alt="AI Generated Workspace" class="rounded-lg w-full mb-2" />
				<p class="text-sm text-gray-600">{message.content}</p>
			</div>
		{:else}
			<div>{@html marked.parse(message.content)}</div>
		{/if}
	{:else}
		<div>{message.content}</div>
	{/if}
{/snippet}

<!-- Floating Action Button -->
<button
	onclick={() => isOpen = true}
	class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 hover:scale-110"
	title="Open AI Assistant"
>
	<span class="text-2xl">🤖</span>
</button>

<!-- Dialog Overlay -->
{#if isOpen}
	<div 
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
		onclick={(e) => {
			if (e.target === e.currentTarget) isOpen = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') isOpen = false;
		}}
		role="dialog"
		aria-modal="true"
		aria-label="AI Assistant Dialog"
		tabindex="-1"
	>
		<div 
			class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
			transition:fly={{ y: 50, duration: 300 }}
		>
			<!-- Header -->
			<div class="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-bold text-gray-800">AI Assistant</h2>
					<button
						onclick={() => isOpen = false}
						class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
					>
						×
					</button>
				</div>
				
				<!-- Mode Selector -->
				<div class="flex gap-2 flex-wrap">
					{#each Object.entries(modes) as [mode, config]}
						<button
							onclick={() => selectedMode = mode as any}
							class="px-4 py-2 rounded-lg transition-all {
								selectedMode === mode 
									? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
									: 'bg-white text-gray-700 hover:bg-gray-100'
							}"
						>
							<span class="mr-2">{config.icon}</span>
							{config.title.split(' ').slice(1, -1).join(' ')}
						</button>
					{/each}
				</div>
				
				<!-- System Context Indicator -->
				{#if messages.length > 0 && analytics?.workplaceDNA}
					<div class="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
						<span class="font-semibold">Context:</span> {analytics.workplaceDNA} | 
						<span class="font-semibold">Mode:</span> {modes[selectedMode].title.split(' ')[1]}
					</div>
				{/if}
			</div>
			
			<!-- Chat Messages -->
			<div {@attach autoScrollAttachment} class="flex-1 overflow-y-auto p-6 space-y-4">
				{#if messages.length === 0}
					<div class="text-center text-gray-500 mt-8">
						<div class="text-4xl mb-4">{modes[selectedMode].icon}</div>
						<h3 class="text-lg font-semibold mb-2">{modes[selectedMode].title}</h3>
						<p class="text-sm mb-6">{modes[selectedMode].description}</p>
						
						{#if analytics?.workplaceDNA}
							<div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 text-left max-w-2xl mx-auto">
								<p class="text-sm font-semibold text-gray-700 mb-2">Your Workplace DNA:</p>
								<p class="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
									{analytics.workplaceDNA}
								</p>
								{#if analytics?.wordCloudData?.length > 0}
									<p class="text-xs text-gray-600 mt-2">
										Key themes: {analytics.wordCloudData.slice(0, 5).map(d => d.text).join(', ')}
									</p>
								{/if}
							</div>
						{/if}
						
						<div class="text-left max-w-2xl mx-auto">
							<p class="text-sm font-semibold text-gray-700 mb-3">Try asking:</p>
							<div class="grid gap-2">
								{#each modes[selectedMode].hints as hint}
									{@render hintButton(hint)}
								{/each}
							</div>
						</div>
					</div>
				{/if}
				
				{#each messages as message}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[70%] {message.role === 'user' 
							? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
							: 'bg-gray-100 text-gray-800'} 
							rounded-2xl px-4 py-3 shadow-sm">
							{#if message.role === 'assistant'}
								<div class="prose prose-sm max-w-none">
									{@html marked(message.content)}
								</div>
							{:else}
								<p class="whitespace-pre-wrap">{message.content}</p>
							{/if}
							{#if message.image}
								<img 
									src={message.image} 
									alt="3D Rendered Workspace" 
									class="mt-3 rounded-lg w-full"
								/>
							{/if}
							{#if message.role === 'assistant' && selectedMode === 'brainstorm' && message.content.includes('Concept:')}
								<button
									onclick={() => {
										const conceptMatch = message.content.match(/Concept:\s*([^\n]+)/);
										if (conceptMatch) switchToRenderMode(conceptMatch[1]);
									}}
									class="mt-3 text-sm underline opacity-90 hover:opacity-100"
								>
									Generate 3D visualization →
								</button>
							{/if}
						</div>
					</div>
				{/each}
				
				{#if isLoading}
					<div class="flex justify-start">
						<div class="bg-gray-100 rounded-2xl px-4 py-3 shadow-sm">
							<div class="flex gap-2">
								<span class="animate-bounce">●</span>
								<span class="animate-bounce" style="animation-delay: 0.1s">●</span>
								<span class="animate-bounce" style="animation-delay: 0.2s">●</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Input Area -->
			<div class="p-6 border-t bg-gray-50 rounded-b-2xl">
				{#if selectedConcept && selectedMode === 'render'}
					<div class="mb-2 text-sm text-gray-600">
						Rendering concept: <span class="font-semibold">{selectedConcept}</span>
					</div>
				{/if}
				
				<div class="flex gap-3">
					<input
						bind:value={userInput}
						onkeydown={handleKeydown}
						placeholder={modes[selectedMode].placeholder}
						disabled={isLoading}
						class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
					/>
					<button
						onclick={sendMessage}
						disabled={!userInput.trim() || isLoading}
						class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					>
						{isLoading ? 'Thinking...' : 'Send'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
	
	.animate-bounce {
		animation: bounce 0.6s infinite;
	}
	
	/* Markdown styling for chatbot messages */
	:global(.prose) {
		color: inherit;
	}
	
	:global(.prose strong) {
		color: inherit;
		font-weight: 600;
	}
	
	:global(.prose ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	:global(.prose ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	:global(.prose li) {
		margin-top: 0.25rem;
		margin-bottom: 0.25rem;
	}
	
	:global(.prose p) {
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	:global(.prose h1, .prose h2, .prose h3) {
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}
	
	:global(.prose code) {
		background-color: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
</style>